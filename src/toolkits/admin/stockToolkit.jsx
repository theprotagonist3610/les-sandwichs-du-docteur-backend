/**
 * admin/stockToolkit.jsx
 * Gestion du stock avec cache local et système de queue pour éviter les collisions Firestore
 *
 * Structure Firestore :
 * - stock/liste : { elements: [array d'éléments de stock] }
 * - stock/resume : { [id]: { ...élément avec quantité actuelle } }
 * - stock/transactions/liste/[DDMMYYYY] : { transactions: [array de transactions du jour] }
 * - stock/emplacements : { [id]: { ...emplacement avec stock_actuel } }
 * - stock/operationsQueue : { operations: [array d'opérations en attente/complétées] }
 *
 * Structure LocalStorage :
 * - lsd_stock_liste : { elements: [...], lastSync: timestamp }
 * - lsd_stock_transactions : { transactions: [...], lastSync: timestamp }
 *
 * IMPORTANT: Toutes les opérations de stock (entrées, sorties, transferts) passent par
 * une queue d'opérations pour garantir l'atomicité et éviter les collisions Firestore.
 * Les opérations sont exécutées chronologiquement avec runTransaction().
 *
 * Voir STOCK_QUEUE_SYSTEM.md pour la documentation complète.
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import { ref, push, onChildAdded } from "firebase/database";
import { db, rtdb } from "@/firebase.js";
import { nanoid } from "nanoid";
import { auth } from "@/firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================

const STOCK_LISTE_PATH = "stock/liste";
const STOCK_RESUME_PATH = "stock/resume";
const STOCK_TRANSACTIONS_BASE_PATH = "stock/transactions/liste";
const STOCK_EMPLACEMENTS_PATH = "stock/emplacements";
const STOCK_OPERATIONS_QUEUE_PATH = "stock/operationsQueue";
const STOCK_QUEUE_METADATA_PATH = "stock/queueMetadata";
const LOCAL_STOCK_KEY = "lsd_stock_liste";
const LOCAL_TRANSACTIONS_KEY = "lsd_stock_transactions";
const LOCAL_LAST_CLEANUP_KEY = "lsd_stock_last_cleanup";
const RTDB_NOTIFICATIONS_PATH = "notification";

// Statuts des opérations dans la queue
export const OPERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

// Types d'éléments de stock
export const STOCK_TYPES = {
  INGREDIENT: "ingredient",
  CONSOMMABLE: "consommable",
  PERISSABLE: "perissable",
  MATERIEL: "materiel",
  EMBALLAGE: "emballage",
};

// Types de transactions
export const TRANSACTION_TYPES = {
  ENTREE: "entree",
  SORTIE: "sortie",
  TRANSFERT: "transfert",
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

const cleanRecordOfObjects = (val) => {
  if (val === null || val === undefined) return {};

  // Si c'est un array, convertir en map indexée par id
  if (Array.isArray(val)) {
    const map = {};
    val.forEach((item) => {
      if (typeof item === "object" && item !== null && item.id) {
        map[item.id] = item;
      }
    });
    return map;
  }

  // Si c'est un objet, filtrer les valeurs non-objets
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
          `🧹 [Schema] Valeur invalide ignorée dans record: ${key} (type: ${typeof value})`
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
 * Schema pour une unité de mesure
 */
export const uniteSchema = z.preprocess(
  cleanObject,
  z.object({
    nom: z.preprocess(
      cleanString,
      z.string().min(1, "Le nom de l'unité est requis")
    ),
    symbol: z.preprocess(
      cleanString,
      z.string().min(1, "Le symbole de l'unité est requis")
    ),
  })
);

/**
 * Schema pour un élément de stock
 */
export const itemStockSchema = z.preprocess(
  (val) => {
    // Rejeter les valeurs qui ne sont pas des objets
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
      console.warn(
        "🧹 [Schema] itemStockSchema reçu valeur non-objet:",
        typeof val
      );
      return null;
    }
    return val;
  },
  z.object({
    id: z.preprocess(cleanString, z.string().min(1, "L'ID est requis")),
    denomination: z.preprocess(
      cleanString,
      z.string().min(1, "La dénomination est requise")
    ),
    unite: uniteSchema,
    quantite_actuelle: z.preprocess(
      cleanNumber,
      z.number().min(0, "La quantité doit être positive")
    ),
    prix_unitaire: z.preprocess(
      cleanNumber,
      z
        .number()
        .min(0, "Le prix unitaire doit être positif")
        .optional()
        .default(0)
    ),
    seuil_alerte: z.preprocess(
      cleanNumber,
      z
        .number()
        .min(0, "Le seuil d'alerte doit être positif")
        .optional()
        .default(0)
    ),
    imgURL: z.preprocess(cleanString, z.string().optional().default("")),
    description: z.preprocess(cleanString, z.string().optional().default("")),
    type: z.enum([
      STOCK_TYPES.INGREDIENT,
      STOCK_TYPES.CONSOMMABLE,
      STOCK_TYPES.PERISSABLE,
      STOCK_TYPES.MATERIEL,
      STOCK_TYPES.EMBALLAGE,
    ]),
    status: z.boolean().default(true),
    createdAt: z.preprocess(cleanNumber, z.number().positive().optional()),
    updatedAt: z.preprocess(cleanNumber, z.number().positive().optional()),
    updatedBy: z.preprocess(cleanString, z.string().optional()),
  })
);

/**
 * Schema pour une transaction de stock
 */
export const transactionSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  date: z.number().positive("La date doit être positive"),
  type: z.enum([
    TRANSACTION_TYPES.ENTREE,
    TRANSACTION_TYPES.SORTIE,
    TRANSACTION_TYPES.TRANSFERT,
  ]),
  element: z.object({
    id: z.string().min(1, "L'ID de l'élément est requis"),
    denomination: z.string().min(1, "La dénomination est requise"),
    unite: uniteSchema,
    imgURL: z.string().optional().default(""),
  }),
  quantite: z.number().positive("La quantité doit être positive"),
  source: z
    .object({
      emplacementId: z.string().optional(),
      externe: z.boolean().optional(),
    })
    .optional(),
  destination: z
    .object({
      emplacementId: z.string().optional(),
      externe: z.boolean().optional(),
    })
    .optional(),
  note: z.string().optional().default(""),
  motif: z.string().optional().default(""),
  actorId: z.string().optional(),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
  appliedOnRev: z.number().optional(),
});

/**
 * Schema pour le résumé d'un élément dans le stock global
 */
export const resumeElementSchema = z.object({
  id: z.string().min(1),
  denomination: z.string().min(1),
  unite: uniteSchema,
  quantite_totale: z.number().min(0),
  type: z.enum([
    STOCK_TYPES.INGREDIENT,
    STOCK_TYPES.CONSOMMABLE,
    STOCK_TYPES.PERISSABLE,
    STOCK_TYPES.MATERIEL,
    STOCK_TYPES.EMBALLAGE,
  ]),
  imgURL: z.string().optional().default(""),
  updatedAt: z.number().positive().optional(),
});

/**
 * Schema pour une opération dans la queue
 */
export const queuedOperationSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  timestamp: z.number().positive("Le timestamp doit être positif"),
  type: z.enum([
    TRANSACTION_TYPES.ENTREE,
    TRANSACTION_TYPES.SORTIE,
    TRANSACTION_TYPES.TRANSFERT,
  ]),
  status: z.enum([
    OPERATION_STATUS.PENDING,
    OPERATION_STATUS.PROCESSING,
    OPERATION_STATUS.COMPLETED,
    OPERATION_STATUS.FAILED,
  ]),
  payload: z.object({
    element_id: z.string().min(1, "element_id est requis"),
    quantite: z.number().positive("La quantité doit être positive"),
    emplacement_id: z.string().min(1, "emplacement_id est requis"),
    emplacement_dest_id: z.string().nullable().optional(),
    prix_unitaire: z.number().min(0, "Le prix unitaire doit être positif").optional().default(0),
    motif: z.string().optional().default(""),
    user_id: z.string().optional(),
  }),
  actorId: z.string().optional(),
  error: z.string().optional(),
  retryCount: z.number().min(0).default(0),
  createdAt: z.number().positive(),
  processedAt: z.number().optional(),
});

