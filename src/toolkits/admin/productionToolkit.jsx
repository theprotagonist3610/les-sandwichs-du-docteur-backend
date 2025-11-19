/**
 * admin/productionToolkit.jsx
 * Gestion du système de production en cuisine avec cache local et notifications RTDB
 *
 * SYSTÈME DE QUEUE ANTI-COLLISION:
 * Toutes les opérations de création/modification/suppression passent par une queue
 * d'opérations pour garantir l'atomicité et éviter les collisions Firestore.
 *
 * Structure Firestore :
 * - productions/liste: { productions: [array de ProductionDefinition] }
 * - productions/en_attente: { items: [array de ProductionInstance] }
 * - productions/historique/days/{DDMMYYYY}: { items: [array de ProductionInstance] }
 * - productions/operationsQueue: document array qui contient la queue des opérations
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import { ref, push, onValue, off, onChildAdded } from "firebase/database";
import { db, rtdb } from "../../firebase.js";
import { nanoid } from "nanoid";
import { auth } from "../../firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================

// Statuts des opérations dans la queue
export const OPERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

// Types d'opérations de production
export const OPERATION_TYPES = {
  SCHEDULE: "schedule",           // Programmer une production
  START: "start",                 // Démarrer une production
  COMPLETE: "complete",           // Terminer une production
  UPDATE_INSTANCE: "update_instance", // Mettre à jour une instance
  CREATE_DEFINITION: "create_definition", // Créer une définition
  UPDATE_DEFINITION: "update_definition", // Mettre à jour une définition
  DELETE_DEFINITION: "delete_definition", // Supprimer une définition
};

const PRODUCTIONS_LIST_DOC = "productions/liste";
const PRODUCTIONS_EN_ATTENTE_DOC = "productions/en_attente";
const PRODUCTIONS_DAYS_COLLECTION = "productions/historique/days";
const PRODUCTIONS_STATISTIQUES_DOC = "productions/statistiques";
const PRODUCTIONS_OPERATIONS_QUEUE_DOC = "productions/operationsQueue";
const LOCAL_PRODUCTIONS_KEY = "local_prod_definitions";
const LOCAL_EN_ATTENTE_KEY = "local_prod_en_attente";
const LOCAL_DAY_KEY_PREFIX = "local_prod_day_";
const RTDB_NOTIFICATIONS_PATH = "notification";
const RTDB_QUEUE_TRIGGER_PATH = "productions_queue_trigger"; // Trigger pour le worker

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
  produit_fini: z.object({
    type: z.enum(["menu", "boisson"], {
      errorMap: () => ({ message: "Le type du produit fini est requis (menu ou boisson)" }),
    }),
    denomination: z.string().min(1, "La dénomination du produit fini est requise"),
    unite: z.object({
      nom: z.string().min(1, "Le nom de l'unité du produit fini est requis"),
      symbol: z.string().min(1, "Le symbole de l'unité du produit fini est requis"),
    }),
  }),
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

/**
 * Schema pour une recette produite (statistiques journalières)
 */
export const recetteProduitSchema = z.object({
  ingredient_principal: z.string().min(1),
  quantite_produite: z.number().nonnegative(),
  unite: uniteSchema,
  tendance: z.enum(["hausse", "baisse", "stable", "nouvelle"]).optional(),
});

/**
 * Schema pour les statistiques d'un jour
 */
export const statistiqueJourSchema = z.object({
  jour: z.string().regex(/^\d{8}$/, "Le jour doit être au format DDMMYYYY"),
  recettesProduites: z.array(recetteProduitSchema),
});

/**
 * Schema pour le document statistiques (7 derniers jours)
 */
export const statistiquesSchema = z.object({
  statistiques: z.array(statistiqueJourSchema).max(7, "Maximum 7 jours de statistiques"),
  lastUpdated: z.number().positive(),
});

/**
 * Schema pour une opération dans la queue
 */
export const queuedProductionOperationSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  timestamp: z.number().positive("Le timestamp doit être positif"),
  type: z.enum([
    OPERATION_TYPES.SCHEDULE,
    OPERATION_TYPES.START,
    OPERATION_TYPES.COMPLETE,
    OPERATION_TYPES.UPDATE_INSTANCE,
    OPERATION_TYPES.CREATE_DEFINITION,
    OPERATION_TYPES.UPDATE_DEFINITION,
    OPERATION_TYPES.DELETE_DEFINITION,
  ]),
  status: z.enum([
    OPERATION_STATUS.PENDING,
    OPERATION_STATUS.PROCESSING,
    OPERATION_STATUS.COMPLETED,
    OPERATION_STATUS.FAILED,
  ]),
  payload: z.object({
    // Pour SCHEDULE
    definitionId: z.string().optional(),
    principalQuantite: z.number().optional(),
    note: z.string().optional(),
    dayKey: z.string().optional(),

    // Pour START
    instanceId: z.string().optional(),

    // Pour COMPLETE
    resultat: z.any().optional(),
    emplacementId: z.string().optional(),

    // Pour UPDATE_INSTANCE
    updates: z.any().optional(),

    // Pour CREATE_DEFINITION
    definitionData: z.any().optional(),

    // Pour UPDATE_DEFINITION / DELETE_DEFINITION
    defId: z.string().optional(),
    defUpdates: z.any().optional(),
  }),
  userId: z.string().min(1, "userId est requis"),
  error: z.string().optional(),
  retryCount: z.number().min(0).default(0),
  createdAt: z.number().positive(),
  processedAt: z.number().optional(),
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
 * Vérifie si le cache est encore valide (< 5 minutes)
 */
function getDefinitionsFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_PRODUCTIONS_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Vérifier l'expiration du cache (5 minutes = 300000 ms)
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const cacheAge = now - parsed.lastSync;

    if (cacheAge > CACHE_DURATION) {
      console.log("⏰ [getDefinitionsFromCache] Cache expiré (", Math.round(cacheAge / 60000), "minutes)");
      return null; // Cache expiré
    }

    console.log("✅ [getDefinitionsFromCache] Cache valide (", Math.round(cacheAge / 1000), "secondes)");
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
// GESTION DU CACHE LOCAL - PRODUCTIONS EN ATTENTE
// ============================================================================

/**
 * Sauvegarde les productions en attente dans le LocalStorage
 */
function saveEnAttenteToCache(items) {
  try {
    const dataToStore = {
      data: items,
      lastSync: Date.now(),
    };
    localStorage.setItem(LOCAL_EN_ATTENTE_KEY, JSON.stringify(dataToStore));
    console.log("✅ Productions en attente sauvegardées en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache en_attente:", error);
    return false;
  }
}

/**
 * Récupère les productions en attente depuis le LocalStorage
 */
function getEnAttenteFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_EN_ATTENTE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log("✅ Productions en attente récupérées du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache en_attente:", error);
    return null;
  }
}

/**
 * Supprime le cache des productions en attente
 */
