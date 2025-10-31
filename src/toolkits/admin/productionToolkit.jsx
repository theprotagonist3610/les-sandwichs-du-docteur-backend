/**
 * admin/productionToolkit.jsx
 * Gestion du système de production en cuisine avec cache local et notifications RTDB
 *
 * Structure Firestore :
 * - productions/liste: { productions: [array de ProductionDefinition] }
 * - productions/historique/days/{DDMMYYYY}: { items: [array de ProductionInstance] }
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, push, onValue, off } from "firebase/database";
import { db, rtdb } from "../../firebase.js";
import { nanoid } from "nanoid";
import { auth } from "../../firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================

const PRODUCTIONS_LIST_DOC = "productions/liste";
const PRODUCTIONS_DAYS_COLLECTION = "productions/historique/days";
const LOCAL_PRODUCTIONS_KEY = "local_prod_definitions";
const LOCAL_DAY_KEY_PREFIX = "local_prod_day_";
const RTDB_NOTIFICATIONS_PATH = "notification";

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

/**
 * Schema pour une unité de mesure
 */
export const uniteSchema = z.object({
  nom: z.string().min(1, "Le nom de l'unité est requis"),
  symbol: z.string().min(1, "Le symbole de l'unité est requis"),
});

/**
 * Schema pour une ligne de recette (proportionnelle à l'ingrédient principal)
 */
export const recetteLineSchema = z.object({
  ingredient: z.string().min(1, "L'ingrédient est requis"),
  quantite: z.number().nonnegative("La quantité doit être positive ou nulle"),
  unite: uniteSchema,
});

/**
 * Schema pour une définition de production (catalogue)
 */
export const productionDefinitionSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  type: z.enum(["menu", "boisson"]),
  denomination: z.string().min(1, "La dénomination est requise"),
  ingredient_principal: z.object({
    id: z.string().min(1),
    denomination: z.string().min(1),
    quantite_par_defaut: z.number().positive(),
    unite: uniteSchema,
  }),
  recette: z.array(recetteLineSchema).default([]),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

/**
 * Schema pour le statut d'une production
 */
export const productionStatusEnum = z.enum(["Programmee", "en_cours", "termine"]);

/**
 * Schema pour le résultat d'une production
 */
export const productionResultSchema = z.object({
  type: z.enum(["menu", "boisson"]),
  id: z.string().min(1),
  denomination: z.string().min(1),
  unite: uniteSchema,
  quantite: z.number().positive(),
  imgURL: z.string().optional().default(""),
});

/**
 * Schema pour une instance de production (historique)
 */
export const productionInstanceSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  definitionId: z.string().min(1, "L'ID de définition est requis"),
  type: z.enum(["menu", "boisson"]),
  denomination: z.string().min(1, "La dénomination est requise"),
  principal_cible: z.object({
    quantite: z.number().positive(),
    unite: uniteSchema,
  }),
  recette_calculee: z.array(recetteLineSchema).default([]),
  status: productionStatusEnum,
  note: z.string().optional().default(""),
  resultat: productionResultSchema.optional(),
  emplacementId: z.string().optional(),
  actorId: z.string().optional(),
  date: z.number().positive(),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

// ============================================================================
// GESTION DU CACHE LOCAL - DEFINITIONS
// ============================================================================

/**
 * Sauvegarde les définitions dans le LocalStorage
 */
function saveDefinitionsToCache(definitions) {
  try {
    const dataToStore = {
      data: definitions,
      lastSync: Date.now(),
    };
    localStorage.setItem(LOCAL_PRODUCTIONS_KEY, JSON.stringify(dataToStore));
    console.log("✅ Définitions de production sauvegardées en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache définitions:", error);
    return false;
  }
}

/**
 * Récupère les définitions depuis le LocalStorage
 */
function getDefinitionsFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_PRODUCTIONS_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log("✅ Définitions de production récupérées du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache définitions:", error);
    return null;
  }
}

/**
 * Supprime le cache des définitions
 */
export function clearDefinitionsCache() {
  localStorage.removeItem(LOCAL_PRODUCTIONS_KEY);
  console.log("✅ Cache définitions supprimé");
}

// ============================================================================
// GESTION DU CACHE LOCAL - HISTORIQUE PAR JOUR
// ============================================================================

/**
 * Sauvegarde les productions d'un jour dans le LocalStorage
 */