// ============================================================================
// GESTION DU CACHE LOCAL - STOCK
// ============================================================================

function saveStockToCache(elements) {
  try {
    const dataToStore = { elements, lastSync: Date.now() };
    localStorage.setItem(LOCAL_STOCK_KEY, JSON.stringify(dataToStore));
    console.log("✅ Stock sauvegardé en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache stock:", error);
    return false;
  }
}

function getStockFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_STOCK_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    console.log("✅ Stock récupéré du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache stock:", error);
    return null;
  }
}

export function clearStockCache() {
  localStorage.removeItem(LOCAL_STOCK_KEY);
  console.log("✅ Cache stock supprimé");
}

// ============================================================================
// GESTION DU CACHE LOCAL - TRANSACTIONS
// ============================================================================

function saveTransactionsToCache(transactions) {
  try {
    const dataToStore = { transactions, lastSync: Date.now() };
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(dataToStore));
    console.log("✅ Transactions sauvegardées en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache transactions:", error);
    return false;
  }
}

function getTransactionsFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    console.log("✅ Transactions récupérées du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache transactions:", error);
    return null;
  }
}

export function clearTransactionsCache() {
  localStorage.removeItem(LOCAL_TRANSACTIONS_KEY);
  console.log("✅ Cache transactions supprimé");
}

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

// ============================================================================
// HELPERS - DATE
// ============================================================================

function formatDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Récupère la date du dernier nettoyage depuis localStorage
 * @returns {string|null} Date au format DDMMYYYY ou null
 */
function getLastCleanupDate() {
  try {
    const lastCleanup = localStorage.getItem(LOCAL_LAST_CLEANUP_KEY);
    return lastCleanup;
  } catch (error) {
    console.error("❌ Erreur lecture dernier nettoyage:", error);
    return null;
  }
}

/**
 * Sauvegarde la date du dernier nettoyage dans localStorage
 * @param {string} dateKey - Date au format DDMMYYYY
 */
function saveLastCleanupDate(dateKey) {
  try {
    localStorage.setItem(LOCAL_LAST_CLEANUP_KEY, dateKey);
    console.log("✅ Date de nettoyage sauvegardée:", dateKey);
  } catch (error) {
    console.error("❌ Erreur sauvegarde date nettoyage:", error);
  }
}

/**
 * Vérifie si on est passé à un nouveau jour depuis le dernier nettoyage
 * @returns {boolean} True si on doit nettoyer la queue
 */
function shouldCleanQueue() {
  const today = formatDateKey(new Date());
  const lastCleanup = getLastCleanupDate();

  if (!lastCleanup) {
    // Jamais nettoyé, il faut nettoyer
    return true;
  }

  // Si la date du jour est différente de la dernière date de nettoyage
  return today !== lastCleanup;
}

// ============================================================================
// GESTION DE LA QUEUE D'OPÉRATIONS
// ============================================================================

/**
 * Ajoute une opération à la queue
 * @param {string} type - Type d'opération (entree, sortie, transfert)
 * @param {Object} payload - Données de l'opération
 * @returns {Promise<Object>} L'opération créée
 */
export async function enqueueOperation(type, payload) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }

    const now = Date.now();
    const operationId = `OP-${nanoid(10)}`;

    const operation = {
      id: operationId,
      timestamp: now,
      type,
      status: OPERATION_STATUS.PENDING,
      payload,
      actorId: currentUser.uid,
      retryCount: 0,
      createdAt: now,
    };

    // Valider l'opération
    const validatedOperation = queuedOperationSchema.parse(operation);

    // Ajouter à la queue avec runTransaction pour éviter les collisions
    const queueRef = doc(db, STOCK_OPERATIONS_QUEUE_PATH);

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);
      const currentQueue = queueDoc.exists()
        ? queueDoc.data().operations || []
        : [];

      currentQueue.push(validatedOperation);

      transaction.set(queueRef, { operations: currentQueue }, { merge: true });
    });

    console.log("✅ Opération ajoutée à la queue:", operationId);

    // Notification
    await createRTDBNotification(
      "Opération en file d'attente",
      `Opération ${type} ajoutée à la queue`,
      "info"
    );

    return validatedOperation;
  } catch (error) {
    console.error("❌ Erreur ajout opération à la queue:", error);
    throw error;
  }
}

// Variable globale pour éviter les exécutions simultanées
let isExecuting = false;

/**
 * Exécute toutes les opérations en attente dans la queue
 * Les opérations sont exécutées chronologiquement
 * Les quantités ne peuvent jamais être négatives
 * @returns {Promise<Object>} Résumé de l'exécution { success: number, failed: number, errors: [] }
 */
