/**
 * admin/emplacementToolkit.jsx
 * Gestion des emplacements avec cache local et intégration du stock
 *
 * Structure Firestore :
 * - stock/emplacements : { [id]: { ...emplacement avec stock_actuel } }
 * - emplacements/liste : { emplacements: [array d'emplacements] }
 * - emplacements/operations/[DDMMYYYY] : { operations: [array d'opérations du jour] }
 *
 * Structure LocalStorage :
 * - lsd_emplacements_liste : { emplacements: [...], lastSync: timestamp }
 * - lsd_emplacements_operations : { operations: [...], lastSync: timestamp }
 *
 * Note: Les emplacements sont intégrés avec le système de stock via stock/emplacements
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { ref, push, onValue, onChildAdded, off } from "firebase/database";
import { db, rtdb } from "@/firebase.js";
import { nanoid } from "nanoid";
import { auth } from "@/firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================

const EMPLACEMENTS_LISTE_PATH = "emplacements/liste";
const STOCK_EMPLACEMENTS_PATH = "stock/emplacements";
const LOCAL_EMPLACEMENTS_KEY = "lsd_emplacements_liste";
const RTDB_NOTIFICATIONS_PATH = "notification";

// Types d'emplacements
export const EMPLACEMENT_TYPES = {
  ENTREPOT: "entrepot",
  POINT_DE_VENTE: "point_de_vente",
  STAND: "stand",
};

// Types d'opérations
export const OPERATION_TYPES = {
  OUVERTURE: "ouverture",
  FERMETURE: "fermeture",
  CHANGEMENT_VENDEUR: "changement_vendeur",
  DEPLACEMENT: "deplacement",
};

// ============================================================================
// PREPROCESSING HELPERS
// ============================================================================

const cleanString = (val) => {
  if (val === null || val === undefined) return "";
  return String(val);
};

const cleanNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const cleanBoolean = (val) => {
  if (val === null || val === undefined) return false;
  return Boolean(val);
};

const cleanObject = (val) => {
  if (
    val === null ||
    val === undefined ||
    typeof val !== "object" ||
    Array.isArray(val)
  ) {
    return {};
  }
  return val;
};

const cleanArray = (val) => {
  if (val === null || val === undefined || !Array.isArray(val)) {
    return [];
  }
  return val;
};

const cleanRecordOfObjects = (val) => {
  if (val === null || val === undefined) return {};

  if (Array.isArray(val)) {
    const map = {};
    val.forEach((item) => {
      if (typeof item === "object" && item !== null && item.id) {
        map[item.id] = item;
      }
    });
    return map;
  }

  if (typeof val === "object") {
    const cleaned = {};
    Object.entries(val).forEach(([key, value]) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        cleaned[key] = value;
      } else {
        console.warn(
          `🧹 [Schema] Valeur invalide ignorée: ${key} (type: ${typeof value})`
        );
      }
    });
    return cleaned;
  }

  return {};
};

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

/**
 * Schema pour une localisation géographique
 */
export const localisationSchema = z.preprocess(
  cleanObject,
  z.object({
    longitude: z.preprocess(cleanNumber, z.number()),
    latitude: z.preprocess(cleanNumber, z.number()),
  })
);

/**
 * Schema pour une position
 */
export const positionSchema = z.preprocess(
  cleanObject,
  z.object({
    departement: z.preprocess(cleanString, z.string().min(1)),
    commune: z.preprocess(cleanString, z.string().min(1)),
    arrondissement: z.preprocess(
      cleanString,
      z.string().optional().default("")
    ),
    quartier: z.preprocess(cleanString, z.string().optional().default("")),
    localisation: localisationSchema,
  })
);

/**
 * Schema pour un historique de position
 */
export const historiquePositionSchema = z.object({
  position: positionSchema,
  dateDebut: z.number().positive(),
  dateFin: z.number().positive().optional(),
});

/**
 * Schema pour les positions complètes
 */
export const positionsCompleteSchema = z.preprocess(
  cleanObject,
  z.object({
    actuelle: positionSchema,
    historique: z.preprocess(
      cleanArray,
      z.array(historiquePositionSchema).default([])
    ),
  })
);