export function clearEnAttenteCache() {
  localStorage.removeItem(LOCAL_EN_ATTENTE_KEY);
  console.log("✅ Cache en_attente supprimé");
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
// GESTION DE LA QUEUE D'OPÉRATIONS - ANTI-COLLISION
// ============================================================================

// Variable globale pour éviter les exécutions simultanées
let isExecutingProductions = false;

// Constante pour le dernier nettoyage
const LOCAL_LAST_CLEANUP_KEY = "lsd_productions_last_cleanup";

/**
 * Helpers pour le nettoyage automatique de la queue
 */
function getLastCleanupDate() {
  try {
    return localStorage.getItem(LOCAL_LAST_CLEANUP_KEY);
  } catch (error) {
    console.error("❌ Erreur lecture dernier nettoyage:", error);
    return null;
  }
}

function saveLastCleanupDate(dateKey) {
  try {
    localStorage.setItem(LOCAL_LAST_CLEANUP_KEY, dateKey);
    console.log("✅ Date de nettoyage sauvegardée:", dateKey);
  } catch (error) {
    console.error("❌ Erreur sauvegarde date nettoyage:", error);
  }
}

function shouldCleanProductionQueue() {
  const today = formatDayKey();
  const lastCleanup = getLastCleanupDate();

  if (!lastCleanup) {
    return true; // Jamais nettoyé
  }

  return today !== lastCleanup;
}

/**
 * Ajoute une opération à la queue de production
 * @param {string} type - Type d'opération
 * @param {Object} payload - Données de l'opération
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération créée
 */
export async function enqueueProductionOperation(
  type,
  payload,
  userId = "system"
) {
  try {
    const now = Date.now();
    const operationId = `PROD-OP-${nanoid(10)}`;

    const operation = {
      id: operationId,
      timestamp: now,
      type,
      status: OPERATION_STATUS.PENDING,
      payload,
      userId,
      retryCount: 0,
      createdAt: now,
    };

    // Valider l'opération
    const validatedOperation = queuedProductionOperationSchema.parse(operation);

    // Ajouter à la queue avec runTransaction pour éviter les collisions
    const queueRef = doc(db, PRODUCTIONS_OPERATIONS_QUEUE_DOC);

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);
      const currentQueue = queueDoc.exists()
        ? queueDoc.data().operations || []
        : [];

      currentQueue.push(validatedOperation);

      transaction.set(queueRef, { operations: currentQueue }, { merge: true });
    });

    console.log("✅ Opération production ajoutée à la queue:", operationId);

    // Trigger RTDB pour le worker
    try {
      await push(ref(rtdb, RTDB_QUEUE_TRIGGER_PATH), {
        operationId: validatedOperation.id,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Erreur trigger RTDB:", error);
      // Ne pas bloquer l'opération si le trigger échoue
    }

    // Notification
    await createRTDBNotification(
      "Opération production en file d'attente",
      `Opération ${type} ajoutée à la queue`,
      "info"
    );

    return validatedOperation;
  } catch (error) {
    console.error("❌ Erreur ajout opération à la queue:", error);
    throw error;
  }
}

/**
 * Exécute toutes les opérations en attente dans la queue
 * Les opérations sont exécutées chronologiquement avec runTransaction
 * @returns {Promise<Object>} Résumé de l'exécution { success: number, failed: number, errors: [] }
 */