export async function executeOperations() {
  // Éviter les exécutions simultanées
  if (isExecuting) {
    console.log("⏳ Exécution déjà en cours, opération ignorée");
    return { success: 0, failed: 0, errors: [], skipped: true };
  }

  try {
    isExecuting = true;
    console.log("🔄 Début de l'exécution des opérations...");

    const queueRef = doc(db, STOCK_OPERATIONS_QUEUE_PATH);
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    await runTransaction(db, async (transaction) => {
      // 1. Récupérer la queue
      const queueDoc = await transaction.get(queueRef);
      if (!queueDoc.exists()) {
        console.log("📭 Queue vide");
        return;
      }

      const queue = queueDoc.data().operations || [];

      // 2. Filtrer les opérations en attente
      const pendingOps = queue.filter(
        (op) => op.status === OPERATION_STATUS.PENDING
      );

      if (pendingOps.length === 0) {
        console.log("📭 Aucune opération en attente");
        return;
      }

      // 3. Trier chronologiquement
      pendingOps.sort((a, b) => a.timestamp - b.timestamp);

      console.log(`📋 ${pendingOps.length} opérations à traiter`);

      // 4. Récupérer TOUS les documents nécessaires (AVANT toute écriture)
      const resumeRef = doc(db, STOCK_RESUME_PATH);
      const emplacementsRef = doc(db, STOCK_EMPLACEMENTS_PATH);
      const now = Date.now();
      const dateKey = formatDateKey(now);
      const transactionRef = doc(db, STOCK_TRANSACTIONS_BASE_PATH, dateKey);

      // IMPORTANT: Toutes les lectures doivent être faites avant toute écriture
      const [resumeDoc, emplacementsDoc, transactionDoc] = await Promise.all([
        transaction.get(resumeRef),
        transaction.get(emplacementsRef),
        transaction.get(transactionRef),
      ]);

      const resume = resumeDoc.exists() ? resumeDoc.data() : {};
      const emplacements = emplacementsDoc.exists()
        ? emplacementsDoc.data()
        : {};
      const currentTransactions = transactionDoc.exists()
        ? transactionDoc.data().transactions || []
        : [];

      // 5. Exécuter chaque opération
      for (const operation of pendingOps) {
        try {
          // Trouver l'opération dans la queue d'origine pour la mettre à jour
          const operationInQueue = queue.find((op) => op.id === operation.id);
          if (!operationInQueue) {
            console.error(`⚠️ Opération ${operation.id} introuvable dans la queue`);
            continue;
          }

          const { type, payload } = operation;
          const {
            element_id,
            quantite,
            emplacement_id,
            emplacement_dest_id,
            prix_unitaire,
            motif,
          } = payload;

          // Récupérer l'élément
          const element = resume[element_id];
          if (!element) {
            throw new Error(`Élément ${element_id} non trouvé`);
          }

          // Traiter selon le type d'opération
          if (type === TRANSACTION_TYPES.ENTREE) {
            // ENTRÉE : ajouter du stock
            if (emplacement_id) {
              // Vérifier que l'emplacement existe
              if (!emplacements[emplacement_id]) {
                emplacements[emplacement_id] = { stock_actuel: {} };
              }
              if (!emplacements[emplacement_id].stock_actuel) {
                emplacements[emplacement_id].stock_actuel = {};
              }
              if (!emplacements[emplacement_id].stock_actuel[element_id]) {
                emplacements[emplacement_id].stock_actuel[element_id] = {
                  ...element,
                  quantite_actuelle: 0,
                };
              }

              // Ajouter la quantité
              emplacements[emplacement_id].stock_actuel[
                element_id
              ].quantite_actuelle += quantite;
            }

            // Mettre à jour le résumé global
            if (!resume[element_id]) {
              resume[element_id] = { ...element, quantite_totale: 0 };
            }
            resume[element_id].quantite_totale =
              (resume[element_id].quantite_totale || 0) + quantite;
            resume[element_id].updatedAt = Date.now();
          } else if (type === TRANSACTION_TYPES.SORTIE) {
            // SORTIE : retirer du stock
            if (emplacement_id) {
              const stockItem =
                emplacements[emplacement_id]?.stock_actuel?.[element_id];

              if (!stockItem) {
                throw new Error(
                  `Élément ${element_id} non trouvé dans l'emplacement ${emplacement_id}`
                );
              }

              // Vérifier que la quantité ne devient pas négative
              if (stockItem.quantite_actuelle < quantite) {
                throw new Error(
                  `Stock insuffisant: ${stockItem.quantite_actuelle} disponible, ${quantite} demandé`
                );
              }

              // Retirer la quantité
              emplacements[emplacement_id].stock_actuel[
                element_id
              ].quantite_actuelle -= quantite;
            }

            // Mettre à jour le résumé global
            if (!resume[element_id]) {
              throw new Error(`Élément ${element_id} non trouvé dans le résumé`);
            }

            // Vérifier que le stock global ne devient pas négatif
            if ((resume[element_id].quantite_totale || 0) < quantite) {
              throw new Error(
                `Stock global insuffisant: ${resume[element_id].quantite_totale} disponible, ${quantite} demandé`
              );
            }

            resume[element_id].quantite_totale =
              (resume[element_id].quantite_totale || 0) - quantite;
            resume[element_id].updatedAt = Date.now();
          } else if (type === TRANSACTION_TYPES.TRANSFERT) {
            // TRANSFERT : déplacer entre emplacements
            if (!emplacement_id || !emplacement_dest_id) {
              throw new Error(
                "emplacement_id et emplacement_dest_id requis pour un transfert"
              );
            }

            const fromStock =
              emplacements[emplacement_id]?.stock_actuel?.[element_id];

            if (!fromStock) {
              throw new Error(
                `Élément ${element_id} non trouvé dans l'emplacement source`
              );
            }

            // Vérifier que la quantité ne devient pas négative
            if (fromStock.quantite_actuelle < quantite) {
              throw new Error(
                `Stock source insuffisant: ${fromStock.quantite_actuelle} disponible, ${quantite} demandé`
              );
            }

            // Retirer de la source
            emplacements[emplacement_id].stock_actuel[
              element_id
            ].quantite_actuelle -= quantite;

            // Ajouter à la destination
            if (!emplacements[emplacement_dest_id]) {
              emplacements[emplacement_dest_id] = { stock_actuel: {} };
            }
            if (!emplacements[emplacement_dest_id].stock_actuel) {
              emplacements[emplacement_dest_id].stock_actuel = {};
            }
            if (!emplacements[emplacement_dest_id].stock_actuel[element_id]) {
              emplacements[emplacement_dest_id].stock_actuel[element_id] = {
                ...element,
                quantite_actuelle: 0,
              };
            }

            emplacements[emplacement_dest_id].stock_actuel[
              element_id
            ].quantite_actuelle += quantite;
          }

          // Marquer l'opération comme complétée dans la queue
          operationInQueue.status = OPERATION_STATUS.COMPLETED;
          operationInQueue.processedAt = now;
          results.success++;

          console.log(`✅ Opération ${operation.id} exécutée avec succès`);
        } catch (error) {
          // Trouver l'opération dans la queue pour la marquer comme échouée
          const operationInQueue = queue.find((op) => op.id === operation.id);
          if (operationInQueue) {
            operationInQueue.status = OPERATION_STATUS.FAILED;
            operationInQueue.error = error.message;
            operationInQueue.retryCount = (operationInQueue.retryCount || 0) + 1;
          }

          results.failed++;
          results.errors.push({
            operationId: operation.id,
            error: error.message,
          });

          console.error(`❌ Échec opération ${operation.id}:`, error.message);
        }
      }

      // 6. Convertir les opérations réussies en transactions pour l'historique
      const successfulOps = queue.filter(
        (op) => op.status === OPERATION_STATUS.COMPLETED &&
                op.processedAt === now // Seulement celles traitées dans cette exécution
      );
      for (const operation of successfulOps) {
        const element = resume[operation.payload.element_id];
        if (element) {
          const transactionRecord = {
            id: `TXN-${operation.id}`,
            date: operation.timestamp,
            timestamp: operation.timestamp,
            type: operation.type,
            element: {
              id: element.id,
              denomination: element.denomination,
              unite: element.unite,
              imgURL: element.imgURL || "",
            },
            quantite: operation.payload.quantite,
            emplacement: operation.payload.emplacement_id || "",
            emplacement_dest: operation.payload.emplacement_dest_id || "",
            motif: operation.payload.motif || "",
            actorId: operation.actorId,
            user_id: operation.payload.user_id || "",
            createdAt: operation.createdAt,
            updatedAt: operation.processedAt || now,
          };

          // Prix unitaire uniquement pour les entrées
          if (operation.type === TRANSACTION_TYPES.ENTREE) {
            transactionRecord.prix_unitaire = operation.payload.prix_unitaire || 0;
          }

          currentTransactions.push(transactionRecord);
        }
      }

      // 7. ÉCRITURES: Sauvegarder toutes les modifications (APRÈS toutes les lectures)
      transaction.set(resumeRef, resume, { merge: true });
      transaction.set(emplacementsRef, emplacements, { merge: true });
      transaction.set(queueRef, { operations: queue }, { merge: true });
      transaction.set(
        transactionRef,
        { transactions: currentTransactions },
        { merge: true }
      );
    });

    console.log(
      `✅ Exécution terminée: ${results.success} réussies, ${results.failed} échouées`
    );

    // Notification RTDB pour synchronisation temps réel
    if (results.success > 0) {
      console.log("📡 Envoi notification RTDB pour synchronisation...");
      await createRTDBNotification(
        "Transaction stock",
        `${results.success} transaction(s) de stock effectuée(s)`,
        "success"
      );
      console.log("✅ Notification RTDB envoyée avec succès");
    }

    if (results.failed > 0) {
      await createRTDBNotification(
        "Transaction stock",
        `${results.failed} transaction(s) échouée(s)`,
        "warning"
      );
    }

    return results;
  } catch (error) {
    console.error("❌ Erreur exécution des opérations:", error);
    throw error;
  } finally {
    isExecuting = false;
  }
}

/**
 * Nettoie la queue en supprimant TOUTES les opérations complétées ou échouées
 * Garde uniquement les opérations pending et processing
 * @returns {Promise<number>} Nombre d'opérations supprimées
 */
export async function cleanQueue() {
  try {
    const queueRef = doc(db, STOCK_OPERATIONS_QUEUE_PATH);
    let removedCount = 0;

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);

      if (!queueDoc.exists()) {
        return;
      }

      const queue = queueDoc.data().operations || [];

      // Garder UNIQUEMENT les opérations pending et processing
      const filteredQueue = queue.filter((op) => {
        const shouldKeep =
          op.status === OPERATION_STATUS.PENDING ||
          op.status === OPERATION_STATUS.PROCESSING;

        if (!shouldKeep) removedCount++;
        return shouldKeep;
      });

      transaction.set(queueRef, { operations: filteredQueue }, { merge: true });
    });

    // Sauvegarder la date du nettoyage
    const today = formatDateKey(new Date());
    saveLastCleanupDate(today);

    console.log(`✅ Queue nettoyée: ${removedCount} opérations supprimées`);

    // Notification
    if (removedCount > 0) {
      await createRTDBNotification(
        "Queue nettoyée",
        `${removedCount} opérations complétées/échouées supprimées`,
        "info"
      );
    }

    return removedCount;
  } catch (error) {
    console.error("❌ Erreur nettoyage de la queue:", error);
    throw error;
  }
}

