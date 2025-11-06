/**
 * statistiques.js
 * Calcul des statistiques comptables journalières et hebdomadaires
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, push } from "firebase/database";
import { db, rtdb } from "../../../firebase.js";
import {
  STATISTIQUES_WEEKS_COLLECTION,
  RTDB_COMPTA_TRIGGER_PATH,
} from "./constants";
import { formatDayKey, formatWeekKey, getDaysInWeek } from "./utils";
import { getOperationsToday, getOperationsByDay } from "./operations";
import { getAllComptes, getAllComptesTresorerie } from "./comptes";
import { dayStatisticSchema, weekStatisticSchema } from "./schemas";

// ============================================================================
// FONCTIONS DE CALCUL DES STATISTIQUES
// ============================================================================

/**
 * Calcule les statistiques pour un jour donné
 * @param {string} dayKey - Format DDMMYYYY
 * @returns {Promise<Object>} Statistiques du jour
 */
export async function calculerStatistiquesJour(dayKey = formatDayKey()) {
  try {
    console.log(`📊 Calcul des statistiques pour ${dayKey}...`);

    // Récupérer les opérations du jour
    const isToday = dayKey === formatDayKey();
    const { operations } = isToday
      ? await getOperationsToday()
      : await getOperationsByDay(dayKey);

    if (operations.length === 0) {
      console.log(`ℹ️ Aucune opération pour ${dayKey}`);
      const emptyStats = {
        id: dayKey,
        comptes: [],
        tresorerie: [],
        total_entrees: 0,
        total_sorties: 0,
        solde_journalier: 0,
        nombre_operations: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return dayStatisticSchema.parse(emptyStats);
    }

    // Récupérer les comptes pour identifier trésorerie
    const { comptes: allComptes } = await getAllComptes();
    const { comptes: allTreso } = await getAllComptesTresorerie();

    // Grouper les opérations par compte_id
    const comptesMap = new Map();
    const tresorerieMap = new Map();

    operations.forEach((op) => {
      const isTresorerie = op.compte_id.startsWith("tresor_");
      const map = isTresorerie ? tresorerieMap : comptesMap;

      if (!map.has(op.compte_id)) {
        // Trouver le compte
        const compte = isTresorerie
          ? allTreso.find((c) => c.id === op.compte_id)
          : allComptes.find((c) => c.id === op.compte_id);

        if (!compte) {
          console.warn(`⚠️ Compte ${op.compte_id} introuvable`);
          return;
        }

        map.set(op.compte_id, {
          compte_id: op.compte_id,
          code_ohada: compte.code_ohada,
          denomination: compte.denomination,
          categorie: compte.categorie,
          nombre_operations: 0,
          montant_total: 0,
        });
      }

      const stat = map.get(op.compte_id);
      stat.nombre_operations += 1;
      stat.montant_total += op.montant;
    });

    // Calculer totaux
    let total_entrees = 0;
    let total_sorties = 0;

    operations.forEach((op) => {
      if (op.type_operation === "entree") {
        total_entrees += op.montant;
      } else {
        total_sorties += op.montant;
      }
    });

    const solde_journalier = total_entrees - total_sorties;

    // Construire les statistiques
    const statistiques = {
      id: dayKey,
      comptes: Array.from(comptesMap.values()),
      tresorerie: Array.from(tresorerieMap.values()),
      total_entrees,
      total_sorties,
      solde_journalier,
      nombre_operations: operations.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Valider
    const validated = dayStatisticSchema.parse(statistiques);

    console.log(`✅ Statistiques calculées: ${validated.nombre_operations} opérations, solde: ${validated.solde_journalier} FCFA`);

    return validated;
  } catch (error) {
    console.error("❌ Erreur calcul statistiques jour:", error);
    throw error;
  }
}

/**
 * Calcule et sauvegarde les statistiques d'une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {Promise<Object>} Statistiques de la semaine
 */
export async function calculerStatistiquesSemaine(weekKey = formatWeekKey()) {
  try {
    console.log(`📊 Calcul des statistiques pour la semaine ${weekKey}...`);

    const [debut, fin] = weekKey.split("-");
    const jours = getDaysInWeek(weekKey);

    // Récupérer les stats de chaque jour
    const joursStats = [];
    for (const dayKey of jours) {
      try {
        const dayStats = await calculerStatistiquesJour(dayKey);
        joursStats.push(dayStats);
      } catch (error) {
        console.warn(`⚠️ Erreur stats pour ${dayKey}:`, error);
      }
    }

    // Agréger les données
    const comptesMap = new Map();
    const tresorerieMap = new Map();

    let total_entrees = 0;
    let total_sorties = 0;
    let nombre_operations = 0;

    joursStats.forEach((dayStats) => {
      total_entrees += dayStats.total_entrees;
      total_sorties += dayStats.total_sorties;
      nombre_operations += dayStats.nombre_operations;

      // Agréger comptes
      dayStats.comptes.forEach((c) => {
        if (!comptesMap.has(c.compte_id)) {
          comptesMap.set(c.compte_id, {
            ...c,
            nombre_operations: 0,
            montant_total: 0,
          });
        }
        const stat = comptesMap.get(c.compte_id);
        stat.nombre_operations += c.nombre_operations;
        stat.montant_total += c.montant_total;
      });

      // Agréger trésorerie
      dayStats.tresorerie.forEach((t) => {
        if (!tresorerieMap.has(t.compte_id)) {
          tresorerieMap.set(t.compte_id, {
            ...t,
            nombre_operations: 0,
            montant_total: 0,
          });
        }
        const stat = tresorerieMap.get(t.compte_id);
        stat.nombre_operations += t.nombre_operations;
        stat.montant_total += t.montant_total;
      });
    });

    const solde_hebdomadaire = total_entrees - total_sorties;

    // Construire les statistiques
    const statistiques = {
      id: weekKey,
      debut,
      fin,
      jours: joursStats,
      comptes: Array.from(comptesMap.values()),
      tresorerie: Array.from(tresorerieMap.values()),
      total_entrees,
      total_sorties,
      solde_hebdomadaire,
      nombre_operations,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Valider
    const validated = weekStatisticSchema.parse(statistiques);

    // Sauvegarder
    const weekRef = doc(db, `${STATISTIQUES_WEEKS_COLLECTION}/${weekKey}`);
    await setDoc(weekRef, validated);

    console.log(`✅ Statistiques semaine sauvegardées: ${validated.nombre_operations} opérations`);

    return validated;
  } catch (error) {
    console.error("❌ Erreur calcul statistiques semaine:", error);
    throw error;
  }
}

/**
 * Met à jour les statistiques en temps réel après une opération
 * Cette fonction est appelée via trigger RTDB
 */
export async function updateStatistiquesEnTempsReel() {
  try {
    const today = formatDayKey();
    const currentWeek = formatWeekKey();

    console.log("🔄 Mise à jour des statistiques en temps réel...");

    // Recalculer les stats du jour
    const dayStats = await calculerStatistiquesJour(today);

    // Recalculer les stats de la semaine
    await calculerStatistiquesSemaine(currentWeek);

    // Trigger RTDB pour notifier les hooks
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "stats_updated",
      dayKey: today,
      weekKey: currentWeek,
      timestamp: Date.now(),
    });

    console.log("✅ Statistiques mises à jour");

    return dayStats;
  } catch (error) {
    console.error("❌ Erreur mise à jour statistiques temps réel:", error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'un jour depuis la semaine
 * @param {string} dayKey - Format DDMMYYYY
 * @returns {Promise<Object>} Statistiques du jour
 */
export async function getStatistiquesJour(dayKey) {
  try {
    // Trouver la semaine correspondante
    const date = new Date(
      parseInt(dayKey.substring(4, 8)), // year
      parseInt(dayKey.substring(2, 4)) - 1, // month (0-indexed)
      parseInt(dayKey.substring(0, 2)) // day
    );
    const weekKey = formatWeekKey(date);

    // Récupérer les stats de la semaine
    const weekRef = doc(db, `${STATISTIQUES_WEEKS_COLLECTION}/${weekKey}`);
    const weekSnap = await getDoc(weekRef);

    if (!weekSnap.exists()) {
      console.log(`ℹ️ Aucune statistique pour la semaine ${weekKey}`);
      // Calculer si n'existe pas
      await calculerStatistiquesSemaine(weekKey);
      const newSnap = await getDoc(weekRef);
      if (!newSnap.exists()) {
        throw new Error("Impossible de créer les statistiques");
      }
      return newSnap.data().jours.find((j) => j.id === dayKey) || null;
    }

    const weekData = weekStatisticSchema.parse(weekSnap.data());
    const dayStats = weekData.jours.find((j) => j.id === dayKey);

    if (!dayStats) {
      console.log(`ℹ️ Stats du jour ${dayKey} non trouvées, recalcul...`);
      return await calculerStatistiquesJour(dayKey);
    }

    return dayStats;
  } catch (error) {
    console.error("❌ Erreur récupération statistiques jour:", error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {Promise<Object>} Statistiques de la semaine
 */
export async function getStatistiquesSemaine(weekKey) {
  try {
    const weekRef = doc(db, `${STATISTIQUES_WEEKS_COLLECTION}/${weekKey}`);
    const weekSnap = await getDoc(weekRef);

    if (!weekSnap.exists()) {
      console.log(`ℹ️ Aucune statistique pour la semaine ${weekKey}, calcul...`);
      return await calculerStatistiquesSemaine(weekKey);
    }

    return weekStatisticSchema.parse(weekSnap.data());
  } catch (error) {
    console.error("❌ Erreur récupération statistiques semaine:", error);
    throw error;
  }
}
