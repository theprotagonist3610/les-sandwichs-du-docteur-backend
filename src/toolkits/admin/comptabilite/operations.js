/**
 * operations.js
 * Gestion des opérations comptables
 */

import { nanoid } from "nanoid";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, push } from "firebase/database";
import { db, rtdb, auth } from "../../../firebase.js";
import { operationSchema, operationsListeSchema } from "./schemas";
import {
  TODAY_DOC,
  HISTORIQUE_DAYS_COLLECTION,
  RTDB_COMPTA_TRIGGER_PATH,
  CACHE_KEY_TODAY,
  CACHE_KEY_HISTORIQUE_PREFIX
} from "./constants";
import { formatDayKey, saveToCache, getFromCache, clearCache } from "./utils";
import { getAllComptes, getAllComptesTresorerie } from "./comptes";

// ============================================================================
// FONCTIONS DE GESTION DES OPÉRATIONS
// ============================================================================

/**
 * Récupère les opérations du jour (today)
 * Utilise le cache en priorité pour optimiser les performances
 */
export async function getOperationsToday() {
  try {
    // Essayer le cache d'abord
    const cached = getFromCache(CACHE_KEY_TODAY);
    if (cached) {
      console.log(`📦 Cache: ${cached.operations.length} opérations today`);
      return cached;
    }

    // Si pas de cache, récupérer depuis Firestore
    const todayRef = doc(db, TODAY_DOC);
    const todaySnap = await getDoc(todayRef);

    if (!todaySnap.exists()) {
      console.log("ℹ️ Aucune opération aujourd'hui");
      const emptyData = { operations: [], lastUpdated: Date.now() };
      saveToCache(CACHE_KEY_TODAY, emptyData);
      return emptyData;
    }

    const validated = operationsListeSchema.parse(todaySnap.data());
    console.log(`✅ ${validated.operations.length} opérations today récupérées`);

    // Sauvegarder dans le cache
    saveToCache(CACHE_KEY_TODAY, validated);

    return validated;
  } catch (error) {
    console.error("❌ Erreur récupération operations today:", error);
    throw error;
  }
}

/**
 * Récupère les opérations d'un jour spécifique (historique)
 * Utilise le cache en priorité pour optimiser les performances
 */
export async function getOperationsByDay(dayKey) {
  try {
    // Essayer le cache d'abord
    const cacheKey = `${CACHE_KEY_HISTORIQUE_PREFIX}${dayKey}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Cache: ${cached.operations.length} opérations pour ${dayKey}`);
      return cached;
    }

    // Si pas de cache, récupérer depuis Firestore
    const dayRef = doc(db, `${HISTORIQUE_DAYS_COLLECTION}/${dayKey}`);
    const daySnap = await getDoc(dayRef);

    if (!daySnap.exists()) {
      console.log(`ℹ️ Aucune opération pour ${dayKey}`);
      const emptyData = { operations: [], lastUpdated: Date.now() };
      saveToCache(cacheKey, emptyData);
      return emptyData;
    }

    const validated = operationsListeSchema.parse(daySnap.data());
    console.log(`✅ ${validated.operations.length} opérations récupérées pour ${dayKey}`);

    // Sauvegarder dans le cache
    saveToCache(cacheKey, validated);

    return validated;
  } catch (error) {
    console.error(`❌ Erreur récupération operations ${dayKey}:`, error);
    throw error;
  }
}

/**
 * Récupère les opérations pour une période (plusieurs jours)
 * Charge today + historique pour les jours spécifiés
 * @param {number} nombreJours - Nombre de jours à charger (par défaut 7)
 * @param {Date} dateDebut - Date de début (optionnel, sinon calcul automatique)
 * @returns {Promise<{operations: Array, dayKeys: string[]}>}
 */
export async function getOperationsForPeriod(nombreJours = 7, dateDebut = null) {
  try {
    const allOperations = [];
    const dayKeys = [];

    // Déterminer les jours à charger
    const today = new Date();
    const startDate = dateDebut || new Date(today.getTime() - (nombreJours - 1) * 24 * 60 * 60 * 1000);

    // Générer les clés de jours
    for (let i = 0; i < nombreJours; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayKey = formatDayKey(date);
      dayKeys.push(dayKey);
    }

    console.log(`🔄 Chargement de ${nombreJours} jours: ${dayKeys[0]} → ${dayKeys[dayKeys.length - 1]}`);

    // Charger les opérations de chaque jour
    const promises = dayKeys.map(async (dayKey) => {
      // Vérifier si c'est aujourd'hui
      const todayKey = formatDayKey(today);
      if (dayKey === todayKey) {
        // Charger depuis "today"
        const { operations } = await getOperationsToday();
        return operations;
      } else {
        // Charger depuis l'historique
        const { operations } = await getOperationsByDay(dayKey);
        return operations;
      }
    });

    const results = await Promise.all(promises);

    // Fusionner toutes les opérations
    results.forEach((ops) => {
      allOperations.push(...ops);
    });

    console.log(`✅ Total: ${allOperations.length} opérations sur ${nombreJours} jours`);

    return {
      operations: allOperations,
      dayKeys,
      nombreJours,
    };
  } catch (error) {
    console.error("❌ Erreur récupération operations période:", error);
    throw error;
  }
}