export async function executeProductionOperations() {
  // Éviter les exécutions simultanées
  if (isExecutingProductions) {
    console.log("⏳ Exécution production déjà en cours, opération ignorée");
    return { success: 0, failed: 0, errors: [], skipped: true };
  }

  try {
    isExecutingProductions = true;
    console.log("🔄 Début de l'exécution des opérations production...");

    const queueRef = doc(db, PRODUCTIONS_OPERATIONS_QUEUE_DOC);
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    await runTransaction(db, async (transaction) => {
      // 1. Récupérer la queue
      const queueDoc = await transaction.get(queueRef);
      if (!queueDoc.exists()) {
        console.log("📭 Queue production vide");
        return;
      }

      const queue = queueDoc.data().operations || [];

      // 2. Filtrer les opérations en attente
      const pendingOps = queue.filter(
        (op) => op.status === OPERATION_STATUS.PENDING
      );

      if (pendingOps.length === 0) {
        console.log("📭 Aucune opération production en attente");
        return;
      }

      // 3. Trier chronologiquement
      pendingOps.sort((a, b) => a.timestamp - b.timestamp);

      console.log(`📋 ${pendingOps.length} opérations production à traiter`);

      // 4. Récupérer TOUS les documents nécessaires (AVANT toute écriture)
      const listeRef = doc(db, PRODUCTIONS_LIST_DOC);
      const enAttenteRef = doc(db, PRODUCTIONS_EN_ATTENTE_DOC);
      const now = Date.now();

      // IMPORTANT: Toutes les lectures avant toute écriture
      const [listeDoc, enAttenteDoc] = await Promise.all([
        transaction.get(listeRef),
        transaction.get(enAttenteRef),
      ]);

      // Structure: { liste: { productions: [...] } }
      const listeData = listeDoc.exists() ? listeDoc.data() : {};
      let definitions = listeData.liste?.productions || listeData.productions || [];
      let enAttente = enAttenteDoc.exists() ? enAttenteDoc.data().items || [] : [];

      // Map pour stocker les documents de jour déjà chargés
      const dayDocsMap = new Map();

      // Précharger tous les documents de jour nécessaires
      for (const operation of pendingOps) {
        const dayKey = operation.payload.dayKey || formatDayKey();
        if (!dayDocsMap.has(dayKey)) {
          const dayDocPath = `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`;
          const dayRef = doc(db, dayDocPath);
          const dayDoc = await transaction.get(dayRef);
          dayDocsMap.set(dayKey, {
            ref: dayRef,
            items: dayDoc.exists() ? dayDoc.data().items || [] : [],
          });
        }
      }

      // 5. Exécuter chaque opération
      for (const operation of pendingOps) {
        try {
          // Trouver l'opération dans la queue d'origine
          const operationInQueue = queue.find((op) => op.id === operation.id);
          if (!operationInQueue) {
            console.error(`⚠️ Opération ${operation.id} introuvable`);
            continue;
          }

          const { type, payload } = operation;

          // Traiter selon le type d'opération
          if (type === OPERATION_TYPES.SCHEDULE) {
            // SCHEDULE: Programmer une nouvelle production
            const { definitionId, principalQuantite, note, dayKey } = payload;
            const targetDayKey = dayKey || formatDayKey();

            // Récupérer la définition
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
              note: note || "",
              actorId: operation.userId,
              date: now,
              createdAt: now,
              updatedAt: now,
            };

            // Validation
            const validatedInstance = productionInstanceSchema.parse(newInstance);

            // Ajouter dans en_attente
            enAttente.push(validatedInstance);

            // Ajouter dans l'historique du jour
            const dayData = dayDocsMap.get(targetDayKey);
            dayData.items.push(validatedInstance);
          } else if (type === OPERATION_TYPES.START) {
            // START: Démarrer une production
            const { instanceId, dayKey } = payload;
            const targetDayKey = dayKey || formatDayKey();

            // Trouver dans en_attente
            const enAttenteIndex = enAttente.findIndex((item) => item.id === instanceId);
            if (enAttenteIndex === -1) {
              throw new Error(`Instance ${instanceId} introuvable dans en_attente`);
            }

            const instance = enAttente[enAttenteIndex];
            if (instance.status === "termine") {
              throw new Error("Impossible de démarrer une production déjà terminée");
            }

            // Mettre à jour le statut
            const updatedInstance = {
              ...instance,
              status: "en_cours",
              updatedAt: now,
            };

            // Validation
            const validatedInstance = productionInstanceSchema.parse(updatedInstance);

            // Mettre à jour dans en_attente
            enAttente[enAttenteIndex] = validatedInstance;

            // Mettre à jour dans l'historique du jour
            const dayData = dayDocsMap.get(targetDayKey);
            const dayIndex = dayData.items.findIndex((item) => item.id === instanceId);
            if (dayIndex !== -1) {
              dayData.items[dayIndex] = validatedInstance;
            }
          } else if (type === OPERATION_TYPES.COMPLETE) {
            // COMPLETE: Terminer une production
            const { instanceId, resultat, emplacementId, dayKey } = payload;
            const targetDayKey = dayKey || formatDayKey();

            // Valider le résultat
            const validatedResultat = productionResultSchema.parse(resultat);

            // Trouver dans en_attente
            const enAttenteIndex = enAttente.findIndex((item) => item.id === instanceId);
            if (enAttenteIndex === -1) {
              throw new Error(`Instance ${instanceId} introuvable dans en_attente`);
            }

            const instance = enAttente[enAttenteIndex];
            if (instance.status === "termine") {
              throw new Error("Production déjà terminée");
            }

            // Mettre à jour l'instance
            const updatedInstance = {
              ...instance,
              status: "termine",
              resultat: validatedResultat,
              emplacementId,
              updatedAt: now,
            };

            // Validation
            const validatedInstance = productionInstanceSchema.parse(updatedInstance);

            // Supprimer de en_attente
            enAttente = enAttente.filter((item) => item.id !== instanceId);

            // Mettre à jour dans l'historique du jour
            const dayData = dayDocsMap.get(targetDayKey);
            const dayIndex = dayData.items.findIndex((item) => item.id === instanceId);
            if (dayIndex !== -1) {
              dayData.items[dayIndex] = validatedInstance;
            } else {
              dayData.items.push(validatedInstance);
            }

            // Marquer pour intégration stock (en dehors de la transaction)
            operationInQueue._pendingStockIntegration = {
              emplacementId,
              resultItem: validatedResultat,
            };

            // Marquer pour mise à jour des statistiques
            operationInQueue._pendingStatsUpdate = {
              dayKey: targetDayKey,
              instance: validatedInstance,
            };
          } else if (type === OPERATION_TYPES.UPDATE_INSTANCE) {
            // UPDATE_INSTANCE: Mettre à jour une instance
            const { instanceId, updates, dayKey } = payload;
            const targetDayKey = dayKey || formatDayKey();

            // Empêcher l'écrasement de certains champs critiques
            const { definitionId, recette_calculee, ...allowedPatch } = updates;

            // Mettre à jour dans l'historique du jour
            const dayData = dayDocsMap.get(targetDayKey);
            const dayIndex = dayData.items.findIndex((item) => item.id === instanceId);
            if (dayIndex === -1) {
              throw new Error(`Instance ${instanceId} introuvable`);
            }

            const updatedInstance = {
              ...dayData.items[dayIndex],
              ...allowedPatch,
              updatedAt: now,
            };

            // Validation
            const validatedInstance = productionInstanceSchema.parse(updatedInstance);
            dayData.items[dayIndex] = validatedInstance;

            // Mettre à jour dans en_attente si présente
            const enAttenteIndex = enAttente.findIndex((item) => item.id === instanceId);
            if (enAttenteIndex !== -1) {
              enAttente[enAttenteIndex] = validatedInstance;
            }
          } else if (type === OPERATION_TYPES.CREATE_DEFINITION) {
            // CREATE_DEFINITION: Créer une définition
            const { definitionData } = payload;

            const newDefinition = {
              id: `prod_${nanoid()}`,
              type: definitionData.type,
              denomination: definitionData.denomination,
              ingredient_principal: definitionData.ingredient_principal,
              recette: definitionData.recette || [],
              produit_fini: definitionData.produit_fini,
              createdAt: now,
              updatedAt: now,
            };

            // Validation
            const validatedDefinition = productionDefinitionSchema.parse(newDefinition);
            definitions.push(validatedDefinition);
          } else if (type === OPERATION_TYPES.UPDATE_DEFINITION) {
            // UPDATE_DEFINITION: Mettre à jour une définition
            const { defId, defUpdates } = payload;

            const defIndex = definitions.findIndex((def) => def.id === defId);
            if (defIndex === -1) {
              throw new Error(`Définition ${defId} introuvable`);
            }

            const updatedDefinition = {
              ...definitions[defIndex],
              ...defUpdates,
              updatedAt: now,
            };

            // Validation
            const validatedDefinition = productionDefinitionSchema.parse(updatedDefinition);
            definitions[defIndex] = validatedDefinition;
          } else if (type === OPERATION_TYPES.DELETE_DEFINITION) {
            // DELETE_DEFINITION: Supprimer une définition
            const { defId } = payload;

            const filtered = definitions.filter((def) => def.id !== defId);
            if (filtered.length === definitions.length) {
              throw new Error(`Définition ${defId} introuvable`);
            }

            definitions = filtered;
          }

          // Marquer l'opération comme complétée
          operationInQueue.status = OPERATION_STATUS.COMPLETED;
          operationInQueue.processedAt = now;
          results.success++;

          console.log(`✅ Opération production ${operation.id} exécutée`);
        } catch (error) {
          // Marquer l'opération comme échouée
          const operationInQueue = queue.find((op) => op.id === operation.id);
          if (operationInQueue) {
            operationInQueue.status = OPERATION_STATUS.FAILED;
            operationInQueue.error = error.message;
            operationInQueue.retryCount =
              (operationInQueue.retryCount || 0) + 1;
          }

          results.failed++;
          results.errors.push({
            operationId: operation.id,
            error: error.message,
          });

          console.error(`❌ Échec opération production ${operation.id}:`, error.message);
        }
      }

      // 6. ÉCRITURES: Sauvegarder toutes les modifications
      // Structure: { liste: { productions: [...] } }
      transaction.set(listeRef, { liste: { productions: definitions } });
      transaction.set(enAttenteRef, { items: enAttente });

      // Sauvegarder tous les documents de jour
      for (const [dayKey, dayData] of dayDocsMap.entries()) {
        transaction.set(dayData.ref, { items: dayData.items });
      }

      transaction.set(queueRef, { operations: queue }, { merge: true });
    });

    // 7. Traiter les opérations post-transaction (intégration stock, statistiques)
    const queueDoc = await getDoc(queueRef);
    if (queueDoc.exists()) {
      const queue = queueDoc.data().operations || [];
      for (const operation of queue) {
        // Intégration stock
        if (operation._pendingStockIntegration) {
          try {
            await addResultToEmplacement(operation._pendingStockIntegration);
          } catch (error) {
            console.error("❌ Erreur intégration stock:", error);
            // Ne pas bloquer les autres opérations
          }
        }

        // Mise à jour des statistiques
        if (operation._pendingStatsUpdate) {
          try {
            await updateProductionStatistiques(
              operation._pendingStatsUpdate.dayKey,
              operation._pendingStatsUpdate.instance
            );
          } catch (error) {
            console.error("❌ Erreur mise à jour statistiques:", error);
            // Ne pas bloquer les autres opérations
          }
        }
      }
    }

    // 8. Invalider les caches
    clearDefinitionsCache();
    clearEnAttenteCache();

    console.log(
      `✅ Exécution production terminée: ${results.success} réussies, ${results.failed} échouées`
    );

    // Notifications
    if (results.success > 0) {
      await createRTDBNotification(
        "Opérations production",
        `${results.success} opération(s) effectuée(s)`,
        "success"
      );
    }

    if (results.failed > 0) {
      await createRTDBNotification(
        "Opérations production",
        `${results.failed} opération(s) échouée(s)`,
        "warning"
      );
    }

    return results;
  } catch (error) {
    console.error("❌ Erreur exécution des opérations production:", error);
    throw error;
  } finally {
    isExecutingProductions = false;
  }
}

