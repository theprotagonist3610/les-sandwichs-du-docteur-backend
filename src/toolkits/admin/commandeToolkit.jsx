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
 * GESTION DES ADRESSES DE LIVRAISON:
 *  - Pour les commandes "a livrer", le champ adresse_livraison est REQUIS
 *  - Structure: { id: string, description?: string }
 *    - id: référence vers une adresse dans adresseToolkit (département, commune, quartier, localisation GPS)
 *    - description: texte libre pour précisions supplémentaires (ex: "Porte bleue", "3ème étage", etc.)
 *  - Le livreur récupère l'adresse complète via l'ID et utilise la description pour la précision finale
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
} from "firebase/firestore";
import { ref, push, onChildAdded, off } from "firebase/database";
import { db, rtdb } from "@/firebase";

// Import du nouveau système de comptabilité modulaire
import {
  createOperationWithQueue,
  creerOperation,
  formatDayKey,
  getAllComptesTresorerie,
  findCompteByCodeOhada,
} from "./comptabiliteToolkit";

// ============================================================================
// CONSTANTES (définies avant les schémas qui les utilisent)
// ============================================================================

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

const AdresseLivraisonSchema = z.object({
  id: z.string().min(1, "ID de l'adresse requis"),
  description: z.string().optional(), // Description libre pour préciser l'adresse
});

const PaiementSchema = z.object({
  total: z.number().nonnegative("Total doit être positif ou zéro"),
  livraison: z
    .number()
    .nonnegative("Frais de livraison doivent être positifs ou zéro")
    .default(0),
  montant_total_recu: z
    .number()
    .nonnegative("Montant reçu doit être positif ou zéro"),
  monnaie_rendue: z
    .number()
    .nonnegative("Monnaie rendue doit être positive ou zéro")
    .default(0),
  montant_momo_recu: z
    .number()
    .nonnegative("Montant Mobile Money doit être positif ou zéro")
    .default(0),
  montant_espece_recu: z
    .number()
    .nonnegative("Montant espèces doit être positif ou zéro")
    .default(0),
  reduction: z
    .number()
    .nonnegative("Réduction doit être positive ou zéro")
    .default(0),
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

const StatutSchema = z.enum([
  "livree",
  "non livree",
  "servi",
  "non servi",
  "annulee",
]);
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
  adresse_livraison: AdresseLivraisonSchema.optional(),
  paiement: PaiementSchema,
  incident: z.string().optional(),
  commentaire: z.string().optional(),
}).refine((data) => {
  // Validation: si type "a livrer", adresse_livraison est requise
  if (data.type === "a livrer") {
    return !!data.adresse_livraison;
  }
  return true;
}, {
  message: "L'adresse de livraison est requise pour les commandes à livrer",
  path: ["adresse_livraison"]
});

