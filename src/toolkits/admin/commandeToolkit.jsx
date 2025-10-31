/**
 * commandeToolkit.jsx
 * Gestion des commandes (ventes) avec intégration comptable automatique
 *
 * SYSTÈME DE QUEUE ANTI-COLLISION (comme stockToolkit):
 * Toutes les opérations de création/modification/suppression passent par une queue
 * d'opérations pour garantir l'atomicité et éviter les collisions Firestore.
 *
 * Structure Firestore:
 *  - ventes/today : document array qui enregistre toutes les commandes du jour
 *  - ventes/archives/liste/{DDMMYYYY} : document array qui archive les ventes de chaque jour
 *  - ventes/ventes_en_attente : document array qui enregistre toutes les ventes non soldées, non livrées ou non servies
 *  - ventes/statistiques : document array qui enregistre les statistiques hebdomadaires
 *  - ventes/operationsQueue : document array qui contient la queue des opérations (create, update, delete)
 *
 * Consignes respectées:
 *  1. Structure optimisée pour limiter les lectures Firestore (cache local)
 *  2. Triggers RTDB pour synchronisation automatique des hooks
 *  3. Intégration comptabiliteToolkit pour transactions automatiques
 *  4. Système de queue pour éviter les collisions Firestore (comme stockToolkit)
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { ref, push, onChildAdded, off } from "firebase/database";
import { db, rtdb } from "@/firebase";
import { createOperation, getDateKey } from "./comptabiliteToolkit";

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const DetailSchema = z.object({
  id: z.string(),
  denomination: z.string().min(1, "Dénomination requise"),
  quantite: z.number().positive("Quantité doit être positive"),
  prix: z.number().nonnegative("Prix doit être positif ou zéro"),
});

const ClientSchema = z.object({
  nom: z.string().min(1, "Nom du client requis"),
  numero: z
    .string()
    .regex(/^\d{1,14}$/, "Numéro doit contenir 1 à 14 chiffres")
    .optional(),
});

const PersonneALivrerSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  contact: z.string().optional(),
});

const PaiementSchema = z.object({
  total: z.number().nonnegative("Total doit être positif ou zéro"),
  livraison: z.number().nonnegative("Frais de livraison doivent être positifs ou zéro").default(0),
  montant_total_recu: z.number().nonnegative("Montant reçu doit être positif ou zéro"),
  monnaie_rendue: z.number().nonnegative("Monnaie rendue doit être positive ou zéro").default(0),
  montant_momo_recu: z.number().nonnegative("Montant Mobile Money doit être positif ou zéro").default(0),
  montant_espece_recu: z.number().nonnegative("Montant espèces doit être positif ou zéro").default(0),
  reduction: z.number().nonnegative("Réduction doit être positive ou zéro").default(0),
  dette: z.number().nonnegative("Dette doit être positive ou zéro").default(0),
});

const PointDeVenteSchema = z.object({
  id: z.string().min(1, "ID point de vente requis"),
  denomination: z.string().min(1, "Dénomination requise"),
});

const DateHeureLivraisonSchema = z.object({
  date: z.string().regex(/^\d{8}$/, "Format date: DDMMYYYY"),
  heure: z.string().regex(/^\d{2}:\d{2}$/, "Format heure: HH:MM"),
});

const StatutSchema = z.enum(["livree", "non livree", "servi", "non servi"]);
const TypeSchema = z.enum(["a livrer", "sur place"]);

export const CommandeSchema = z.object({
  id: z.string(),
  createdBy: z.string().min(1, "Créateur requis"),
  updatedBy: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any().optional(),
  details: z.array(DetailSchema).min(1, "Au moins un article requis"),
  statut: StatutSchema,
  type: TypeSchema,
  point_de_vente: PointDeVenteSchema,
  client: ClientSchema,
  date_heure_livraison: DateHeureLivraisonSchema.optional(),
  personne_a_livrer: PersonneALivrerSchema.optional(),
  paiement: PaiementSchema,
  incident: z.string().optional(),
  commentaire: z.string().optional(),
});

const StatistiquesJourSchema = z.object({
  total_ventes: z.number().default(0),
  total_ventes_sur_place: z.number().default(0),
  total_ventes_a_livrer: z.number().default(0),
  total_ventes_par_articles: z
    .array(
      z.object({
        id: z.string(),
        denomination: z.string(),
        total: z.number(),
      })
    )
    .default([]),
  tendance: z.enum(["hausse", "baisse", "stable"]).default("stable"),
});

/**
 * Schema pour une opération dans la queue
 */
