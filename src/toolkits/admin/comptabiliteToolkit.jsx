/**
 * comptabiliteToolkit.jsx
 * Système de queue anti-collision pour la comptabilité
 *
 * Ce fichier implémente UNIQUEMENT le système de queue pour éviter les collisions
 * lors d'écritures concurrentes dans Firestore.
 *
 * Toutes les autres fonctionnalités (CRUD, hooks, stats, bilans) sont importées
 * depuis le système modulaire: ./comptabilite/
 */

import { useState, useEffect } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  doc,
  runTransaction,
  onSnapshot,
} from "firebase/firestore";
import { ref, push } from "firebase/database";
import { db, rtdb } from "@/firebase";

// ============================================================================
// IMPORTS DEPUIS LE SYSTÈME MODULAIRE
// ============================================================================

// Réexporter tout depuis le système modulaire
export * from "./comptabilite";

// Imports spécifiques pour le système de queue
import {
  operationSchema,
  creerOperation as creerOperationModular,
  updateOperation as updateOperationModular,
  deleteOperation as deleteOperationModular,
  updateStatistiquesEnTempsReel,
} from "./comptabilite";

// ============================================================================
// SYSTÈME DE QUEUE ANTI-COLLISION
// ============================================================================
/**
 * Ce système de queue implémente un mécanisme de traitement séquentiel des opérations
 * comptables pour éviter les collisions lors d'écritures simultanées dans Firestore.
 *
 * FONCTIONNEMENT:
 * 1. Chaque opération (create/update/delete) est ajoutée à une queue avec statut "pending"
 * 2. executeComptaOperations() traite toutes les opérations pending en une seule transaction atomique
 * 3. Un flag global isExecutingCompta empêche les exécutions simultanées
 * 4. Toutes les lectures de documents sont effectuées AVANT toute écriture (read-before-write)
 * 5. Les opérations sont traitées dans l'ordre chronologique (tri par timestamp)
 * 6. La trésorerie est mise à jour automatiquement pour chaque opération
 * 7. Les opérations sont marquées "completed" ou "failed" selon le résultat
 * 8. cleanComptaQueue() nettoie périodiquement les opérations terminées
 *
 * AVANTAGES:
 * - Évite les race conditions avec plusieurs utilisateurs
 * - Garantit la cohérence des données via runTransaction
 * - Permet un traitement batch efficace
 * - Offre une visibilité sur l'état des opérations via useComptaQueue()
 * - Résilience: les opérations échouées restent en queue pour retry manuel
 */

// ============================================================================
// CONSTANTES
// ============================================================================

const OPERATIONS_QUEUE_PATH = "comptabilite/operationsQueue";
const RTDB_QUEUE_NOTIFICATIONS = "notifications/comptabilite_queue";

// Statuts des opérations dans la queue
export const COMPTA_OPERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schéma pour les opérations en queue
 */
const QueuedComptaOperationSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: z.enum(["create", "update", "delete"]),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  payload: z.any(),
  actorId: z.string().optional(),
  retryCount: z.number().default(0),
  createdAt: z.number(),
  error: z.string().optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Crée une notification RTDB pour la queue
 */
async function createQueueNotification(title, message, type = "info") {
  try {
    const notificationsRef = ref(rtdb, RTDB_QUEUE_NOTIFICATIONS);
    await push(notificationsRef, {
      title,
      message,
      type,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Erreur notification queue RTDB:", error);
  }
}

// ============================================================================
// FONCTIONS DE QUEUE
// ============================================================================

/**
 * Ajoute une opération comptable à la queue
 * @param {string} type - Type d'opération (create, update, delete)
 * @param {Object} payload - Données de l'opération
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération créée
 */
async function enqueueComptaOperation(type, payload, userId = "system") {
  try {
    const now = Date.now();
    const operationId = `COP-${nanoid(10)}`;

    const operation = QueuedComptaOperationSchema.parse({
      id: operationId,
      timestamp: now,
      type,
      status: COMPTA_OPERATION_STATUS.PENDING,
      payload,
      actorId: userId,
      retryCount: 0,
      createdAt: now,
    });

    const queueRef = doc(db, OPERATIONS_QUEUE_PATH);

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);
      const currentQueue = queueDoc.exists()
        ? queueDoc.data().operations || []
        : [];

      currentQueue.push(operation);

      transaction.set(queueRef, {
        operations: currentQueue,
        lastUpdated: now
      });
    });

    console.log("✅ Opération comptable ajoutée à la queue:", operationId);

    return operation;
  } catch (error) {
    console.error("❌ Erreur ajout opération à la queue:", error);
    throw error;
  }
}