/**
 * Vérifie si un nettoyage de la queue est nécessaire et l'exécute si besoin
 * Se déclenche automatiquement au passage à un nouveau jour
 * @returns {Promise<number|null>} Nombre d'opérations supprimées ou null si pas de nettoyage
 */
export async function autoCleanQueue() {
  try {
    if (shouldCleanQueue()) {
      console.log(
        "🧹 Détection d'un nouveau jour - Nettoyage automatique de la queue"
      );
      const removedCount = await cleanQueue();
      return removedCount;
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur nettoyage automatique:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS CRUD - ELEMENTS DE STOCK
// ============================================================================

/**
 * Crée un nouveau élément de stock
 * Permet les éléments avec quantité 0 UNIQUEMENT pour les nouveaux éléments (placeholders)
 * Si un élément existe déjà avec la même dénomination, une erreur sera levée
 * @param {Object} elementData - Données de l'élément (sans id, avec quantite_initiale optionnel)
 * @returns {Promise<Object>} L'élément créé avec son id
 */
export async function createElement(elementData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }

    // Vérifier si un élément avec la même dénomination existe déjà
    const listeRef = doc(db, STOCK_LISTE_PATH);
    const listeDoc = await getDoc(listeRef);
    const currentListe = listeDoc.exists()
      ? listeDoc.data().elements || []
      : [];

    const existingElement = currentListe.find(
      (el) =>
        el.denomination.toLowerCase().trim() ===
        elementData.denomination.toLowerCase().trim()
    );

    if (existingElement) {
      throw new Error(
        `Un élément avec la dénomination "${elementData.denomination}" existe déjà (ID: ${existingElement.id}). ` +
          `Veuillez utiliser updateElement() pour le modifier ou makeTransaction() pour ajouter du stock.`
      );
    }

    // Générer un ID unique
    const id = `STK-${nanoid(10)}`;
    const now = Date.now();

    // Créer l'élément avec les métadonnées
    // Note: quantite_actuelle est toujours initialisé à 0 pour les nouveaux éléments
    // Pour ajouter du stock, utilisez makeTransaction() après création
    const element = {
      ...elementData,
      id,
      quantite_actuelle: 0, // Toujours 0 pour les nouveaux éléments (placeholder)
      status: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: currentUser.uid,
    };

    // Valider avec le schema
    const validatedElement = itemStockSchema.parse(element);

    // 1. Ajouter à la liste
    currentListe.push(validatedElement);
    await setDoc(listeRef, { elements: currentListe });

    // 2. Ajouter au résumé
    const resumeRef = doc(db, STOCK_RESUME_PATH);
    await setDoc(
      resumeRef,
      {
        [id]: {
          id: validatedElement.id,
          denomination: validatedElement.denomination,
          unite: validatedElement.unite,
          quantite_totale: 0,
          type: validatedElement.type,
          imgURL: validatedElement.imgURL || "",
          updatedAt: now,
        },
      },
      { merge: true }
    );

    // Mettre à jour le cache
    saveStockToCache(currentListe);

    // Notification
    const notificationType =
      validatedElement.quantite_actuelle === 0 ? "info" : "success";
    const notificationMessage =
      validatedElement.quantite_actuelle === 0
        ? `${validatedElement.denomination} ajouté comme placeholder (quantité: 0)`
        : `${validatedElement.denomination} ajouté au stock`;

    await createRTDBNotification(
      "Nouvel élément de stock",
      notificationMessage,
      notificationType
    );

    console.log(
      `✅ Élément de stock créé: ${id} (placeholder: ${
        validatedElement.quantite_actuelle === 0
      })`
    );
    return validatedElement;
  } catch (error) {
    console.error("❌ Erreur création élément de stock:", error);
    throw error;
  }
}

/**
 * Met à jour un élément de stock
 * @param {string} id - ID de l'élément
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>} L'élément mis à jour
 */
export async function updateElement(id, updates) {
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

    // 1. Mettre à jour dans la liste
    const listeRef = doc(db, STOCK_LISTE_PATH);
    const listeDoc = await getDoc(listeRef);

    if (!listeDoc.exists()) {
      throw new Error("Liste de stock non trouvée");
    }

    const currentListe = listeDoc.data().elements || [];
    const elementIndex = currentListe.findIndex((el) => el.id === id);

    if (elementIndex === -1) {
      throw new Error(`Élément ${id} non trouvé`);
    }
    currentListe[elementIndex] = {
      ...currentListe[elementIndex],
      ...updatedData,
    };

    // Valider avec le schema
    const validatedElement = itemStockSchema.parse(currentListe[elementIndex]);
    currentListe[elementIndex] = validatedElement;

    await setDoc(listeRef, { elements: currentListe });

    // 2. Mettre à jour dans le résumé
    const resumeRef = doc(db, STOCK_RESUME_PATH);
    await setDoc(
      resumeRef,
      {
        [id]: {
          denomination: validatedElement.denomination,
          unite: validatedElement.unite,
          type: validatedElement.type,
          imgURL: validatedElement.imgURL || "",
          updatedAt: now,
        },
      },
      { merge: true }
    );

    // Mettre à jour le cache
    saveStockToCache(currentListe);

    // Notification
    await createRTDBNotification(
      "Élément modifié",
      `${validatedElement.denomination} a été modifié`,
      "info"
    );

    console.log("✅ Élément de stock mis à jour:", id);
    return validatedElement;
  } catch (error) {
    console.error("❌ Erreur mise à jour élément de stock:", error);
    throw error;
  }
}

/**
 * Désactive un élément de stock
 * @param {string} id - ID de l'élément
 * @returns {Promise<void>}
 */
export async function desactivateElement(id) {
  try {
    await updateElement(id, { status: false });
    console.log("✅ Élément désactivé:", id);
  } catch (error) {
    console.error("❌ Erreur désactivation élément:", error);
    throw error;
  }
}

/**
 * Réactive un élément de stock
 * @param {string} id - ID de l'élément
 * @returns {Promise<void>}
 */
export async function reactivateElement(id) {
  try {
    await updateElement(id, { status: true });
    console.log("✅ Élément réactivé:", id);
  } catch (error) {
    console.error("❌ Erreur réactivation élément:", error);
    throw error;
  }
}

/**
 * Récupère un élément de stock par son ID
 * @param {string} id - ID de l'élément
 * @returns {Promise<Object|null>} L'élément ou null
 */
export async function getElement(id) {
  try {
    // Récupérer depuis la liste complète pour avoir tous les champs
    const listeRef = doc(db, STOCK_LISTE_PATH);
    const listeDoc = await getDoc(listeRef);

    if (!listeDoc.exists()) {
      return null;
    }

    const data = listeDoc.data();
    const elements = data.elements || [];

    const element = elements.find((el) => el.id === id);
    return element || null;
  } catch (error) {
    console.error("❌ Erreur récupération élément:", error);
    throw error;
  }
}

/**
 * Liste les éléments de stock avec filtre optionnel
 * @param {Object} filter - Filtre { type?, status?, search? }
 * @returns {Promise<Array>} Liste des éléments
 */