/**
 * Schema pour un vendeur
 */
export const vendeurSchema = z.preprocess(
  cleanObject,
  z.object({
    id: z.preprocess(cleanString, z.string().min(1)),
    nom: z.preprocess(cleanString, z.string().min(1)),
    prenoms: z.preprocess(cleanArray, z.array(z.string()).default([])),
  })
);

/**
 * Schema pour les horaires d'un jour
 */
export const horaireJourSchema = z.preprocess(
  cleanObject,
  z.object({
    ouvert: z.preprocess(cleanBoolean, z.boolean().default(false)),
    ouverture: z.preprocess(cleanString, z.string().optional().default("")),
    fermeture: z.preprocess(cleanString, z.string().optional().default("")),
  })
);

/**
 * Schema pour les horaires de la semaine
 */
export const horairesSchema = z.preprocess(
  cleanObject,
  z.object({
    lun: horaireJourSchema,
    mar: horaireJourSchema,
    mer: horaireJourSchema,
    jeu: horaireJourSchema,
    ven: horaireJourSchema,
    sam: horaireJourSchema,
    dim: horaireJourSchema,
  })
);

/**
 * Schema pour le type d'emplacement
 */
export const typeEmplacementSchema = z.preprocess(
  cleanObject,
  z.object({
    famille: z.enum([
      EMPLACEMENT_TYPES.ENTREPOT,
      EMPLACEMENT_TYPES.POINT_DE_VENTE,
      EMPLACEMENT_TYPES.STAND,
    ]),
    sous_type: z.preprocess(cleanString, z.string().optional().default("")),
  })
);

/**
 * Schema pour le thème central
 */
export const themeCentralSchema = z.preprocess(
  cleanObject,
  z.object({
    theme: z.preprocess(cleanString, z.string().min(1)),
    description: z.preprocess(cleanString, z.string().optional().default("")),
  })
);

/**
 * Schema pour un emplacement complet
 */
export const emplacementSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  type: typeEmplacementSchema,
  denomination: z.string().min(1, "La dénomination est requise"),
  theme_central: themeCentralSchema,
  position: positionsCompleteSchema,
  vendeur_actuel: vendeurSchema.optional(),
  horaires: horairesSchema,
  stock_actuel: z.preprocess(
    cleanRecordOfObjects,
    z.record(z.any()).default({})
  ),
  status: z.boolean().default(true),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
  updatedBy: z.string().optional(),
});

/**
 * Schema pour une opération sur un emplacement
 */
export const operationEmplacementSchema = z.object({
  id: z.string().min(1),
  emplacementId: z.string().min(1),
  type: z.enum([
    OPERATION_TYPES.OUVERTURE,
    OPERATION_TYPES.FERMETURE,
    OPERATION_TYPES.CHANGEMENT_VENDEUR,
    OPERATION_TYPES.DEPLACEMENT,
  ]),
  timestamp: z.number().positive(),
  data: z.record(z.any()).optional(),
  actorId: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.number().positive(),
});

// ============================================================================
// GESTION DU CACHE LOCAL - EMPLACEMENTS
// ============================================================================

function saveEmplacementsToCache(emplacements) {
  try {
    const dataToStore = { emplacements, lastSync: Date.now() };
    localStorage.setItem(LOCAL_EMPLACEMENTS_KEY, JSON.stringify(dataToStore));
    console.log("✅ Emplacements sauvegardés en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache emplacements:", error);
    return false;
  }
}

function getEmplacementsFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_EMPLACEMENTS_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    console.log("✅ Emplacements récupérés du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache emplacements:", error);
    return null;
  }
}

// Fonctions de cache non utilisées - supprimées pour simplifier le code

// ============================================================================
// RTDB HELPERS - NOTIFICATIONS
// ============================================================================

async function createRTDBNotification(title, message, type = "info") {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn(
        "⚠️ Utilisateur non authentifié, notification RTDB non envoyée"
      );
      return;
    }

    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);
    const notification = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };

    await push(notificationsRef, notification);
    console.log("✅ Notification RTDB créée:", title);
  } catch (error) {
    console.error("❌ Erreur création notification RTDB:", error);
  }
}