// Variable globale pour éviter les exécutions simultanées
let isExecutingCompta = false;

/**
 * Exécute toutes les opérations comptables en attente dans la queue
 * Les opérations sont exécutées chronologiquement avec le système modulaire
 * @returns {Promise<Object>} Résumé de l'exécution { success: number, failed: number, errors: [] }
 */
export async function executeComptaOperations() {
  // Éviter les exécutions simultanées
  if (isExecutingCompta) {
    console.log("⏳ Exécution comptable déjà en cours, opération ignorée");
    return { success: 0, failed: 0, errors: [], skipped: true };
  }

  try {
    isExecutingCompta = true;
    console.log("🔄 Début de l'exécution des opérations comptables en queue...");

    const queueRef = doc(db, OPERATIONS_QUEUE_PATH);
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    await runTransaction(db, async (transaction) => {
      // 1. Récupérer la queue
      const queueDoc = await transaction.get(queueRef);
      if (!queueDoc.exists()) {
        console.log("📭 Queue comptable vide");
        return;
      }

      const queue = queueDoc.data().operations || [];

      // 2. Filtrer les opérations en attente
      const pendingOps = queue.filter(
        (op) => op.status === COMPTA_OPERATION_STATUS.PENDING
      );

      if (pendingOps.length === 0) {
        console.log("📭 Aucune opération comptable en attente");
        return;
      }

      // 3. Trier chronologiquement
      pendingOps.sort((a, b) => a.timestamp - b.timestamp);

      console.log(`📋 ${pendingOps.length} opération(s) comptable(s) à traiter`);

      // 4. Exécuter chaque opération séquentiellement
      const updatedQueue = [];

      for (const op of queue) {
        if (op.status !== COMPTA_OPERATION_STATUS.PENDING) {
          updatedQueue.push(op);
          continue;
        }

        try {
          const { type, payload } = op;

          if (type === "create") {
            // Créer une nouvelle opération via le système modulaire
            await creerOperationModular(payload.operationData, payload.userId);
            results.success++;
          } else if (type === "update") {
            // Mettre à jour une opération
            await updateOperationModular(
              payload.operationId,
              payload.updates,
              payload.userId
            );
            results.success++;
          } else if (type === "delete") {
            // Supprimer une opération
            await deleteOperationModular(payload.operationId, payload.userId);
            results.success++;
          }

          // Marquer l'opération comme complétée
          updatedQueue.push({
            ...op,
            status: COMPTA_OPERATION_STATUS.COMPLETED,
            completedAt: Date.now(),
          });

          console.log(`✅ Opération ${op.id} (${type}) complétée`);
        } catch (error) {
          console.error(`❌ Erreur opération ${op.id}:`, error);
          results.failed++;
          results.errors.push({
            operationId: op.id,
            error: error.message,
          });

          // Marquer l'opération comme échouée
          updatedQueue.push({
            ...op,
            status: COMPTA_OPERATION_STATUS.FAILED,
            error: error.message,
            retryCount: (op.retryCount || 0) + 1,
            failedAt: Date.now(),
          });
        }
      }

      // 5. Mettre à jour la queue
      transaction.set(queueRef, {
        operations: updatedQueue,
        lastUpdated: Date.now()
      });
    });

    console.log(
      `✅ Exécution terminée: ${results.success} succès, ${results.failed} échecs`
    );

    // Mettre à jour les statistiques si au moins une opération a réussi
    if (results.success > 0) {
      try {
        await updateStatistiquesEnTempsReel();
        console.log("📊 Statistiques mises à jour");
      } catch (error) {
        console.error("❌ Erreur mise à jour statistiques:", error);
      }
    }

    // Notification
    if (results.success > 0) {
      await createQueueNotification(
        "Opérations comptables",
        `${results.success} opération(s) exécutée(s)`,
        "success"
      );
    }

    if (results.failed > 0) {
      await createQueueNotification(
        "Opérations comptables",
        `${results.failed} opération(s) échouée(s)`,
        "error"
      );
    }

    return results;
  } catch (error) {
    console.error("❌ Erreur exécution des opérations comptables:", error);
    throw error;
  } finally {
    isExecutingCompta = false;
  }
}