export async function listElements(filter = {}) {
  try {
    // Essayer le cache d'abord
    const cached = getStockFromCache();
    let elements = [];

    if (cached && cached.elements) {
      elements = cached.elements;
      console.log("📦 Liste chargée depuis le cache");
    } else {
      const listeRef = doc(db, STOCK_LISTE_PATH);
      const listeDoc = await getDoc(listeRef);

      if (!listeDoc.exists()) {
        return [];
      }

      elements = listeDoc.data().elements || [];
      saveStockToCache(elements);
    }

    // Appliquer les filtres
    let filtered = elements;

    if (filter.type) {
      filtered = filtered.filter((el) => el.type === filter.type);
    }

    if (filter.status !== undefined) {
      filtered = filtered.filter((el) => el.status === filter.status);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (el) =>
          el.denomination.toLowerCase().includes(searchLower) ||
          el.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  } catch (error) {
    console.error("❌ Erreur liste éléments:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS - TRANSACTIONS
// ============================================================================

/**
 * Crée une transaction de stock (entrée ou sortie)
 * NOUVELLE VERSION: Ajoute l'opération à la queue au lieu de l'exécuter directement
 * Déclenche automatiquement le nettoyage de la queue au changement de jour
 * @param {string} type - "entree" ou "sortie"
 * @param {Object} payload - { elementId, quantite, emplacementId?, note?, motif? }
 * @returns {Promise<Object>} L'opération en queue
 */
export async function makeTransaction(type, payload) {
  try {
    console.log("📝 Payload reçu:", payload);
    const {
      element_id,
      quantite,
      emplacement_id,
      emplacement_dest_id,
      prix_unitaire,
      motif,
      user_id,
    } = payload;

    if (!element_id || !quantite || quantite <= 0) {
      throw new Error("element_id et quantite (> 0) sont requis");
    }

    if (!emplacement_id) {
      throw new Error("emplacement_id est requis");
    }

    // Pour les transferts, vérifier emplacement_dest_id
    if (type === TRANSACTION_TYPES.TRANSFERT && !emplacement_dest_id) {
      throw new Error("emplacement_dest_id est requis pour un transfert");
    }

    // Vérifier que l'élément existe
    const element = await getElement(element_id);
    if (!element) {
      throw new Error(`Élément ${element_id} non trouvé`);
    }

    // Nettoyage automatique au changement de jour
    autoCleanQueue().catch((err) => {
      console.error("❌ Erreur nettoyage automatique:", err);
      // Ne pas bloquer l'opération si le nettoyage échoue
    });

    // Préparer le payload complet pour la queue
    const completePayload = {
      element_id,
      quantite: parseFloat(quantite),
      emplacement_id,
      emplacement_dest_id: emplacement_dest_id || null,
      motif: motif || "",
      user_id: user_id || auth.currentUser?.uid || "unknown",
    };

    // Prix unitaire uniquement pour les entrées (les sorties et transferts ne coûtent rien)
    if (type === TRANSACTION_TYPES.ENTREE) {
      completePayload.prix_unitaire = parseFloat(prix_unitaire) || 0;
    }

    // Ajouter l'opération à la queue
    const operation = await enqueueOperation(type, completePayload);

    console.log(`✅ Transaction ${type} ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    // Ceci peut être fait de manière asynchrone sans bloquer
    executeOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur création transaction:", error);
    throw error;
  }
}

/**
 * Crée un transfert entre deux emplacements
 * NOUVELLE VERSION: Ajoute l'opération à la queue au lieu de l'exécuter directement
 * Déclenche automatiquement le nettoyage de la queue au changement de jour
 * @param {Object} payload - { elementId, quantite, fromEmplacementId, toEmplacementId, note? }
 * @returns {Promise<Object>} L'opération en queue
 */
export async function makeTransfert(payload) {
  try {
    const { elementId, quantite, fromEmplacementId, toEmplacementId, note } =
      payload;

    if (!elementId || !quantite || quantite <= 0) {
      throw new Error("elementId et quantite (> 0) sont requis");
    }

    if (!fromEmplacementId || !toEmplacementId) {
      throw new Error("fromEmplacementId et toEmplacementId sont requis");
    }

    // Vérifier que l'élément existe
    const element = await getElement(elementId);
    if (!element) {
      throw new Error(`Élément ${elementId} non trouvé`);
    }

    // Nettoyage automatique au changement de jour
    autoCleanQueue().catch((err) => {
      console.error("❌ Erreur nettoyage automatique:", err);
      // Ne pas bloquer l'opération si le nettoyage échoue
    });

    // Ajouter l'opération à la queue
    const operation = await enqueueOperation(TRANSACTION_TYPES.TRANSFERT, {
      elementId,
      quantite,
      fromEmplacementId,
      toEmplacementId,
      note,
    });

    console.log(`✅ Transfert ajouté à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    // Ceci peut être fait de manière asynchrone sans bloquer
    executeOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur création transfert:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS - STOCK
// ============================================================================

/**
 * Hook pour récupérer un élément de stock et son historique
 * @param {string} elementId - ID de l'élément
 * @param {number} days - Nombre de jours d'historique (défaut: 7)
 * @returns {Object} { element, transactions, loading, error, refetch }
 */
export function useStockElement(elementId, days = 7) {
  const [element, setElement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'élément
      const elementData = await getElement(elementId);
      setElement(elementData);

      // Récupérer les transactions des N derniers jours
      const transactionsArray = [];
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = formatDateKey(date);

        const transactionRef = doc(db, STOCK_TRANSACTIONS_BASE_PATH, dateKey);
        const transactionDoc = await getDoc(transactionRef);

        if (transactionDoc.exists()) {
          const dayTransactions = transactionDoc.data().transactions || [];
          const filtered = dayTransactions.filter(
            (t) => t.element.id === elementId
          );
          transactionsArray.push(...filtered);
        }
      }

      setTransactions(transactionsArray.sort((a, b) => b.date - a.date));
    } catch (err) {
      console.error("❌ Erreur useStockElement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [elementId, days]);

  useEffect(() => {
    if (elementId) {
      fetchData();
    }
  }, [elementId, fetchData]);

  return { element, transactions, loading, error, refetch: fetchData };
}

/**
 * Hook pour récupérer tous les éléments de stock
 * @param {Object} filter - Filtre optionnel
 * @returns {Object} { elements, loading, error, refetch }
 */
export function useStockElements(filter = {}) {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extraire les valeurs primitives du filtre pour éviter les re-renders
  const filterType = filter.type;
  const filterStatus = filter.status;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Reconstruire le filtre avec les valeurs primitives
      const filterObj = {};
      if (filterType) filterObj.type = filterType;
      if (filterStatus !== undefined) filterObj.status = filterStatus;

      const data = await listElements(filterObj);

      // Comparer avec les données actuelles pour éviter les re-renders inutiles
      setElements((prevElements) => {
        const isDifferent = JSON.stringify(prevElements) !== JSON.stringify(data);
        return isDifferent ? data : prevElements;
      });
    } catch (err) {
      console.error("❌ Erreur useStockElements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les mises à jour en temps réel via RTDB avec debounce
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);
    let debounceTimer = null;
    let isInitialLoad = true;

    const handleNotification = (snapshot) => {
      // Ignorer les notifications qui existaient déjà au moment du montage
      if (isInitialLoad) {
        return;
      }

      const notification = snapshot.val();
      if (
        notification &&
        (notification.title?.includes("stock") ||
          notification.title?.includes("Stock"))
      ) {
        console.log("🔔 Notification RTDB reçue - Rechargement différé des éléments de stock");

        // Annuler le timer précédent
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Attendre 500ms avant de recharger (debounce)
        debounceTimer = setTimeout(() => {
          fetchData();
        }, 500);
      }
    };

    // Écouter les nouvelles notifications ajoutées
    const unsubscribe = onChildAdded(notificationsRef, handleNotification);

    // Après un court délai, considérer le chargement initial terminé
    const initTimer = setTimeout(() => {
      isInitialLoad = false;
      console.log("✅ useStockElements - Chargement initial terminé, écoute des nouvelles notifications");
    }, 1000);

    return () => {
      unsubscribe();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      clearTimeout(initTimer);
    };
  }, [fetchData]);

  return { elements, loading, error, refetch: fetchData };
}

/**
 * Hook pour récupérer l'historique des transactions
 * @param {number} days - Nombre de jours d'historique (défaut: 7)
 * @param {Object} filter - Filtre optionnel { type?, elementId? }
 * @returns {Object} { transactions, loading, error, refetch }
 */
export function useTransactions(days = 7, filter = {}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extraire les valeurs primitives du filtre pour éviter les re-renders
  const filterType = filter.type;
  const filterElementId = filter.elementId;

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 useTransactions - Chargement des transactions...", {
        days,
        filterType,
        filterElementId,
        forceRefresh,
      });

      // Essayer le cache d'abord (sauf si forceRefresh)
      const cached = forceRefresh ? null : getTransactionsFromCache();
      let transactionsArray = [];

      // Utiliser le cache seulement s'il contient des transactions
      if (cached && cached.transactions && cached.transactions.length > 0) {
        transactionsArray = cached.transactions;
        console.log("📦 Transactions chargées depuis le cache:", transactionsArray.length);
      } else {
        console.log("🔄 Chargement depuis Firestore...");
        const now = new Date();

        for (let i = 0; i < days; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateKey = formatDateKey(date);

          console.log(`📅 Chargement du ${dateKey}...`);

          const transactionRef = doc(db, STOCK_TRANSACTIONS_BASE_PATH, dateKey);
          const transactionDoc = await getDoc(transactionRef);

          if (transactionDoc.exists()) {
            const dayTransactions = transactionDoc.data().transactions || [];
            console.log(`  ✅ ${dayTransactions.length} transactions trouvées pour ${dateKey}`);
            transactionsArray.push(...dayTransactions);
          } else {
            console.log(`  ⚪ Aucune transaction pour ${dateKey}`);
          }
        }

        console.log(`💾 Total chargé depuis Firestore: ${transactionsArray.length} transactions`);
        saveTransactionsToCache(transactionsArray);
      }

      // Appliquer les filtres
      let filtered = transactionsArray;

      console.log(`🔍 Avant filtrage: ${filtered.length} transactions`);

      if (filterType) {
        filtered = filtered.filter((t) => t.type === filterType);
        console.log(`  → Filtre type "${filterType}": ${filtered.length} transactions`);
      }

      if (filterElementId) {
        const beforeFilter = filtered.length;
        filtered = filtered.filter((t) => t.element && t.element.id === filterElementId);
        console.log(`  → Filtre elementId "${filterElementId}": ${filtered.length} transactions (avant: ${beforeFilter})`);
      }

      console.log(`✅ Transactions finales: ${filtered.length}`);
      setTransactions(filtered.sort((a, b) => b.date - a.date));
    } catch (err) {
      console.error("❌ Erreur useTransactions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days, filterType, filterElementId]);

  useEffect(() => {
    fetchData(false); // Premier chargement avec cache
  }, [fetchData]);

  // Fonction de refetch qui force le rechargement
  const refetch = useCallback(() => {
    return fetchData(true); // Forcer le rechargement sans cache
  }, [fetchData]);

  // Écouter les mises à jour en temps réel via RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title?.includes("Transaction stock") ||
          notification.title?.includes("Transaction") ||
          notification.title?.includes("Transfert"))
      ) {
        console.log("🔔 Notification RTDB reçue - Rechargement des transactions");
        fetchData(true); // Force refresh pour éviter le cache
      }
    };

    // Écouter les nouvelles notifications ajoutées
    const unsubscribe = onChildAdded(notificationsRef, handleNotification);

    return () => {
      unsubscribe();
    };
  }, [fetchData]);

  return { transactions, loading, error, refetch };
}