/**
 * Nettoie la queue en supprimant les opérations complétées
 * @returns {Promise<number>} Nombre d'opérations supprimées
 */
export async function cleanProductionQueue() {
  try {
    const queueRef = doc(db, PRODUCTIONS_OPERATIONS_QUEUE_DOC);
    let removedCount = 0;

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);

      if (!queueDoc.exists()) {
        return;
      }

      const queue = queueDoc.data().operations || [];

      // Garder UNIQUEMENT les opérations pending, processing et failed
      const filteredQueue = queue.filter((op) => {
        const shouldKeep =
          op.status === OPERATION_STATUS.PENDING ||
          op.status === OPERATION_STATUS.PROCESSING ||
          op.status === OPERATION_STATUS.FAILED;

        if (!shouldKeep) removedCount++;
        return shouldKeep;
      });

      transaction.set(queueRef, { operations: filteredQueue }, { merge: true });
    });

    // Sauvegarder la date du nettoyage
    const today = formatDayKey();
    saveLastCleanupDate(today);

    console.log(`✅ Queue production nettoyée: ${removedCount} opérations supprimées`);

    if (removedCount > 0) {
      await createRTDBNotification(
        "Queue production nettoyée",
        `${removedCount} opérations complétées supprimées`,
        "info"
      );
    }

    return removedCount;
  } catch (error) {
    console.error("❌ Erreur nettoyage de la queue production:", error);
    throw error;
  }
}

/**
 * Vérifie si un nettoyage est nécessaire et l'exécute si besoin
 * @returns {Promise<number|null>} Nombre d'opérations supprimées ou null
 */
export async function autoCleanProductionQueue() {
  try {
    if (shouldCleanProductionQueue()) {
      console.log(
        "🧹 Détection d'un nouveau jour - Nettoyage automatique de la queue production"
      );
      const removedCount = await cleanProductionQueue();
      return removedCount;
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur nettoyage automatique production:", error);
    throw error;
  }
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
    console.log("📡 [getAllProductionDefinitions] Début récupération depuis Firestore...");
    console.log("📡 [getAllProductionDefinitions] Document path:", PRODUCTIONS_LIST_DOC);
    const listRef = doc(db, PRODUCTIONS_LIST_DOC);
    const listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      console.log("⚠️ [getAllProductionDefinitions] Document n'existe pas");
      return [];
    }

    const data = listSnap.data();
    console.log("📄 [getAllProductionDefinitions] Data brute:", data);
    console.log("📄 [getAllProductionDefinitions] data.liste:", data.liste);
    console.log("📄 [getAllProductionDefinitions] data.productions:", data.productions);

    // Structure: { liste: { productions: [...] } }
    const definitions = data.liste?.productions || data.productions || [];
    console.log("📦 [getAllProductionDefinitions] Définitions extraites:", definitions.length);

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

    console.log("✅ [getAllProductionDefinitions] Définitions validées:", validatedDefinitions.length);

    // Sauvegarder dans le cache
    saveDefinitionsToCache(validatedDefinitions);

    console.log(`✅ ${validatedDefinitions.length} définitions de production récupérées`);
    return validatedDefinitions;
  } catch (error) {
    console.error("❌ [getAllProductionDefinitions] Erreur récupération définitions:", error);
    throw error;
  }
}

/**
 * Crée une nouvelle définition de production (AVEC QUEUE ANTI-COLLISION)
 * @param {Object} defPayload - Données de la définition
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function createProductionDefinition(defPayload, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Ajouter l'opération à la queue
    const operation = await enqueueProductionOperation(
      OPERATION_TYPES.CREATE_DEFINITION,
      {
        definitionData: defPayload,
      },
      actualUserId
    );

    console.log(`✅ Opération CREATE_DEFINITION ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeProductionOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations production:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur createProductionDefinition:", error);
    throw error;
  }
}

/**
 * Met à jour une définition de production (AVEC QUEUE ANTI-COLLISION)
 * @param {string} defId - ID de la définition
 * @param {Object} patch - Modifications à appliquer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function updateProductionDefinition(defId, patch, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Ajouter l'opération à la queue
    const operation = await enqueueProductionOperation(
      OPERATION_TYPES.UPDATE_DEFINITION,
      {
        defId,
        defUpdates: patch,
      },
      actualUserId
    );

    console.log(`✅ Opération UPDATE_DEFINITION ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeProductionOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations production:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur updateProductionDefinition:", error);
    throw error;
  }
}

/**
 * Supprime une définition de production (AVEC QUEUE ANTI-COLLISION)
 * @param {string} defId - ID de la définition
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function deleteProductionDefinition(defId, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Ajouter l'opération à la queue
    const operation = await enqueueProductionOperation(
      OPERATION_TYPES.DELETE_DEFINITION,
      {
        defId,
      },
      actualUserId
    );

    console.log(`✅ Opération DELETE_DEFINITION ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeProductionOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations production:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur deleteProductionDefinition:", error);
    throw error;
  }
}

// ============================================================================
// API PRODUCTIONS EN ATTENTE
// ============================================================================

/**
 * Récupère toutes les productions en attente (Programmee + en_cours)
 */