/**
 * Trouve un compte (simple ou trésorerie) par ID
 */
async function findCompteById(compteId) {
  try {
    // Essayer dans les comptes simples
    const { comptes } = await getAllComptes();
    let compte = comptes.find((c) => c.id === compteId);

    if (compte) {
      return {
        ...compte,
        isTresorerie: false,
      };
    }

    // Essayer dans la trésorerie
    const { comptes: comptesT } = await getAllComptesTresorerie();
    compte = comptesT.find((c) => c.id === compteId);

    if (compte) {
      return {
        ...compte,
        isTresorerie: true,
      };
    }

    throw new Error(`Compte ${compteId} introuvable`);
  } catch (error) {
    console.error("❌ Erreur recherche compte:", error);
    throw error;
  }
}

/**
 * Crée une opération comptable
 * @param {Object} operationData - {compte_id, montant, motif, type_operation, date}
 * @param {string} userId
 */
export async function creerOperation(operationData, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Trouver le compte pour récupérer ses infos
    const compte = await findCompteById(operationData.compte_id);

    // Vérifier la cohérence du type d'opération avec la catégorie du compte
    if (compte.categorie === "entree" && operationData.type_operation !== "entree") {
      throw new Error(`Le compte ${compte.denomination} n'accepte que des entrées`);
    }
    if (compte.categorie === "sortie" && operationData.type_operation !== "sortie") {
      throw new Error(`Le compte ${compte.denomination} n'accepte que des sorties`);
    }

    const now = Date.now();
    const nouvelleOperation = {
      id: `op_${nanoid(12)}`,
      compte_id: operationData.compte_id,
      compte_ohada: compte.code_ohada,
      compte_denomination: compte.denomination,
      montant: operationData.montant,
      motif: operationData.motif,
      type_operation: operationData.type_operation,
      date: operationData.date || now,
      createdBy: actualUserId,
      createdAt: now,
    };

    // Valider avec Zod
    const validated = operationSchema.parse(nouvelleOperation);

    // Récupérer les opérations actuelles de today
    const { operations } = await getOperationsToday();

    // Vérifier si c'est la première opération du jour
    const isFirstOperation = operations.length === 0;

    // Ajouter la nouvelle opération
    operations.push(validated);

    // Sauvegarder
    const todayRef = doc(db, TODAY_DOC);
    await setDoc(todayRef, {
      operations,
      lastUpdated: now,
    });

    // Invalider le cache pour forcer le rechargement
    clearCache(CACHE_KEY_TODAY);

    // Trigger RTDB pour mise à jour des statistiques
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "create_operation",
      operationId: validated.id,
      compteId: validated.compte_id,
      montant: validated.montant,
      type: validated.type_operation,
      isFirstOperation,
      timestamp: now,
    });

    console.log(`✅ Opération créée: ${validated.motif} (${validated.montant} FCFA)`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur création opération:", error);
    throw error;
  }
}

/**
 * Crée plusieurs opérations d'un coup (bulk)
 * @param {Array} operationsArray - Array d'objets opération
 * @param {string} userId
 */