/**
 * Hook pour surveiller la queue d'opérations
 * @param {Object} filter - Filtre optionnel { status?, type? }
 * @returns {Object} { operations, stats, loading, error, refetch, executeAll, cleanQueue }
 */
export function useOperationsQueue(filter = {}) {
  const [operations, setOperations] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extraire les valeurs primitives du filtre pour éviter les re-renders
  const filterStatus = filter.status;
  const filterType = filter.type;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queueRef = doc(db, STOCK_OPERATIONS_QUEUE_PATH);
      const queueDoc = await getDoc(queueRef);

      if (!queueDoc.exists()) {
        setOperations([]);
        setStats({
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          total: 0,
        });
        return;
      }

      let allOperations = queueDoc.data().operations || [];

      // Appliquer les filtres
      let filtered = allOperations;

      if (filterStatus) {
        filtered = filtered.filter((op) => op.status === filterStatus);
      }

      if (filterType) {
        filtered = filtered.filter((op) => op.type === filterType);
      }

      // Trier par timestamp (plus récent en premier)
      filtered.sort((a, b) => b.timestamp - a.timestamp);

      setOperations(filtered);

      // Calculer les statistiques
      const newStats = {
        pending: allOperations.filter(
          (op) => op.status === OPERATION_STATUS.PENDING
        ).length,
        processing: allOperations.filter(
          (op) => op.status === OPERATION_STATUS.PROCESSING
        ).length,
        completed: allOperations.filter(
          (op) => op.status === OPERATION_STATUS.COMPLETED
        ).length,
        failed: allOperations.filter(
          (op) => op.status === OPERATION_STATUS.FAILED
        ).length,
        total: allOperations.length,
      };

      setStats(newStats);
    } catch (err) {
      console.error("❌ Erreur useOperationsQueue:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les mises à jour en temps réel via RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title?.includes("Transaction stock") ||
          notification.title?.includes("Opération") ||
          notification.title?.includes("opération"))
      ) {
        console.log("🔔 Notification RTDB reçue - Rechargement de la queue d'opérations");
        fetchData();
      }
    };

    // Écouter les nouvelles notifications ajoutées
    const unsubscribe = onChildAdded(notificationsRef, handleNotification);

    return () => {
      unsubscribe();
    };
  }, [fetchData]);

  // Fonction pour exécuter toutes les opérations en attente
  const executeAll = useCallback(async () => {
    try {
      const results = await executeOperations();
      await fetchData(); // Rafraîchir après l'exécution
      return results;
    } catch (err) {
      console.error("❌ Erreur executeAll:", err);
      throw err;
    }
  }, [fetchData]);

  // Fonction pour nettoyer la queue
  const cleanQueueCallback = useCallback(async () => {
    try {
      const removedCount = await cleanQueue();
      await fetchData(); // Rafraîchir après le nettoyage
      return removedCount;
    } catch (err) {
      console.error("❌ Erreur cleanQueue:", err);
      throw err;
    }
  }, [fetchData]);

  return {
    operations,
    stats,
    loading,
    error,
    refetch: fetchData,
    executeAll,
    cleanQueue: cleanQueueCallback,
  };
}

/**
 * Hook pour récupérer le stock d'un élément spécifique par emplacement
 * @param {string} elementId - ID de l'élément de stock
 * @returns {Object} { stockByEmplacement, loading, error, refetch }
 *
 * @example
 * const { stockByEmplacement, loading } = useStockByEmplacement("element_123");
 * // stockByEmplacement = [
 * //   { emplacementId, emplacementNom, quantite, element },
 * //   ...
 * // ]
 */
export function useStockByEmplacement(elementId) {
  const [stockByEmplacement, setStockByEmplacement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!elementId) {
      setStockByEmplacement([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer le document stock/emplacements
      const emplacementsRef = doc(db, STOCK_EMPLACEMENTS_PATH);
      const emplacementsDoc = await getDoc(emplacementsRef);

      if (!emplacementsDoc.exists()) {
        setStockByEmplacement([]);
        setLoading(false);
        return;
      }

      const emplacements = emplacementsDoc.data();
      const stockData = [];

      // Parcourir tous les emplacements
      Object.entries(emplacements).forEach(([emplacementId, emplacementData]) => {
        // Vérifier si cet emplacement a le stock de l'élément recherché
        const stockActuel = emplacementData.stock_actuel || {};
        const elementStock = stockActuel[elementId];

        if (elementStock && elementStock.quantite_actuelle > 0) {
          stockData.push({
            emplacementId,
            emplacementNom: emplacementData.denomination || emplacementId,
            quantite: elementStock.quantite_actuelle || 0,
            element: elementStock,
            type: emplacementData.type,
            position: emplacementData.position,
          });
        }
      });

      // Trier par quantité décroissante
      stockData.sort((a, b) => b.quantite - a.quantite);

      setStockByEmplacement(stockData);
    } catch (err) {
      console.error("❌ Erreur useStockByEmplacement:", err);
      setError(err.message);
      setStockByEmplacement([]);
    } finally {
      setLoading(false);
    }
  }, [elementId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les notifications en temps réel
  useEffect(() => {
    if (!elementId) return;

    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title?.includes("Transaction stock") ||
          notification.title?.includes("Transaction") ||
          notification.title?.includes("Transfert"))
      ) {
        console.log("🔔 Notification RTDB reçue - Rechargement du stock par emplacement");
        fetchData();
      }
    };

    const unsubscribe = onChildAdded(notificationsRef, handleNotification);

    return () => {
      unsubscribe();
    };
  }, [elementId, fetchData]);

  return { stockByEmplacement, loading, error, refetch: fetchData };
}

