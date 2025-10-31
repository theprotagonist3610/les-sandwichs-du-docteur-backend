/*
 * comptabiliteToolkit.jsx
 * Gestion de la comptabilité selon le plan comptable OHADA
 *
 * Structure Firestore:
 *  - comptabilite/comptes : document array qui contient tous les comptes comptables disponibles
 *  - comptabilite/operations/liste/DDMMYYYY : document array journalier des opérations
 *  - comptabilite/tresorerie : document array listant les comptes de trésorerie avec leurs soldes
 *
 * Schemas:
 *  - compte {id, code_ohada, denomination, description, type}
 *  - operation {id, type, createdAt, updatedAt, createdBy, updatedBy, montant, tresorerie, observation}
 *  - tresorerie {id, denomination, type, solde}
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
  onSnapshot,
} from "firebase/firestore";
import { ref, push, onChildAdded, off } from "firebase/database";
import { db, rtdb } from "@/firebase";

// ============================================================================
// LISTE DES COMPTES OHADA PAR DÉFAUT
// ============================================================================

const COMPTES_OHADA_DEFAULT = [
  {
    code_ohada: "101",
    denomination: "Capital social",
    description: "Apport initial du propriétaire ou des associés",
    type: "entree",
  },
  {
    code_ohada: "108",
    denomination: "Compte de l'exploitant",
    description: "Apports ou retraits personnels du propriétaire",
    type: "entree/sortie",
  },
  {
    code_ohada: "2183",
    denomination: "Matériel et outillage",
    description: "Grill, frigo, mixeur, plancha, matériel de préparation",
    type: "sortie",
  },
  {
    code_ohada: "2184",
    denomination: "Mobilier et matériel de bureau",
    description: "Tables, chaises, caisse, tablette, décorations",
    type: "sortie",
  },
  {
    code_ohada: "2186",
    denomination: "Matériel de transport",
    description: "Moto ou triporteur pour livraison",
    type: "sortie",
  },
  {
    code_ohada: "31",
    denomination: "Matières premières",
    description: "Pain, œufs, viande, lait, fruits, sucre, etc.",
    type: "sortie",
  },
  {
    code_ohada: "32",
    denomination: "Fournitures consommables",
    description: "Emballages, gobelets, pailles, serviettes",
    type: "sortie",
  },
  {
    code_ohada: "37",
    denomination: "Produits finis",
    description: "Sandwichs, yaourts prêts à vendre",
    type: "entree",
  },
  {
    code_ohada: "401",
    denomination: "Fournisseurs",
    description: "Achats à crédit auprès des fournisseurs",
    type: "sortie",
  },
  {
    code_ohada: "4091",
    denomination: "Fournisseurs – avances et acomptes",
    description: "Acomptes versés avant livraison",
    type: "sortie",
  },
  {
    code_ohada: "411",
    denomination: "Clients",
    description: "Ventes à crédit",
    type: "entree",
  },
  {
    code_ohada: "421",
    denomination: "Prestataires externes",
    description: "Paiements aux aides, livreurs, etc.",
    type: "sortie",
  },
  {
    code_ohada: "4456",
    denomination: "TVA déductible",
    description: "TVA sur les achats",
    type: "sortie",
  },
  {
    code_ohada: "4457",
    denomination: "TVA collectée",
    description: "TVA sur les ventes",
    type: "entree",
  },
  {
    code_ohada: "467",
    denomination: "Autres comptes divers",
    description: "Comptes de régularisation ou prêts temporaires",
    type: "entree/sortie",
  },
  {
    code_ohada: "511",
    denomination: "Banque",
    description: "Compte bancaire professionnel",
    type: "entree/sortie",
  },
  {
    code_ohada: "5121",
    denomination: "Mobile Money",
    description: "Encaissements ou paiements via MTN ou Moov",
    type: "entree/sortie",
  },
  {
    code_ohada: "531",
    denomination: "Caisse",
    description: "Encaissements et paiements en espèces",
    type: "entree/sortie",
  },
  {
    code_ohada: "601",
    denomination: "Achats de matières premières",
    description: "Achats de pain, lait, fruits, etc.",
    type: "sortie",
  },
  {
    code_ohada: "602",
    denomination: "Fournitures consommables",
    description: "Achats de gobelets, serviettes, emballages",
    type: "sortie",
  },
  {
    code_ohada: "604",
    denomination: "Petits équipements",
    description: "Petits matériels non immobilisés",
    type: "sortie",
  },
  {
    code_ohada: "611",
    denomination: "Transport",
    description: "Livraison, taxi, déplacement d'approvisionnement",
    type: "sortie",
  },
  {
    code_ohada: "613",
    denomination: "Loyers et charges locatives",
    description: "Loyer du local de la sandwicherie",
    type: "sortie",
  },
  {
    code_ohada: "615",
    denomination: "Entretien et réparations",
    description: "Nettoyage, réparations d'équipements",
    type: "sortie",
  },
  {
    code_ohada: "616",
    denomination: "Assurances",
    description: "Assurance du local ou du matériel",
    type: "sortie",
  },
  {
    code_ohada: "623",
    denomination: "Publicité et marketing",
    description: "Affiches, flyers, communication en ligne",
    type: "sortie",
  },
  {
    code_ohada: "625",
    denomination: "Déplacements et missions",
    description: "Dépenses diverses liées à l'activité",
    type: "sortie",
  },
  {
    code_ohada: "626",
    denomination: "Téléphone et Internet",
    description: "Frais de communication",
    type: "sortie",
  },
  {
    code_ohada: "627",
    denomination: "Honoraires",
    description: "Comptable, consultant, designer",
    type: "sortie",
  },
  {
    code_ohada: "628",
    denomination: "Autres charges externes",
    description: "Prestations diverses non classées",
    type: "sortie",
  },
  {
    code_ohada: "635",
    denomination: "Impôts et taxes",
    description: "Patente, taxes communales",
    type: "sortie",
  },
  {
    code_ohada: "641",
    denomination: "Rémunération des prestataires",
    description: "Paiements aux collaborateurs occasionnels",
    type: "sortie",
  },
  {
    code_ohada: "651",
    denomination: "Intérêts bancaires",
    description: "Frais financiers liés à un emprunt",
    type: "sortie",
  },
  {
    code_ohada: "658",
    denomination: "Charges diverses de gestion",
    description: "Pourboires, dépenses imprévues",
    type: "sortie",
  },
  {
    code_ohada: "701",
    denomination: "Vente de produits finis",
    description: "Vente de sandwichs et yaourts",
    type: "entree",
  },
  {
    code_ohada: "707",
    denomination: "Vente de marchandises",
    description: "Vente de boissons, biscuits ou autres produits",
    type: "entree",
  },
  {
    code_ohada: "758",
    denomination: "Autres produits divers",
    description: "Revenus accessoires ou exceptionnels",
    type: "entree",
  },
];

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const CompteTypeSchema = z.enum(["entree", "sortie", "entree/sortie"]);

export const CompteSchema = z.object({
  id: z.string(),
  code_ohada: z.string().min(1, "Code OHADA requis"),
  denomination: z.string().min(1, "Dénomination requise"),
  description: z.string().optional(),
  type: CompteTypeSchema,
});

export const OperationTypeSchema = z.enum(["recette", "depense"]);

export const OperationSchema = z.object({
  id: z.string(),
  type: OperationTypeSchema,
  compte_code: z.string().min(1, "Code compte requis"),
  compte_denomination: z.string().optional(),
  montant: z.number().positive("Montant doit être positif"),
  tresorerie_id: z.string().min(1, "Compte de trésorerie requis"),
  observation: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const TresorerieTypeSchema = z.enum([
  "Compte bancaire",
  "Mobile Money",
  "Momo pay",
  "Moov money",
  "Caisse",
]);

export const TresorerieSchema = z.object({
  id: z.string(),
  denomination: z.string().min(1, "Dénomination requise"),
  type: TresorerieTypeSchema,
  solde: z.number().default(0),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// ============================================================================
// CONSTANTES
// ============================================================================

const COMPTABILITE_PATH = "comptabilite";
const COMPTES_DOC = "comptes";
const OPERATIONS_PATH = "operations/liste";
const TRESORERIE_DOC = "tresorerie";
const OPERATIONS_QUEUE_PATH = "comptabilite/operationsQueue";
const RTDB_COMPTA_NOTIFICATIONS = "notifications/comptabilite";

const CACHE_KEY_PREFIX = "compta_cache_";
const CACHE_TIMESTAMP_KEY = "compta_cache_timestamp_";

// Statuts des opérations dans la queue
export const COMPTA_OPERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère une clé de date au format DDMMYYYY
 */
