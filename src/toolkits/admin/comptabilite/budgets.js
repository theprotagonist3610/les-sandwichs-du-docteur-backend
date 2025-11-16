/**
 * budgets.js
 * Gestion des budgets prévisionnels mensuels
 */

import { nanoid } from "nanoid";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { ref, push } from "firebase/database";
import { db, rtdb, auth } from "../../../firebase.js";
import {
  budgetSchema,
  budgetAvecRealisationSchema,
  ligneBudgetAvecRealisationSchema,
} from "./schemas";
import { formatMonthKey, saveToCache, getFromCache, clearCache } from "./utils";
import { getStatistiquesByMonth } from "./statistiques";
import {
  BUDGETS_COLLECTION,
  CACHE_KEY_BUDGETS,
  CACHE_KEY_BUDGET_PREFIX,
  RTDB_COMPTA_TRIGGER_PATH,
} from "./constants";

// ============================================================================
// FONCTIONS CRUD BUDGETS
// ============================================================================

/**
 * Crée un nouveau budget prévisionnel
 * @param {Object} budgetData - Données du budget
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Budget créé
 */
export async function creerBudget(budgetData, userId = null) {
  try {
    console.log("💰 Création d'un nouveau budget...");

    const currentUser = auth.currentUser;
    const user = userId || (currentUser ? currentUser.uid : "system");
    const now = Date.now();

    // Vérifier qu'il n'existe pas déjà un budget actif pour ce mois
    const budgetExistant = await getBudgetActif(budgetData.mois);
    if (budgetExistant) {
      throw new Error(
        `Un budget actif existe déjà pour ${budgetData.mois}. Archivez-le d'abord.`
      );
    }

    // Calculer le montant total prévisionnel
    const montant_total_previsionnel = budgetData.lignes_budget.reduce(
      (sum, ligne) => sum + ligne.montant_previsionnel,
      0
    );

    const budgetId = `budget_${nanoid(10)}`;

    const budget = {
      id: budgetId,
      mois: budgetData.mois,
      nom: budgetData.nom,
      description: budgetData.description || "",
      montant_total_previsionnel,
      statut: "actif",
      lignes_budget: budgetData.lignes_budget,
      createdBy: user,
      createdAt: now,
      updatedAt: now,
    };

    // Valider avec Zod
    const validated = budgetSchema.parse(budget);

    // Sauvegarder dans Firestore
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await setDoc(budgetRef, validated);

    // Invalider le cache
    clearCache(CACHE_KEY_BUDGETS);

    // Trigger RTDB pour invalidation
    try {
      const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);
      await push(triggerRef, {
        action: "budget_created",
        budgetId,
        timestamp: now,
      });
    } catch (error) {
      console.warn("⚠️ Erreur trigger RTDB:", error);
    }

    console.log(`✅ Budget créé: ${validated.nom} (${validated.mois})`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur création budget:", error);
    throw error;
  }
}

/**
 * Récupère un budget par son ID
 * @param {string} budgetId - ID du budget
 * @returns {Promise<Object|null>} Budget ou null
 */