export async function getProductionsEnAttente() {
  try {
    const enAttenteRef = doc(db, PRODUCTIONS_EN_ATTENTE_DOC);
    const enAttenteSnap = await getDoc(enAttenteRef);

    if (!enAttenteSnap.exists()) {
      console.log("ℹ️ Aucune production en attente");
      return [];
    }

    const data = enAttenteSnap.data();
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
    saveEnAttenteToCache(validatedItems);

    console.log(`✅ ${validatedItems.length} productions en attente récupérées`);
    return validatedItems;
  } catch (error) {
    console.error("❌ Erreur récupération productions en attente:", error);
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
 * Programme une nouvelle production (AVEC QUEUE ANTI-COLLISION)
 * @param {string} definitionId - ID de la définition de production
 * @param {number} principalQuantite - Quantité à produire
 * @param {string} note - Note optionnelle
 * @param {string} dayKey - Clé du jour (DDMMYYYY)
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function scheduleProduction(
  definitionId,
  principalQuantite,
  note = "",
  dayKey = formatDayKey(),
  userId = "system"
) {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Nettoyage automatique au changement de jour
    autoCleanProductionQueue().catch((err) => {
      console.error("❌ Erreur nettoyage automatique production:", err);
    });

    // Ajouter l'opération à la queue
    const operation = await enqueueProductionOperation(
      OPERATION_TYPES.SCHEDULE,
      {
        definitionId,
        principalQuantite,
        note,
        dayKey,
      },
      actualUserId
    );

    console.log(`✅ Opération SCHEDULE ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeProductionOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations production:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur scheduleProduction:", error);
    throw error;
  }
}

/**
 * Démarre une production (AVEC QUEUE ANTI-COLLISION)
 * @param {string} instanceId - ID de l'instance de production
 * @param {string} dayKey - Clé du jour (DDMMYYYY)
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function startProduction(
  instanceId,
  dayKey = formatDayKey(),
  userId = "system"
) {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Ajouter l'opération à la queue
    const operation = await enqueueProductionOperation(
      OPERATION_TYPES.START,
      {
        instanceId,
        dayKey,
      },
      actualUserId
    );

    console.log(`✅ Opération START ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeProductionOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations production:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur startProduction:", error);
    throw error;
  }
}

/**
 * Met à jour les statistiques de production pour les 7 derniers jours
 * Calcule la tendance par rapport à la veille
 */
async function updateProductionStatistiques(dayKey, completedInstance) {
  try {
    // Vérifier que l'instance a un résultat
    if (!completedInstance.resultat) {
      console.warn("⚠️ Instance sans résultat, statistiques non mises à jour");
      return;
    }

    const statsRef = doc(db, PRODUCTIONS_STATISTIQUES_DOC);

    // Récupérer les statistiques actuelles
    const statsSnap = await getDoc(statsRef);
    let currentStats = { statistiques: [], lastUpdated: Date.now() };

    if (statsSnap.exists()) {
      currentStats = statsSnap.data();
    }

    // Trouver ou créer l'entrée pour aujourd'hui
    let todayStats = currentStats.statistiques.find((s) => s.jour === dayKey);

    if (!todayStats) {
      todayStats = {
        jour: dayKey,
        recettesProduites: [],
      };
      currentStats.statistiques.push(todayStats);
    }

    // Récupérer toutes les productions terminées du jour pour calculer les totaux
    const allTodayProductions = await getProductionsByDay(dayKey);
    const completedProductions = allTodayProductions.filter((p) => p.status === "termine" && p.resultat);

    // Agréger par ingrédient principal
    const productionsByIngredient = {};

    for (const prod of completedProductions) {
      const ingKey = prod.resultat.denomination;

      if (!productionsByIngredient[ingKey]) {
        productionsByIngredient[ingKey] = {
          ingredient_principal: ingKey,
          quantite_produite: 0,
          unite: prod.resultat.unite,
        };
      }

      productionsByIngredient[ingKey].quantite_produite += prod.resultat.quantite;
    }

    // Calculer les tendances par rapport à la veille
    const yesterdayKey = formatDayKey(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStats = currentStats.statistiques.find((s) => s.jour === yesterdayKey);

    // Mettre à jour les recettes produites avec tendances
    todayStats.recettesProduites = Object.values(productionsByIngredient).map((recette) => {
      let tendance = "nouvelle";

      if (yesterdayStats) {
        const yesterdayRecette = yesterdayStats.recettesProduites.find(
          (r) => r.ingredient_principal === recette.ingredient_principal
        );

        if (yesterdayRecette) {
          const diff = recette.quantite_produite - yesterdayRecette.quantite_produite;
          const diffPercent = Math.abs(diff / yesterdayRecette.quantite_produite);

          if (diffPercent < 0.05) {
            // Moins de 5% de variation = stable
            tendance = "stable";
          } else if (diff > 0) {
            tendance = "hausse";
          } else {
            tendance = "baisse";
          }
        }
      }

      return {
        ...recette,
        tendance,
      };
    });

    // Mettre à jour l'entrée du jour dans les statistiques
    const todayIndex = currentStats.statistiques.findIndex((s) => s.jour === dayKey);
    currentStats.statistiques[todayIndex] = todayStats;

    // Garder uniquement les 7 derniers jours
    // Trier par jour (format DDMMYYYY)
    currentStats.statistiques.sort((a, b) => {
      const dateA = parseDayKey(a.jour);
      const dateB = parseDayKey(b.jour);
      return dateB - dateA; // Plus récent en premier
    });

    // Limiter à 7 jours
    if (currentStats.statistiques.length > 7) {
      currentStats.statistiques = currentStats.statistiques.slice(0, 7);
    }

    // Mettre à jour lastUpdated
    currentStats.lastUpdated = Date.now();

    // Valider avec Zod
    const validatedStats = statistiquesSchema.parse(currentStats);

    // Sauvegarder dans Firestore
    await setDoc(statsRef, validatedStats);

    console.log(`✅ Statistiques mises à jour pour ${dayKey}`);
  } catch (error) {
    console.error("❌ Erreur mise à jour statistiques:", error);
    // Ne pas bloquer la production si les statistiques échouent
  }
}

/**
 * Parse une clé de jour DDMMYYYY en timestamp
 */
function parseDayKey(dayKey) {
  const day = parseInt(dayKey.substring(0, 2), 10);
  const month = parseInt(dayKey.substring(2, 4), 10) - 1; // Les mois commencent à 0
  const year = parseInt(dayKey.substring(4, 8), 10);
  return new Date(year, month, day).getTime();
}

/**
 * Termine une production et l'intègre au stock (AVEC QUEUE ANTI-COLLISION)
 * @param {string} instanceId - ID de l'instance de production
 * @param {string} dayKey - Clé du jour (DDMMYYYY)
 * @param {Object} params - Paramètres { resultat, emplacementId }
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function completeProduction(
  instanceId,
  dayKey = formatDayKey(),
  { resultat, emplacementId },
  userId = "system"
) {
  try {
    // Vérifier les paramètres requis
    if (!resultat) {
      throw new Error("Le résultat est requis pour terminer la production");
    }

    if (!emplacementId) {
      throw new Error("L'emplacement de stockage est requis");
    }

    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Ajouter l'opération à la queue
    const operation = await enqueueProductionOperation(
      OPERATION_TYPES.COMPLETE,
      {
        instanceId,
        resultat,
        emplacementId,
        dayKey,
      },
      actualUserId
    );

    console.log(`✅ Opération COMPLETE ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeProductionOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations production:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur completeProduction:", error);
    throw error;
  }
}

/**
 * Récupère les statistiques de production des 7 derniers jours
 */
export async function getProductionStatistiques() {
  try {
    const statsRef = doc(db, PRODUCTIONS_STATISTIQUES_DOC);
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      console.log("ℹ️ Aucune statistique de production trouvée");
      return { statistiques: [], lastUpdated: Date.now() };
    }

    const data = statsSnap.data();

    // Valider avec Zod
    const validatedStats = statistiquesSchema.parse(data);

    console.log(`✅ ${validatedStats.statistiques.length} jours de statistiques récupérés`);
    return validatedStats;
  } catch (error) {
    console.error("❌ Erreur récupération statistiques:", error);
    throw error;
  }
}

/**
 * Met à jour une instance de production (AVEC QUEUE ANTI-COLLISION)
 * @param {string} instanceId - ID de l'instance de production
 * @param {string} dayKey - Clé du jour (DDMMYYYY)
 * @param {Object} patch - Modifications à appliquer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function updateProductionInstance(
  instanceId,
  dayKey = formatDayKey(),
  patch,
  userId = "system"
) {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Ajouter l'opération à la queue
    const operation = await enqueueProductionOperation(
      OPERATION_TYPES.UPDATE_INSTANCE,
      {
        instanceId,
        updates: patch,
        dayKey,
      },
      actualUserId
    );

    console.log(`✅ Opération UPDATE_INSTANCE ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeProductionOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations production:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur updateProductionInstance:", error);
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
      console.log("🔄 [useProductionDefinitions] Début sync avec Firestore...");
      setLoading(true);
      setError(null);
      const freshDefinitions = await getAllProductionDefinitions();
      console.log("✅ [useProductionDefinitions] Définitions récupérées:", freshDefinitions.length);
      console.log("📦 [useProductionDefinitions] Première définition:", freshDefinitions[0]);
      setDefinitions(freshDefinitions);
    } catch (err) {
      console.error("❌ [useProductionDefinitions] Erreur sync:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage et TOUJOURS sync avec Firestore
  useEffect(() => {
    console.log("🚀 [useProductionDefinitions] Hook monté");
    const cached = getDefinitionsFromCache();

    if (cached && cached.data) {
      console.log("💾 [useProductionDefinitions] Cache valide trouvé:", cached.data.length, "définitions");
      // Charger le cache immédiatement pour une UI réactive
      setDefinitions(cached.data);
      setLoading(false);

      // Mais TOUJOURS sync en arrière-plan pour comparer avec Firestore
      console.log("🔄 [useProductionDefinitions] Sync en arrière-plan pour vérifier...");
      sync();
    } else {
      console.log("⚠️ [useProductionDefinitions] Cache expiré ou absent, sync Firestore...");
      sync();
    }
  }, [sync]);

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

      // Chercher une notification "nouvelle_recette" récente (< 10 secondes)
      const now = Date.now();
      const recentNotif = notificationsList.find(
        (notif) =>
          (notif.title === "nouvelle_recette" ||
           notif.title === "Production:Liste:Update") &&
          now - notif.createdAt < 10000
      );

      if (recentNotif) {
        console.log(
          "🔔 [useProductionDefinitions] Notification détectée:", recentNotif.title, "- Synchronisation..."
        );
        clearDefinitionsCache(); // Forcer le rafraîchissement
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
 * Hook pour gérer les productions en attente avec cache local
 * Synchronisation automatique via RTDB notifications
 */
export function useProductionsEnAttente() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou automatique)
   */
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const freshItems = await getProductionsEnAttente();
      setItems(freshItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cached = getEnAttenteFromCache();
    if (cached && cached.data) {
      setItems(cached.data);
      setLoading(false);
    } else {
      sync();
    }
  }, [sync]);

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

      // Chercher une notification "Production:EnAttente:Update" récente (< 5 secondes)
      const now = Date.now();
      const recentNotif = notificationsList.find(
        (notif) =>
          notif.title === "Production:EnAttente:Update" && now - notif.createdAt < 5000
      );

      if (recentNotif) {
        console.log(
          "🔔 Notification détectée: Production:EnAttente:Update - Synchronisation..."
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
    items,
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

/**
 * Hook pour récupérer les statistiques de production
 * Synchronisation automatique via RTDB notifications
 */
export function useProductionStatistiques() {
  const [statistiques, setStatistiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou automatique)
   */
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await getProductionStatistiques();
      setStatistiques(stats.statistiques);
      setLastUpdated(stats.lastUpdated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    sync();
  }, [sync]);

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

      // Chercher une notification "Production:Historique:Update" avec action "complete"
      const now = Date.now();
      const recentNotif = notificationsList.find(
        (notif) =>
          notif.title === "Production:Historique:Update" &&
          notif.meta?.action === "complete" &&
          now - notif.createdAt < 5000
      );

      if (recentNotif) {
        console.log(
          "🔔 Notification détectée: Production terminée - Synchronisation statistiques..."
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
    statistiques,
    loading,
    error,
    lastUpdated,
    sync,
  };
}

// ============================================================================
// HOOKS DE STATISTIQUES ENRICHIES
// ============================================================================

/**
 * Utilitaire pour formater une date au format DD/MM/YYYY
 */
function formatDateDisplay(dayKey) {
  if (!dayKey || dayKey.length !== 8) return dayKey;
  const day = dayKey.substring(0, 2);
  const month = dayKey.substring(2, 4);
  const year = dayKey.substring(4, 8);
  return `${day}/${month}/${year}`;
}

/**
 * Schema pour les statistiques enrichies du jour
 */
export const StatistiquesProductionJourSchema = z.object({
  date: z.string().optional(),
  total_productions: z.number().default(0),
  productions_en_cours: z.number().default(0),
  productions_programmees: z.number().default(0),
  productions_terminees: z.number().default(0),
  total_items_produits: z.number().default(0), // Somme des quantités
  top_recettes: z.array(
    z.object({
      denomination: z.string(),
      type: z.enum(["menu", "boisson"]),
      quantite_totale: z.number(),
      nombre_productions: z.number(),
    })
  ).default([]),
  productions_par_emplacement: z.array(
    z.object({
      emplacementId: z.string(),
      denomination: z.string().optional(),
      quantite: z.number(),
      nombre_productions: z.number(),
    })
  ).default([]),
  efficacite: z.object({
    temps_moyen_minutes: z.number().default(0),
    taux_reussite: z.number().default(100), // Pourcentage
    productions_par_heure: z.number().default(0),
  }).optional(),
  tendance: z.enum(["hausse", "baisse", "stable"]).default("stable"),
  tendance_pourcentage: z.number().default(0).optional(),
});

/**
 * Calcule les statistiques enrichies de production pour un jour donné
 * @param {string} dayKey - Jour au format DDMMYYYY
 * @returns {Promise<Object>} Statistiques enrichies
 */
export async function MakeProductionStatistiques(dayKey = formatDayKey()) {
  try {
    console.log(`📊 Calcul des statistiques de production pour ${dayKey}...`);

    // Récupérer les productions du jour
    const dayRef = doc(db, `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`);
    const daySnap = await getDoc(dayRef);

    const productions = daySnap.exists() ? daySnap.data().items || [] : [];

    // Récupérer également les productions en attente (programmées ou en cours)
    const enAttenteRef = doc(db, PRODUCTIONS_EN_ATTENTE_DOC);
    const enAttenteSnap = await getDoc(enAttenteRef);
    const productionsEnAttente = enAttenteSnap.exists() ? enAttenteSnap.data().items || [] : [];

    // Filtrer les productions du jour
    const productionsDuJour = productionsEnAttente.filter((p) => {
      const prodDayKey = formatDayKey(new Date(p.date));
      return prodDayKey === dayKey;
    });

    // Toutes les productions du jour (historique + en attente)
    const toutesProductions = [...productions, ...productionsDuJour];

    // Calculs de base
    const total_productions = toutesProductions.length;
    const productions_en_cours = productionsDuJour.filter((p) => p.status === "en_cours").length;
    const productions_programmees = productionsDuJour.filter((p) => p.status === "Programmee").length;
    const productions_terminees = toutesProductions.filter((p) => p.status === "termine").length;

    // Total items produits (somme des quantités finales)
    const total_items_produits = toutesProductions.reduce((sum, prod) => {
      if (prod.resultat?.quantite) {
        return sum + prod.resultat.quantite;
      }
      return sum;
    }, 0);

    // Top recettes (grouper par denomination)
    const recettesMap = new Map();
    toutesProductions.forEach((prod) => {
      const key = prod.denomination;
      if (!recettesMap.has(key)) {
        recettesMap.set(key, {
          denomination: prod.denomination,
          type: prod.type,
          quantite_totale: 0,
          nombre_productions: 0,
        });
      }
      const recette = recettesMap.get(key);
      recette.nombre_productions += 1;
      if (prod.resultat?.quantite) {
        recette.quantite_totale += prod.resultat.quantite;
      } else if (prod.principal_cible?.quantite) {
        recette.quantite_totale += prod.principal_cible.quantite;
      }
    });

    const top_recettes = Array.from(recettesMap.values())
      .sort((a, b) => b.quantite_totale - a.quantite_totale);

    // Productions par emplacement
    const emplacementsMap = new Map();
    toutesProductions.forEach((prod) => {
      if (prod.emplacementId) {
        const key = prod.emplacementId;
        if (!emplacementsMap.has(key)) {
          emplacementsMap.set(key, {
            emplacementId: key,
            denomination: key, // Peut être enrichi avec les données d'emplacements
            quantite: 0,
            nombre_productions: 0,
          });
        }
        const emplacement = emplacementsMap.get(key);
        emplacement.nombre_productions += 1;
        if (prod.resultat?.quantite) {
          emplacement.quantite += prod.resultat.quantite;
        } else if (prod.principal_cible?.quantite) {
          emplacement.quantite += prod.principal_cible.quantite;
        }
      }
    });

    const productions_par_emplacement = Array.from(emplacementsMap.values())
      .sort((a, b) => b.quantite - a.quantite);

    // Efficacité (seulement pour productions terminées)
    let efficacite = {
      temps_moyen_minutes: 0,
      taux_reussite: 100,
      productions_par_heure: 0,
    };

    if (productions_terminees > 0) {
      const productionsTermineesData = toutesProductions.filter((p) => p.status === "termine");

      // Temps moyen (différence entre createdAt et updatedAt)
      const temps_total = productionsTermineesData.reduce((sum, prod) => {
        const duree = prod.updatedAt - prod.createdAt;
        return sum + duree;
      }, 0);

      const temps_moyen_ms = temps_total / productions_terminees;
      efficacite.temps_moyen_minutes = Math.round(temps_moyen_ms / 60000);

      // Taux de réussite
      efficacite.taux_reussite = Math.round((productions_terminees / total_productions) * 100);

      // Productions par heure
      if (efficacite.temps_moyen_minutes > 0) {
        efficacite.productions_par_heure = Math.round(60 / efficacite.temps_moyen_minutes);
      }
    }

    // Tendance (comparer avec hier)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDayKey(yesterday);

    const yesterdayRef = doc(db, `${PRODUCTIONS_DAYS_COLLECTION}/${yesterdayKey}`);
    const yesterdaySnap = await getDoc(yesterdayRef);
    const productionsHier = yesterdaySnap.exists() ? yesterdaySnap.data().items || [] : [];

    const total_hier = productionsHier.length;
    let tendance = "stable";
    let tendance_pourcentage = 0;

    if (total_hier > 0) {
      tendance_pourcentage = ((total_productions - total_hier) / total_hier) * 100;
      if (tendance_pourcentage > 5) {
        tendance = "hausse";
      } else if (tendance_pourcentage < -5) {
        tendance = "baisse";
      }
    } else if (total_productions > 0) {
      tendance = "hausse";
      tendance_pourcentage = 100;
    }

    // Construire l'objet de statistiques
    const statistiques = {
      date: dayKey,
      total_productions,
      productions_en_cours,
      productions_programmees,
      productions_terminees,
      total_items_produits,
      top_recettes,
      productions_par_emplacement,
      efficacite,
      tendance,
      tendance_pourcentage,
    };

    // Valider avec Zod
    const validatedStats = StatistiquesProductionJourSchema.parse(statistiques);

    // Sauvegarder dans Firestore
    const statsRef = doc(db, `${PRODUCTIONS_STATISTIQUES_DOC}/daily/${dayKey}`);
    await setDoc(statsRef, validatedStats);

    console.log("✅ Statistiques de production calculées et sauvegardées");
    return validatedStats;
  } catch (error) {
    console.error("❌ Erreur calcul statistiques production:", error);
    throw error;
  }
}

/**
 * Hook pour récupérer les statistiques enrichies du jour avec détection de changement de jour
 * et archivage automatique
 */
export function useProductionStatistiquesJour() {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCheckedDay, setLastCheckedDay] = useState(formatDayKey());

  const fetchStatistiques = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dayKey = formatDayKey();
      const statsRef = doc(db, `${PRODUCTIONS_STATISTIQUES_DOC}/daily/${dayKey}`);
      const statsSnap = await getDoc(statsRef);

      if (!statsSnap.exists()) {
        // Calculer les statistiques si elles n'existent pas
        const stats = await MakeProductionStatistiques(dayKey);
        setStatistiques(stats);
      } else {
        const validatedStats = StatistiquesProductionJourSchema.parse(statsSnap.data());
        setStatistiques(validatedStats);
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur fetch statistiques jour:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Détection de changement de jour
  const checkAndRefreshIfNewDay = useCallback(async () => {
    const currentDay = formatDayKey();
    if (currentDay !== lastCheckedDay) {
      console.log("📅 Nouveau jour détecté, rafraîchissement des statistiques...");
      setLastCheckedDay(currentDay);
      await fetchStatistiques();
    }
  }, [lastCheckedDay, fetchStatistiques]);

  // Initial fetch
  useEffect(() => {
    fetchStatistiques();
  }, [fetchStatistiques]);

  // Vérifier le changement de jour toutes les minutes
  useEffect(() => {
    checkAndRefreshIfNewDay();
    const intervalId = setInterval(() => {
      checkAndRefreshIfNewDay();
    }, 60000); // Toutes les minutes

    return () => clearInterval(intervalId);
  }, [checkAndRefreshIfNewDay]);

  // Écouter les notifications RTDB pour mise à jour en temps réel
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      const notifications = snapshot.val();
      if (!notifications) return;

      const notificationsList = Object.values(notifications);
      const now = Date.now();

      // Détecter une production terminée ou modifiée récemment
      const recentProductionUpdate = notificationsList.find(
        (notif) =>
          (notif.title === "Production:Historique:Update" ||
           notif.title === "Production:EnAttente:Update") &&
          now - notif.createdAt < 5000
      );

      if (recentProductionUpdate) {
        console.log("🔔 Notification production détectée - Rafraîchissement stats...");
        fetchStatistiques();
      }
    };

    onValue(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "value", handleNotification);
    };
  }, [fetchStatistiques]);

  return {
    statistiques,
    loading,
    error,
    refetch: fetchStatistiques,
  };
}