/**
 * Nettoie la queue comptable en supprimant les opérations complétées ou échouées
 * @param {boolean} keepFailed - Garder les opérations échouées (défaut: true)
 * @returns {Promise<number>} Nombre d'opérations supprimées
 */
export async function cleanComptaQueue(keepFailed = true) {
  try {
    const queueRef = doc(db, OPERATIONS_QUEUE_PATH);
    let removedCount = 0;

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);

      if (!queueDoc.exists()) {
        return;
      }

      const queue = queueDoc.data().operations || [];

      // Filtrer la queue
      const filteredQueue = queue.filter((op) => {
        // Garder les opérations pending et processing
        if (
          op.status === COMPTA_OPERATION_STATUS.PENDING ||
          op.status === COMPTA_OPERATION_STATUS.PROCESSING
        ) {
          return true;
        }

        // Garder les opérations failed si keepFailed = true
        if (keepFailed && op.status === COMPTA_OPERATION_STATUS.FAILED) {
          return true;
        }

        // Supprimer les autres
        removedCount++;
        return false;
      });

      transaction.set(queueRef, {
        operations: filteredQueue,
        lastUpdated: Date.now()
      });
    });

    console.log(
      `✅ Queue comptable nettoyée: ${removedCount} opération(s) supprimée(s)`
    );

    if (removedCount > 0) {
      await createQueueNotification(
        "Queue nettoyée",
        `${removedCount} opération(s) comptable(s) supprimée(s)`,
        "info"
      );
    }

    return removedCount;
  } catch (error) {
    console.error("❌ Erreur nettoyage queue comptable:", error);
    throw error;
  }
}

/**
 * Retire une opération spécifique de la queue
 * @param {string} operationId - ID de l'opération à retirer
 * @returns {Promise<boolean>} True si supprimée
 */