export function getDateKey(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Parse une clé de date DDMMYYYY en objet Date
 */
export function parseDateKey(dateKey) {
  const day = parseInt(dateKey.substring(0, 2), 10);
  const month = parseInt(dateKey.substring(2, 4), 10) - 1;
  const year = parseInt(dateKey.substring(4, 8), 10);
  return new Date(year, month, day);
}

/**
 * Crée une notification RTDB
 */
async function createRTDBNotification(title, message, type = "info") {
  try {
    const notificationsRef = ref(rtdb, RTDB_COMPTA_NOTIFICATIONS);
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

// ============================================================================
// SYSTÈME DE QUEUE POUR ÉVITER LES COLLISIONS FIRESTORE
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

      transaction.set(queueRef, { operations: currentQueue });
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
 * Les opérations sont exécutées chronologiquement avec runTransaction
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
    console.log("🔄 Début de l'exécution des opérations comptables...");

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

      console.log(`📋 ${pendingOps.length} opérations comptables à traiter`);

      // 4. Récupérer TOUS les documents nécessaires AVANT toute écriture
      const tresorerieRef = doc(db, COMPTABILITE_PATH, TRESORERIE_DOC);
      const tresorerieDoc = await transaction.get(tresorerieRef);

      if (!tresorerieDoc.exists()) {
        throw new Error("Document trésorerie introuvable");
      }

      const tresoreries = tresorerieDoc.data().liste || [];

      // Map pour stocker les références de documents d'opérations par date
      const operationsDocsMap = new Map();

      // 5. Exécuter chaque opération
      const updatedQueue = [];

      for (const op of queue) {
        if (op.status !== COMPTA_OPERATION_STATUS.PENDING) {
          updatedQueue.push(op);
          continue;
        }

        try {
          const { type, payload } = op;

          if (type === "create") {
            // Créer une nouvelle opération comptable
            const operation = OperationSchema.parse({
              id: `op_${nanoid(10)}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              createdBy: payload.userId || "system",
              updatedBy: payload.userId || "system",
              ...payload.operationData,
            });

            const dateKey = payload.dateKey || getDateKey();

            // Récupérer ou créer la référence du document d'opérations
            if (!operationsDocsMap.has(dateKey)) {
              const operationsRef = doc(
                db,
                COMPTABILITE_PATH,
                OPERATIONS_PATH,
                dateKey
              );
              const operationsDoc = await transaction.get(operationsRef);
              operationsDocsMap.set(dateKey, {
                ref: operationsRef,
                data: operationsDoc.exists()
                  ? operationsDoc.data().liste || []
                  : [],
              });
            }

            const operationsData = operationsDocsMap.get(dateKey);
            operationsData.data.push(operation);

            // Mettre à jour la trésorerie
            const tresoIndex = tresoreries.findIndex(
              (t) => t.id === operation.tresorerie_id
            );

            if (tresoIndex === -1) {
              throw new Error(
                `Trésorerie ${operation.tresorerie_id} non trouvée`
              );
            }

            const delta =
              operation.type === "recette"
                ? operation.montant
                : -operation.montant;

            tresoreries[tresoIndex].solde += delta;
            tresoreries[tresoIndex].updatedAt = serverTimestamp();

            results.success++;
          } else if (type === "update") {
            // Mettre à jour une opération existante
            const { operationId, updates, dateKey } = payload;

            if (!operationsDocsMap.has(dateKey)) {
              const operationsRef = doc(
                db,
                COMPTABILITE_PATH,
                OPERATIONS_PATH,
                dateKey
              );
              const operationsDoc = await transaction.get(operationsRef);
              operationsDocsMap.set(dateKey, {
                ref: operationsRef,
                data: operationsDoc.exists()
                  ? operationsDoc.data().liste || []
                  : [],
              });
            }

            const operationsData = operationsDocsMap.get(dateKey);
            const index = operationsData.data.findIndex(
              (o) => o.id === operationId
            );

            if (index === -1) {
              throw new Error(`Opération ${operationId} non trouvée`);
            }

            const oldOperation = operationsData.data[index];

            // Annuler l'ancienne opération sur la trésorerie
            if (
              updates.montant !== undefined ||
              updates.tresorerie_id !== undefined ||
              updates.type !== undefined
            ) {
              const oldTresoIndex = tresoreries.findIndex(
                (t) => t.id === oldOperation.tresorerie_id
              );
              if (oldTresoIndex !== -1) {
                const oldDelta =
                  oldOperation.type === "recette"
                    ? -oldOperation.montant
                    : oldOperation.montant;
                tresoreries[oldTresoIndex].solde += oldDelta;
              }

              // Appliquer la nouvelle opération
              const newTresoId =
                updates.tresorerie_id || oldOperation.tresorerie_id;
              const newMontant = updates.montant ?? oldOperation.montant;
              const newType = updates.type || oldOperation.type;

              const newTresoIndex = tresoreries.findIndex(
                (t) => t.id === newTresoId
              );
              if (newTresoIndex === -1) {
                throw new Error(`Trésorerie ${newTresoId} non trouvée`);
              }

              const newDelta =
                newType === "recette" ? newMontant : -newMontant;
              tresoreries[newTresoIndex].solde += newDelta;
              tresoreries[newTresoIndex].updatedAt = serverTimestamp();
            }

            operationsData.data[index] = {
              ...oldOperation,
              ...updates,
              updatedAt: serverTimestamp(),
              updatedBy: payload.userId || "system",
            };

            results.success++;
          } else if (type === "delete") {
            // Supprimer une opération
            const { operationId, dateKey } = payload;

            if (!operationsDocsMap.has(dateKey)) {
              const operationsRef = doc(
                db,
                COMPTABILITE_PATH,
                OPERATIONS_PATH,
                dateKey
              );
              const operationsDoc = await transaction.get(operationsRef);
              operationsDocsMap.set(dateKey, {
                ref: operationsRef,
                data: operationsDoc.exists()
                  ? operationsDoc.data().liste || []
                  : [],
              });
            }

            const operationsData = operationsDocsMap.get(dateKey);
            const operation = operationsData.data.find(
              (o) => o.id === operationId
            );

            if (!operation) {
              throw new Error(`Opération ${operationId} non trouvée`);
            }

            // Annuler l'impact sur la trésorerie
            const tresoIndex = tresoreries.findIndex(
              (t) => t.id === operation.tresorerie_id
            );

            if (tresoIndex !== -1) {
              const delta =
                operation.type === "recette"
                  ? -operation.montant
                  : operation.montant;
              tresoreries[tresoIndex].solde += delta;
              tresoreries[tresoIndex].updatedAt = serverTimestamp();
            }

            operationsData.data = operationsData.data.filter(
              (o) => o.id !== operationId
            );

            results.success++;
          }

          // Marquer l'opération comme complétée
          updatedQueue.push({
            ...op,
            status: COMPTA_OPERATION_STATUS.COMPLETED,
          });
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
          });
        }
      }

      // 6. Écrire toutes les modifications en une seule transaction
      transaction.set(tresorerieRef, { liste: tresoreries });

      for (const [dateKey, operationsData] of operationsDocsMap.entries()) {
        transaction.set(operationsData.ref, { liste: operationsData.data });
      }

      transaction.set(queueRef, { operations: updatedQueue });
    });

    console.log(
      `✅ Exécution terminée: ${results.success} succès, ${results.failed} échecs`
    );

    // Invalider les caches
    clearCache("tresoreries");
    for (const dateKey of Array.from(
      new Set(
        [...results.errors.map((e) => e.dateKey)].filter((k) => k)
      )
    )) {
      clearCache(`operations_${dateKey}`);
    }

    // Notification
    if (results.success > 0) {
      await createRTDBNotification(
        "Opérations comptables",
        `${results.success} opération(s) comptable(s) exécutée(s)`,
        "success"
      );
    }

    if (results.failed > 0) {
      await createRTDBNotification(
        "Opérations comptables",
        `${results.failed} opération(s) échouée(s)`,
        "warning"
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
 * @returns {Promise<number>} Nombre d'opérations supprimées
 */
export async function cleanComptaQueue() {
  try {
    const queueRef = doc(db, OPERATIONS_QUEUE_PATH);
    let removedCount = 0;

    await runTransaction(db, async (transaction) => {
      const queueDoc = await transaction.get(queueRef);

      if (!queueDoc.exists()) {
        return;
      }

      const queue = queueDoc.data().operations || [];

      // Garder uniquement les opérations pending et processing
      const filteredQueue = queue.filter((op) => {
        const shouldKeep =
          op.status === COMPTA_OPERATION_STATUS.PENDING ||
          op.status === COMPTA_OPERATION_STATUS.PROCESSING;

        if (!shouldKeep) removedCount++;
        return shouldKeep;
      });

      transaction.set(queueRef, { operations: filteredQueue });
    });

    console.log(
      `✅ Queue comptable nettoyée: ${removedCount} opérations supprimées`
    );

    if (removedCount > 0) {
      await createRTDBNotification(
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

// ============================================================================
// FONCTIONS CRUD - COMPTES
// ============================================================================

/**
 * Créer un nouveau compte
 */
export async function createCompte(compteData) {
  try {
    const compte = CompteSchema.parse({
      id: `cmpt_${nanoid(10)}`,
      ...compteData,
    });

    const comptesRef = doc(db, COMPTABILITE_PATH, COMPTES_DOC);
    const comptesDoc = await getDoc(comptesRef);

    let comptes = [];
    if (comptesDoc.exists()) {
      comptes = comptesDoc.data().liste || [];
    }

    // Vérifier si le code OHADA existe déjà
    if (comptes.some((c) => c.code_ohada === compte.code_ohada)) {
      throw new Error(`Le code OHADA ${compte.code_ohada} existe déjà`);
    }

    comptes.push(compte);

    await setDoc(comptesRef, { liste: comptes });
    clearCache("comptes");

    await createRTDBNotification(
      "Compte créé",
      `Compte ${compte.denomination} créé`,
      "success"
    );

    return compte;
  } catch (error) {
    console.error("❌ Erreur createCompte:", error);
    throw error;
  }
}

/**
 * Lire tous les comptes
 */
export async function getAllComptes() {
  try {
    const cached = getCache("comptes");
    if (cached) return cached;

    const comptesRef = doc(db, COMPTABILITE_PATH, COMPTES_DOC);
    const comptesDoc = await getDoc(comptesRef);

    const comptes = comptesDoc.exists()
      ? comptesDoc.data().liste || []
      : [];

    setCache("comptes", comptes);
    return comptes;
  } catch (error) {
    console.error("❌ Erreur getAllComptes:", error);
    throw error;
  }
}

/**
 * Lire un compte par ID
 */
export async function getCompteById(compteId) {
  try {
    const comptes = await getAllComptes();
    const compte = comptes.find((c) => c.id === compteId);
    if (!compte) throw new Error(`Compte ${compteId} non trouvé`);
    return compte;
  } catch (error) {
    console.error("❌ Erreur getCompteById:", error);
    throw error;
  }
}

/**
 * Lire un compte par code OHADA
 */
export async function getCompteByCode(codeOhada) {
  try {
    const comptes = await getAllComptes();
    const compte = comptes.find((c) => c.code_ohada === codeOhada);
    if (!compte) throw new Error(`Compte ${codeOhada} non trouvé`);
    return compte;
  } catch (error) {
    console.error("❌ Erreur getCompteByCode:", error);
    throw error;
  }
}

/**
 * Mettre à jour un compte
 */
export async function updateCompte(compteId, updates) {
  try {
    const comptesRef = doc(db, COMPTABILITE_PATH, COMPTES_DOC);
    const comptesDoc = await getDoc(comptesRef);

    if (!comptesDoc.exists()) {
      throw new Error("Document comptes introuvable");
    }

    const comptes = comptesDoc.data().liste || [];
    const index = comptes.findIndex((c) => c.id === compteId);

    if (index === -1) {
      throw new Error(`Compte ${compteId} non trouvé`);
    }

    comptes[index] = { ...comptes[index], ...updates };

    await setDoc(comptesRef, { liste: comptes });
    clearCache("comptes");

    await createRTDBNotification(
      "Compte modifié",
      `Compte ${comptes[index].denomination} modifié`,
      "info"
    );

    return comptes[index];
  } catch (error) {
    console.error("❌ Erreur updateCompte:", error);
    throw error;
  }
}

/**
 * Supprimer un compte
 */
export async function deleteCompte(compteId) {
  try {
    const comptesRef = doc(db, COMPTABILITE_PATH, COMPTES_DOC);
    const comptesDoc = await getDoc(comptesRef);

    if (!comptesDoc.exists()) {
      throw new Error("Document comptes introuvable");
    }

    const comptes = comptesDoc.data().liste || [];
    const filtered = comptes.filter((c) => c.id !== compteId);

    if (filtered.length === comptes.length) {
      throw new Error(`Compte ${compteId} non trouvé`);
    }

    await setDoc(comptesRef, { liste: filtered });
    clearCache("comptes");

    await createRTDBNotification(
      "Compte supprimé",
      `Compte supprimé`,
      "warning"
    );

    return true;
  } catch (error) {
    console.error("❌ Erreur deleteCompte:", error);
    throw error;
  }
}

/**
 * Opérations batch sur les comptes
 */
export async function batchCreateComptes(comptesData) {
  try {
    const newComptes = comptesData.map((data) =>
      CompteSchema.parse({
        id: `cmpt_${nanoid(10)}`,
        ...data,
      })
    );

    const comptesRef = doc(db, COMPTABILITE_PATH, COMPTES_DOC);
    const comptesDoc = await getDoc(comptesRef);

    let comptes = [];
    if (comptesDoc.exists()) {
      comptes = comptesDoc.data().liste || [];
    }

    // Vérifier les doublons
    const existingCodes = new Set(comptes.map((c) => c.code_ohada));
    for (const compte of newComptes) {
      if (existingCodes.has(compte.code_ohada)) {
        throw new Error(`Le code OHADA ${compte.code_ohada} existe déjà`);
      }
    }

    comptes.push(...newComptes);

    await setDoc(comptesRef, { liste: comptes });
    clearCache("comptes");

    await createRTDBNotification(
      "Comptes créés",
      `${newComptes.length} compte(s) créé(s)`,
      "success"
    );

    return newComptes;
  } catch (error) {
    console.error("❌ Erreur batchCreateComptes:", error);
    throw error;
  }
}

/**
 * Initialiser les comptes OHADA par défaut
 */
export async function initializeComptesOHADA() {
  try {
    const comptesRef = doc(db, COMPTABILITE_PATH, COMPTES_DOC);
    const comptesDoc = await getDoc(comptesRef);

    if (comptesDoc.exists() && comptesDoc.data().liste?.length > 0) {
      throw new Error("Les comptes sont déjà initialisés");
    }

    const comptes = COMPTES_OHADA_DEFAULT.map((data) => ({
      id: `cmpt_${nanoid(10)}`,
      ...data,
    }));

    await setDoc(comptesRef, { liste: comptes });
    clearCache("comptes");

    await createRTDBNotification(
      "Comptes initialisés",
      `${comptes.length} comptes OHADA initialisés`,
      "success"
    );

    return comptes;
  } catch (error) {
    console.error("❌ Erreur initializeComptesOHADA:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS CRUD - OPÉRATIONS
// ============================================================================

/**
 * Créer une nouvelle opération comptable
 * NOUVELLE VERSION: Ajoute l'opération à la queue au lieu de l'exécuter directement
 * @param {Object} operationData - Données de l'opération
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function createOperation(operationData, userId = "system") {
  try {
    // Valider les données
    OperationSchema.partial({ id: true, createdAt: true, updatedAt: true, createdBy: true, updatedBy: true }).parse(operationData);

    const dateKey = getDateKey();

    // Ajouter l'opération à la queue
    const queuedOp = await enqueueComptaOperation(
      "create",
      {
        operationData,
        userId,
        dateKey,
      },
      userId
    );

    console.log("✅ Opération comptable ajoutée à la queue:", queuedOp.id);

    // Notification immédiate
    await createRTDBNotification(
      "Opération en file d'attente",
      `${operationData.type} de ${operationData.montant} FCFA ajoutée`,
      "info"
    );

    // Déclencher l'exécution des opérations en attente (asynchrone)
    executeComptaOperations().catch((err) => {
      console.error("❌ Erreur lors de l'exécution automatique:", err);
    });

    return queuedOp;
  } catch (error) {
    console.error("❌ Erreur createOperation:", error);
    throw error;
  }
}

/**
 * Lire les opérations d'une journée
 */
export async function getOperationsByDate(date = new Date()) {
  try {
    const dateKey = getDateKey(date);
    const cached = getCache(`operations_${dateKey}`);
    if (cached) return cached;

    const operationsRef = doc(db, COMPTABILITE_PATH, OPERATIONS_PATH, dateKey);
    const operationsDoc = await getDoc(operationsRef);

    const operations = operationsDoc.exists()
      ? operationsDoc.data().liste || []
      : [];

    setCache(`operations_${dateKey}`, operations);
    return operations;
  } catch (error) {
    console.error("❌ Erreur getOperationsByDate:", error);
    throw error;
  }
}

/**
 * Lire une opération par ID
 */
export async function getOperationById(operationId, date = new Date()) {
  try {
    const operations = await getOperationsByDate(date);
    const operation = operations.find((o) => o.id === operationId);
    if (!operation) throw new Error(`Opération ${operationId} non trouvée`);
    return operation;
  } catch (error) {
    console.error("❌ Erreur getOperationById:", error);
    throw error;
  }
}

/**
 * Mettre à jour une opération
 * NOUVELLE VERSION: Ajoute l'opération de mise à jour à la queue
 * @param {string} operationId - ID de l'opération
 * @param {Object} updates - Modifications à appliquer
 * @param {Date} date - Date de l'opération
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} L'opération en queue
 */
export async function updateOperation(
  operationId,
  updates,
  date = new Date(),
  userId = "system"
) {
  try {
    const dateKey = getDateKey(date);

    // Ajouter l'opération de mise à jour à la queue
    const queuedOp = await enqueueComptaOperation(
      "update",
      {
        operationId,
        updates,
        dateKey,
        userId,
      },
      userId
    );

    console.log("✅ Mise à jour d'opération ajoutée à la queue:", queuedOp.id);

    // Notification immédiate
    await createRTDBNotification(
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
    console.error("❌ Erreur updateOperation:", error);
    throw error;
  }
}

/**
 * Supprimer une opération
 */
export async function deleteOperation(
  operationId,
  date = new Date(),
  userId = "system"
) {
  try {
    const dateKey = getDateKey(date);

    // Ajouter l'opération à la queue
    const queuedOp = await enqueueComptaOperation(
      "delete",
      { operationId, dateKey },
      userId
    );

    // Notification immédiate
    await createRTDBNotification(
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
    console.error("❌ Erreur deleteOperation:", error);
    throw error;
  }
}

/**
 * Créer plusieurs opérations en batch
 */
export async function batchCreateOperations(operationsData, userId = "system") {
  try {
    // Valider toutes les opérations
    operationsData.forEach((data) => {
      OperationSchema.partial({
        id: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      }).parse(data);
    });

    const dateKey = getDateKey();

    // Ajouter toutes les opérations à la queue
    const queuedOps = [];
    for (const operationData of operationsData) {
      const queuedOp = await enqueueComptaOperation(
        "create",
        { operationData, userId, dateKey },
        userId
      );
      queuedOps.push(queuedOp);
    }

    // Notification immédiate
    await createRTDBNotification(
      "Opérations en file d'attente",
      `${operationsData.length} opération(s) ajoutée(s) en batch`,
      "info"
    );

    // Déclencher l'exécution (asynchrone)
    executeComptaOperations().catch((err) => {
      console.error("❌ Erreur lors de l'exécution automatique:", err);
    });

    return queuedOps;
  } catch (error) {
    console.error("❌ Erreur batchCreateOperations:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS CRUD - TRÉSORERIE
// ============================================================================

/**
 * Créer un nouveau compte de trésorerie
 */
export async function createTresorerie(tresorerieData) {
  try {
    const tresorerie = TresorerieSchema.parse({
      id: `tresor_${nanoid(10)}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...tresorerieData,
    });

    const tresorerieRef = doc(db, COMPTABILITE_PATH, TRESORERIE_DOC);
    const tresorerieDoc = await getDoc(tresorerieRef);

    let tresoreries = [];
    if (tresorerieDoc.exists()) {
      tresoreries = tresorerieDoc.data().liste || [];
    }

    tresoreries.push(tresorerie);

    await setDoc(tresorerieRef, { liste: tresoreries });
    clearCache("tresoreries");

    await createRTDBNotification(
      "Trésorerie créée",
      `Compte ${tresorerie.denomination} créé`,
      "success"
    );

    return tresorerie;
  } catch (error) {
    console.error("❌ Erreur createTresorerie:", error);
    throw error;
  }
}

/**
 * Lire tous les comptes de trésorerie
 */
export async function getAllTresoreries() {
  try {
    const cached = getCache("tresoreries");
    if (cached) return cached;

    const tresorerieRef = doc(db, COMPTABILITE_PATH, TRESORERIE_DOC);
    const tresorerieDoc = await getDoc(tresorerieRef);

    const tresoreries = tresorerieDoc.exists()
      ? tresorerieDoc.data().liste || []
      : [];

    setCache("tresoreries", tresoreries);
    return tresoreries;
  } catch (error) {
    console.error("❌ Erreur getAllTresoreries:", error);
    throw error;
  }
}

/**
 * Lire une trésorerie par ID
 */
export async function getTresorerieById(tresorerieId) {
  try {
    const tresoreries = await getAllTresoreries();
    const tresorerie = tresoreries.find((t) => t.id === tresorerieId);
    if (!tresorerie)
      throw new Error(`Trésorerie ${tresorerieId} non trouvée`);
    return tresorerie;
  } catch (error) {
    console.error("❌ Erreur getTresorerieById:", error);
    throw error;
  }
}

/**
 * Mettre à jour une trésorerie
 */
export async function updateTresorerie(tresorerieId, updates) {
  try {
    const tresorerieRef = doc(db, COMPTABILITE_PATH, TRESORERIE_DOC);
    const tresorerieDoc = await getDoc(tresorerieRef);

    if (!tresorerieDoc.exists()) {
      throw new Error("Document trésorerie introuvable");
    }

    const tresoreries = tresorerieDoc.data().liste || [];
    const index = tresoreries.findIndex((t) => t.id === tresorerieId);

    if (index === -1) {
      throw new Error(`Trésorerie ${tresorerieId} non trouvée`);
    }

    tresoreries[index] = {
      ...tresoreries[index],
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await setDoc(tresorerieRef, { liste: tresoreries });
    clearCache("tresoreries");

    await createRTDBNotification(
      "Trésorerie modifiée",
      `Compte ${tresoreries[index].denomination} modifié`,
      "info"
    );

    return tresoreries[index];
  } catch (error) {
    console.error("❌ Erreur updateTresorerie:", error);
    throw error;
  }
}

/**
 * Supprimer une trésorerie
 */
export async function deleteTresorerie(tresorerieId) {
  try {
    const tresorerieRef = doc(db, COMPTABILITE_PATH, TRESORERIE_DOC);
    const tresorerieDoc = await getDoc(tresorerieRef);

    if (!tresorerieDoc.exists()) {
      throw new Error("Document trésorerie introuvable");
    }

    const tresoreries = tresorerieDoc.data().liste || [];
    const filtered = tresoreries.filter((t) => t.id !== tresorerieId);

    if (filtered.length === tresoreries.length) {
      throw new Error(`Trésorerie ${tresorerieId} non trouvée`);
    }

    await setDoc(tresorerieRef, { liste: filtered });
    clearCache("tresoreries");

    await createRTDBNotification(
      "Trésorerie supprimée",
      `Compte supprimé`,
      "warning"
    );

    return true;
  } catch (error) {
    console.error("❌ Erreur deleteTresorerie:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer tous les comptes
 */
export function useComptes(options = {}) {
  const { autoFetch = true, filterType } = options;
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchComptes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allComptes = await getAllComptes();
      const filtered = filterType
        ? allComptes.filter((c) => c.type === filterType || c.type === "entree/sortie")
        : allComptes;
      setComptes(filtered);
    } catch (err) {
      console.error("❌ Erreur useComptes:", err);
      setError(err.message);
      setComptes([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (autoFetch) fetchComptes();
  }, [autoFetch, fetchComptes]);

  // Écouter les notifications RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_COMPTA_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (notification && notification.title.toLowerCase().includes("compte")) {
        clearCache("comptes");
        fetchComptes();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchComptes]);

  return { comptes, loading, error, refetch: fetchComptes };
}

/**
 * Hook pour récupérer un compte spécifique
 */
export function useCompte(compteId) {
  const [compte, setCompte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!compteId) {
      setLoading(false);
      return;
    }

    const fetchCompte = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompteById(compteId);
        setCompte(data);
      } catch (err) {
        console.error("❌ Erreur useCompte:", err);
        setError(err.message);
        setCompte(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompte();
  }, [compteId]);

  return { compte, loading, error };
}

/**
 * Hook pour récupérer les opérations avec filtres
 */
export function useOperations(options = {}) {
  const {
    autoFetch = true,
    date = new Date(),
    filterType,
    filterCompte,
    filterTresorerie,
  } = options;

  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const dateKey = getDateKey(date);

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let allOperations = await getOperationsByDate(date);

      // Appliquer les filtres
      if (filterType) {
        allOperations = allOperations.filter((o) => o.type === filterType);
      }

      if (filterCompte) {
        allOperations = allOperations.filter(
          (o) => o.compte_code === filterCompte
        );
      }

      if (filterTresorerie) {
        allOperations = allOperations.filter(
          (o) => o.tresorerie_id === filterTresorerie
        );
      }

      setOperations(allOperations);
    } catch (err) {
      console.error("❌ Erreur useOperations:", err);
      setError(err.message);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, [date, filterType, filterCompte, filterTresorerie, dateKey]);

  useEffect(() => {
    if (autoFetch) fetchOperations();
  }, [autoFetch, fetchOperations]);

  // Écouter les notifications RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_COMPTA_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        notification.title.toLowerCase().includes("opération")
      ) {
        clearCache(`operations_${dateKey}`);
        fetchOperations();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchOperations, dateKey]);

  return { operations, loading, error, refetch: fetchOperations };
}

/**
 * Hook pour récupérer les comptes de trésorerie
 */
export function useTresoreries(options = {}) {
  const { autoFetch = true, filterType } = options;
  const [tresoreries, setTresoreries] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchTresoreries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allTresoreries = await getAllTresoreries();
      const filtered = filterType
        ? allTresoreries.filter((t) => t.type === filterType)
        : allTresoreries;
      setTresoreries(filtered);
    } catch (err) {
      console.error("❌ Erreur useTresoreries:", err);
      setError(err.message);
      setTresoreries([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (autoFetch) fetchTresoreries();
  }, [autoFetch, fetchTresoreries]);

  // Écouter les notifications RTDB
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_COMPTA_NOTIFICATIONS);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title.toLowerCase().includes("trésorerie") ||
          notification.title.toLowerCase().includes("opération"))
      ) {
        clearCache("tresoreries");
        fetchTresoreries();
      }
    };

    onChildAdded(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "child_added", handleNotification);
    };
  }, [fetchTresoreries]);

  return { tresoreries, loading, error, refetch: fetchTresoreries };
}

/**
 * Hook pour récupérer une trésorerie spécifique
 */
export function useTresorerie(tresorerieId) {
  const [tresorerie, setTresorerie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tresorerieId) {
      setLoading(false);
      return;
    }

    const fetchTresorerie = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTresorerieById(tresorerieId);
        setTresorerie(data);
      } catch (err) {
        console.error("❌ Erreur useTresorerie:", err);
        setError(err.message);
        setTresorerie(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTresorerie();
  }, [tresorerieId]);

  return { tresorerie, loading, error };
}

/**
 * Hook pour surveiller l'état de la queue d'opérations comptables
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
            setStats({ pending: 0, processing: 0, completed: 0, failed: 0, total: 0 });
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

  return { queue, stats, loading, error };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  COMPTES_OHADA_DEFAULT,
  COMPTABILITE_PATH,
  COMPTES_DOC,
  OPERATIONS_PATH,
  TRESORERIE_DOC,
  OPERATIONS_QUEUE_PATH,
};
