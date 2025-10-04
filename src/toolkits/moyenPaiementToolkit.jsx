// toolkits/moyenPaiementToolkit.js
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { moyenPaiementSchema } from "@/toolkits/schema";

// ===========================================
// CONSTANTES
// ===========================================
const MOYENS_PAIEMENT_KEY = "lsd_moyens_paiement";
const COLLECTION = "moyens_paiement";
const DOCUMENT = "liste";

// Types de moyens de paiement
export const TYPES_PAIEMENT = {
  ESPECES: "especes",
  MOBILE: "paiement_mobile",
  BANCAIRE: "compte_bancaire",
};

// Groupes pour paiement mobile
export const GROUPES_MOBILE = {
  MTN: "MTN Mobile Money",
  MOOV: "Moov Money",
  CELTIIS: "Celtiis Cash",
};

// Groupes pour compte bancaire
export const GROUPES_BANCAIRE = {
  BOA: "Bank of Africa",
  ECOBANK: "Ecobank",
  ORABANK: "Orabank",
  UBA: "UBA",
  SGBB: "SGBB",
  AUTRE: "Autre banque",
};

// ===========================================
// FONCTIONS CRUD
// ===========================================

/**
 * Récupère tous les moyens de paiement
 */
export const getAllMoyensPaiement = async () => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: true, data: [], count: 0 };
    }

    const moyensPaiement = docSnap.data().moyensPaiement || [];

    // Mettre en cache
    localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(moyensPaiement));

    return {
      success: true,
      data: moyensPaiement,
      count: moyensPaiement.length,
    };
  } catch (error) {
    console.error("❌ Erreur getAllMoyensPaiement:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Vérifie si un moyen de paiement existe déjà
 */
const moyenPaiementExists = (moyensPaiement, type, numero, groupe) => {
  return moyensPaiement.some((mp) => {
    // Pour espèces, vérifier uniquement le type (un seul moyen espèces)
    if (type === TYPES_PAIEMENT.ESPECES) {
      return mp.type === TYPES_PAIEMENT.ESPECES;
    }

    // Pour mobile/bancaire, vérifier type + numéro + groupe
    return (
      mp.type === type &&
      mp.numero?.toLowerCase().trim() === numero?.toLowerCase().trim() &&
      mp.groupe?.toLowerCase().trim() === groupe?.toLowerCase().trim()
    );
  });
};

/**
 * Crée un nouveau moyen de paiement
 */
export const createMoyenPaiement = async (data) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let moyensPaiement = [];
    if (docSnap.exists()) {
      moyensPaiement = docSnap.data().moyensPaiement || [];
    }

    // Vérifier les doublons
    if (
      moyenPaiementExists(moyensPaiement, data.type, data.numero, data.groupe)
    ) {
      const message =
        data.type === TYPES_PAIEMENT.ESPECES
          ? "Le moyen de paiement Espèces existe déjà"
          : `${data.denomination || data.type} existe déjà`;

      toast.error(message);
      return {
        success: false,
        error: "Doublon détecté",
        isDuplicate: true,
      };
    }

    // Créer le moyen de paiement
    const nouveauMoyenPaiement = {
      id: nanoid(10),
      type: data.type,
      numero: data.numero || "",
      groupe: data.groupe || "",
      denomination: data.denomination || generateDenomination(data),
      actif: true,
      createdAt: Timestamp.now(),
    };

    // Valider avec le schema
    const validation = moyenPaiementSchema(nouveauMoyenPaiement);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Ajouter à la liste
    moyensPaiement.push(nouveauMoyenPaiement);

    // Sauvegarder
    await setDoc(docRef, { moyensPaiement, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(moyensPaiement));

    toast.success(`${nouveauMoyenPaiement.denomination} ajouté avec succès`);
    return { success: true, data: nouveauMoyenPaiement };
  } catch (error) {
    console.error("❌ Erreur createMoyenPaiement:", error);
    toast.error("Erreur lors de la création");
    return { success: false, error: error.message };
  }
};

/**
 * Génère une dénomination automatique
 */
const generateDenomination = (data) => {
  switch (data.type) {
    case TYPES_PAIEMENT.ESPECES:
      return "Espèces";

    case TYPES_PAIEMENT.MOBILE:
      return `${data.groupe} - ${data.numero}`;

    case TYPES_PAIEMENT.BANCAIRE:
      return `${data.groupe} - ${data.numero}`;

    default:
      return "Moyen de paiement";
  }
};

/**
 * Crée plusieurs moyens de paiement en batch
 */
export const createMoyensPaiementBatch = async (dataArray) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let moyensPaiement = [];
    if (docSnap.exists()) {
      moyensPaiement = docSnap.data().moyensPaiement || [];
    }

    const nouveaux = [];
    const doublons = [];
    const erreurs = [];

    for (const data of dataArray) {
      // Vérifier les doublons
      if (
        moyenPaiementExists(moyensPaiement, data.type, data.numero, data.groupe)
      ) {
        doublons.push(data.denomination || generateDenomination(data));
        continue;
      }

      // Créer le moyen de paiement
      const nouveauMoyenPaiement = {
        id: nanoid(10),
        type: data.type,
        numero: data.numero || "",
        groupe: data.groupe || "",
        denomination: data.denomination || generateDenomination(data),
        actif: true,
        createdAt: Timestamp.now(),
      };

      // Valider
      const validation = moyenPaiementSchema(nouveauMoyenPaiement);
      if (!validation.success) {
        erreurs.push({
          moyenPaiement: nouveauMoyenPaiement.denomination,
          errors: validation.errors,
        });
        continue;
      }

      nouveaux.push(nouveauMoyenPaiement);
    }

    if (nouveaux.length > 0) {
      // Ajouter tous les nouveaux moyens de paiement
      moyensPaiement = [...moyensPaiement, ...nouveaux];

      // Sauvegarder
      await setDoc(docRef, { moyensPaiement, updated_at: Timestamp.now() });

      // Mettre à jour le cache
      localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(moyensPaiement));
    }

    // Notifications
    if (nouveaux.length > 0) {
      toast.success(`${nouveaux.length} moyens de paiement ajoutés`);
    }
    if (doublons.length > 0) {
      toast.warning(`${doublons.length} doublons ignorés`);
    }
    if (erreurs.length > 0) {
      toast.error(`${erreurs.length} erreurs de validation`);
    }

    return {
      success: nouveaux.length > 0,
      created: nouveaux.length,
      duplicates: doublons,
      errors: erreurs,
      data: nouveaux,
    };
  } catch (error) {
    console.error("❌ Erreur createMoyensPaiementBatch:", error);
    toast.error("Erreur lors de la création en batch");
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour un moyen de paiement
 */
export const updateMoyenPaiement = async (id, updatedData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let moyensPaiement = docSnap.data().moyensPaiement || [];
    const index = moyensPaiement.findIndex((mp) => mp.id === id);

    if (index === -1) {
      return { success: false, error: "Moyen de paiement introuvable" };
    }

    // Vérifier doublon si modifications clés
    if (
      updatedData.type ||
      updatedData.numero !== undefined ||
      updatedData.groupe !== undefined
    ) {
      const newType = updatedData.type || moyensPaiement[index].type;
      const newNumero =
        updatedData.numero !== undefined
          ? updatedData.numero
          : moyensPaiement[index].numero;
      const newGroupe =
        updatedData.groupe !== undefined
          ? updatedData.groupe
          : moyensPaiement[index].groupe;

      // Exclure le moyen de paiement actuel de la vérification
      const otherMoyens = moyensPaiement.filter((mp) => mp.id !== id);

      if (moyenPaiementExists(otherMoyens, newType, newNumero, newGroupe)) {
        toast.error(
          "Un moyen de paiement avec ces caractéristiques existe déjà"
        );
        return {
          success: false,
          error: "Doublon détecté",
          isDuplicate: true,
        };
      }
    }

    // Mettre à jour
    moyensPaiement[index] = {
      ...moyensPaiement[index],
      ...updatedData,
      id, // Préserver l'ID
      createdAt: moyensPaiement[index].createdAt, // Préserver la date de création
      // Régénérer la dénomination si nécessaire
      denomination:
        updatedData.denomination ||
        (updatedData.type || updatedData.numero || updatedData.groupe
          ? generateDenomination({
              type: updatedData.type || moyensPaiement[index].type,
              numero:
                updatedData.numero !== undefined
                  ? updatedData.numero
                  : moyensPaiement[index].numero,
              groupe:
                updatedData.groupe !== undefined
                  ? updatedData.groupe
                  : moyensPaiement[index].groupe,
            })
          : moyensPaiement[index].denomination),
    };

    // Valider
    const validation = moyenPaiementSchema(moyensPaiement[index]);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Sauvegarder
    await setDoc(docRef, { moyensPaiement, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(moyensPaiement));

    toast.success("Moyen de paiement mis à jour");
    return { success: true, data: moyensPaiement[index] };
  } catch (error) {
    console.error("❌ Erreur updateMoyenPaiement:", error);
    toast.error("Erreur lors de la mise à jour");
    return { success: false, error: error.message };
  }
};

/**
 * Désactive un moyen de paiement (soft delete)
 */
export const desactiverMoyenPaiement = async (id) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let moyensPaiement = docSnap.data().moyensPaiement || [];
    const index = moyensPaiement.findIndex((mp) => mp.id === id);

    if (index === -1) {
      return { success: false, error: "Moyen de paiement introuvable" };
    }

    // Désactiver
    moyensPaiement[index].actif = false;

    // Sauvegarder
    await setDoc(docRef, { moyensPaiement, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(moyensPaiement));

    toast.success("Moyen de paiement désactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur desactiverMoyenPaiement:", error);
    toast.error("Erreur lors de la désactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Réactive un moyen de paiement
 */
export const reactiverMoyenPaiement = async (id) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let moyensPaiement = docSnap.data().moyensPaiement || [];
    const index = moyensPaiement.findIndex((mp) => mp.id === id);

    if (index === -1) {
      return { success: false, error: "Moyen de paiement introuvable" };
    }

    // Réactiver
    moyensPaiement[index].actif = true;

    // Sauvegarder
    await setDoc(docRef, { moyensPaiement, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(moyensPaiement));

    toast.success("Moyen de paiement réactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur reactiverMoyenPaiement:", error);
    toast.error("Erreur lors de la réactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Supprime définitivement un moyen de paiement
 */
export const deleteMoyenPaiement = async (id) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let moyensPaiement = docSnap.data().moyensPaiement || [];
    moyensPaiement = moyensPaiement.filter((mp) => mp.id !== id);

    // Sauvegarder
    await setDoc(docRef, { moyensPaiement, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(moyensPaiement));

    toast.success("Moyen de paiement supprimé définitivement");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur deleteMoyenPaiement:", error);
    toast.error("Erreur lors de la suppression");
    return { success: false, error: error.message };
  }
};

/**
 * Récupère un moyen de paiement par son ID
 */
export const getMoyenPaiementById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable", data: null };
    }

    const moyensPaiement = docSnap.data().moyensPaiement || [];
    const moyenPaiement = moyensPaiement.find((mp) => mp.id === id);

    if (!moyenPaiement) {
      return {
        success: false,
        error: "Moyen de paiement introuvable",
        data: null,
      };
    }

    return { success: true, data: moyenPaiement };
  } catch (error) {
    console.error("❌ Erreur getMoyenPaiementById:", error);
    return { success: false, error: error.message, data: null };
  }
};

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook pour récupérer tous les moyens de paiement avec synchronisation temps réel
 */
export const useMoyensPaiement = () => {
  const [moyensPaiement, setMoyensPaiement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const loadMoyensPaiement = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger depuis le cache
        const cached = localStorage.getItem(MOYENS_PAIEMENT_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.length > 0) {
            setMoyensPaiement(parsedCache);
          }
        }

        // Synchronisation temps réel
        const docRef = doc(db, COLLECTION, DOCUMENT);

        unsubscribeRef.current = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data().moyensPaiement || [];
              setMoyensPaiement(data);
              setLoading(false);

              // Mettre à jour le cache
              localStorage.setItem(MOYENS_PAIEMENT_KEY, JSON.stringify(data));
            } else {
              setMoyensPaiement([]);
              setLoading(false);
            }
          },
          (error) => {
            console.error("❌ Erreur snapshot moyens paiement:", error);
            setError(error.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("❌ Erreur loadMoyensPaiement:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadMoyensPaiement();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Fonctions utilitaires
  const moyensActifs = moyensPaiement.filter((mp) => mp.actif !== false);
  const moyensInactifs = moyensPaiement.filter((mp) => mp.actif === false);

  // Grouper par type
  const moyensByType = moyensActifs.reduce((acc, mp) => {
    const type = mp.type || "autre";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(mp);
    return acc;
  }, {});

  // Récupérer par type spécifique
  const especes = moyensActifs.filter(
    (mp) => mp.type === TYPES_PAIEMENT.ESPECES
  );
  const mobile = moyensActifs.filter((mp) => mp.type === TYPES_PAIEMENT.MOBILE);
  const bancaire = moyensActifs.filter(
    (mp) => mp.type === TYPES_PAIEMENT.BANCAIRE
  );

  return {
    moyensPaiement,
    moyensActifs,
    moyensInactifs,
    moyensByType,
    especes,
    mobile,
    bancaire,
    loading,
    error,
    totalCount: moyensPaiement.length,
    activeCount: moyensActifs.length,
    inactiveCount: moyensInactifs.length,
  };
};

// ===========================================
// EXPORTS
// ===========================================

export default {
  // CRUD
  getAllMoyensPaiement,
  createMoyenPaiement,
  createMoyensPaiementBatch,
  updateMoyenPaiement,
  desactiverMoyenPaiement,
  reactiverMoyenPaiement,
  deleteMoyenPaiement,
  getMoyenPaiementById,

  // Hook
  useMoyensPaiement,

  // Constantes
  TYPES_PAIEMENT,
  GROUPES_MOBILE,
  GROUPES_BANCAIRE,
};