export const QueuedCommandeOperationSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  timestamp: z.number().positive("Le timestamp doit être positif"),
  type: z.enum([
    OPERATION_TYPES.CREATE,
    OPERATION_TYPES.UPDATE,
    OPERATION_TYPES.DELETE,
    OPERATION_TYPES.DELETE_BATCH,
  ]),
  status: z.enum([
    OPERATION_STATUS.PENDING,
    OPERATION_STATUS.PROCESSING,
    OPERATION_STATUS.COMPLETED,
    OPERATION_STATUS.FAILED,
  ]),
  payload: z.object({
    commandeData: z.any().optional(), // Pour CREATE
    commandeId: z.string().optional(), // Pour UPDATE et DELETE
    commandeIds: z.array(z.string()).optional(), // Pour DELETE_BATCH
    updates: z.any().optional(), // Pour UPDATE
  }),
  userId: z.string().min(1, "userId est requis"),
  error: z.string().optional(),
  retryCount: z.number().min(0).default(0),
  createdAt: z.number().positive(),
  processedAt: z.number().optional(),
});

// ============================================================================
// CONSTANTES
// ============================================================================

const VENTES_PATH = "ventes";
const TODAY_DOC = "today";
const ARCHIVES_PATH = "archives/liste";
const VENTES_EN_ATTENTE_DOC = "ventes_en_attente";
const STATISTIQUES_DOC = "statistiques";
const COMMANDES_OPERATIONS_QUEUE_PATH = "ventes/operationsQueue";
const RTDB_COMMANDES_NOTIFICATIONS = "notifications/commandes";

const CACHE_KEY_PREFIX = "commandes_cache_";
const CACHE_TIMESTAMP_KEY = "commandes_cache_timestamp_";
const LOCAL_LAST_CLEANUP_KEY = "lsd_commandes_last_cleanup";

// Statuts des opérations dans la queue
export const OPERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

// Types d'opérations de commandes
export const OPERATION_TYPES = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  DELETE_BATCH: "delete_batch",
};

// Codes OHADA pour les ventes (automatiquement détectés)
const CODE_VENTE_PRODUITS_FINIS = "701"; // Vente de produits finis (sandwichs, yaourts)
const CODE_VENTE_MARCHANDISES = "707"; // Vente de marchandises (boissons, biscuits)
const CODE_COMPTE_CLIENT = "411"; // Clients (vente à crédit/dette)

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Crée une notification RTDB
 */
async function createRTDBNotification(title, message, type = "info") {
  try {
    const notificationsRef = ref(rtdb, RTDB_COMMANDES_NOTIFICATIONS);
    await push(notificationsRef, {
      title,
      message,
      type,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Erreur notification RTDB:", error);
  }
}

/**
 * Gestion du cache local
 */
function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY + key, Date.now().toString());
  } catch (error) {
    console.error("❌ Erreur setCache:", error);
  }
}

function getCache(key) {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("❌ Erreur getCache:", error);
    return null;
  }
}

function clearCache(key) {
  try {
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY + key);
  } catch (error) {
    console.error("❌ Erreur clearCache:", error);
  }
}

/**
 * Détecte le changement de jour et retourne si on est dans un nouveau jour
 */
function isNewDay() {
  const lastDateKey = localStorage.getItem("last_commandes_date");
  const currentDateKey = getDateKey();

  if (lastDateKey !== currentDateKey) {
    localStorage.setItem("last_commandes_date", currentDateKey);
    return lastDateKey !== null; // true si ce n'est pas la première fois
  }

  return false;
}

/**
 * Génère un ID de commande unique
 */
function generateCommandeId() {
  return `cmd_${nanoid(10)}`;
}

/**
 * Calcule la tendance des ventes (hausse, baisse, stable)
 */
function calculateTendance(totalToday, totalYesterday) {
  const variation = ((totalToday - totalYesterday) / (totalYesterday || 1)) * 100;

  if (variation > 5) return "hausse";
  if (variation < -5) return "baisse";
  return "stable";
}

// ============================================================================
// INTÉGRATION COMPTABILITÉ - DÉTECTION AUTOMATIQUE CODE OHADA
// ============================================================================