export async function retryFailedOperation(operationId) {
  try {
    const queueRef = doc(db, OPERATIONS_QUEUE_PATH);

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);

      if (!queueDoc.exists()) {
        throw new Error("Queue introuvable");
      }

      const queue = queueDoc.data().operations || [];
      const opIndex = queue.findIndex((op) => op.id === operationId);

      if (opIndex === -1) {
        throw new Error(`Opération ${operationId} introuvable`);
      }

      const operation = queue[opIndex];

      if (operation.status !== COMPTA_OPERATION_STATUS.FAILED) {
        throw new Error("Seules les opérations échouées peuvent être réessayées");
      }

      // Remettre en pending
      queue[opIndex] = {
        ...operation,
        status: COMPTA_OPERATION_STATUS.PENDING,
        retryCount: (operation.retryCount || 0) + 1,
        error: undefined,
        retriedAt: Date.now(),
      };

      transaction.set(queueRef, {
        operations: queue,
        lastUpdated: Date.now()
      });
    });

    console.log(`✅ Opération ${operationId} remise en pending pour retry`);

    // Déclencher l'exécution
    executeComptaOperations().catch((err) => {
      console.error("❌ Erreur lors de l'exécution automatique:", err);
    });

    return true;
  } catch (error) {
    console.error("❌ Erreur retry opération:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS PUBLIQUES AVEC QUEUE
// ============================================================================

/**
 * Créer une nouvelle opération comptable (avec queue)
 * @param {Object} operationData - Données de l'opération
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function createOperationWithQueue(operationData, userId = "system") {
  try {
    // Valider les données
    operationSchema
      .partial({
        id: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        date: true
      })
      .parse(operationData);

    // Ajouter l'opération à la queue
    const queuedOp = await enqueueComptaOperation(
      "create",
      {
        operationData,
        userId,
      },
      userId
    );

    console.log("✅ Opération comptable ajoutée à la queue:", queuedOp.id);

    // Notification immédiate
    await createQueueNotification(
      "Opération en file d'attente",
      `${operationData.type_operation} de ${operationData.montant} FCFA ajoutée`,
      "info"
    );

    // Déclencher l'exécution des opérations en attente (asynchrone)
    executeComptaOperations().catch((err) => {
      console.error("❌ Erreur lors de l'exécution automatique:", err);
    });

    return queuedOp;
  } catch (error) {
    console.error("❌ Erreur createOperationWithQueue:", error);
    throw error;
  }
}

/**
 * Créer un transfert entre deux comptes de trésorerie (avec queue)
 * Un transfert génère 2 opérations :
 * - Une sortie du compte source
 * - Une entrée sur le compte destination
 *
 * @param {Object} transfertData - Données du transfert
 * @param {string} transfertData.compte_source_id - ID du compte source
 * @param {string} transfertData.compte_source_ohada - Code OHADA du compte source
 * @param {string} transfertData.compte_source_denomination - Dénomination du compte source
 * @param {string} transfertData.compte_destination_id - ID du compte destination
 * @param {string} transfertData.compte_destination_ohada - Code OHADA du compte destination
 * @param {string} transfertData.compte_destination_denomination - Dénomination du compte destination
 * @param {number} transfertData.montant - Montant du transfert
 * @param {number} transfertData.date - Date du transfert (timestamp)
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object[]>} Les 2 opérations en queue
 */
export async function createTransfertWithQueue(transfertData, userId = "system") {
  try {
    const {
      compte_source_id,
      compte_source_ohada,
      compte_source_denomination,
      compte_destination_id,
      compte_destination_ohada,
      compte_destination_denomination,
      montant,
      date,
    } = transfertData;

    // Validation basique
    if (!compte_source_id || !compte_destination_id) {
      throw new Error("Les comptes source et destination sont requis");
    }

    if (compte_source_id === compte_destination_id) {
      throw new Error("Le compte source et destination doivent être différents");
    }

    if (!montant || montant <= 0) {
      throw new Error("Le montant doit être supérieur à 0");
    }

    // Créer l'opération de sortie du compte source
    const operationSortie = {
      compte_id: compte_source_id,
      compte_ohada: compte_source_ohada,
      compte_denomination: compte_source_denomination,
      montant,
      motif: `Transfert vers ${compte_destination_denomination} (${compte_destination_ohada})`,
      type_operation: "sortie",
      date: date || Date.now(),
    };

    // Créer l'opération d'entrée sur le compte destination
    const operationEntree = {
      compte_id: compte_destination_id,
      compte_ohada: compte_destination_ohada,
      compte_denomination: compte_destination_denomination,
      montant,
      motif: `Transfert depuis ${compte_source_denomination} (${compte_source_ohada})`,
      type_operation: "entree",
      date: date || Date.now(),
    };

    // Ajouter les 2 opérations à la queue
    const [queuedOpSortie, queuedOpEntree] = await Promise.all([
      enqueueComptaOperation("create", { operationData: operationSortie, userId }, userId),
      enqueueComptaOperation("create", { operationData: operationEntree, userId }, userId),
    ]);

    console.log("✅ Transfert ajouté à la queue:", {
      sortie: queuedOpSortie.id,
      entree: queuedOpEntree.id,
    });

    // Notification immédiate
    await createQueueNotification(
      "Transfert en file d'attente",
      `Transfert de ${montant} FCFA de ${compte_source_denomination} vers ${compte_destination_denomination}`,
      "info"
    );

    // Déclencher l'exécution des opérations en attente (asynchrone)
    executeComptaOperations().catch((err) => {
      console.error("❌ Erreur lors de l'exécution automatique:", err);
    });

    return [queuedOpSortie, queuedOpEntree];
  } catch (error) {
    console.error("❌ Erreur createTransfertWithQueue:", error);
    throw error;
  }
}

/**
 * Mettre à jour une opération (avec queue)
 * @param {string} operationId - ID de l'opération
 * @param {Object} updates - Modifications à appliquer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function updateOperationWithQueue(
  operationId,
  updates,
  userId = "system"
) {
  try {
    // Ajouter l'opération de mise à jour à la queue
    const queuedOp = await enqueueComptaOperation(
      "update",
      {
        operationId,
        updates,
        userId,
      },
      userId
    );

    console.log("✅ Mise à jour d'opération ajoutée à la queue:", queuedOp.id);

    // Notification immédiate
    await createQueueNotification(
      "Modification en file d'attente",
      `Modification de l'opération ${operationId}`,
      "info"
    );

    // Déclencher l'exécution (asynchrone)
    executeComptaOperations().catch((err) => {
      console.error("❌ Erreur lors de l'exécution automatique:", err);
    });

    return queuedOp;
  } catch (error) {
    console.error("❌ Erreur updateOperationWithQueue:", error);
    throw error;
  }
}

/**
 * Supprimer une opération (avec queue)
 * @param {string} operationId - ID de l'opération
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function deleteOperationWithQueue(operationId, userId = "system") {
  try {
    // Ajouter l'opération à la queue
    const queuedOp = await enqueueComptaOperation(
      "delete",
      { operationId },
      userId
    );

    // Notification immédiate
    await createQueueNotification(
      "Suppression en file d'attente",
      `Suppression de l'opération ${operationId}`,
      "info"
    );

    // Déclencher l'exécution (asynchrone)
    executeComptaOperations().catch((err) => {
      console.error("❌ Erreur lors de l'exécution automatique:", err);
    });

    return queuedOp;
  } catch (error) {
    console.error("❌ Erreur deleteOperationWithQueue:", error);
    throw error;
  }
}

// ============================================================================
// HOOK POUR SURVEILLER LA QUEUE
// ============================================================================

/**
 * Hook pour surveiller l'état de la queue d'opérations comptables
 * @returns {Object} { queue, stats, loading, error, retry, clean, execute }
 */
export function useComptaQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);

    const queueRef = doc(db, OPERATIONS_QUEUE_PATH);

    const unsubscribe = onSnapshot(
      queueRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const operations = snapshot.data().operations || [];
            setQueue(operations);

            // Calculer les statistiques
            const newStats = operations.reduce(
              (acc, op) => {
                acc[op.status] = (acc[op.status] || 0) + 1;
                acc.total++;
                return acc;
              },
              { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
            );
            setStats(newStats);
          } else {
            setQueue([]);
            setStats({
              pending: 0,
              processing: 0,
              completed: 0,
              failed: 0,
              total: 0,
            });
          }
          setLoading(false);
        } catch (err) {
          console.error("❌ Erreur useComptaQueue:", err);
          setError(err.message);
          setLoading(false);
        }
      },
      (err) => {
        console.error("❌ Erreur snapshot useComptaQueue:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    queue,
    stats,
    loading,
    error,
    retry: retryFailedOperation,
    clean: cleanComptaQueue,
    execute: executeComptaOperations,
  };
}

// ============================================================================
// EXPORTS SUPPLÉMENTAIRES
// ============================================================================

export {
  OPERATIONS_QUEUE_PATH,
  RTDB_QUEUE_NOTIFICATIONS,
  enqueueComptaOperation,
};