export async function getBudgetById(budgetId) {
  try {
    // Vérifier le cache
    const cacheKey = `${CACHE_KEY_BUDGET_PREFIX}${budgetId}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return budgetSchema.parse(cached);
    }

    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    const budgetSnap = await getDoc(budgetRef);

    if (!budgetSnap.exists()) {
      return null;
    }

    const validated = budgetSchema.parse(budgetSnap.data());

    // Mettre en cache
    saveToCache(cacheKey, validated);

    return validated;
  } catch (error) {
    console.error("❌ Erreur récupération budget:", error);
    throw error;
  }
}

/**
 * Récupère tous les budgets
 * @returns {Promise<Array>} Liste des budgets
 */
export async function getAllBudgets() {
  try {
    // Vérifier le cache
    const cached = getFromCache(CACHE_KEY_BUDGETS);
    if (cached) {
      return cached;
    }

    const budgetsRef = collection(db, BUDGETS_COLLECTION);
    const q = query(budgetsRef, orderBy("mois", "desc"));
    const snapshot = await getDocs(q);

    const budgets = [];
    snapshot.forEach((doc) => {
      try {
        const validated = budgetSchema.parse(doc.data());
        budgets.push(validated);
      } catch (error) {
        console.warn(`⚠️ Budget invalide ${doc.id}:`, error);
      }
    });

    // Mettre en cache
    saveToCache(CACHE_KEY_BUDGETS, budgets);

    return budgets;
  } catch (error) {
    console.error("❌ Erreur récupération budgets:", error);
    throw error;
  }
}

/**
 * Récupère les budgets pour un mois donné
 * @param {string} moisKey - Format MMYYYY
 * @returns {Promise<Array>} Liste des budgets du mois
 */
export async function getBudgetsByMois(moisKey) {
  try {
    const budgetsRef = collection(db, BUDGETS_COLLECTION);
    const q = query(budgetsRef, where("mois", "==", moisKey));
    const snapshot = await getDocs(q);

    const budgets = [];
    snapshot.forEach((doc) => {
      try {
        const validated = budgetSchema.parse(doc.data());
        budgets.push(validated);
      } catch (error) {
        console.warn(`⚠️ Budget invalide ${doc.id}:`, error);
      }
    });

    return budgets;
  } catch (error) {
    console.error("❌ Erreur récupération budgets par mois:", error);
    throw error;
  }
}

/**
 * Récupère le budget actif pour un mois
 * @param {string} moisKey - Format MMYYYY
 * @returns {Promise<Object|null>} Budget actif ou null
 */
export async function getBudgetActif(moisKey) {
  try {
    const budgets = await getBudgetsByMois(moisKey);
    const budgetActif = budgets.find((b) => b.statut === "actif");
    return budgetActif || null;
  } catch (error) {
    console.error("❌ Erreur récupération budget actif:", error);
    throw error;
  }
}

/**
 * Met à jour un budget
 * @param {string} budgetId - ID du budget
 * @param {Object} updates - Champs à mettre à jour
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Budget mis à jour
 */
export async function updateBudget(budgetId, updates, userId = null) {
  try {
    console.log(`🔄 Mise à jour budget ${budgetId}...`);

    const currentUser = auth.currentUser;
    const user = userId || (currentUser ? currentUser.uid : "system");
    const now = Date.now();

    // Récupérer le budget existant
    const budget = await getBudgetById(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} introuvable`);
    }

    // Recalculer le montant total si lignes_budget modifiées
    let montant_total_previsionnel = budget.montant_total_previsionnel;
    if (updates.lignes_budget) {
      montant_total_previsionnel = updates.lignes_budget.reduce(
        (sum, ligne) => sum + ligne.montant_previsionnel,
        0
      );
    }

    const updatedData = {
      ...budget,
      ...updates,
      montant_total_previsionnel,
      updatedBy: user,
      updatedAt: now,
    };

    // Valider
    const validated = budgetSchema.parse(updatedData);

    // Sauvegarder
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await updateDoc(budgetRef, validated);

    // Invalider le cache
    clearCache(CACHE_KEY_BUDGETS);
    clearCache(`${CACHE_KEY_BUDGET_PREFIX}${budgetId}`);

    // Trigger RTDB
    try {
      const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);
      await push(triggerRef, {
        action: "budget_updated",
        budgetId,
        timestamp: now,
      });
    } catch (error) {
      console.warn("⚠️ Erreur trigger RTDB:", error);
    }

    console.log(`✅ Budget mis à jour: ${validated.nom}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur mise à jour budget:", error);
    throw error;
  }
}

/**
 * Archive un budget (change le statut à "archive")
 * @param {string} budgetId - ID du budget
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Budget archivé
 */
export async function archiverBudget(budgetId, userId = null) {
  try {
    console.log(`📦 Archivage budget ${budgetId}...`);
    return await updateBudget(budgetId, { statut: "archive" }, userId);
  } catch (error) {
    console.error("❌ Erreur archivage budget:", error);
    throw error;
  }
}

/**
 * Supprime un budget
 * @param {string} budgetId - ID du budget
 * @returns {Promise<void>}
 */
export async function deleteBudget(budgetId) {
  try {
    console.log(`🗑️ Suppression budget ${budgetId}...`);

    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await deleteDoc(budgetRef);

    // Invalider le cache
    clearCache(CACHE_KEY_BUDGETS);
    clearCache(`${CACHE_KEY_BUDGET_PREFIX}${budgetId}`);

    // Trigger RTDB
    try {
      const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);
      await push(triggerRef, {
        action: "budget_deleted",
        budgetId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn("⚠️ Erreur trigger RTDB:", error);
    }

    console.log(`✅ Budget supprimé`);
  } catch (error) {
    console.error("❌ Erreur suppression budget:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS DE CALCUL DE RÉALISATION
// ============================================================================

/**
 * Calcule la réalisation d'un budget par rapport aux statistiques réelles
 * @param {string} budgetId - ID du budget
 * @returns {Promise<Object>} Budget avec données de réalisation
 */
export async function calculerRealisationBudget(budgetId) {
  try {
    console.log(`📊 Calcul réalisation budget ${budgetId}...`);

    // Récupérer le budget
    const budget = await getBudgetById(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} introuvable`);
    }

    // Récupérer les statistiques du mois
    let statsMonth;
    try {
      statsMonth = await getStatistiquesByMonth(budget.mois);
    } catch (error) {
      console.warn("⚠️ Pas de statistiques disponibles:", error);
      // Retourner le budget avec réalisation à 0
      return {
        ...budget,
        lignes_budget_avec_realisation: budget.lignes_budget.map((ligne) => ({
          ...ligne,
          montant_realise: 0,
          nombre_operations: 0,
          taux_realisation: 0,
          alerte_active: false,
        })),
        montant_total_realise: 0,
        taux_realisation_global: 0,
      };
    }

    // Créer une map des comptes avec leurs statistiques
    const comptesStatsMap = new Map();

    // Agréger tous les comptes des statistiques du mois
    if (statsMonth.comptes) {
      statsMonth.comptes.forEach((compte) => {
        comptesStatsMap.set(compte.compte_id, compte);
      });
    }

    // Calculer réalisation pour chaque ligne
    const lignes_budget_avec_realisation = budget.lignes_budget.map((ligne) => {
      const stats = comptesStatsMap.get(ligne.compte_id);

      const montant_realise = stats ? stats.montant_total : 0;
      const nombre_operations = stats ? stats.nombre_operations : 0;
      const taux_realisation =
        ligne.montant_previsionnel > 0
          ? (montant_realise / ligne.montant_previsionnel) * 100
          : 0;

      const alerte_active = taux_realisation >= ligne.seuil_alerte;

      return {
        ...ligne,
        montant_realise,
        nombre_operations,
        taux_realisation: Math.round(taux_realisation * 100) / 100, // 2 décimales
        alerte_active,
      };
    });

    // Calculer totaux
    const montant_total_realise = lignes_budget_avec_realisation.reduce(
      (sum, ligne) => sum + ligne.montant_realise,
      0
    );

    const taux_realisation_global =
      budget.montant_total_previsionnel > 0
        ? (montant_total_realise / budget.montant_total_previsionnel) * 100
        : 0;

    const budgetAvecRealisation = {
      ...budget,
      lignes_budget_avec_realisation,
      montant_total_realise,
      taux_realisation_global: Math.round(taux_realisation_global * 100) / 100,
    };

    // Valider
    const validated = budgetAvecRealisationSchema.parse(budgetAvecRealisation);

    console.log(
      `✅ Réalisation calculée: ${validated.taux_realisation_global}% (${montant_total_realise}/${budget.montant_total_previsionnel} FCFA)`
    );

    return validated;
  } catch (error) {
    console.error("❌ Erreur calcul réalisation budget:", error);
    throw error;
  }
}

/**
 * Vérifie les alertes d'un budget
 * @param {string} budgetId - ID du budget
 * @returns {Promise<Array>} Liste des alertes actives
 */
export async function verifierAlertesBudget(budgetId) {
  try {
    const budgetAvecRealisation = await calculerRealisationBudget(budgetId);

    const alertes = budgetAvecRealisation.lignes_budget_avec_realisation
      .filter((ligne) => ligne.alerte_active)
      .map((ligne) => ({
        compte_id: ligne.compte_id,
        denomination: ligne.denomination,
        code_ohada: ligne.code_ohada,
        montant_previsionnel: ligne.montant_previsionnel,
        montant_realise: ligne.montant_realise,
        taux_realisation: ligne.taux_realisation,
        seuil_alerte: ligne.seuil_alerte,
        depassement: ligne.taux_realisation > 100,
      }));

    return alertes;
  } catch (error) {
    console.error("❌ Erreur vérification alertes budget:", error);
    throw error;
  }
}