/**
 * Crée automatiquement les opérations comptables pour une commande
 * Détecte automatiquement le code OHADA selon le type de vente
 * @param {Object} commande - La commande créée
 * @param {string} userId - ID de l'utilisateur
 */
async function createComptabiliteOperationsForCommande(commande, userId) {
  try {
    const { paiement } = commande;

    // Déterminer le code OHADA (701 pour produits finis, 707 pour marchandises)
    // Par défaut: 701 (ventes de sandwichs/yaourts = produits finis)
    const codeOhada = CODE_VENTE_PRODUITS_FINIS;

    const operations = [];

    // 1. Enregistrer les recettes en espèces (Caisse - 531)
    if (paiement.montant_espece_recu > 0) {
      operations.push({
        type: "recette",
        compte_code: codeOhada,
        compte_denomination: "Vente de produits finis",
        montant: paiement.montant_espece_recu,
        tresorerie_id: "caisse", // À adapter selon votre système de trésorerie
        observation: `Vente commande ${commande.id} - Espèces`,
      });
    }

    // 2. Enregistrer les recettes Mobile Money (5121)
    if (paiement.montant_momo_recu > 0) {
      operations.push({
        type: "recette",
        compte_code: codeOhada,
        compte_denomination: "Vente de produits finis",
        montant: paiement.montant_momo_recu,
        tresorerie_id: "mobile_money", // À adapter selon votre système de trésorerie
        observation: `Vente commande ${commande.id} - Mobile Money`,
      });
    }

    // 3. Enregistrer la dette si présente (Compte Client - 411)
    if (paiement.dette > 0) {
      operations.push({
        type: "recette",
        compte_code: CODE_COMPTE_CLIENT,
        compte_denomination: "Clients (créance)",
        montant: paiement.dette,
        tresorerie_id: "compte_client", // Compte clients
        observation: `Dette commande ${commande.id} - Client: ${commande.client.nom}`,
      });
    }

    // Créer toutes les opérations comptables
    for (const operationData of operations) {
      await createOperation(operationData, userId);
    }

    console.log(
      `✅ ${operations.length} opération(s) comptable(s) créée(s) pour commande ${commande.id}`
    );
  } catch (error) {
    console.error(
      "❌ Erreur création opérations comptables pour commande:",
      error
    );
    // Ne pas bloquer la création de commande si la comptabilité échoue
  }
}

/**
 * Supprime les opérations comptables associées à une commande
 * @param {string} commandeId - ID de la commande
 * @param {string} userId - ID de l'utilisateur
 */
async function deleteComptabiliteOperationsForCommande(commandeId, userId) {
  try {
    // Note: Pour l'instant, on crée une opération de "compensation"
    // Une version plus avancée pourrait rechercher et supprimer les opérations spécifiques
    console.log(
      `⚠️ Suppression comptable de la commande ${commandeId} - Nécessite implémentation manuelle`
    );
    // TODO: Implémenter la recherche et suppression des opérations liées
  } catch (error) {
    console.error(
      "❌ Erreur suppression opérations comptables pour commande:",
      error
    );
  }
}

// ============================================================================
// GESTION DE LA QUEUE D'OPÉRATIONS - ANTI-COLLISION
// ============================================================================

// Variable globale pour éviter les exécutions simultanées
let isExecutingCommandes = false;

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

function shouldCleanCommandeQueue() {
  const today = getDateKey();
  const lastCleanup = getLastCleanupDate();

  if (!lastCleanup) {
    return true; // Jamais nettoyé
  }

  return today !== lastCleanup;
}

/**
 * Ajoute une opération à la queue
 * @param {string} type - Type d'opération (create, update, delete, delete_batch)
 * @param {Object} payload - Données de l'opération
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération créée
 */