/**
 * Hook pour récupérer les statistiques de production de la semaine (7 derniers jours)
 */
export function useProductionStatistiquesWeek() {
  const [statistiques, setStatistiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistiques = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = [];
      const today = new Date();

      // Récupérer les 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayKey = formatDayKey(date);

        const statsRef = doc(db, `${PRODUCTIONS_STATISTIQUES_DOC}/daily/${dayKey}`);
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
          const validatedStats = StatistiquesProductionJourSchema.parse(statsSnap.data());
          stats.push(validatedStats);
        } else {
          // Calculer les stats si elles n'existent pas
          try {
            const calculatedStats = await MakeProductionStatistiques(dayKey);
            stats.push(calculatedStats);
          } catch (calcError) {
            console.warn(`⚠️ Impossible de calculer les stats pour ${dayKey}`);
            // Ajouter un objet vide pour ce jour
            stats.push({
              date: dayKey,
              total_productions: 0,
              productions_en_cours: 0,
              productions_programmees: 0,
              productions_terminees: 0,
              total_items_produits: 0,
              top_recettes: [],
              productions_par_emplacement: [],
              efficacite: {
                temps_moyen_minutes: 0,
                taux_reussite: 100,
                productions_par_heure: 0,
              },
              tendance: "stable",
              tendance_pourcentage: 0,
            });
          }
        }
      }

      setStatistiques(stats);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur fetch statistiques semaine:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistiques();
  }, [fetchStatistiques]);

  return {
    statistiques,
    loading,
    error,
    refetch: fetchStatistiques,
  };
}