const StatistiquesJourSchema = z.object({
  date: z.string().optional(),
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
  total_ventes_par_vendeur: z
    .array(
      z.object({
        userId: z.string(),
        nom: z.string(),
        total_commandes: z.number(),
        total_ventes: z.number(),
      })
    )
    .default([])
    .optional(),
  encaissements: z
    .object({
      especes: z.number().default(0),
      momo: z.number().default(0),
      total: z.number().default(0),
    })
    .optional(),
  nombre_commandes: z.number().default(0).optional(),
  tendance: z.enum(["hausse", "baisse", "stable"]).default("stable"),
  tendance_pourcentage: z.number().default(0).optional(),
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
  const currentDateKey = formatDayKey();

  if (lastDateKey !== currentDateKey) {
    localStorage.setItem("last_commandes_date", currentDateKey);
    return lastDateKey !== null; // true si ce n'est pas la première fois
  }

  return false;
}

/**
 * Génère une clé de date au format DDMMYYYY (alias pour compatibilité)
 */
function getDateKey(date = new Date()) {
  return formatDayKey(date);
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
  const variation =
    ((totalToday - totalYesterday) / (totalYesterday || 1)) * 100;

  if (variation > 5) return "hausse";
  if (variation < -5) return "baisse";
  return "stable";
}

// ============================================================================
// INTÉGRATION COMPTABILITÉ - DÉTECTION AUTOMATIQUE CODE OHADA
// ============================================================================

/**
 * Crée automatiquement les opérations comptables pour une commande
 * Utilise le nouveau système modulaire avec queue anti-collision
 * @param {Object} commande - La commande créée
 * @param {string} userId - ID de l'utilisateur
 */
async function createComptabiliteOperationsForCommande(commande, userId) {
  try {
    const { paiement } = commande;

    // Vérifier si le module comptabilité est disponible
    if (!createOperationWithQueue || typeof createOperationWithQueue !== 'function') {
      console.log(
        `ℹ️ Module comptabilité non disponible - Opérations comptables ignorées pour commande ${commande.id}`
      );
      return;
    }

    // Récupérer les comptes de trésorerie pour obtenir les IDs réels
    let comptesTreesorerie = [];
    try {
      const result = await getAllComptesTresorerie();
      comptesTreesorerie = result.comptes || [];
    } catch (error) {
      console.warn("⚠️ Impossible de récupérer les comptes de trésorerie:", error.message);
    }

    // Trouver le compte OHADA pour les ventes (701 - Vente de produits finis)
    let compteVenteId = null;
    try {
      const compteVente = await findCompteByCodeOhada(CODE_VENTE_PRODUITS_FINIS);
      compteVenteId = compteVente?.id;
    } catch (error) {
      console.warn("⚠️ Compte vente 701 non trouvé:", error.message);
      return; // Arrêter si le compte de vente n'existe pas
    }

    if (!compteVenteId) {
      console.warn("⚠️ Impossible de créer les opérations comptables: compte de vente introuvable");
      return;
    }

    // Trouver les comptes de trésorerie par code OHADA
    const compteCaisse = comptesTreesorerie.find(c => c.code_ohada === "531");
    const compteMomo = comptesTreesorerie.find(c => c.code_ohada === "5121");

    const operations = [];

    // 1. Enregistrer les recettes en espèces (Caisse - 531)
    if (paiement.montant_espece_recu > 0 && compteCaisse) {
      operations.push({
        compte_id: compteVenteId,
        montant: paiement.montant_espece_recu,
        motif: `Vente commande ${commande.id} - ${commande.client.nom} - Espèces`,
        type_operation: "entree",
      });
    }

    // 2. Enregistrer les recettes Mobile Money (5121)
    if (paiement.montant_momo_recu > 0 && compteMomo) {
      operations.push({
        compte_id: compteVenteId,
        montant: paiement.montant_momo_recu,
        motif: `Vente commande ${commande.id} - ${commande.client.nom} - Mobile Money`,
        type_operation: "entree",
      });
    }

    // 3. Enregistrer la dette si présente (Compte Client - 411)
    if (paiement.dette > 0) {
      try {
        const compteClient = await findCompteByCodeOhada(CODE_COMPTE_CLIENT);
        if (compteClient) {
          operations.push({
            compte_id: compteClient.id,
            montant: paiement.dette,
            motif: `Dette commande ${commande.id} - Client: ${commande.client.nom}`,
            type_operation: "entree",
          });
        }
      } catch (error) {
        console.warn("⚠️ Compte client 411 non trouvé:", error.message);
      }
    }

    // Si aucune opération à créer, sortir
    if (operations.length === 0) {
      console.log(`ℹ️ Aucune opération comptable à créer pour commande ${commande.id}`);
      return;
    }

    // Créer toutes les opérations comptables avec le système de queue
    const results = await Promise.allSettled(
      operations.map((operationData) => createOperationWithQueue(operationData, userId))
    );

    // Compter les succès et échecs
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (succeeded > 0) {
      console.log(
        `✅ ${succeeded} opération(s) comptable(s) ajoutée(s) à la queue pour commande ${commande.id}`
      );
    }

    if (failed > 0) {
      console.warn(
        `⚠️ ${failed} opération(s) comptable(s) échouée(s) pour commande ${commande.id}`
      );
      // Afficher les erreurs en détail
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(
            `  - Opération ${index + 1}: ${result.reason?.message || result.reason}`
          );
        }
      });
    }
  } catch (error) {
    console.error(
      "❌ Erreur création opérations comptables pour commande:",
      error.message || error
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
export async function enqueueCommandeOperation(
  type,
  payload,
  userId = "system"
) {
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

            // NE PAS créer les opérations comptables lors de la création
            // Elles seront créées uniquement lors de la clôture de la commande
            // (voir UPDATE ci-dessous)
          } else if (type === OPERATION_TYPES.UPDATE) {
            // UPDATE: Modifier une commande existante
            const { commandeId, updates } = payload;
            const index = commandes.findIndex((c) => c.id === commandeId);

            if (index === -1) {
              throw new Error(`Commande ${commandeId} non trouvée`);
            }

            const oldCommande = commandes[index];
            const wasNotClosed =
              oldCommande.statut === "non livree" ||
              oldCommande.statut === "non servi";

            commandes[index] = {
              ...commandes[index],
              ...updates,
              updatedBy: operation.userId,
              updatedAt: now,
            };

            // Mettre à jour dans attentes
            const attenteIndex = attentes.findIndex((a) => a.id === commandeId);
            const updatedCommande = commandes[index];

            const isNowClosed =
              updatedCommande.statut === "livree" ||
              updatedCommande.statut === "servi" ||
              updatedCommande.statut === "annulee";

            // Si la commande vient d'être clôturée, créer les opérations comptables
            if (wasNotClosed && isNowClosed) {
              operationInQueue._pendingComptaOps = updatedCommande;
            }

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
            operationInQueue.retryCount =
              (operationInQueue.retryCount || 0) + 1;
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
            await deleteComptabiliteOperationsForCommande(
              cmdId,
              operation.userId
            );
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

      // Garder UNIQUEMENT les opérations pending, processing et failed (pour analyse)
      // Supprimer seulement les opérations completed
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
        createdAt: Date.now(),
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
 *
 * COMPORTEMENT:
 * - Les commandes CLÔTURÉES (livree/servi/annulee) sont archivées
 * - Les commandes NON CLÔTURÉES (non livree/non servi) sont REPORTÉES dans le nouveau "today"
 * - Les commandes avec dette restent aussi dans ventes_en_attente
 *
 * @returns {Promise<Object>} Résultat de l'archivage
 */
export async function ArchiverYesterdayCommandes() {
  try {
    console.log("🗄️ Archivage des commandes de la veille...");

    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
    const todayDoc = await getDoc(todayRef);

    if (!todayDoc.exists() || !todayDoc.data().liste?.length) {
      console.log("📭 Aucune commande à archiver");
      return { archived: 0, carried: 0 };
    }

    const allCommandes = todayDoc.data().liste;

    // Séparer les commandes clôturées et non clôturées
    const commandesCloturees = allCommandes.filter(
      (cmd) =>
        cmd.statut === "livree" ||
        cmd.statut === "servi" ||
        cmd.statut === "annulee"
    );

    const commandesNonCloturees = allCommandes.filter(
      (cmd) => cmd.statut === "non livree" || cmd.statut === "non servi"
    );

    // Déterminer la date d'hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);

    // 1. Archiver UNIQUEMENT les commandes clôturées
    if (commandesCloturees.length > 0) {
      const archiveRef = doc(db, VENTES_PATH, ARCHIVES_PATH, yesterdayKey);
      await setDoc(archiveRef, { liste: commandesCloturees });
      console.log(`📦 ${commandesCloturees.length} commande(s) clôturée(s) archivée(s)`);
    }

    // 2. Reporter les commandes non clôturées dans le nouveau "today"
    await setDoc(todayRef, { liste: commandesNonCloturees });
    if (commandesNonCloturees.length > 0) {
      console.log(
        `📋 ${commandesNonCloturees.length} commande(s) non clôturée(s) reportée(s) au nouveau jour`
      );
    }

    // 3. Nettoyer les ventes en attente (garder seulement celles non clôturées ou avec dette)
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
      console.log(`⏳ ${stillPending.length} commande(s) toujours en attente`);
    }

    // Invalider le cache
    clearCache("today");
    clearCache("attente");
    clearCache(`archives_${yesterdayKey}`);

    // Notification
    const message =
      commandesNonCloturees.length > 0
        ? `${commandesCloturees.length} archivée(s), ${commandesNonCloturees.length} reportée(s)`
        : `${commandesCloturees.length} commande(s) archivée(s)`;

    await createRTDBNotification("Archivage effectué", message, "info");

    console.log(
      `✅ Archivage terminé pour ${yesterdayKey}: ${commandesCloturees.length} archivée(s), ${commandesNonCloturees.length} reportée(s)`
    );

    return {
      archived: commandesCloturees.length,
      carried: commandesNonCloturees.length,
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

    // Calculer les totaux par article (en nombre d'articles vendus, pas en valeur)
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
        article.total += detail.quantite; // ✅ Nombre d'articles vendus (pas prix × quantité)
      });
    });

    const total_ventes_par_articles = Array.from(articlesMap.values());

    // Calculer les encaissements
    const encaissements = commandes.reduce(
      (acc, cmd) => {
        acc.especes += cmd.paiement.montant_espece_recu || 0;
        acc.momo += cmd.paiement.montant_momo_recu || 0;
        return acc;
      },
      { especes: 0, momo: 0, total: 0 }
    );
    encaissements.total = encaissements.especes + encaissements.momo;

    // Calculer le nombre de commandes
    const nombre_commandes = commandes.length;

    // Calculer les ventes par vendeur
    const vendeursMap = new Map();
    commandes.forEach((cmd) => {
      if (!vendeursMap.has(cmd.createdBy)) {
        vendeursMap.set(cmd.createdBy, {
          userId: cmd.createdBy,
          nom: cmd.createdBy, // Sera enrichi avec le nom réel côté frontend
          total_commandes: 0,
          total_ventes: 0,
        });
      }

      const vendeur = vendeursMap.get(cmd.createdBy);
      vendeur.total_commandes += 1;
      vendeur.total_ventes += cmd.paiement.total;
    });

    const total_ventes_par_vendeur = Array.from(vendeursMap.values());

    // Calculer la tendance (comparer avec hier)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);

    const archiveRef = doc(db, VENTES_PATH, ARCHIVES_PATH, yesterdayKey);
    const archiveDoc = await getDoc(archiveRef);

    let total_ventes_hier = 0;
    let encaissements_hier = { especes: 0, momo: 0, total: 0 };
    if (archiveDoc.exists()) {
      const commandesHier = archiveDoc.data().liste || [];
      total_ventes_hier = commandesHier.reduce(
        (sum, cmd) => sum + cmd.paiement.total,
        0
      );

      // Calculer les encaissements d'hier
      encaissements_hier = commandesHier.reduce(
        (acc, cmd) => {
          acc.especes += cmd.paiement.montant_espece_recu || 0;
          acc.momo += cmd.paiement.montant_momo_recu || 0;
          return acc;
        },
        { especes: 0, momo: 0, total: 0 }
      );
      encaissements_hier.total = encaissements_hier.especes + encaissements_hier.momo;
    }

    const tendance = calculateTendance(total_ventes, total_ventes_hier);

    // Calculer le pourcentage de tendance
    let tendance_pourcentage = 0;
    if (total_ventes_hier > 0) {
      tendance_pourcentage = ((total_ventes - total_ventes_hier) / total_ventes_hier) * 100;
    } else if (total_ventes > 0) {
      tendance_pourcentage = 100; // 100% d'augmentation si hier était 0
    }

    // Statistiques finales
    const statistiques = StatistiquesJourSchema.parse({
      total_ventes,
      total_ventes_sur_place,
      total_ventes_a_livrer,
      total_ventes_par_articles,
      total_ventes_par_vendeur,
      encaissements,
      nombre_commandes,
      tendance,
      tendance_pourcentage: Math.round(tendance_pourcentage * 10) / 10, // Arrondir à 1 décimale
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
 * Détecte automatiquement le changement de jour et archive les commandes clôturées
 * @returns {Object} { statistiques, loading, error, refetch, isArchiving }
 */
export function useCommandeStatistiques() {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [lastCheckedDay, setLastCheckedDay] = useState(getDateKey());

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

  // Vérifier le changement de jour et archiver si nécessaire
  const checkAndArchiveIfNewDay = useCallback(async () => {
    const currentDay = getDateKey();

    if (currentDay !== lastCheckedDay) {
      console.log(`🔔 Détection d'un nouveau jour: ${lastCheckedDay} → ${currentDay}`);
      setIsArchiving(true);

      try {
        // Archiver les commandes de la veille
        const result = await ArchiverYesterdayCommandes();
        console.log(
          `✅ Archivage automatique: ${result.archived} commande(s) archivée(s), ${result.carried} reportée(s)`
        );

        // Nettoyage automatique de la queue
        await autoCleanCommandeQueue();

        // Mettre à jour les statistiques
        await MakeCommandeStatistiques();

        // Mettre à jour la date de dernière vérification
        setLastCheckedDay(currentDay);

        // Rafraîchir les statistiques
        await fetchStatistiques();
      } catch (err) {
        console.error("❌ Erreur lors de l'archivage automatique:", err);
        // Ne pas bloquer l'application si l'archivage échoue
      } finally {
        setIsArchiving(false);
      }
    }
  }, [lastCheckedDay, fetchStatistiques]);

  // Fetch initial
  useEffect(() => {
    fetchStatistiques();
  }, [fetchStatistiques]);

  // Vérifier le changement de jour toutes les minutes
  useEffect(() => {
    // Vérification initiale
    checkAndArchiveIfNewDay();

    // Vérifier toutes les minutes (60000 ms)
    const intervalId = setInterval(() => {
      checkAndArchiveIfNewDay();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkAndArchiveIfNewDay]);

  // Écouter les notifications RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_COMMANDES_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title.toLowerCase().includes("statistiques") ||
          notification.title.toLowerCase().includes("archivage"))
      ) {
        fetchStatistiques();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchStatistiques]);

  return {
    statistiques,
    loading,
    error,
    isArchiving,
    refetch: fetchStatistiques
  };
}

/**
 * Hook pour récupérer les statistiques de la semaine (7 derniers jours)
 * @returns {Object} { statistiquesWeek, loading, error }
 */
export function useCommandeStatistiquesWeek() {
  const [statistiquesWeek, setStatistiquesWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistiquesWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRef = doc(db, VENTES_PATH, STATISTIQUES_DOC);
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const allStats = statsDoc.data().liste || [];

        // Récupérer les 7 derniers jours
        const last7Days = allStats.slice(-7);
        setStatistiquesWeek(last7Days);
      } else {
        setStatistiquesWeek([]);
      }
    } catch (err) {
      console.error("❌ Erreur useCommandeStatistiquesWeek:", err);
      setError(err.message);
      setStatistiquesWeek([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistiquesWeek();
  }, [fetchStatistiquesWeek]);

  // Écouter les notifications RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_COMMANDES_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        notification.title.toLowerCase().includes("statistiques")
      ) {
        fetchStatistiquesWeek();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchStatistiquesWeek]);

  return { statistiquesWeek, loading, error, refetch: fetchStatistiquesWeek };
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
// HOOKS AVANCÉS - ANALYSES DÉTAILLÉES
// ============================================================================

/**
 * Hook pour récupérer les détails d'un produit spécifique avec analyses
 * @param {string} productId - ID du produit
 * @param {number} days - Nombre de jours d'historique (défaut: 7)
 * @returns {Object} { productStats, loading, error, refetch }
 */
export function useProductDetails(productId, days = 7) {
  const [productStats, setProductStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductDetails = useCallback(async () => {
    if (!productId) {
      setProductStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Récupérer les statistiques de la semaine
      const statsRef = doc(db, VENTES_PATH, STATISTIQUES_DOC);
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) {
        setProductStats(null);
        setLoading(false);
        return;
      }

      const allStats = statsDoc.data().liste || [];
      const lastDaysStats = allStats.slice(-days);

      // Calculer les données du produit
      let totalQuantity = 0;
      let totalRevenue = 0;
      let dailySales = [];
      let productName = "";

      lastDaysStats.forEach((dayStat) => {
        const productInDay = dayStat.total_ventes_par_articles?.find(
          (article) => article.id === productId
        );

        if (productInDay) {
          totalQuantity += productInDay.total;
          productName = productInDay.denomination;

          dailySales.push({
            date: dayStat.date,
            quantity: productInDay.total,
          });
        } else {
          dailySales.push({
            date: dayStat.date,
            quantity: 0,
          });
        }
      });

      // Calcul du prix moyen (approximatif à partir du CA total)
      const avgPrice = totalQuantity > 0 ? Math.round(totalRevenue / totalQuantity) : 0;

      // Tendance (comparaison dernière période vs période précédente)
      const midPoint = Math.floor(dailySales.length / 2);
      const firstHalf = dailySales.slice(0, midPoint);
      const secondHalf = dailySales.slice(midPoint);

      const avgFirstHalf = firstHalf.reduce((sum, d) => sum + d.quantity, 0) / firstHalf.length;
      const avgSecondHalf = secondHalf.reduce((sum, d) => sum + d.quantity, 0) / secondHalf.length;

      const trend = avgSecondHalf > avgFirstHalf ? "hausse" : avgSecondHalf < avgFirstHalf ? "baisse" : "stable";
      const trendPercentage = avgFirstHalf > 0
        ? ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100
        : 0;

      setProductStats({
        id: productId,
        name: productName || "Produit inconnu",
        totalQuantity,
        totalRevenue,
        avgPrice,
        dailySales,
        trend,
        trendPercentage,
        days,
      });
    } catch (err) {
      console.error("❌ Erreur useProductDetails:", err);
      setError(err.message);
      setProductStats(null);
    } finally {
      setLoading(false);
    }
  }, [productId, days]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  return { productStats, loading, error, refetch: fetchProductDetails };
}

/**
 * Hook pour l'analyse ABC des produits (Principe de Pareto)
 * Catégorie A : Top 20% des produits qui génèrent 80% du CA
 * Catégorie B : 30% des produits qui génèrent 15% du CA
 * Catégorie C : 50% des produits qui génèrent 5% du CA
 * @returns {Object} { analysis, loading, error }
 */
export function useABCAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        const { statistiques } = await (async () => {
          const statsRef = doc(db, VENTES_PATH, STATISTIQUES_DOC);
          const statsDoc = await getDoc(statsRef);
          if (!statsDoc.exists()) return { statistiques: null };

          const allStats = statsDoc.data().liste || [];
          const todayKey = getDateKey();
          const todayStats = allStats.find((s) => s.date === todayKey);
          return { statistiques: todayStats };
        })();

        if (!statistiques || !statistiques.total_ventes_par_articles) {
          setAnalysis({ categoryA: [], categoryB: [], categoryC: [] });
          setLoading(false);
          return;
        }

        // Trier par quantité vendue (décroissant)
        const sortedProducts = [...statistiques.total_ventes_par_articles]
          .sort((a, b) => b.total - a.total);

        const totalQuantity = sortedProducts.reduce((sum, p) => sum + p.total, 0);

        let cumulativeQuantity = 0;
        const categoryA = [];
        const categoryB = [];
        const categoryC = [];

        sortedProducts.forEach((product) => {
          cumulativeQuantity += product.total;
          const percentage = (cumulativeQuantity / totalQuantity) * 100;

          const productWithMetrics = {
            ...product,
            percentage: ((product.total / totalQuantity) * 100).toFixed(1),
            cumulativePercentage: percentage.toFixed(1),
          };

          if (percentage <= 80) {
            categoryA.push({ ...productWithMetrics, category: "A" });
          } else if (percentage <= 95) {
            categoryB.push({ ...productWithMetrics, category: "B" });
          } else {
            categoryC.push({ ...productWithMetrics, category: "C" });
          }
        });

        setAnalysis({ categoryA, categoryB, categoryC });
      } catch (err) {
        console.error("❌ Erreur useABCAnalysis:", err);
        setError(err.message);
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  return { analysis, loading, error };
}

/**
 * Hook pour analyser les finances en profondeur (paiements, crédit, tarifs moyens)
 * @param {number} days - Nombre de jours à analyser (défaut: 7)
 */
export function useFinanceAnalysis(days = 7) {
  const [financeStats, setFinanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFinanceAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = {
        totalCA: 0,
        totalCommandes: 0,
        tarif_moyen: 0,
        modes_paiement: {
          especes: 0,
          momo: 0,
          credit: 0,
        },
        evolution_tarif_moyen: [],
        evolution_ca: [],
        jours_semaine: {
          lundi: { ca: 0, commandes: 0, tarif_moyen: 0 },
          mardi: { ca: 0, commandes: 0, tarif_moyen: 0 },
          mercredi: { ca: 0, commandes: 0, tarif_moyen: 0 },
          jeudi: { ca: 0, commandes: 0, tarif_moyen: 0 },
          vendredi: { ca: 0, commandes: 0, tarif_moyen: 0 },
          samedi: { ca: 0, commandes: 0, tarif_moyen: 0 },
          dimanche: { ca: 0, commandes: 0, tarif_moyen: 0 },
        },
        meilleur_jour: "",
        pic_ca: { date: "", montant: 0 },
        trend: "stable",
        trendPercentage: 0,
        days,
      };

      const today = new Date();
      const dailyData = [];
      const joursNoms = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

      // Récupérer les données des N derniers jours
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayKey = getDateKey(date);
        const jourSemaine = joursNoms[date.getDay()];

        // Essayer d'abord les archives
        let commandes = [];
        const archiveRef = doc(db, VENTES_PATH, ARCHIVES_PATH, dayKey);
        const archiveDoc = await getDoc(archiveRef);

        if (archiveDoc.exists()) {
          commandes = archiveDoc.data().liste || [];
        } else if (i === 0) {
          // Si c'est aujourd'hui, récupérer depuis today
          const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
          const todayDoc = await getDoc(todayRef);
          if (todayDoc.exists()) {
            commandes = todayDoc.data().liste || [];
          }
        }

        // Analyser les commandes du jour
        let caJour = 0;
        let nbCommandes = commandes.length;
        let especes = 0;
        let momo = 0;
        let credit = 0;

        commandes.forEach((cmd) => {
          const total = cmd.paiement?.total || 0;
          caJour += total;

          especes += cmd.paiement?.montant_espece_recu || 0;
          momo += cmd.paiement?.montant_momo_recu || 0;
          credit += cmd.paiement?.dette || 0;
        });

        stats.totalCA += caJour;
        stats.totalCommandes += nbCommandes;
        stats.modes_paiement.especes += especes;
        stats.modes_paiement.momo += momo;
        stats.modes_paiement.credit += credit;

        // Mettre à jour les stats par jour de la semaine
        if (stats.jours_semaine[jourSemaine]) {
          stats.jours_semaine[jourSemaine].ca += caJour;
          stats.jours_semaine[jourSemaine].commandes += nbCommandes;
        }

        const tarifMoyen = nbCommandes > 0 ? caJour / nbCommandes : 0;

        dailyData.push({
          date: dayKey,
          ca: caJour,
          commandes: nbCommandes,
          tarif_moyen: tarifMoyen,
          especes,
          momo,
          credit,
        });

        // Tracker le pic de CA
        if (caJour > stats.pic_ca.montant) {
          stats.pic_ca.montant = caJour;
          stats.pic_ca.date = dayKey;
        }
      }

      stats.evolution_tarif_moyen = dailyData.map(d => ({ date: d.date, value: d.tarif_moyen }));
      stats.evolution_ca = dailyData.map(d => ({ date: d.date, value: d.ca }));

      // Calculer le tarif moyen global
      stats.tarif_moyen = stats.totalCommandes > 0
        ? stats.totalCA / stats.totalCommandes
        : 0;

      // Calculer tarif moyen par jour de semaine
      Object.keys(stats.jours_semaine).forEach(jour => {
        const j = stats.jours_semaine[jour];
        j.tarif_moyen = j.commandes > 0 ? j.ca / j.commandes : 0;
      });

      // Trouver le meilleur jour de la semaine
      let maxCA = 0;
      Object.entries(stats.jours_semaine).forEach(([jour, data]) => {
        if (data.ca > maxCA) {
          maxCA = data.ca;
          stats.meilleur_jour = jour;
        }
      });

      // Calculer la tendance (première moitié vs deuxième moitié)
      const midPoint = Math.floor(dailyData.length / 2);
      const firstHalf = dailyData.slice(0, midPoint);
      const secondHalf = dailyData.slice(midPoint);

      const avgFirst = firstHalf.reduce((sum, d) => sum + d.ca, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, d) => sum + d.ca, 0) / secondHalf.length;

      if (avgSecond > avgFirst * 1.1) {
        stats.trend = "hausse";
      } else if (avgSecond < avgFirst * 0.9) {
        stats.trend = "baisse";
      }

      stats.trendPercentage = avgFirst > 0
        ? ((avgSecond - avgFirst) / avgFirst) * 100
        : 0;

      setFinanceStats(stats);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur fetch finance analysis:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchFinanceAnalysis();
  }, [fetchFinanceAnalysis]);

  return {
    financeStats,
    loading,
    error,
    refetch: fetchFinanceAnalysis,
  };
}