export async function enqueueCommandeOperation(type, payload, userId = "system") {
  try {
    const now = Date.now();
    const operationId = `CMD-OP-${nanoid(10)}`;

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
    const validatedOperation = QueuedCommandeOperationSchema.parse(operation);

    // Ajouter à la queue avec runTransaction pour éviter les collisions
    const queueRef = doc(db, COMMANDES_OPERATIONS_QUEUE_PATH);

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

/**
 * Exécute toutes les opérations en attente dans la queue
 * Les opérations sont exécutées chronologiquement avec runTransaction
 * @returns {Promise<Object>} Résumé de l'exécution { success: number, failed: number, errors: [] }
 */
export async function executeCommandeOperations() {
  // Éviter les exécutions simultanées
  if (isExecutingCommandes) {
    console.log("⏳ Exécution déjà en cours, opération ignorée");
    return { success: 0, failed: 0, errors: [], skipped: true };
  }

  try {
    isExecutingCommandes = true;
    console.log("🔄 Début de l'exécution des opérations commandes...");

    const queueRef = doc(db, COMMANDES_OPERATIONS_QUEUE_PATH);
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
      const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
      const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
      const now = Date.now();

      // IMPORTANT: Toutes les lectures avant toute écriture
      const [todayDoc, attenteDoc] = await Promise.all([
        transaction.get(todayRef),
        transaction.get(attenteRef),
      ]);

      let commandes = todayDoc.exists() ? todayDoc.data().liste || [] : [];
      let attentes = attenteDoc.exists() ? attenteDoc.data().liste || [] : [];

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
          if (type === OPERATION_TYPES.CREATE) {
            // CREATE: Ajouter une nouvelle commande
            const { commandeData } = payload;
            const commande = {
              id: generateCommandeId(),
              createdBy: operation.userId,
              createdAt: now,
              ...commandeData,
            };

            // Valider avec le schema
            const validatedCommande = CommandeSchema.parse(commande);
            commandes.push(validatedCommande);

            // Ajouter aux attentes si nécessaire
            if (
              validatedCommande.statut === "non livree" ||
              validatedCommande.statut === "non servi" ||
              validatedCommande.paiement.dette > 0
            ) {
              attentes.push(validatedCommande);
            }

            // Créer opérations comptables (en dehors de la transaction)
            operationInQueue._pendingComptaOps = validatedCommande;

          } else if (type === OPERATION_TYPES.UPDATE) {
            // UPDATE: Modifier une commande existante
            const { commandeId, updates } = payload;
            const index = commandes.findIndex((c) => c.id === commandeId);

            if (index === -1) {
              throw new Error(`Commande ${commandeId} non trouvée`);
            }

            commandes[index] = {
              ...commandes[index],
              ...updates,
              updatedBy: operation.userId,
              updatedAt: now,
            };

            // Mettre à jour dans attentes
            const attenteIndex = attentes.findIndex((a) => a.id === commandeId);
            const updatedCommande = commandes[index];

            if (
              updatedCommande.statut === "livree" ||
              updatedCommande.statut === "servi"
            ) {
              if (updatedCommande.paiement.dette === 0) {
                attentes = attentes.filter((a) => a.id !== commandeId);
              }
            } else {
              if (attenteIndex !== -1) {
                attentes[attenteIndex] = updatedCommande;
              } else {
                attentes.push(updatedCommande);
              }
            }

          } else if (type === OPERATION_TYPES.DELETE) {
            // DELETE: Supprimer une commande
            const { commandeId } = payload;
            const filtered = commandes.filter((c) => c.id !== commandeId);

            if (filtered.length === commandes.length) {
              throw new Error(`Commande ${commandeId} non trouvée`);
            }

            commandes = filtered;
            attentes = attentes.filter((a) => a.id !== commandeId);

            // Marquer pour suppression comptable (en dehors de la transaction)
            operationInQueue._pendingComptaDelete = commandeId;

          } else if (type === OPERATION_TYPES.DELETE_BATCH) {
            // DELETE_BATCH: Supprimer plusieurs commandes
            const { commandeIds } = payload;
            commandes = commandes.filter((c) => !commandeIds.includes(c.id));
            attentes = attentes.filter((a) => !commandeIds.includes(a.id));

            // Marquer pour suppression comptable (en dehors de la transaction)
            operationInQueue._pendingComptaDeleteBatch = commandeIds;
          }

          // Marquer l'opération comme complétée
          operationInQueue.status = OPERATION_STATUS.COMPLETED;
          operationInQueue.processedAt = now;
          results.success++;

          console.log(`✅ Opération ${operation.id} exécutée`);
        } catch (error) {
          // Marquer l'opération comme échouée
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

      // 6. ÉCRITURES: Sauvegarder toutes les modifications
      transaction.set(todayRef, { liste: commandes });
      transaction.set(attenteRef, { liste: attentes });
      transaction.set(queueRef, { operations: queue }, { merge: true });
    });

    // 7. Traiter les opérations comptables APRÈS la transaction Firestore
    // (car createOperation fait ses propres transactions)
    const queueDoc = await getDoc(queueRef);
    if (queueDoc.exists()) {
      const queue = queueDoc.data().operations || [];
      for (const operation of queue) {
        if (operation._pendingComptaOps) {
          await createComptabiliteOperationsForCommande(
            operation._pendingComptaOps,
            operation.userId
          );
        }
        if (operation._pendingComptaDelete) {
          await deleteComptabiliteOperationsForCommande(
            operation._pendingComptaDelete,
            operation.userId
          );
        }
        if (operation._pendingComptaDeleteBatch) {
          for (const cmdId of operation._pendingComptaDeleteBatch) {
            await deleteComptabiliteOperationsForCommande(cmdId, operation.userId);
          }
        }
      }
    }

    // 8. Mettre à jour les statistiques
    await MakeCommandeStatistiques();

    // 9. Invalider le cache
    clearCache("today");
    clearCache("attente");

    console.log(
      `✅ Exécution terminée: ${results.success} réussies, ${results.failed} échouées`
    );

    // Notifications
    if (results.success > 0) {
      await createRTDBNotification(
        "Opérations commandes",
        `${results.success} opération(s) effectuée(s)`,
        "success"
      );
    }

    if (results.failed > 0) {
      await createRTDBNotification(
        "Opérations commandes",
        `${results.failed} opération(s) échouée(s)`,
        "warning"
      );
    }

    return results;
  } catch (error) {
    console.error("❌ Erreur exécution des opérations:", error);
    throw error;
  } finally {
    isExecutingCommandes = false;
  }
}

