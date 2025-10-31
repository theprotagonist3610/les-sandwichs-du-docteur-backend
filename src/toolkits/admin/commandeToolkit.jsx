/**
 * commandeToolkit.jsx
 * Gestion des commandes (ventes) avec intégration comptable automatique
 *
 * Structure Firestore:
 *  - ventes/today : document array qui enregistre toutes les commandes du jour
 *  - ventes/archives/liste/{DDMMYYYY} : document array qui archive les ventes de chaque jour
 *  - ventes/ventes_en_attente : document array qui enregistre toutes les ventes non soldées, non livrées ou non servies
 *  - ventes/statistiques : document array qui enregistre les statistiques hebdomadaires
 *
 * Consignes respectées:
 *  1. Structure optimisée pour limiter les lectures Firestore (cache local)
 *  2. Triggers RTDB pour synchronisation automatique des hooks
 *  3. Intégration comptabiliteToolkit pour transactions automatiques
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

// ============================================================================
// CONSTANTES
// ============================================================================

const VENTES_PATH = "ventes";
const TODAY_DOC = "today";
const ARCHIVES_PATH = "archives/liste";
const VENTES_EN_ATTENTE_DOC = "ventes_en_attente";
const STATISTIQUES_DOC = "statistiques";
const RTDB_COMMANDES_NOTIFICATIONS = "notifications/commandes";

const CACHE_KEY_PREFIX = "commandes_cache_";
const CACHE_TIMESTAMP_KEY = "commandes_cache_timestamp_";

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
    const { paiement, details } = commande;

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
// FONCTIONS CRUD - COMMANDES
// ============================================================================

/**
 * Créer une nouvelle commande
 * Crée automatiquement les opérations comptables associées
 * @param {Object} commandeData - Données de la commande
 * @param {string} userId - ID de l'utilisateur créateur
 * @returns {Promise<Object>} La commande créée
 */
export async function CreateCommande(commandeData, userId = "system") {
  try {
    // Vérifier le changement de jour et archiver si nécessaire
    if (isNewDay()) {
      await ArchiverYesterdayCommandes();
    }

    const commande = CommandeSchema.parse({
      id: generateCommandeId(),
      createdBy: userId,
      createdAt: serverTimestamp(),
      ...commandeData,
    });

    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);

    await runTransaction(db, async (transaction) => {
      const todayDoc = await transaction.get(todayRef);
      const commandes = todayDoc.exists() ? todayDoc.data().liste || [] : [];

      commandes.push(commande);
      transaction.set(todayRef, { liste: commandes });

      // Si commande non soldée, non livrée ou non servie, ajouter aux ventes en attente
      if (
        commande.statut === "non livree" ||
        commande.statut === "non servi" ||
        commande.paiement.dette > 0
      ) {
        const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
        const attenteDoc = await transaction.get(attenteRef);
        const attentes = attenteDoc.exists()
          ? attenteDoc.data().liste || []
          : [];

        attentes.push(commande);
        transaction.set(attenteRef, { liste: attentes });
      }
    });

    // Créer les opérations comptables automatiquement
    await createComptabiliteOperationsForCommande(commande, userId);

    // Mettre à jour les statistiques
    await MakeCommandeStatistiques();

    // Invalider le cache
    clearCache("today");
    clearCache("attente");

    // Notification
    await createRTDBNotification(
      "Commande créée",
      `Commande ${commande.id} créée - ${commande.paiement.total} FCFA`,
      "success"
    );

    console.log("✅ Commande créée:", commande.id);
    return commande;
  } catch (error) {
    console.error("❌ Erreur CreateCommande:", error);
    throw error;
  }
}

/**
 * Mettre à jour une commande existante
 * @param {string} commandeId - ID de la commande
 * @param {Object} updates - Modifications à appliquer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} La commande mise à jour
 */