export async function creerOperations(operationsArray, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    if (!Array.isArray(operationsArray) || operationsArray.length === 0) {
      throw new Error("Le tableau d'opérations est vide ou invalide");
    }

    // Récupérer tous les comptes une seule fois pour optimisation
    const { comptes } = await getAllComptes();
    const { comptes: comptesT } = await getAllComptesTresorerie();
    const tousComptes = [...comptes, ...comptesT];

    const now = Date.now();
    const nouvellesOperations = [];

    // Valider et créer toutes les opérations
    for (const opData of operationsArray) {
      const compte = tousComptes.find((c) => c.id === opData.compte_id);
      if (!compte) {
        throw new Error(`Compte ${opData.compte_id} introuvable`);
      }

      // Vérifier cohérence type/catégorie
      if (compte.categorie === "entree" && opData.type_operation !== "entree") {
        throw new Error(`Le compte ${compte.denomination} n'accepte que des entrées`);
      }
      if (compte.categorie === "sortie" && opData.type_operation !== "sortie") {
        throw new Error(`Le compte ${compte.denomination} n'accepte que des sorties`);
      }

      const operation = {
        id: `op_${nanoid(12)}`,
        compte_id: opData.compte_id,
        compte_ohada: compte.code_ohada,
        compte_denomination: compte.denomination,
        montant: opData.montant,
        motif: opData.motif,
        type_operation: opData.type_operation,
        date: opData.date || now,
        createdBy: actualUserId,
        createdAt: now,
      };

      // Valider
      const validated = operationSchema.parse(operation);
      nouvellesOperations.push(validated);
    }

    // Récupérer les opérations actuelles
    const { operations: existingOps } = await getOperationsToday();
    const isFirstOperation = existingOps.length === 0;

    // Ajouter toutes les nouvelles opérations
    const allOperations = [...existingOps, ...nouvellesOperations];

    // Sauvegarder en une seule écriture
    const todayRef = doc(db, TODAY_DOC);
    await setDoc(todayRef, {
      operations: allOperations,
      lastUpdated: now,
    });

    // Invalider le cache pour forcer le rechargement
    clearCache(CACHE_KEY_TODAY);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "create_operations_bulk",
      count: nouvellesOperations.length,
      isFirstOperation,
      timestamp: now,
    });

    console.log(`✅ ${nouvellesOperations.length} opérations créées en bulk`);
    return nouvellesOperations;
  } catch (error) {
    console.error("❌ Erreur création opérations bulk:", error);
    throw error;
  }
}

/**
 * Met à jour une opération
 * @param {string} operationId
 * @param {Object} updates - {montant?, motif?, type_operation?}
 * @param {string} userId
 */
export async function updateOperation(operationId, updates, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Récupérer les opérations actuelles
    const { operations } = await getOperationsToday();

    // Trouver l'opération
    const index = operations.findIndex((op) => op.id === operationId);
    if (index === -1) {
      throw new Error(`Opération ${operationId} introuvable`);
    }

    // Si le type_operation change, vérifier la cohérence avec le compte
    if (updates.type_operation && updates.type_operation !== operations[index].type_operation) {
      const compte = await findCompteById(operations[index].compte_id);
      if (compte.categorie === "entree" && updates.type_operation !== "entree") {
        throw new Error(`Le compte ${compte.denomination} n'accepte que des entrées`);
      }
      if (compte.categorie === "sortie" && updates.type_operation !== "sortie") {
        throw new Error(`Le compte ${compte.denomination} n'accepte que des sorties`);
      }
    }

    // Mettre à jour
    const now = Date.now();
    const updatedOperation = {
      ...operations[index],
      ...updates,
      id: operationId, // Garder l'ID
      compte_id: operations[index].compte_id, // Ne pas changer le compte
      updatedBy: actualUserId,
      updatedAt: now,
    };

    // Valider
    const validated = operationSchema.parse(updatedOperation);
    operations[index] = validated;

    // Sauvegarder
    const todayRef = doc(db, TODAY_DOC);
    await setDoc(todayRef, {
      operations,
      lastUpdated: now,
    });

    // Invalider le cache pour forcer le rechargement
    clearCache(CACHE_KEY_TODAY);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "update_operation",
      operationId: validated.id,
      timestamp: now,
    });

    console.log(`✅ Opération mise à jour: ${validated.motif}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur mise à jour opération:", error);
    throw error;
  }
}

/**
 * Supprime une opération
 * @param {string} operationId
 * @param {string} userId
 */
export async function deleteOperation(operationId, userId = "system") {
  try {
    // Récupérer les opérations actuelles
    const { operations } = await getOperationsToday();

    // Trouver l'opération
    const index = operations.findIndex((op) => op.id === operationId);
    if (index === -1) {
      throw new Error(`Opération ${operationId} introuvable`);
    }

    const deletedOp = operations[index];

    // Retirer l'opération
    operations.splice(index, 1);

    // Sauvegarder
    const now = Date.now();
    const todayRef = doc(db, TODAY_DOC);
    await setDoc(todayRef, {
      operations,
      lastUpdated: now,
    });

    // Invalider le cache pour forcer le rechargement
    clearCache(CACHE_KEY_TODAY);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "delete_operation",
      operationId,
      compteId: deletedOp.compte_id,
      montant: deletedOp.montant,
      type: deletedOp.type_operation,
      timestamp: now,
    });

    console.log(`✅ Opération supprimée: ${deletedOp.motif}`);
    return deletedOp;
  } catch (error) {
    console.error("❌ Erreur suppression opération:", error);
    throw error;
  }
}

/**
 * Détecte si c'est la première opération du jour
 * @returns {Promise<boolean>}
 */
export async function isPremiereOperationDuJour() {
  try {
    const { operations } = await getOperationsToday();
    return operations.length === 0;
  } catch (error) {
    console.error("❌ Erreur détection première opération:", error);
    return false;
  }
}