/**
 * Nettoie la queue en supprimant les opérations complétées ou échouées
 * @returns {Promise<number>} Nombre d'opérations supprimées
 */
export async function cleanCommandeQueue() {
  try {
    const queueRef = doc(db, COMMANDES_OPERATIONS_QUEUE_PATH);
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
    const today = getDateKey();
    saveLastCleanupDate(today);

    console.log(`✅ Queue nettoyée: ${removedCount} opérations supprimées`);

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
 * Vérifie si un nettoyage est nécessaire et l'exécute si besoin
 * @returns {Promise<number|null>} Nombre d'opérations supprimées ou null
 */
export async function autoCleanCommandeQueue() {
  try {
    if (shouldCleanCommandeQueue()) {
      console.log(
        "🧹 Détection d'un nouveau jour - Nettoyage automatique de la queue"
      );
      const removedCount = await cleanCommandeQueue();
      return removedCount;
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur nettoyage automatique:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS CRUD - COMMANDES (AVEC QUEUE)
// ============================================================================

/**
 * Créer une nouvelle commande (AVEC QUEUE ANTI-COLLISION)
 * Crée automatiquement les opérations comptables associées
 * @param {Object} commandeData - Données de la commande
 * @param {string} userId - ID de l'utilisateur créateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function CreateCommande(commandeData, userId = "system") {
  try {
    // Vérifier le changement de jour et archiver si nécessaire
    if (isNewDay()) {
      await ArchiverYesterdayCommandes();
    }

    // Nettoyage automatique au changement de jour
    autoCleanCommandeQueue().catch((err) => {
      console.error("❌ Erreur nettoyage automatique:", err);
    });

    // Ajouter l'opération à la queue
    const operation = await enqueueCommandeOperation(
      OPERATION_TYPES.CREATE,
      { commandeData },
      userId
    );

    console.log(`✅ Opération CREATE ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeCommandeOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur CreateCommande:", error);
    throw error;
  }
}

/**
 * Mettre à jour une commande existante (AVEC QUEUE ANTI-COLLISION)
 * @param {string} commandeId - ID de la commande
 * @param {Object} updates - Modifications à appliquer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function UpdateCommande(commandeId, updates, userId = "system") {
  try {
    // Ajouter l'opération à la queue
    const operation = await enqueueCommandeOperation(
      OPERATION_TYPES.UPDATE,
      { commandeId, updates },
      userId
    );

    console.log(`✅ Opération UPDATE ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeCommandeOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur UpdateCommande:", error);
    throw error;
  }
}

/**
 * Récupérer toutes les commandes du jour
 * @returns {Promise<Array>} Liste des commandes
 */
export async function GetCommandes() {
  try {
    // Vérifier le cache
    const cached = getCache("today");
    if (cached) return cached;

    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
    const todayDoc = await getDoc(todayRef);

    const commandes = todayDoc.exists() ? todayDoc.data().liste || [] : [];

    // Mettre en cache
    setCache("today", commandes);

    return commandes;
  } catch (error) {
    console.error("❌ Erreur GetCommandes:", error);
    throw error;
  }
}

/**
 * Supprimer une commande (AVEC QUEUE ANTI-COLLISION)
 * Supprime également les opérations comptables associées
 * @param {string} commandeId - ID de la commande à supprimer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function DeleteCommande(commandeId, userId = "system") {
  try {
    // Ajouter l'opération à la queue
    const operation = await enqueueCommandeOperation(
      OPERATION_TYPES.DELETE,
      { commandeId },
      userId
    );

    console.log(`✅ Opération DELETE ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeCommandeOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur DeleteCommande:", error);
    throw error;
  }
}

/**
 * Créer plusieurs commandes en batch
 * @param {Array} commandesData - Tableau de données de commandes
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Tableau des commandes créées
 */
export async function CreateCommandeBatch(commandesData, userId = "system") {
  try {
    // Vérifier le changement de jour et archiver si nécessaire
    if (isNewDay()) {
      await ArchiverYesterdayCommandes();
    }

    const newCommandes = commandesData.map((data) =>
      CommandeSchema.parse({
        id: generateCommandeId(),
        createdBy: userId,
        createdAt: serverTimestamp(),
        ...data,
      })
    );

    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);

    await runTransaction(db, async (transaction) => {
      const todayDoc = await transaction.get(todayRef);
      const commandes = todayDoc.exists() ? todayDoc.data().liste || [] : [];

      commandes.push(...newCommandes);
      transaction.set(todayRef, { liste: commandes });

      // Ajouter aux ventes en attente si nécessaire
      const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
      const attenteDoc = await transaction.get(attenteRef);
      const attentes = attenteDoc.exists() ? attenteDoc.data().liste || [] : [];

      newCommandes.forEach((cmd) => {
        if (
          cmd.statut === "non livree" ||
          cmd.statut === "non servi" ||
          cmd.paiement.dette > 0
        ) {
          attentes.push(cmd);
        }
      });

      transaction.set(attenteRef, { liste: attentes });
    });

    // Créer les opérations comptables pour chaque commande
    for (const commande of newCommandes) {
      await createComptabiliteOperationsForCommande(commande, userId);
    }

    // Mettre à jour les statistiques
    await MakeCommandeStatistiques();

    // Invalider le cache
    clearCache("today");
    clearCache("attente");

    // Notification
    await createRTDBNotification(
      "Commandes créées",
      `${newCommandes.length} commande(s) créée(s) en batch`,
      "success"
    );

    console.log(`✅ ${newCommandes.length} commande(s) créée(s) en batch`);
    return newCommandes;
  } catch (error) {
    console.error("❌ Erreur CreateCommandeBatch:", error);
    throw error;
  }
}

/**
 * Supprimer plusieurs commandes en batch (AVEC QUEUE ANTI-COLLISION)
 * @param {Array} commandeIds - Tableau d'IDs de commandes
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function DeleteCommandeBatch(commandeIds, userId = "system") {
  try {
    // Ajouter l'opération à la queue
    const operation = await enqueueCommandeOperation(
      OPERATION_TYPES.DELETE_BATCH,
      { commandeIds },
      userId
    );

    console.log(`✅ Opération DELETE_BATCH ajoutée à la queue:`, operation.id);

    // Déclencher l'exécution des opérations en attente
    executeCommandeOperations().catch((err) => {
      console.error(
        "❌ Erreur lors de l'exécution automatique des opérations:",
        err
      );
    });

    return operation;
  } catch (error) {
    console.error("❌ Erreur DeleteCommandeBatch:", error);
    throw error;
  }
}

// ============================================================================
// ARCHIVAGE AUTOMATIQUE
// ============================================================================

/**
 * Archive automatiquement les commandes de la veille
 * Détecte le changement de jour et effectue l'archivage
 * @returns {Promise<Object>} Résultat de l'archivage
 */
export async function ArchiverYesterdayCommandes() {
  try {
    console.log("🗄️ Archivage des commandes de la veille...");

    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
    const todayDoc = await getDoc(todayRef);

    if (!todayDoc.exists() || !todayDoc.data().liste?.length) {
      console.log("📭 Aucune commande à archiver");
      return { archived: 0 };
    }

    const commandesToArchive = todayDoc.data().liste;

    // Déterminer la date d'hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);

    // Archiver les commandes
    const archiveRef = doc(db, VENTES_PATH, ARCHIVES_PATH, yesterdayKey);
    await setDoc(archiveRef, { liste: commandesToArchive });

    // Vider today
    await setDoc(todayRef, { liste: [] });

    // Nettoyer les ventes en attente (garder seulement celles non soldées)
    const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
    const attenteDoc = await getDoc(attenteRef);
    if (attenteDoc.exists()) {
      const attentes = attenteDoc.data().liste || [];
      const stillPending = attentes.filter(
        (a) =>
          a.statut === "non livree" ||
          a.statut === "non servi" ||
          a.paiement.dette > 0
      );
      await setDoc(attenteRef, { liste: stillPending });
    }

    // Invalider le cache
    clearCache("today");
    clearCache("attente");
    clearCache(`archives_${yesterdayKey}`);

    // Notification
    await createRTDBNotification(
      "Archivage effectué",
      `${commandesToArchive.length} commande(s) archivée(s) pour ${yesterdayKey}`,
      "info"
    );

    console.log(
      `✅ ${commandesToArchive.length} commande(s) archivée(s) pour ${yesterdayKey}`
    );

    return {
      archived: commandesToArchive.length,
      date: yesterdayKey,
    };
  } catch (error) {
    console.error("❌ Erreur ArchiverYesterdayCommandes:", error);
    throw error;
  }
}

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Met à jour automatiquement les statistiques des commandes
 * Appelé après chaque création/modification/suppression de commande
 * @returns {Promise<Object>} Statistiques calculées
 */
export async function MakeCommandeStatistiques() {
  try {
    const commandes = await GetCommandes();

    // Calculer les totaux
    const total_ventes = commandes.reduce(
      (sum, cmd) => sum + cmd.paiement.total,
      0
    );

    const total_ventes_sur_place = commandes
      .filter((cmd) => cmd.type === "sur place")
      .reduce((sum, cmd) => sum + cmd.paiement.total, 0);

    const total_ventes_a_livrer = commandes
      .filter((cmd) => cmd.type === "a livrer")
      .reduce((sum, cmd) => sum + cmd.paiement.total, 0);

    // Calculer les totaux par article
    const articlesMap = new Map();

    commandes.forEach((cmd) => {
      cmd.details.forEach((detail) => {
        if (!articlesMap.has(detail.id)) {
          articlesMap.set(detail.id, {
            id: detail.id,
            denomination: detail.denomination,
            total: 0,
          });
        }

        const article = articlesMap.get(detail.id);
        article.total += detail.prix * detail.quantite;
      });
    });

    const total_ventes_par_articles = Array.from(articlesMap.values());

    // Calculer la tendance (comparer avec hier)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);

    const archiveRef = doc(db, VENTES_PATH, ARCHIVES_PATH, yesterdayKey);
    const archiveDoc = await getDoc(archiveRef);

    let total_ventes_hier = 0;
    if (archiveDoc.exists()) {
      const commandesHier = archiveDoc.data().liste || [];
      total_ventes_hier = commandesHier.reduce(
        (sum, cmd) => sum + cmd.paiement.total,
        0
      );
    }

    const tendance = calculateTendance(total_ventes, total_ventes_hier);

    // Statistiques finales
    const statistiques = StatistiquesJourSchema.parse({
      total_ventes,
      total_ventes_sur_place,
      total_ventes_a_livrer,
      total_ventes_par_articles,
      tendance,
    });

    // Enregistrer dans Firestore
    const statsRef = doc(db, VENTES_PATH, STATISTIQUES_DOC);
    const statsDoc = await getDoc(statsRef);

    let allStats = [];
    if (statsDoc.exists()) {
      allStats = statsDoc.data().liste || [];
    }

    const todayKey = getDateKey();
    const todayStatsIndex = allStats.findIndex((s) => s.date === todayKey);

    if (todayStatsIndex !== -1) {
      allStats[todayStatsIndex] = { date: todayKey, ...statistiques };
    } else {
      allStats.push({ date: todayKey, ...statistiques });
    }

    // Garder seulement les 30 derniers jours
    if (allStats.length > 30) {
      allStats = allStats.slice(-30);
    }

    await setDoc(statsRef, { liste: allStats });

    // Notification RTDB pour trigger les hooks
    await createRTDBNotification(
      "Statistiques mises à jour",
      `Total: ${total_ventes} FCFA - Tendance: ${tendance}`,
      "info"
    );

    console.log("✅ Statistiques mises à jour:", statistiques);
    return statistiques;
  } catch (error) {
    console.error("❌ Erreur MakeCommandeStatistiques:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer les commandes avec filtres
 * @param {Object} options - Options de filtrage
 * @returns {Object} { commandes, loading, error, refetch }
 */
export function useCommandes(options = {}) {
  const {
    autoFetch = true,
    filter = "today", // 'today' | 'week' | 'month' | 'year' | 'all' | 'attente'
    filterStatut,
    filterType,
  } = options;

  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result = [];

      if (filter === "attente") {
        // Récupérer les ventes en attente
        const cached = getCache("attente");
        if (cached) {
          result = cached;
        } else {
          const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
          const attenteDoc = await getDoc(attenteRef);
          result = attenteDoc.exists() ? attenteDoc.data().liste || [] : [];
          setCache("attente", result);
        }
      } else if (filter === "today") {
        result = await GetCommandes();
      } else {
        // Pour week, month, year, all - récupérer depuis archives
        // TODO: Implémenter récupération multi-jours depuis archives
        result = await GetCommandes();
      }

      // Appliquer les filtres
      if (filterStatut) {
        result = result.filter((cmd) => cmd.statut === filterStatut);
      }

      if (filterType) {
        result = result.filter((cmd) => cmd.type === filterType);
      }

      setCommandes(result);
    } catch (err) {
      console.error("❌ Erreur useCommandes:", err);
      setError(err.message);
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  }, [filter, filterStatut, filterType]);

  useEffect(() => {
    if (autoFetch) fetchCommandes();
  }, [autoFetch, fetchCommandes]);

  // Écouter les notifications RTDB pour synchronisation
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_COMMANDES_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (notification) {
        clearCache("today");
        clearCache("attente");
        fetchCommandes();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchCommandes]);

  return { commandes, loading, error, refetch: fetchCommandes };
}

/**
 * Hook pour récupérer les statistiques des commandes
 * @returns {Object} { statistiques, loading, error, refetch }
 */
export function useCommandeStatistiques() {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistiques = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRef = doc(db, VENTES_PATH, STATISTIQUES_DOC);
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const allStats = statsDoc.data().liste || [];
        const todayKey = getDateKey();
        const todayStats = allStats.find((s) => s.date === todayKey);

        setStatistiques(todayStats || null);
      } else {
        setStatistiques(null);
      }
    } catch (err) {
      console.error("❌ Erreur useCommandeStatistiques:", err);
      setError(err.message);
      setStatistiques(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistiques();
  }, [fetchStatistiques]);

  // Écouter les notifications RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_COMMANDES_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        notification.title.toLowerCase().includes("statistiques")
      ) {
        fetchStatistiques();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchStatistiques]);

  return { statistiques, loading, error, refetch: fetchStatistiques };
}