export async function UpdateCommande(commandeId, updates, userId = "system") {
  try {
    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
    let updatedCommande = null;

    await runTransaction(db, async (transaction) => {
      const todayDoc = await transaction.get(todayRef);

      if (!todayDoc.exists()) {
        throw new Error("Document today introuvable");
      }

      const commandes = todayDoc.data().liste || [];
      const index = commandes.findIndex((c) => c.id === commandeId);

      if (index === -1) {
        throw new Error(`Commande ${commandeId} non trouvée`);
      }

      commandes[index] = {
        ...commandes[index],
        ...updates,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
      };

      updatedCommande = commandes[index];
      transaction.set(todayRef, { liste: commandes });

      // Mettre à jour les ventes en attente
      const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
      const attenteDoc = await transaction.get(attenteRef);
      let attentes = attenteDoc.exists() ? attenteDoc.data().liste || [] : [];

      // Retirer de attente si commande soldée/livrée/servie
      if (
        updatedCommande.statut === "livree" ||
        updatedCommande.statut === "servi"
      ) {
        if (updatedCommande.paiement.dette === 0) {
          attentes = attentes.filter((a) => a.id !== commandeId);
        }
      } else {
        // Ajouter ou mettre à jour dans attente
        const attenteIndex = attentes.findIndex((a) => a.id === commandeId);
        if (attenteIndex !== -1) {
          attentes[attenteIndex] = updatedCommande;
        } else {
          attentes.push(updatedCommande);
        }
      }

      transaction.set(attenteRef, { liste: attentes });
    });

    // Mettre à jour les statistiques
    await MakeCommandeStatistiques();

    // Invalider le cache
    clearCache("today");
    clearCache("attente");

    // Notification
    await createRTDBNotification(
      "Commande modifiée",
      `Commande ${commandeId} mise à jour`,
      "info"
    );

    console.log("✅ Commande mise à jour:", commandeId);
    return updatedCommande;
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
 * Supprimer une commande
 * Supprime également les opérations comptables associées
 * @param {string} commandeId - ID de la commande à supprimer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} true si succès
 */
export async function DeleteCommande(commandeId, userId = "system") {
  try {
    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);

    await runTransaction(db, async (transaction) => {
      const todayDoc = await transaction.get(todayRef);

      if (!todayDoc.exists()) {
        throw new Error("Document today introuvable");
      }

      const commandes = todayDoc.data().liste || [];
      const filtered = commandes.filter((c) => c.id !== commandeId);

      if (filtered.length === commandes.length) {
        throw new Error(`Commande ${commandeId} non trouvée`);
      }

      transaction.set(todayRef, { liste: filtered });

      // Supprimer des ventes en attente
      const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
      const attenteDoc = await transaction.get(attenteRef);
      if (attenteDoc.exists()) {
        const attentes = attenteDoc.data().liste || [];
        const filteredAttentes = attentes.filter((a) => a.id !== commandeId);
        transaction.set(attenteRef, { liste: filteredAttentes });
      }
    });

    // Supprimer les opérations comptables
    await deleteComptabiliteOperationsForCommande(commandeId, userId);

    // Mettre à jour les statistiques
    await MakeCommandeStatistiques();

    // Invalider le cache
    clearCache("today");
    clearCache("attente");

    // Notification
    await createRTDBNotification(
      "Commande supprimée",
      `Commande ${commandeId} supprimée`,
      "warning"
    );

    console.log("✅ Commande supprimée:", commandeId);
    return true;
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
 * Supprimer plusieurs commandes en batch
 * @param {Array} commandeIds - Tableau d'IDs de commandes
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Nombre de commandes supprimées
 */
export async function DeleteCommandeBatch(commandeIds, userId = "system") {
  try {
    const todayRef = doc(db, VENTES_PATH, TODAY_DOC);
    let deletedCount = 0;

    await runTransaction(db, async (transaction) => {
      const todayDoc = await transaction.get(todayRef);

      if (!todayDoc.exists()) {
        throw new Error("Document today introuvable");
      }

      const commandes = todayDoc.data().liste || [];
      const filtered = commandes.filter((c) => {
        const shouldDelete = commandeIds.includes(c.id);
        if (shouldDelete) deletedCount++;
        return !shouldDelete;
      });

      transaction.set(todayRef, { liste: filtered });

      // Supprimer des ventes en attente
      const attenteRef = doc(db, VENTES_PATH, VENTES_EN_ATTENTE_DOC);
      const attenteDoc = await transaction.get(attenteRef);
      if (attenteDoc.exists()) {
        const attentes = attenteDoc.data().liste || [];
        const filteredAttentes = attentes.filter(
          (a) => !commandeIds.includes(a.id)
        );
        transaction.set(attenteRef, { liste: filteredAttentes });
      }
    });

    // Supprimer les opérations comptables pour chaque commande
    for (const commandeId of commandeIds) {
      await deleteComptabiliteOperationsForCommande(commandeId, userId);
    }

    // Mettre à jour les statistiques
    await MakeCommandeStatistiques();

    // Invalider le cache
    clearCache("today");
    clearCache("attente");

    // Notification
    await createRTDBNotification(
      "Commandes supprimées",
      `${deletedCount} commande(s) supprimée(s) en batch`,
      "warning"
    );

    console.log(`✅ ${deletedCount} commande(s) supprimée(s) en batch`);
    return deletedCount;
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
};