/**
 * Hook pour analyser un mode de paiement spécifique
 * @param {string} methodId - "especes" | "momo" | "credit"
 * @param {number} days - Nombre de jours à analyser
 */
export function usePaymentMethodAnalysis(methodId, days = 7) {
  const [methodStats, setMethodStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMethodAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = {
        methodId,
        methodName:
          methodId === "especes"
            ? "Espèces"
            : methodId === "momo"
            ? "Mobile Money"
            : "Crédit",
        totalMontant: 0,
        totalCommandes: 0,
        pourcentageTotal: 0,
        evolution: [], // { date, montant, pourcentage }
        jours_semaine: {
          lundi: { montant: 0, commandes: 0, pourcentage: 0 },
          mardi: { montant: 0, commandes: 0, pourcentage: 0 },
          mercredi: { montant: 0, commandes: 0, pourcentage: 0 },
          jeudi: { montant: 0, commandes: 0, pourcentage: 0 },
          vendredi: { montant: 0, commandes: 0, pourcentage: 0 },
          samedi: { montant: 0, commandes: 0, pourcentage: 0 },
          dimanche: { montant: 0, commandes: 0, pourcentage: 0 },
        },
        meilleur_jour: "",
        pic: { date: "", montant: 0, pourcentage: 0 },
        trend: "stable",
        trendPercentage: 0,
        days,
      };

      const joursNoms = [
        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
      ];
      const today = new Date();
      let totalCA = 0;

      // Collecter les données sur N jours
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const dayKey = `${String(date.getDate()).padStart(2, "0")}${String(
          date.getMonth() + 1
        ).padStart(2, "0")}${date.getFullYear()}`;

        let commandes = [];

        // Essayer d'abord les archives
        if (i > 0) {
          const archiveRef = doc(db, `${VENTES_PATH}/${ARCHIVES_PATH}/${dayKey}`);
          const archiveDoc = await getDoc(archiveRef);
          if (archiveDoc.exists()) {
            commandes = archiveDoc.data()?.liste || [];
          }
        } else {
          // Aujourd'hui
          const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
          const todayDoc = await getDoc(todayRef);
          if (todayDoc.exists()) {
            commandes = todayDoc.data()?.liste || [];
          }
        }

        // Analyser les commandes du jour
        let montantJour = 0;
        let caJour = 0;
        let commandesJour = 0;

        commandes.forEach((cmd) => {
          const paiement = cmd.paiement || {};
          const total = paiement.total || 0;
          caJour += total;
          commandesJour++;

          if (methodId === "especes") {
            montantJour += paiement.montant_espece_recu || 0;
          } else if (methodId === "momo") {
            montantJour += paiement.montant_momo_recu || 0;
          } else if (methodId === "credit") {
            montantJour += paiement.dette || 0;
          }
        });

        stats.totalMontant += montantJour;
        stats.totalCommandes += commandesJour;
        totalCA += caJour;

        // Calculer le pourcentage du jour
        const pourcentageJour = caJour > 0 ? (montantJour / caJour) * 100 : 0;

        // Ajouter à l'évolution
        stats.evolution.push({
          date: `${String(date.getDate()).padStart(2, "0")}/${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`,
          montant: montantJour,
          pourcentage: pourcentageJour,
        });

        // Mettre à jour le pic
        if (montantJour > stats.pic.montant) {
          stats.pic = {
            date: `${String(date.getDate()).padStart(2, "0")}/${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`,
            montant: montantJour,
            pourcentage: pourcentageJour,
          };
        }

        // Mettre à jour les statistiques par jour de semaine
        const jourNom = joursNoms[date.getDay()];
        stats.jours_semaine[jourNom].montant += montantJour;
        stats.jours_semaine[jourNom].commandes += commandesJour;
      }

      // Calculer le pourcentage total
      stats.pourcentageTotal =
        totalCA > 0 ? (stats.totalMontant / totalCA) * 100 : 0;

      // Calculer le pourcentage par jour de semaine
      Object.keys(stats.jours_semaine).forEach((jour) => {
        const jourStats = stats.jours_semaine[jour];
        // Le pourcentage est déjà inclus dans l'évolution quotidienne
        // Ici on calcule juste la moyenne
        const joursData = stats.evolution.filter((e) => {
          const date = new Date();
          const [day, month] = e.date.split("/");
          date.setDate(parseInt(day));
          date.setMonth(parseInt(month) - 1);
          return joursNoms[date.getDay()] === jour;
        });

        if (joursData.length > 0) {
          jourStats.pourcentage =
            joursData.reduce((sum, d) => sum + d.pourcentage, 0) /
            joursData.length;
        }
      });

      // Trouver le meilleur jour
      let maxMontant = 0;
      Object.keys(stats.jours_semaine).forEach((jour) => {
        if (stats.jours_semaine[jour].montant > maxMontant) {
          maxMontant = stats.jours_semaine[jour].montant;
          stats.meilleur_jour = jour;
        }
      });

      // Calculer la tendance (première moitié vs seconde moitié)
      if (stats.evolution.length > 1) {
        const mid = Math.floor(stats.evolution.length / 2);
        const firstHalf = stats.evolution
          .slice(0, mid)
          .reduce((sum, d) => sum + d.montant, 0);
        const secondHalf = stats.evolution
          .slice(mid)
          .reduce((sum, d) => sum + d.montant, 0);

        const avgFirst = firstHalf / mid;
        const avgSecond = secondHalf / (stats.evolution.length - mid);

        if (avgSecond > avgFirst * 1.05) {
          stats.trend = "hausse";
          stats.trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        } else if (avgSecond < avgFirst * 0.95) {
          stats.trend = "baisse";
          stats.trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        }
      }

      setMethodStats(stats);
    } catch (err) {
      console.error("Erreur lors de l'analyse du mode de paiement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [methodId, days]);

  useEffect(() => {
    fetchMethodAnalysis();
  }, [fetchMethodAnalysis]);

  return {
    methodStats,
    loading,
    error,
    refetch: fetchMethodAnalysis,
  };
}

/**
 * Hook pour analyser les performances globales des vendeurs
 * @param {number} days - Nombre de jours à analyser (par défaut 30)
 * @returns {Object} - { vendeurs, loading, error, refetch, summary }
 */
export function useVendeursAnalytics(days = 30) {
  const [vendeurs, setVendeurs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendeursAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const vendeursMap = new Map();
      const today = new Date();
      let totalVentes = 0;
      let totalCommandes = 0;

      // Parcourir les N derniers jours
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const dayKey = `${String(date.getDate()).padStart(2, "0")}${String(
          date.getMonth() + 1
        ).padStart(2, "0")}${date.getFullYear()}`;

        let commandes = [];

        // Récupérer les commandes (archives ou today)
        if (i > 0) {
          const archiveRef = doc(db, `${VENTES_PATH}/${ARCHIVES_PATH}/${dayKey}`);
          const archiveDoc = await getDoc(archiveRef);
          if (archiveDoc.exists()) {
            commandes = archiveDoc.data()?.liste || [];
          }
        } else {
          const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
          const todayDoc = await getDoc(todayRef);
          if (todayDoc.exists()) {
            commandes = todayDoc.data()?.liste || [];
          }
        }

        // Agréger par vendeur
        commandes.forEach((cmd) => {
          const vendeurId = cmd.createdBy;
          if (!vendeursMap.has(vendeurId)) {
            vendeursMap.set(vendeurId, {
              userId: vendeurId,
              nom: vendeurId, // Sera enrichi avec le nom réel côté frontend
              total_commandes: 0,
              total_ventes: 0,
              commandes_par_jour: [],
              articles_vendus: new Map(), // Pour tracker les articles
            });
          }

          const vendeur = vendeursMap.get(vendeurId);
          vendeur.total_commandes += 1;
          vendeur.total_ventes += cmd.paiement.total;

          // Tracker les articles vendus
          cmd.details.forEach((detail) => {
            const articleId = detail.id;
            if (!vendeur.articles_vendus.has(articleId)) {
              vendeur.articles_vendus.set(articleId, {
                id: articleId,
                denomination: detail.denomination,
                quantite: 0,
                total_ventes: 0,
              });
            }
            const article = vendeur.articles_vendus.get(articleId);
            article.quantite += detail.quantite;
            article.total_ventes += detail.prixTotal;
          });

          totalCommandes += 1;
          totalVentes += cmd.paiement.total;
        });
      }

      // Convertir en array et enrichir
      const vendeursArray = Array.from(vendeursMap.values()).map((vendeur) => ({
        ...vendeur,
        articles_vendus: Array.from(vendeur.articles_vendus.values())
          .sort((a, b) => b.total_ventes - a.total_ventes)
          .slice(0, 10), // Top 10 articles
        panier_moyen: vendeur.total_commandes > 0
          ? vendeur.total_ventes / vendeur.total_commandes
          : 0,
        pourcentage_ca: totalVentes > 0
          ? (vendeur.total_ventes / totalVentes) * 100
          : 0,
      }));

      // Trier par total des ventes (du plus grand au plus petit)
      vendeursArray.sort((a, b) => b.total_ventes - a.total_ventes);

      // Calculer le résumé global
      const summaryData = {
        total_vendeurs: vendeursArray.length,
        total_ventes: totalVentes,
        total_commandes: totalCommandes,
        panier_moyen_global: totalCommandes > 0 ? totalVentes / totalCommandes : 0,
        top_vendeur: vendeursArray.length > 0 ? vendeursArray[0] : null,
        days,
      };

      setVendeurs(vendeursArray);
      setSummary(summaryData);
    } catch (err) {
      console.error("❌ Erreur useVendeursAnalytics:", err);
      setError(err.message);
      setVendeurs([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchVendeursAnalytics();
  }, [fetchVendeursAnalytics]);

  return {
    vendeurs,
    summary,
    loading,
    error,
    refetch: fetchVendeursAnalytics,
  };
}

/**
 * Hook pour analyser les performances détaillées d'un vendeur spécifique
 * @param {string} vendeurId - ID du vendeur
 * @param {number} days - Nombre de jours à analyser (par défaut 30)
 * @returns {Object} - { vendeurStats, loading, error, refetch }
 */
export function useVendeurDetailAnalytics(vendeurId, days = 30) {
  const [vendeurStats, setVendeurStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendeurDetail = useCallback(async () => {
    if (!vendeurId) {
      setVendeurStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const stats = {
        userId: vendeurId,
        nom: vendeurId,
        total_commandes: 0,
        total_ventes: 0,
        evolution: [], // { date, commandes, ventes, panier_moyen }
        articles_vendus: new Map(),
        jours_semaine: {
          lundi: { commandes: 0, ventes: 0 },
          mardi: { commandes: 0, ventes: 0 },
          mercredi: { commandes: 0, ventes: 0 },
          jeudi: { commandes: 0, ventes: 0 },
          vendredi: { commandes: 0, ventes: 0 },
          samedi: { commandes: 0, ventes: 0 },
          dimanche: { commandes: 0, ventes: 0 },
        },
        meilleur_jour: "",
        trend: "stable",
        trendPercentage: 0,
        days,
      };

      const joursNoms = [
        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
      ];

      const today = new Date();
      let totalVentesGlobal = 0; // Pour calculer le pourcentage

      // Parcourir les N derniers jours
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const dayKey = `${String(date.getDate()).padStart(2, "0")}${String(
          date.getMonth() + 1
        ).padStart(2, "0")}${date.getFullYear()}`;

        const jourNom = joursNoms[date.getDay()];

        let commandes = [];
        let commandesJour = [];

        // Récupérer les commandes (archives ou today)
        if (i > 0) {
          const archiveRef = doc(db, `${VENTES_PATH}/${ARCHIVES_PATH}/${dayKey}`);
          const archiveDoc = await getDoc(archiveRef);
          if (archiveDoc.exists()) {
            commandes = archiveDoc.data()?.liste || [];
          }
        } else {
          const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
          const todayDoc = await getDoc(todayRef);
          if (todayDoc.exists()) {
            commandes = todayDoc.data()?.liste || [];
          }
        }

        // Filtrer les commandes du vendeur
        commandesJour = commandes.filter((cmd) => cmd.createdBy === vendeurId);

        // Calculer les ventes globales du jour (pour le pourcentage)
        const ventesJourGlobal = commandes.reduce(
          (sum, cmd) => sum + cmd.paiement.total,
          0
        );
        totalVentesGlobal += ventesJourGlobal;

        // Calculer les ventes du vendeur pour ce jour
        const ventesJour = commandesJour.reduce(
          (sum, cmd) => sum + cmd.paiement.total,
          0
        );

        stats.total_commandes += commandesJour.length;
        stats.total_ventes += ventesJour;

        // Évolution quotidienne
        stats.evolution.push({
          date: dayKey,
          dateFormatted: `${String(date.getDate()).padStart(2, "0")}/${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`,
          commandes: commandesJour.length,
          ventes: ventesJour,
          panier_moyen:
            commandesJour.length > 0 ? ventesJour / commandesJour.length : 0,
          pourcentage: ventesJourGlobal > 0 ? (ventesJour / ventesJourGlobal) * 100 : 0,
        });

        // Agréger par jour de la semaine
        stats.jours_semaine[jourNom].commandes += commandesJour.length;
        stats.jours_semaine[jourNom].ventes += ventesJour;

        // Tracker les articles vendus
        commandesJour.forEach((cmd) => {
          cmd.details.forEach((detail) => {
            const articleId = detail.id;
            if (!stats.articles_vendus.has(articleId)) {
              stats.articles_vendus.set(articleId, {
                id: articleId,
                denomination: detail.denomination,
                quantite: 0,
                total_ventes: 0,
              });
            }
            const article = stats.articles_vendus.get(articleId);
            article.quantite += detail.quantite;
            article.total_ventes += detail.prixTotal;
          });
        });
      }

      // Convertir articles en array et trier
      stats.articles_vendus = Array.from(stats.articles_vendus.values()).sort(
        (a, b) => b.total_ventes - a.total_ventes
      );

      // Calculer le panier moyen
      stats.panier_moyen =
        stats.total_commandes > 0
          ? stats.total_ventes / stats.total_commandes
          : 0;

      // Calculer le pourcentage du CA global
      stats.pourcentage_ca_global =
        totalVentesGlobal > 0 ? (stats.total_ventes / totalVentesGlobal) * 100 : 0;

      // Trouver le meilleur jour
      let maxVentes = 0;
      Object.keys(stats.jours_semaine).forEach((jour) => {
        if (stats.jours_semaine[jour].ventes > maxVentes) {
          maxVentes = stats.jours_semaine[jour].ventes;
          stats.meilleur_jour = jour;
        }
      });

      // Calculer la tendance (première moitié vs seconde moitié)
      if (stats.evolution.length > 1) {
        const mid = Math.floor(stats.evolution.length / 2);
        const firstHalf = stats.evolution
          .slice(0, mid)
          .reduce((sum, d) => sum + d.ventes, 0);
        const secondHalf = stats.evolution
          .slice(mid)
          .reduce((sum, d) => sum + d.ventes, 0);

        const avgFirst = firstHalf / mid;
        const avgSecond = secondHalf / (stats.evolution.length - mid);

        if (avgSecond > avgFirst * 1.05) {
          stats.trend = "hausse";
          stats.trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        } else if (avgSecond < avgFirst * 0.95) {
          stats.trend = "baisse";
          stats.trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        }
      }

      setVendeurStats(stats);
    } catch (err) {
      console.error("❌ Erreur useVendeurDetailAnalytics:", err);
      setError(err.message);
      setVendeurStats(null);
    } finally {
      setLoading(false);
    }
  }, [vendeurId, days]);

  useEffect(() => {
    fetchVendeurDetail();
  }, [fetchVendeurDetail]);

  return {
    vendeurStats,
    loading,
    error,
    refetch: fetchVendeurDetail,
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