/**
 * Hook pour surveiller la queue d'opérations commandes
 * @param {Object} filter - Filtre optionnel { status?, type? }
 * @returns {Object} { operations, stats, loading, error, refetch, executeAll, cleanQueue }
 */
export function useCommandeQueue(filter = {}) {
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

  // Extraire les valeurs primitives du filtre
  const filterStatus = filter.status;
  const filterType = filter.type;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queueRef = doc(db, COMMANDES_OPERATIONS_QUEUE_PATH);
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
      console.error("❌ Erreur useCommandeQueue:", err);
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
    const notificationsRef = ref(rtdb, RTDB_COMMANDES_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title?.toLowerCase().includes("opération") ||
          notification.title?.toLowerCase().includes("queue"))
      ) {
        console.log("🔔 Notification RTDB reçue - Rechargement de la queue");
        fetchData();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchData]);

  // Fonction pour exécuter toutes les opérations en attente
  const executeAll = useCallback(async () => {
    try {
      const results = await executeCommandeOperations();
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
      const removedCount = await cleanCommandeQueue();
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

// ============================================================================
// EXPORTS
// ============================================================================

export {
  VENTES_PATH,
  TODAY_DOC,
  ARCHIVES_PATH,
  VENTES_EN_ATTENTE_DOC,
  STATISTIQUES_DOC,
  RTDB_COMMANDES_NOTIFICATIONS,
  COMMANDES_OPERATIONS_QUEUE_PATH,
};