function saveDayToCache(dayKey, items) {
  try {
    const dataToStore = {
      data: items,
      lastSync: Date.now(),
    };
    localStorage.setItem(LOCAL_DAY_KEY_PREFIX + dayKey, JSON.stringify(dataToStore));
    console.log(`✅ Productions du jour ${dayKey} sauvegardées en cache`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur sauvegarde cache jour ${dayKey}:`, error);
    return false;
  }
}

/**
 * Récupère les productions d'un jour depuis le LocalStorage
 */
function getDayFromCache(dayKey) {
  try {
    const data = localStorage.getItem(LOCAL_DAY_KEY_PREFIX + dayKey);
    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log(`✅ Productions du jour ${dayKey} récupérées du cache`);
    return parsed;
  } catch (error) {
    console.error(`❌ Erreur lecture cache jour ${dayKey}:`, error);
    return null;
  }
}

/**
 * Supprime le cache d'un jour spécifique
 */
export function clearDayCache(dayKey) {
  localStorage.removeItem(LOCAL_DAY_KEY_PREFIX + dayKey);
  console.log(`✅ Cache jour ${dayKey} supprimé`);
}

// ============================================================================
// RTDB HELPERS - NOTIFICATIONS
// ============================================================================

/**
 * Crée une notification dans RTDB pour signaler une modification
 */
async function createRTDBNotification(title, message, type = "info", meta = {}) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("⚠️ Utilisateur non authentifié, notification RTDB non envoyée");
      return;
    }

    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);
    const notification = {
      userId: currentUser.uid,
      title,
      message,
      type,
      read: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta,
    };

    await push(notificationsRef, notification);
    console.log(`✅ Notification RTDB créée: ${title}`);
  } catch (error) {
    console.error("❌ Erreur création notification RTDB:", error);
    // Ne pas bloquer l'opération si la notification échoue
  }
}

// ============================================================================
// HELPERS UTILITAIRES
// ============================================================================

/**
 * Formate une date en clé jour DDMMYYYY
 */
export function formatDayKey(dateMs = Date.now()) {
  const date = new Date(dateMs);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Calcule la recette proportionnelle à la quantité demandée
 */
function expandRecette(definition, principalQuantiteDemandee) {
  if (principalQuantiteDemandee <= 0) {
    throw new Error("La quantité principale doit être positive");
  }

  const facteur =
    principalQuantiteDemandee / definition.ingredient_principal.quantite_par_defaut;

  const recetteCalculee = definition.recette.map((ligne) => ({
    ingredient: ligne.ingredient,
    quantite: ligne.quantite * facteur,
    unite: ligne.unite,
  }));

  return recetteCalculee;
}

// ============================================================================
// INTEGRATION STOCK
// ============================================================================

/**
 * Ajoute le résultat d'une production dans un emplacement (stub d'intégration)
 * À relier avec stockToolkit.appendTransaction pour une entrée de stock
 */
async function addResultToEmplacement({ emplacementId, resultItem }) {
  try {
    // Import dynamique pour éviter la dépendance circulaire
    const stockToolkit = await import("./stockToolkit.jsx");

    // Construire une transaction d'entrée
    const txn = {
      type: "entree",
      element: {
        id: resultItem.id,
        denomination: resultItem.denomination,
        unite: resultItem.unite,
        imgURL: resultItem.imgURL || "",
      },
      quantite: resultItem.quantite,
      destination: {
        emplacementId,
        externe: false,
      },
      note: `Production terminée: ${resultItem.denomination}`,
      date: Date.now(),
    };

    await stockToolkit.appendTransaction(txn);
    console.log(
      `✅ Résultat ajouté au stock (emplacement: ${emplacementId}): ${resultItem.denomination}`
    );
  } catch (error) {
    console.error("❌ Erreur intégration stock:", error);
    throw new Error(`Échec intégration stock: ${error.message}`);
  }
}

// ============================================================================
// API DEFINITIONS (CATALOGUE)
// ============================================================================

/**
 * Récupère toutes les définitions de production depuis Firestore
 */
export async function getAllProductionDefinitions() {
  try {
    const listRef = doc(db, PRODUCTIONS_LIST_DOC);
    const listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      console.log("ℹ️ Aucune définition de production trouvée");
      return [];
    }

    const data = listSnap.data();
    const definitions = data.productions || [];

    // Valider avec Zod
    const validatedDefinitions = definitions
      .map((def) => {
        try {
          return productionDefinitionSchema.parse(def);
        } catch (err) {
          console.error(`❌ Définition ${def.id} invalide:`, err);
          return null;
        }
      })
      .filter((def) => def !== null);

    // Sauvegarder dans le cache
    saveDefinitionsToCache(validatedDefinitions);

    console.log(`✅ ${validatedDefinitions.length} définitions de production récupérées`);
    return validatedDefinitions;
  } catch (error) {
    console.error("❌ Erreur récupération définitions:", error);
    throw error;
  }
}

/**
 * Crée une nouvelle définition de production
 */
export async function createProductionDefinition(defPayload) {
  try {
    const newDefinition = {
      id: `prod_${nanoid()}`,
      type: defPayload.type,
      denomination: defPayload.denomination,
      ingredient_principal: defPayload.ingredient_principal,
      recette: defPayload.recette || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validation
    const validatedDefinition = productionDefinitionSchema.parse(newDefinition);

    // Récupérer la liste actuelle
    const currentDefinitions = await getAllProductionDefinitions();

    // Ajouter la nouvelle définition
    const updatedDefinitions = [...currentDefinitions, validatedDefinition];

    // Sauvegarder dans Firestore
    const listRef = doc(db, PRODUCTIONS_LIST_DOC);
    await setDoc(listRef, { productions: updatedDefinitions });

    // Mettre à jour le cache
    saveDefinitionsToCache(updatedDefinitions);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Production:Liste:Update",
      `Nouvelle définition créée: ${validatedDefinition.denomination}`,
      "success",
      { ids: [validatedDefinition.id], reason: "create" }
    );

    console.log("✅ Définition de production créée:", validatedDefinition.id);
    return validatedDefinition;
  } catch (error) {
    console.error("❌ Erreur création définition:", error);
    throw error;
  }
}

/**
 * Met à jour une définition de production
 */
export async function updateProductionDefinition(defId, patch) {
  try {
    // Récupérer la liste actuelle
    const currentDefinitions = await getAllProductionDefinitions();

    // Trouver la définition
    const defIndex = currentDefinitions.findIndex((def) => def.id === defId);

    if (defIndex === -1) {
      throw new Error(`Définition ${defId} introuvable`);
    }

    // Mettre à jour
    const updatedDefinition = {
      ...currentDefinitions[defIndex],
      ...patch,
      updatedAt: Date.now(),
    };

    // Validation
    const validatedDefinition = productionDefinitionSchema.parse(updatedDefinition);

    // Remplacer dans la liste
    currentDefinitions[defIndex] = validatedDefinition;

    // Sauvegarder dans Firestore
    const listRef = doc(db, PRODUCTIONS_LIST_DOC);
    await setDoc(listRef, { productions: currentDefinitions });

    // Mettre à jour le cache
    saveDefinitionsToCache(currentDefinitions);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Production:Liste:Update",
      `Définition modifiée: ${validatedDefinition.denomination}`,
      "info",
      { ids: [defId], reason: "update" }
    );

    console.log("✅ Définition mise à jour:", defId);
    return validatedDefinition;
  } catch (error) {
    console.error("❌ Erreur mise à jour définition:", error);
    throw error;
  }
}

/**
 * Supprime une définition de production
 */
export async function deleteProductionDefinition(defId) {
  try {
    // Récupérer la liste actuelle
    const currentDefinitions = await getAllProductionDefinitions();

    // Filtrer la définition à supprimer
    const updatedDefinitions = currentDefinitions.filter((def) => def.id !== defId);

    if (updatedDefinitions.length === currentDefinitions.length) {
      throw new Error(`Définition ${defId} introuvable`);
    }

    const deletedDef = currentDefinitions.find((def) => def.id === defId);

    // Sauvegarder dans Firestore
    const listRef = doc(db, PRODUCTIONS_LIST_DOC);
    await setDoc(listRef, { productions: updatedDefinitions });

    // Mettre à jour le cache
    saveDefinitionsToCache(updatedDefinitions);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Production:Liste:Update",
      `Définition supprimée: ${deletedDef.denomination}`,
      "warning",
      { ids: [defId], reason: "delete" }
    );

    console.log("✅ Définition supprimée:", defId);
    return deletedDef;
  } catch (error) {
    console.error("❌ Erreur suppression définition:", error);
    throw error;
  }
}

// ============================================================================
// API HISTORIQUE (INSTANCES)
// ============================================================================

/**
 * Récupère les productions d'un jour spécifique
 */
export async function getProductionsByDay(dayKey) {
  try {
    const dayDocPath = `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`;
    const dayRef = doc(db, dayDocPath);
    const daySnap = await getDoc(dayRef);

    if (!daySnap.exists()) {
      console.log(`ℹ️ Aucune production pour le jour ${dayKey}`);
      return [];
    }

    const data = daySnap.data();
    const items = data.items || [];

    // Valider avec Zod
    const validatedItems = items
      .map((item) => {
        try {
          return productionInstanceSchema.parse(item);
        } catch (err) {
          console.error(`❌ Instance ${item.id} invalide:`, err);
          return null;
        }
      })
      .filter((item) => item !== null);

    // Sauvegarder dans le cache
    saveDayToCache(dayKey, validatedItems);

    console.log(`✅ ${validatedItems.length} productions récupérées pour ${dayKey}`);
    return validatedItems;
  } catch (error) {
    console.error(`❌ Erreur récupération productions ${dayKey}:`, error);
    throw error;
  }
}

/**
 * Programme une nouvelle production
 */
export async function scheduleProduction(
  definitionId,
  principalQuantite,
  note = "",
  dayKey = formatDayKey()
) {
  try {
    const currentUser = auth.currentUser;

    // Récupérer la définition
    const definitions = await getAllProductionDefinitions();
    const definition = definitions.find((def) => def.id === definitionId);

    if (!definition) {
      throw new Error(`Définition ${definitionId} introuvable`);
    }

    // Calculer la recette
    const recetteCalculee = expandRecette(definition, principalQuantite);

    // Créer l'instance
    const newInstance = {
      id: `pinstance_${nanoid()}`,
      definitionId: definition.id,
      type: definition.type,
      denomination: definition.denomination,
      principal_cible: {
        quantite: principalQuantite,
        unite: definition.ingredient_principal.unite,
      },
      recette_calculee: recetteCalculee,
      status: "Programmee",
      note,
      actorId: currentUser?.uid,
      date: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validation
    const validatedInstance = productionInstanceSchema.parse(newInstance);

    // Récupérer les instances du jour
    const currentItems = await getProductionsByDay(dayKey);

    // Ajouter la nouvelle instance
    const updatedItems = [...currentItems, validatedInstance];

    // Sauvegarder dans Firestore
    const dayDocPath = `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`;
    const dayRef = doc(db, dayDocPath);
    await setDoc(dayRef, { items: updatedItems });

    // Invalider le cache
    clearDayCache(dayKey);
    saveDayToCache(dayKey, updatedItems);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Production:Historique:Update",
      `Production programmée: ${validatedInstance.denomination}`,
      "success",
      { day: dayKey, action: "schedule", instanceId: validatedInstance.id }
    );

    console.log("✅ Production programmée:", validatedInstance.id);
    return validatedInstance;
  } catch (error) {
    console.error("❌ Erreur programmation production:", error);
    throw error;
  }
}

/**
 * Démarre une production
 */
export async function startProduction(instanceId, dayKey = formatDayKey()) {
  try {
    // Récupérer les instances du jour
    const currentItems = await getProductionsByDay(dayKey);

    // Trouver l'instance
    const instanceIndex = currentItems.findIndex((item) => item.id === instanceId);

    if (instanceIndex === -1) {
      throw new Error(`Instance ${instanceId} introuvable`);
    }

    const instance = currentItems[instanceIndex];

    if (instance.status === "termine") {
      throw new Error("Impossible de démarrer une production déjà terminée");
    }

    // Mettre à jour le statut
    const updatedInstance = {
      ...instance,
      status: "en_cours",
      updatedAt: Date.now(),
    };

    // Validation
    const validatedInstance = productionInstanceSchema.parse(updatedInstance);

    // Remplacer dans la liste
    currentItems[instanceIndex] = validatedInstance;

    // Sauvegarder dans Firestore
    const dayDocPath = `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`;
    const dayRef = doc(db, dayDocPath);
    await setDoc(dayRef, { items: currentItems });

    // Invalider le cache
    clearDayCache(dayKey);
    saveDayToCache(dayKey, currentItems);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Production:Historique:Update",
      `Production démarrée: ${validatedInstance.denomination}`,
      "info",
      { day: dayKey, action: "start", instanceId }
    );

    console.log("✅ Production démarrée:", instanceId);
    return validatedInstance;
  } catch (error) {
    console.error("❌ Erreur démarrage production:", error);
    throw error;
  }
}

/**
 * Termine une production et l'intègre au stock
 */
export async function completeProduction(
  instanceId,
  dayKey = formatDayKey(),
  { resultat, emplacementId }
) {
  try {
    // Vérifier les paramètres requis
    if (!resultat) {
      throw new Error("Le résultat est requis pour terminer la production");
    }

    if (!emplacementId) {
      throw new Error("L'emplacement de stockage est requis");
    }

    // Valider le résultat
    const validatedResultat = productionResultSchema.parse(resultat);

    // Récupérer les instances du jour
    const currentItems = await getProductionsByDay(dayKey);

    // Trouver l'instance
    const instanceIndex = currentItems.findIndex((item) => item.id === instanceId);

    if (instanceIndex === -1) {
      throw new Error(`Instance ${instanceId} introuvable`);
    }

    const instance = currentItems[instanceIndex];

    if (instance.status === "termine") {
      throw new Error("Production déjà terminée");
    }

    // Mettre à jour l'instance
    const updatedInstance = {
      ...instance,
      status: "termine",
      resultat: validatedResultat,
      emplacementId,
      updatedAt: Date.now(),
    };

    // Validation
    const validatedInstance = productionInstanceSchema.parse(updatedInstance);

    // Remplacer dans la liste
    currentItems[instanceIndex] = validatedInstance;

    // Sauvegarder dans Firestore
    const dayDocPath = `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`;
    const dayRef = doc(db, dayDocPath);
    await setDoc(dayRef, { items: currentItems });

    // Intégrer le résultat au stock
    try {
      await addResultToEmplacement({
        emplacementId,
        resultItem: validatedResultat,
      });
    } catch (stockError) {
      console.error("❌ Erreur intégration stock:", stockError);
      throw new Error(`Échec intégration stock: ${stockError.message}`);
    }

    // Invalider le cache
    clearDayCache(dayKey);
    saveDayToCache(dayKey, currentItems);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Production:Historique:Update",
      `Production terminée: ${validatedInstance.denomination}`,
      "success",
      { day: dayKey, action: "complete", instanceId }
    );

    console.log("✅ Production terminée:", instanceId);
    return validatedInstance;
  } catch (error) {
    console.error("❌ Erreur finalisation production:", error);
    throw error;
  }
}

/**
 * Met à jour une instance de production
 */
export async function updateProductionInstance(
  instanceId,
  dayKey = formatDayKey(),
  patch
) {
  try {
    // Récupérer les instances du jour
    const currentItems = await getProductionsByDay(dayKey);

    // Trouver l'instance
    const instanceIndex = currentItems.findIndex((item) => item.id === instanceId);

    if (instanceIndex === -1) {
      throw new Error(`Instance ${instanceId} introuvable`);
    }

    const instance = currentItems[instanceIndex];

    // Empêcher l'écrasement de certains champs critiques
    const { definitionId, recette_calculee, ...allowedPatch } = patch;

    // Mettre à jour
    const updatedInstance = {
      ...instance,
      ...allowedPatch,
      updatedAt: Date.now(),
    };

    // Validation
    const validatedInstance = productionInstanceSchema.parse(updatedInstance);

    // Remplacer dans la liste
    currentItems[instanceIndex] = validatedInstance;

    // Sauvegarder dans Firestore
    const dayDocPath = `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`;
    const dayRef = doc(db, dayDocPath);
    await setDoc(dayRef, { items: currentItems });

    // Invalider le cache
    clearDayCache(dayKey);
    saveDayToCache(dayKey, currentItems);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Production:Historique:Update",
      `Production mise à jour: ${validatedInstance.denomination}`,
      "info",
      { day: dayKey, action: "update", instanceId }
    );

    console.log("✅ Production mise à jour:", instanceId);
    return validatedInstance;
  } catch (error) {
    console.error("❌ Erreur mise à jour production:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS REACT
// ============================================================================

/**
 * Hook pour gérer les définitions de production avec cache local
 * Synchronisation automatique via RTDB notifications
 */
export function useProductionDefinitions() {
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou automatique)
   */
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const freshDefinitions = await getAllProductionDefinitions();
      setDefinitions(freshDefinitions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cached = getDefinitionsFromCache();
    if (cached && cached.data) {
      setDefinitions(cached.data);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Écouter les notifications RTDB pour synchronisation automatique
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      if (!snapshot.exists()) return;

      const notifications = snapshot.val();
      const notificationsList = Object.entries(notifications).map(([key, value]) => ({
        id: key,
        ...value,
      }));

      // Chercher une notification "Production:Liste:Update" récente (< 5 secondes)
      const now = Date.now();
      const recentNotif = notificationsList.find(
        (notif) =>
          notif.title === "Production:Liste:Update" && now - notif.createdAt < 5000
      );

      if (recentNotif) {
        console.log(
          "🔔 Notification détectée: Production:Liste:Update - Synchronisation..."
        );
        sync();
      }
    };

    // Écouter les changements
    onValue(notificationsRef, handleNotification);

    // Cleanup
    return () => {
      off(notificationsRef, "value", handleNotification);
    };
  }, [sync]);

  return {
    definitions,
    loading,
    error,
    sync,
  };
}

/**
 * Hook pour gérer les productions d'un jour avec cache local
 * Synchronisation automatique via RTDB notifications
 */
export function useProductionsDay(dayKey) {
  const currentDayKey = dayKey || formatDayKey(Date.now());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou automatique)
   */
  const sync = useCallback(
    async (targetDayKey) => {
      try {
        setLoading(true);
        setError(null);
        const freshItems = await getProductionsByDay(targetDayKey || currentDayKey);
        setItems(freshItems);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [currentDayKey]
  );

  // Charger depuis le cache au montage
  useEffect(() => {
    const cached = getDayFromCache(currentDayKey);
    if (cached && cached.data) {
      setItems(cached.data);
      setLoading(false);
    } else {
      sync(currentDayKey);
    }
  }, [currentDayKey, sync]);

  // Écouter les notifications RTDB pour synchronisation automatique
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      if (!snapshot.exists()) return;

      const notifications = snapshot.val();
      const notificationsList = Object.entries(notifications).map(([key, value]) => ({
        id: key,
        ...value,
      }));

      // Chercher une notification "Production:Historique:Update" récente (< 5 secondes)
      const now = Date.now();
      const recentNotif = notificationsList.find(
        (notif) =>
          notif.title === "Production:Historique:Update" &&
          notif.meta?.day === currentDayKey &&
          now - notif.createdAt < 5000
      );

      if (recentNotif) {
        console.log(
          `🔔 Notification détectée: Production:Historique:Update (${currentDayKey}) - Synchronisation...`
        );
        sync(currentDayKey);
      }
    };

    // Écouter les changements
    onValue(notificationsRef, handleNotification);

    // Cleanup
    return () => {
      off(notificationsRef, "value", handleNotification);
    };
  }, [currentDayKey, sync]);

  return {
    items,
    loading,
    error,
    sync,
  };
}

/**
 * Hook pour gérer le workflow de production
 */
export function useProductionFlow(dayKey) {
  const currentDayKey = dayKey || formatDayKey(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const schedule = useCallback(
    async (definitionId, principalQuantite, note) => {
      try {
        setSubmitting(true);
        setError(null);

        const result = await scheduleProduction(
          definitionId,
          principalQuantite,
          note,
          currentDayKey
        );

        console.log("✅ Production programmée avec succès");
        return result;
      } catch (err) {
        setError(err.message);
        console.error("❌ Erreur programmation production:", err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [currentDayKey]
  );

  const start = useCallback(
    async (instanceId) => {
      try {
        setSubmitting(true);
        setError(null);

        const result = await startProduction(instanceId, currentDayKey);

        console.log("✅ Production démarrée avec succès");
        return result;
      } catch (err) {
        setError(err.message);
        console.error("❌ Erreur démarrage production:", err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [currentDayKey]
  );

  const complete = useCallback(
    async (instanceId, { resultat, emplacementId }) => {
      try {
        setSubmitting(true);
        setError(null);

        const result = await completeProduction(instanceId, currentDayKey, {
          resultat,
          emplacementId,
        });

        console.log("✅ Production terminée avec succès");
        return result;
      } catch (err) {
        setError(err.message);
        console.error("❌ Erreur finalisation production:", err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [currentDayKey]
  );

  return {
    schedule,
    start,
    complete,
    submitting,
    error,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Schemas
  uniteSchema,
  recetteLineSchema,
  productionDefinitionSchema,
  productionInstanceSchema,
  productionStatusEnum,
  productionResultSchema,

  // Utils
  formatDayKey,

  // Definitions
  getAllProductionDefinitions,
  createProductionDefinition,
  updateProductionDefinition,
  deleteProductionDefinition,

  // Historique (instances)
  getProductionsByDay,
  scheduleProduction,
  startProduction,
  completeProduction,
  updateProductionInstance,

  // Hooks
  useProductionDefinitions,
  useProductionsDay,
  useProductionFlow,

  // Cache
  clearDefinitionsCache,
  clearDayCache,
};