/**
 * Hook pour les statistiques globales du stock
 * @param {number} days - Nombre de jours à analyser
 * @returns {Object} { stats, loading, error, refetch }
 */
export function useStockAnalytics(days = 30) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les éléments de stock
      const elements = await listElements();

      // Récupérer toutes les transactions des N derniers jours
      const transactionsArray = [];
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = formatDateKey(date);

        const transactionRef = doc(db, STOCK_TRANSACTIONS_BASE_PATH, dateKey);
        const transactionDoc = await getDoc(transactionRef);

        if (transactionDoc.exists()) {
          const dayTransactions = transactionDoc.data().transactions || [];
          transactionsArray.push(...dayTransactions);
        }
      }

      // Initialiser les statistiques
      const analytics = {
        total_articles: elements.length,
        articles_en_alerte: 0,
        articles_en_rupture: 0,
        valeur_totale_stock: 0,
        articles_par_type: {
          [STOCK_TYPES.INGREDIENT]: 0,
          [STOCK_TYPES.CONSOMMABLE]: 0,
          [STOCK_TYPES.PERISSABLE]: 0,
          [STOCK_TYPES.MATERIEL]: 0,
          [STOCK_TYPES.EMBALLAGE]: 0,
        },
        transactions_par_type: {
          [TRANSACTION_TYPES.ENTREE]: 0,
          [TRANSACTION_TYPES.SORTIE]: 0,
          [TRANSACTION_TYPES.TRANSFERT]: 0,
        },
        evolution_stock: [], // { date, valeur_totale, nb_articles_alerte }
        articles_critiques: [], // Articles en alerte avec prévision rupture
        top_consommation: [], // Top 10 des articles les plus consommés
        days,
      };

      // Analyser les éléments
      const consommationMap = new Map();

      elements.forEach((element) => {
        // Compter par type
        analytics.articles_par_type[element.type]++;

        // Calculer valeur du stock
        const valeur = (element.quantite_actuelle || 0) * (element.prix_unitaire || 0);
        analytics.valeur_totale_stock += valeur;

        // Détecter alertes et ruptures
        const quantite = element.quantite_actuelle || 0;
        const seuil = element.seuil_alerte || 0;

        if (quantite === 0) {
          analytics.articles_en_rupture++;
        } else if (seuil > 0 && quantite <= seuil) {
          analytics.articles_en_alerte++;
        }

        // Initialiser la consommation
        consommationMap.set(element.id, {
          element,
          quantite_sortie: 0,
          nb_sorties: 0,
        });
      });

      // Analyser les transactions
      transactionsArray.forEach((transaction) => {
        // Compter par type
        analytics.transactions_par_type[transaction.type]++;

        // Analyser la consommation (sorties)
        if (transaction.type === TRANSACTION_TYPES.SORTIE && transaction.element) {
          const elementId = transaction.element.id;
          if (consommationMap.has(elementId)) {
            const consomData = consommationMap.get(elementId);
            consomData.quantite_sortie += transaction.quantite || 0;
            consomData.nb_sorties++;
          }
        }
      });

      // Créer le top consommation
      const consommationArray = Array.from(consommationMap.values())
        .filter((c) => c.quantite_sortie > 0)
        .sort((a, b) => b.quantite_sortie - a.quantite_sortie)
        .slice(0, 10);

      analytics.top_consommation = consommationArray.map((c) => ({
        id: c.element.id,
        denomination: c.element.denomination,
        unite: c.element.unite,
        quantite_sortie: c.quantite_sortie,
        nb_sorties: c.nb_sorties,
        quantite_actuelle: c.element.quantite_actuelle,
        seuil_alerte: c.element.seuil_alerte,
        type: c.element.type,
        imgURL: c.element.imgURL,
      }));

      // Identifier les articles critiques avec prévision de rupture
      const critiques = [];

      consommationArray.forEach((c) => {
        const element = c.element;
        const quantite_actuelle = element.quantite_actuelle || 0;
        const seuil = element.seuil_alerte || 0;

        // Calculer la consommation moyenne par jour
        const consommation_moyenne_jour = c.quantite_sortie / days;

        // Prévision de rupture (en jours)
        const jours_avant_rupture = consommation_moyenne_jour > 0
          ? Math.floor(quantite_actuelle / consommation_moyenne_jour)
          : Infinity;

        // Article critique si rupture prévue dans moins de 7 jours ou en alerte
        if (
          quantite_actuelle === 0 ||
          jours_avant_rupture < 7 ||
          (seuil > 0 && quantite_actuelle <= seuil)
        ) {
          critiques.push({
            id: element.id,
            denomination: element.denomination,
            unite: element.unite,
            quantite_actuelle,
            seuil_alerte: seuil,
            consommation_moyenne_jour: parseFloat(consommation_moyenne_jour.toFixed(2)),
            jours_avant_rupture: jours_avant_rupture === Infinity ? null : jours_avant_rupture,
            statut: quantite_actuelle === 0
              ? "rupture"
              : jours_avant_rupture < 7
              ? "critique"
              : "alerte",
            type: element.type,
            imgURL: element.imgURL,
          });
        }
      });

      analytics.articles_critiques = critiques.sort((a, b) => {
        // Trier par statut (rupture > critique > alerte) puis par jours avant rupture
        const statutOrder = { rupture: 0, critique: 1, alerte: 2 };
        if (statutOrder[a.statut] !== statutOrder[b.statut]) {
          return statutOrder[a.statut] - statutOrder[b.statut];
        }
        const aJours = a.jours_avant_rupture === null ? Infinity : a.jours_avant_rupture;
        const bJours = b.jours_avant_rupture === null ? Infinity : b.jours_avant_rupture;
        return aJours - bJours;
      });

      // Calculer l'évolution du stock par jour (simulée avec les transactions)
      // Pour chaque jour, on calcule le nombre d'articles en alerte
      const evolutionMap = new Map();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

        evolutionMap.set(dateKey, {
          date: dateKey,
          valeur_totale: 0,
          nb_articles_alerte: 0,
          nb_entrees: 0,
          nb_sorties: 0,
        });
      }

      // Remplir avec les données de transactions
      transactionsArray.forEach((transaction) => {
        const date = new Date(transaction.date);
        const dateKey = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (evolutionMap.has(dateKey)) {
          const dayData = evolutionMap.get(dateKey);
          if (transaction.type === TRANSACTION_TYPES.ENTREE) {
            dayData.nb_entrees++;
          } else if (transaction.type === TRANSACTION_TYPES.SORTIE) {
            dayData.nb_sorties++;
          }
        }
      });

      analytics.evolution_stock = Array.from(evolutionMap.values());

      setStats(analytics);
    } catch (err) {
      console.error("❌ Erreur useStockAnalytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { stats, loading, error, refetch: fetchAnalytics };
}

/**
 * Hook pour l'analyse détaillée d'un article
 * @param {string} articleId - ID de l'article
 * @param {number} days - Nombre de jours à analyser
 * @returns {Object} { articleStats, loading, error, refetch }
 */
export function useArticleAnalytics(articleId, days = 30) {
  const [articleStats, setArticleStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticleAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'élément
      const element = await getElement(articleId);
      if (!element) {
        throw new Error("Article non trouvé");
      }

      // Récupérer toutes les transactions pour cet article
      const transactionsArray = [];
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = formatDateKey(date);

        const transactionRef = doc(db, STOCK_TRANSACTIONS_BASE_PATH, dateKey);
        const transactionDoc = await getDoc(transactionRef);

        if (transactionDoc.exists()) {
          const dayTransactions = transactionDoc.data().transactions || [];
          const filtered = dayTransactions.filter((t) => t.element?.id === articleId);
          transactionsArray.push(...filtered);
        }
      }

      // Initialiser les statistiques
      const analytics = {
        id: element.id,
        denomination: element.denomination,
        unite: element.unite,
        type: element.type,
        quantite_actuelle: element.quantite_actuelle || 0,
        seuil_alerte: element.seuil_alerte || 0,
        prix_unitaire_actuel: element.prix_unitaire || 0,
        imgURL: element.imgURL || "",
        description: element.description || "",

        // Statistiques des transactions
        total_entrees: 0,
        total_sorties: 0,
        total_transferts: 0,
        quantite_entree: 0,
        quantite_sortie: 0,

        // Analyse des prix
        prix_moyen_achat: 0,
        prix_min_achat: Infinity,
        prix_max_achat: 0,
        historique_prix: [], // { date, prix, quantite, type }

        // Evolution
        evolution_quantite: [], // { date, quantite_entree, quantite_sortie, solde }
        evolution_prix: [], // { date, prix_moyen }

        // Consommation
        consommation_moyenne_jour: 0,
        consommation_totale: 0,
        jours_avant_rupture: null,

        // Tendance
        trend: "stable", // "hausse", "baisse", "stable"
        trendPercentage: 0,

        // Recommandations
        periode_optimale_achat: null, // { mois, prix_moyen }
        quantite_recommandee: 0,

        days,
      };

      // Analyser les transactions
      const prixArray = [];
      const evolutionMap = new Map();

      // Initialiser l'évolution pour chaque jour
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

        evolutionMap.set(dateKey, {
          date: dateKey,
          quantite_entree: 0,
          quantite_sortie: 0,
          solde: 0,
          prix_moyen: 0,
          nb_achats: 0,
          somme_prix: 0,
        });
      }

      transactionsArray.forEach((transaction) => {
        const date = new Date(transaction.date);
        const dateKey = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
        const prix = transaction.prix_unitaire || 0;
        const quantite = transaction.quantite || 0;

        // Compter les transactions par type
        if (transaction.type === TRANSACTION_TYPES.ENTREE) {
          analytics.total_entrees++;
          analytics.quantite_entree += quantite;

          // Analyser les prix d'achat (uniquement pour les entrées)
          if (prix > 0) {
            prixArray.push(prix);
            analytics.prix_min_achat = Math.min(analytics.prix_min_achat, prix);
            analytics.prix_max_achat = Math.max(analytics.prix_max_achat, prix);

            analytics.historique_prix.push({
              date: dateKey,
              prix,
              quantite,
              type: transaction.type,
              motif: transaction.motif || "",
            });
          }

          // Mettre à jour l'évolution
          if (evolutionMap.has(dateKey)) {
            const dayData = evolutionMap.get(dateKey);
            dayData.quantite_entree += quantite;
            dayData.solde += quantite;

            if (prix > 0) {
              dayData.nb_achats++;
              dayData.somme_prix += prix;
            }
          }
        } else if (transaction.type === TRANSACTION_TYPES.SORTIE) {
          analytics.total_sorties++;
          analytics.quantite_sortie += quantite;
          analytics.consommation_totale += quantite;

          // Mettre à jour l'évolution
          if (evolutionMap.has(dateKey)) {
            const dayData = evolutionMap.get(dateKey);
            dayData.quantite_sortie += quantite;
            dayData.solde -= quantite;
          }
        } else if (transaction.type === TRANSACTION_TYPES.TRANSFERT) {
          analytics.total_transferts++;
        }
      });

      // Calculer le prix moyen d'achat
      if (prixArray.length > 0) {
        analytics.prix_moyen_achat = prixArray.reduce((a, b) => a + b, 0) / prixArray.length;
      }
      if (analytics.prix_min_achat === Infinity) {
        analytics.prix_min_achat = 0;
      }

      // Calculer l'évolution
      analytics.evolution_quantite = Array.from(evolutionMap.values()).map((day) => ({
        date: day.date,
        quantite_entree: day.quantite_entree,
        quantite_sortie: day.quantite_sortie,
        solde: day.solde,
      }));

      analytics.evolution_prix = Array.from(evolutionMap.values())
        .filter((day) => day.nb_achats > 0)
        .map((day) => ({
          date: day.date,
          prix_moyen: day.somme_prix / day.nb_achats,
        }));

      // Calculer la consommation moyenne par jour
      analytics.consommation_moyenne_jour = analytics.quantite_sortie / days;

      // Prévision de rupture
      if (analytics.consommation_moyenne_jour > 0 && analytics.quantite_actuelle > 0) {
        analytics.jours_avant_rupture = Math.floor(
          analytics.quantite_actuelle / analytics.consommation_moyenne_jour
        );
      }

      // Calculer la tendance (première moitié vs seconde moitié)
      if (analytics.evolution_quantite.length > 1) {
        const mid = Math.floor(analytics.evolution_quantite.length / 2);
        const firstHalf = analytics.evolution_quantite
          .slice(0, mid)
          .reduce((sum, d) => sum + d.quantite_sortie, 0);
        const secondHalf = analytics.evolution_quantite
          .slice(mid)
          .reduce((sum, d) => sum + d.quantite_sortie, 0);

        const avgFirst = firstHalf / mid;
        const avgSecond = secondHalf / (analytics.evolution_quantite.length - mid);

        if (avgSecond > avgFirst * 1.1) {
          analytics.trend = "hausse";
          analytics.trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        } else if (avgSecond < avgFirst * 0.9) {
          analytics.trend = "baisse";
          analytics.trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        }
      }

      // Trouver la période optimale d'achat (mois avec prix moyen le plus bas)
      const prixParMois = new Map();

      analytics.historique_prix.forEach((entry) => {
        const [day, month] = entry.date.split("/");
        const moisKey = month; // Juste le numéro du mois

        if (!prixParMois.has(moisKey)) {
          prixParMois.set(moisKey, { prix_total: 0, nb_achats: 0 });
        }

        const moisData = prixParMois.get(moisKey);
        moisData.prix_total += entry.prix;
        moisData.nb_achats++;
      });

      if (prixParMois.size > 0) {
        let meilleurMois = null;
        let prixMin = Infinity;

        prixParMois.forEach((data, mois) => {
          const prixMoyen = data.prix_total / data.nb_achats;
          if (prixMoyen < prixMin) {
            prixMin = prixMoyen;
            meilleurMois = mois;
          }
        });

        if (meilleurMois) {
          const nomsMois = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                           "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
          analytics.periode_optimale_achat = {
            mois: nomsMois[parseInt(meilleurMois)],
            prix_moyen: prixMin,
          };
        }
      }

      // Quantité recommandée à commander (basée sur consommation + marge de sécurité)
      if (analytics.consommation_moyenne_jour > 0) {
        // Commander pour 14 jours avec 20% de marge de sécurité
        analytics.quantite_recommandee = Math.ceil(
          analytics.consommation_moyenne_jour * 14 * 1.2
        );
      }

      setArticleStats(analytics);
    } catch (err) {
      console.error("❌ Erreur useArticleAnalytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [articleId, days]);

  useEffect(() => {
    if (articleId) {
      fetchArticleAnalytics();
    }
  }, [articleId, fetchArticleAnalytics]);

  return { articleStats, loading, error, refetch: fetchArticleAnalytics };
}

// ============================================================================
// ALIAS EXPORTS
// ============================================================================

/**
 * Alias pour listElements (pour compatibilité)
 */
export const getStockElements = listElements;