/**
 * Hook pour récupérer les détails d'une recette spécifique avec analyses sur plusieurs jours
 * @param {string} recetteId - ID ou denomination de la recette
 * @param {number} days - Nombre de jours à analyser (défaut: 7)
 */
export function useRecetteDetails(recetteId, days = 7) {
  const [recetteStats, setRecetteStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecetteDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!recetteId) {
        throw new Error("recetteId est requis");
      }

      const stats = {
        id: recetteId,
        denomination: "",
        type: "menu",
        totalQuantite: 0,
        totalProductions: 0,
        avgQuantite: 0,
        maxQuantite: 0,
        minQuantite: Infinity,
        dailyProductions: [],
        trend: "stable",
        trendPercentage: 0,
        days,
      };

      const today = new Date();
      const dailyData = [];

      // Récupérer les données des N derniers jours
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayKey = formatDayKey(date);

        const dayRef = doc(db, `${PRODUCTIONS_DAYS_COLLECTION}/${dayKey}`);
        const daySnap = await getDoc(dayRef);

        if (daySnap.exists()) {
          const productions = daySnap.data().items || [];

          // Filtrer les productions de cette recette
          const recetteProductions = productions.filter(
            (p) => p.id === recetteId || p.denomination === recetteId || p.definitionId === recetteId
          );

          let quantiteJour = 0;
          recetteProductions.forEach((prod) => {
            if (!stats.denomination && prod.denomination) {
              stats.denomination = prod.denomination;
              stats.type = prod.type || "menu";
            }

            if (prod.resultat?.quantite) {
              quantiteJour += prod.resultat.quantite;
            } else if (prod.principal_cible?.quantite) {
              quantiteJour += prod.principal_cible.quantite;
            }
          });

          stats.totalQuantite += quantiteJour;
          stats.totalProductions += recetteProductions.length;

          if (quantiteJour > stats.maxQuantite) stats.maxQuantite = quantiteJour;
          if (quantiteJour < stats.minQuantite && quantiteJour > 0) stats.minQuantite = quantiteJour;

          dailyData.push({
            date: dayKey,
            quantite: quantiteJour,
            productions: recetteProductions.length,
          });
        } else {
          dailyData.push({
            date: dayKey,
            quantite: 0,
            productions: 0,
          });
        }
      }

      stats.dailyProductions = dailyData;
      stats.avgQuantite = stats.totalProductions > 0 ? stats.totalQuantite / days : 0;

      if (stats.minQuantite === Infinity) stats.minQuantite = 0;

      // Calculer la tendance (comparer première moitié vs deuxième moitié)
      const midPoint = Math.floor(dailyData.length / 2);
      const firstHalf = dailyData.slice(0, midPoint);
      const secondHalf = dailyData.slice(midPoint);

      const avgFirst =
        firstHalf.reduce((sum, d) => sum + d.quantite, 0) / firstHalf.length;
      const avgSecond =
        secondHalf.reduce((sum, d) => sum + d.quantite, 0) / secondHalf.length;

      if (avgSecond > avgFirst * 1.1) {
        stats.trend = "hausse";
      } else if (avgSecond < avgFirst * 0.9) {
        stats.trend = "baisse";
      } else {
        stats.trend = "stable";
      }

      stats.trendPercentage =
        avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

      setRecetteStats(stats);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur fetch recette details:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [recetteId, days]);

  useEffect(() => {
    fetchRecetteDetails();
  }, [fetchRecetteDetails]);

  return {
    recetteStats,
    loading,
    error,
    refetch: fetchRecetteDetails,
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
  recetteProduitSchema,
  statistiqueJourSchema,
  statistiquesSchema,
  queuedProductionOperationSchema,

  // Utils
  formatDayKey,

  // Queue Operations (Anti-Collision)
  enqueueProductionOperation,
  executeProductionOperations,
  cleanProductionQueue,
  autoCleanProductionQueue,

  // Definitions
  getAllProductionDefinitions,
  createProductionDefinition,
  updateProductionDefinition,
  deleteProductionDefinition,

  // Productions en attente
  getProductionsEnAttente,

  // Historique (instances)
  getProductionsByDay,
  scheduleProduction,
  startProduction,
  completeProduction,
  updateProductionInstance,

  // Statistiques
  getProductionStatistiques,

  // Hooks
  useProductionDefinitions,
  useProductionsEnAttente,
  useProductionsDay,
  useProductionFlow,
  useProductionStatistiques,
  useProductionStatistiquesJour,
  useProductionStatistiquesWeek,
  useRecetteDetails,

  // Statistiques enrichies
  StatistiquesProductionJourSchema,
  MakeProductionStatistiques,

  // Cache
  clearDefinitionsCache,
  clearEnAttenteCache,
  clearDayCache,
};