// Helper formatDateKey supprimé (non utilisé)

// ============================================================================
// FONCTIONS CRUD - EMPLACEMENTS
// ============================================================================

/**
 * Crée un nouvel emplacement
 * @param {Object} emplacementData - Données de l'emplacement (sans id)
 * @returns {Promise<Object>} L'emplacement créé avec son id
 */
export async function createEmplacement(emplacementData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }

    const id = `empl_${nanoid(10)}`;
    const now = Date.now();

    const emplacement = {
      ...emplacementData,
      id,
      stock_actuel: {},
      status: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: currentUser.uid,
    };

    // Valider avec le schema
    const validatedEmplacement = emplacementSchema.parse(emplacement);

    await runTransaction(db, async (transaction) => {
      // 1. Ajouter à la liste
      const listeRef = doc(db, EMPLACEMENTS_LISTE_PATH);
      const listeDoc = await transaction.get(listeRef);
      const currentListe = listeDoc.exists()
        ? listeDoc.data().emplacements || []
        : [];
      currentListe.push(validatedEmplacement);
      transaction.set(listeRef, { emplacements: currentListe });

      // 2. Ajouter au stock/emplacements
      const stockEmplacementsRef = doc(db, STOCK_EMPLACEMENTS_PATH);
      transaction.set(
        stockEmplacementsRef,
        {
          [id]: validatedEmplacement,
        },
        { merge: true }
      );
    });

    // Mettre à jour le cache
    const cached = getEmplacementsFromCache();
    const newCache = cached?.emplacements || [];
    newCache.push(validatedEmplacement);
    saveEmplacementsToCache(newCache);

    // Notification
    await createRTDBNotification(
      "Nouvel emplacement",
      `${validatedEmplacement.denomination} a été créé`,
      "success"
    );

    console.log("✅ Emplacement créé:", id);
    return validatedEmplacement;
  } catch (error) {
    console.error("❌ Erreur création emplacement:", error);
    throw error;
  }
}

/**
 * Met à jour un emplacement
 * @param {string} id - ID de l'emplacement
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>} L'emplacement mis à jour
 */
export async function updateEmplacement(id, updates) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }

    const now = Date.now();
    const updatedData = {
      ...updates,
      updatedAt: now,
      updatedBy: currentUser.uid,
    };

    let validatedEmplacement;

    await runTransaction(db, async (transaction) => {
      // 1. Mettre à jour dans la liste
      const listeRef = doc(db, EMPLACEMENTS_LISTE_PATH);
      const listeDoc = await transaction.get(listeRef);

      if (!listeDoc.exists()) {
        throw new Error("Liste des emplacements non trouvée");
      }

      const currentListe = listeDoc.data().emplacements || [];
      const emplacementIndex = currentListe.findIndex((empl) => empl.id === id);

      if (emplacementIndex === -1) {
        throw new Error(`Emplacement ${id} non trouvé`);
      }

      currentListe[emplacementIndex] = {
        ...currentListe[emplacementIndex],
        ...updatedData,
      };

      // Valider avec le schema
      validatedEmplacement = emplacementSchema.parse(
        currentListe[emplacementIndex]
      );
      currentListe[emplacementIndex] = validatedEmplacement;

      transaction.set(listeRef, { emplacements: currentListe });

      // 2. Mettre à jour dans stock/emplacements
      const stockEmplacementsRef = doc(db, STOCK_EMPLACEMENTS_PATH);
      transaction.set(
        stockEmplacementsRef,
        {
          [id]: validatedEmplacement,
        },
        { merge: true }
      );
    });

    // Mettre à jour le cache
    const cached = getEmplacementsFromCache();
    if (cached?.emplacements) {
      const updatedCache = cached.emplacements.map((empl) =>
        empl.id === id ? validatedEmplacement : empl
      );
      saveEmplacementsToCache(updatedCache);
    }

    // Notification
    await createRTDBNotification(
      "Emplacement modifié",
      `${validatedEmplacement.denomination} a été modifié`,
      "info"
    );

    console.log("✅ Emplacement mis à jour:", id);
    return validatedEmplacement;
  } catch (error) {
    console.error("❌ Erreur mise à jour emplacement:", error);
    throw error;
  }
}

// Fonctions désactivation/réactivation supprimées (non utilisées)

/**
 * Liste les emplacements avec filtre optionnel
 * @param {Object} filter - Filtre { type?, status?, search? }
 * @returns {Promise<Array>} Liste des emplacements
 */
export async function listEmplacements(filter = {}) {
  try {
    // Essayer le cache d'abord
    const cached = getEmplacementsFromCache();
    let emplacements = [];

    if (cached && cached.emplacements) {
      emplacements = cached.emplacements;
      console.log("📦 Liste chargée depuis le cache");
    } else {
      const listeRef = doc(db, EMPLACEMENTS_LISTE_PATH);
      const listeDoc = await getDoc(listeRef);

      if (!listeDoc.exists()) {
        return [];
      }

      emplacements = listeDoc.data().emplacements || [];
      saveEmplacementsToCache(emplacements);
    }

    // Appliquer les filtres
    let filtered = emplacements;

    if (filter.type) {
      filtered = filtered.filter((empl) => empl.type.famille === filter.type);
    }

    if (filter.status !== undefined) {
      filtered = filtered.filter((empl) => empl.status === filter.status);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (empl) =>
          empl.denomination.toLowerCase().includes(searchLower) ||
          empl.id.toLowerCase().includes(searchLower) ||
          empl.theme_central.theme.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  } catch (error) {
    console.error("❌ Erreur liste emplacements:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS BATCH - CRUD MULTIPLE (utilisées par initStockToolkit)
// ============================================================================

/**
 * Crée plusieurs emplacements en une seule transaction
 * @param {Array<Object>} emplacementsData - Array de données d'emplacements
 * @returns {Promise<Array>} Array des emplacements créés
 */
export async function createEmplacementsBatch(emplacementsData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }

    const now = Date.now();
    const validatedEmplacements = [];

    // Préparer et valider tous les emplacements
    for (const data of emplacementsData) {
      const id = `empl_${nanoid(10)}`;
      const emplacement = {
        ...data,
        id,
        stock_actuel: {},
        status: true,
        createdAt: now,
        updatedAt: now,
        updatedBy: currentUser.uid,
      };

      const validated = emplacementSchema.parse(emplacement);
      validatedEmplacements.push(validated);
    }

    await runTransaction(db, async (transaction) => {
      // Mettre à jour la liste
      const listeRef = doc(db, EMPLACEMENTS_LISTE_PATH);
      const listeDoc = await transaction.get(listeRef);
      const currentListe = listeDoc.exists()
        ? listeDoc.data().emplacements || []
        : [];

      currentListe.push(...validatedEmplacements);
      transaction.set(listeRef, { emplacements: currentListe });

      // Mettre à jour stock/emplacements
      const stockEmplacementsRef = doc(db, STOCK_EMPLACEMENTS_PATH);
      const stockUpdate = {};
      validatedEmplacements.forEach((empl) => {
        stockUpdate[empl.id] = empl;
      });
      transaction.set(stockEmplacementsRef, stockUpdate, { merge: true });
    });

    // Mettre à jour le cache
    const cached = getEmplacementsFromCache();
    const newCache = [
      ...(cached?.emplacements || []),
      ...validatedEmplacements,
    ];
    saveEmplacementsToCache(newCache);

    // Notification
    await createRTDBNotification(
      "Emplacements créés",
      `${validatedEmplacements.length} emplacements ont été créés`,
      "success"
    );

    console.log(`✅ ${validatedEmplacements.length} emplacements créés`);
    return validatedEmplacements;
  } catch (error) {
    console.error("❌ Erreur création batch emplacements:", error);
    throw error;
  }
}

/**
 * Met à jour plusieurs emplacements en une seule transaction
 * @param {Array<{id: string, updates: Object}>} updatesArray - Array de {id, updates}
 * @returns {Promise<Array>} Array des emplacements mis à jour
 */
export async function updateEmplacementsBatch(updatesArray) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }

    const now = Date.now();
    const validatedEmplacements = [];

    await runTransaction(db, async (transaction) => {
      // Mettre à jour la liste
      const listeRef = doc(db, EMPLACEMENTS_LISTE_PATH);
      const listeDoc = await transaction.get(listeRef);

      if (!listeDoc.exists()) {
        throw new Error("Liste des emplacements non trouvée");
      }

      const currentListe = listeDoc.data().emplacements || [];

      for (const { id, updates } of updatesArray) {
        const emplacementIndex = currentListe.findIndex(
          (empl) => empl.id === id
        );

        if (emplacementIndex === -1) {
          throw new Error(`Emplacement ${id} non trouvé`);
        }

        currentListe[emplacementIndex] = {
          ...currentListe[emplacementIndex],
          ...updates,
          updatedAt: now,
          updatedBy: currentUser.uid,
        };

        const validated = emplacementSchema.parse(
          currentListe[emplacementIndex]
        );
        currentListe[emplacementIndex] = validated;
        validatedEmplacements.push(validated);
      }

      transaction.set(listeRef, { emplacements: currentListe });

      // Mettre à jour stock/emplacements
      const stockEmplacementsRef = doc(db, STOCK_EMPLACEMENTS_PATH);
      const stockUpdate = {};
      validatedEmplacements.forEach((empl) => {
        stockUpdate[empl.id] = empl;
      });
      transaction.set(stockEmplacementsRef, stockUpdate, { merge: true });
    });

    // Mettre à jour le cache
    saveEmplacementsToCache(validatedEmplacements);

    // Notification
    await createRTDBNotification(
      "Emplacements modifiés",
      `${validatedEmplacements.length} emplacements ont été modifiés`,
      "info"
    );

    console.log(`✅ ${validatedEmplacements.length} emplacements mis à jour`);
    return validatedEmplacements;
  } catch (error) {
    console.error("❌ Erreur mise à jour batch emplacements:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS ET HOOKS NON UTILISÉS - SUPPRIMÉS
// ============================================================================
// Les fonctions suivantes ont été supprimées car non utilisées :
// - makeOperation()
// - getOperations()
// - useEmplacement()
// - useEmplacements()
// - useOperations()
//
// Si vous avez besoin de ces fonctions, elles peuvent être réimplémentées.

// ============================================================================
// HOOKS REACT
// ============================================================================

/**
 * Hook pour récupérer un emplacement spécifique avec cache local et sync Firestore
 * @param {string} emplacementId - ID de l'emplacement
 * @returns {Object} { emplacement, loading, error, refetch }
 *
 * @example
 * function EmplacementDetail({ id }) {
 *   const { emplacement, loading, error, refetch } = useEmplacement(id);
 *
 *   if (loading) return <div>Chargement...</div>;
 *   if (error) return <div>Erreur: {error}</div>;
 *
 *   return <div>{emplacement.denomination}</div>;
 * }
 */
export function useEmplacement(emplacementId) {
  const [emplacement, setEmplacement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!emplacementId) {
      setEmplacement(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Essayer le cache local d'abord
      const cached = getEmplacementsFromCache();
      if (cached?.emplacements) {
        const cachedEmplacement = cached.emplacements.find(
          (e) => e.id === emplacementId
        );
        if (cachedEmplacement) {
          setEmplacement(cachedEmplacement);
          console.log("📦 Emplacement chargé depuis le cache:", emplacementId);
        }
      }

      // 2. Récupérer depuis stock/emplacements (source de vérité)
      const stockEmplacementsRef = doc(db, STOCK_EMPLACEMENTS_PATH);
      const stockDoc = await getDoc(stockEmplacementsRef);

      if (stockDoc.exists()) {
        const emplacements = stockDoc.data();
        const freshEmplacement = emplacements[emplacementId];

        if (freshEmplacement) {
          setEmplacement(freshEmplacement);

          // Mettre à jour le cache avec les nouvelles données
          if (cached?.emplacements) {
            const updatedCache = cached.emplacements.map((e) =>
              e.id === emplacementId ? freshEmplacement : e
            );
            saveEmplacementsToCache(updatedCache);
          }
        } else {
          setEmplacement(null);
          setError("Emplacement non trouvé");
        }
      } else {
        setEmplacement(null);
        setError("Document stock/emplacements non trouvé");
      }
    } catch (err) {
      console.error("❌ Erreur useEmplacement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [emplacementId]);

  // Charger les données au montage et quand l'ID change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les notifications en temps réel
  useEffect(() => {
    if (!emplacementId) return;

    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (notification && notification.message?.includes(emplacementId)) {
        console.log("🔔 Notification RTDB reçue, rechargement...");
        fetchData();
      }
    };

    onValue(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "value", handleNotification);
    };
  }, [emplacementId, fetchData]);

  return { emplacement, loading, error, refetch: fetchData };
}

/**
 * Hook pour récupérer tous les emplacements avec cache local et sync Firestore
 * @param {Object} filter - Filtre optionnel { type?, status?, search? }
 * @returns {Object} { emplacements, loading, error, refetch }
 *
 * @example
 * function EmplacementsList() {
 *   const { emplacements, loading, error, refetch } = useEmplacements({ status: true });
 *
 *   if (loading) return <div>Chargement...</div>;
 *   if (error) return <div>Erreur: {error}</div>;
 *
 *   return (
 *     <ul>
 *       {emplacements.map(emp => (
 *         <li key={emp.id}>{emp.denomination}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 */
export function useEmplacements(filter = {}) {
  const [emplacements, setEmplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stabiliser les valeurs du filtre pour éviter les rerenders
  const filterType = filter.type;
  const filterStatus = filter.status;
  const filterSearch = filter.search;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Essayer le cache local d'abord
      const cached = getEmplacementsFromCache();
      if (cached?.emplacements) {
        setEmplacements(cached.emplacements);
        console.log("📦 Emplacements chargés depuis le cache");
      }

      // 2. Récupérer depuis Firestore (emplacements/liste)
      const listeRef = doc(db, EMPLACEMENTS_LISTE_PATH);
      const listeDoc = await getDoc(listeRef);

      if (listeDoc.exists()) {
        let freshEmplacements = listeDoc.data().emplacements || [];

        // Appliquer les filtres
        if (filterType) {
          freshEmplacements = freshEmplacements.filter(
            (empl) =>
              empl.type === filterType || empl.type?.famille === filterType
          );
        }

        if (filterStatus !== undefined) {
          freshEmplacements = freshEmplacements.filter(
            (empl) => empl.status === filterStatus
          );
        }

        if (filterSearch) {
          const searchLower = filterSearch.toLowerCase();
          freshEmplacements = freshEmplacements.filter(
            (empl) =>
              empl.denomination?.toLowerCase().includes(searchLower) ||
              empl.id?.toLowerCase().includes(searchLower) ||
              empl.theme_central?.theme?.toLowerCase().includes(searchLower)
          );
        }

        setEmplacements(freshEmplacements);

        // Sauvegarder dans le cache (sans filtres)
        if (!filterType && filterStatus === undefined && !filterSearch) {
          saveEmplacementsToCache(listeDoc.data().emplacements || []);
        }
      } else {
        setEmplacements([]);
      }
    } catch (err) {
      console.error("❌ Erreur useEmplacements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterSearch]);

  // Charger les données au montage et quand le filtre change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les notifications en temps réel avec debounce
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);
    let timeoutId = null;

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title?.toLowerCase().includes("emplacement") ||
          notification.message?.toLowerCase().includes("emplacement"))
      ) {
        console.log("🔔 Notification RTDB reçue");

        // Debounce: attendre 500ms avant de recharger pour éviter les rechargements multiples
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          console.log("🔄 Rechargement de la liste des emplacements...");
          fetchData();
        }, 500);
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchData]);

  return { emplacements, loading, error, refetch: fetchData };
}

// ============================================================================
// ALIAS EXPORTS
// ============================================================================

/**
 * Alias pour listEmplacements (pour compatibilité)
 */
export const getEmplacements = listEmplacements;
