/**
 * bilans.js
 * Calcul des bilans comptables journaliers et hebdomadaires
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, push } from "firebase/database";
import { db, rtdb } from "../../../firebase.js";
import {
  BILAN_WEEKS_COLLECTION,
  RTDB_COMPTA_TRIGGER_PATH,
} from "./constants";
import { formatDayKey, formatWeekKey, getDaysInWeek } from "./utils";
import { getStatistiquesJour, getStatistiquesSemaine } from "./statistiques";
import { dayBilanSchema, weekBilanSchema } from "./schemas";

// ============================================================================
// FONCTIONS DE CALCUL DES BILANS
// ============================================================================

/**
 * Crée le bilan pour un jour donné
 * @param {string} dayKey - Format DDMMYYYY
 * @returns {Promise<Object>} Bilan du jour
 */
export async function creerBilanJour(dayKey = formatDayKey()) {
  try {
    console.log(`💰 Création du bilan pour ${dayKey}...`);

    // Récupérer les statistiques du jour
    const statistiques = await getStatistiquesJour(dayKey);

    if (!statistiques) {
      throw new Error(`Statistiques non trouvées pour ${dayKey}`);
    }

    // Calculer le résultat
    const total_entrees = statistiques.total_entrees || 0;
    const total_sorties = statistiques.total_sorties || 0;
    const resultat = total_entrees - total_sorties;

    // Déterminer le statut
    let statut = "equilibre";
    if (resultat > 0) {
      statut = "positif";
    } else if (resultat < 0) {
      statut = "negatif";
    }

    // Calculer les soldes de trésorerie
    const tresorerie_entrees = statistiques.tresorerie.reduce(
      (sum, t) => sum + (t.montant_total > 0 ? t.montant_total : 0),
      0
    );
    const tresorerie_sorties = statistiques.tresorerie.reduce(
      (sum, t) => sum + (t.montant_total < 0 ? Math.abs(t.montant_total) : 0),
      0
    );
    const solde_tresorerie = tresorerie_entrees - tresorerie_sorties;

    // Construire le bilan
    const bilan = {
      id: dayKey,
      total_entrees,
      total_sorties,
      resultat,
      statut,
      tresorerie_entrees,
      tresorerie_sorties,
      solde_tresorerie,
      nombre_operations: statistiques.nombre_operations,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Valider
    const validated = dayBilanSchema.parse(bilan);

    console.log(
      `✅ Bilan créé: ${validated.resultat >= 0 ? "+" : ""}${validated.resultat} FCFA (${validated.statut})`
    );

    return validated;
  } catch (error) {
    console.error("❌ Erreur création bilan jour:", error);
    throw error;
  }
}

/**
 * Crée et sauvegarde le bilan pour une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {Promise<Object>} Bilan de la semaine
 */
export async function creerBilanSemaine(weekKey = formatWeekKey()) {
  try {
    console.log(`💰 Création du bilan pour la semaine ${weekKey}...`);

    const [debut, fin] = weekKey.split("-");
    const jours = getDaysInWeek(weekKey);

    // Récupérer les statistiques de la semaine
    const statistiques = await getStatistiquesSemaine(weekKey);

    if (!statistiques) {
      throw new Error(`Statistiques non trouvées pour ${weekKey}`);
    }

    // Récupérer les bilans de chaque jour
    const joursBilans = [];
    for (const dayKey of jours) {
      try {
        const bilanJour = await creerBilanJour(dayKey);
        joursBilans.push(bilanJour);
      } catch (error) {
        console.warn(`⚠️ Erreur bilan pour ${dayKey}:`, error);
        // Créer un bilan vide pour ce jour
        joursBilans.push({
          id: dayKey,
          total_entrees: 0,
          total_sorties: 0,
          resultat: 0,
          statut: "equilibre",
          tresorerie_entrees: 0,
          tresorerie_sorties: 0,
          solde_tresorerie: 0,
          nombre_operations: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Agréger les bilans des jours
    let total_entrees = 0;
    let total_sorties = 0;
    let tresorerie_entrees = 0;
    let tresorerie_sorties = 0;
    let nombre_operations = 0;

    joursBilans.forEach((bilanJour) => {
      total_entrees += bilanJour.total_entrees;
      total_sorties += bilanJour.total_sorties;
      tresorerie_entrees += bilanJour.tresorerie_entrees;
      tresorerie_sorties += bilanJour.tresorerie_sorties;
      nombre_operations += bilanJour.nombre_operations;
    });

    const resultat = total_entrees - total_sorties;
    const solde_tresorerie = tresorerie_entrees - tresorerie_sorties;

    // Déterminer le statut
    let statut = "equilibre";
    if (resultat > 0) {
      statut = "positif";
    } else if (resultat < 0) {
      statut = "negatif";
    }

    // Construire les statistiques de comptes et trésorerie
    const compte_statistiques = statistiques.comptes.map((c) => ({
      compte_id: c.compte_id,
      code_ohada: c.code_ohada,
      denomination: c.denomination,
      categorie: c.categorie,
      nombre_operations: c.nombre_operations,
      montant_total: c.montant_total,
    }));

    const tresorerie_statistiques = statistiques.tresorerie.map((t) => ({
      compte_id: t.compte_id,
      code_ohada: t.code_ohada,
      denomination: t.denomination,
      categorie: t.categorie,
      nombre_operations: t.nombre_operations,
      montant_total: t.montant_total,
    }));

    // Construire le bilan
    const bilan = {
      id: weekKey,
      debut,
      fin,
      jours: joursBilans,
      total_entrees,
      total_sorties,
      resultat,
      statut,
      tresorerie_entrees,
      tresorerie_sorties,
      solde_tresorerie,
      nombre_operations,
      compte_statistiques,
      tresorerie_statistiques,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Valider
    const validated = weekBilanSchema.parse(bilan);

    // Sauvegarder
    const weekRef = doc(db, `${BILAN_WEEKS_COLLECTION}/${weekKey}`);
    await setDoc(weekRef, validated);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "bilan_week_created",
      weekKey,
      resultat: validated.resultat,
      statut: validated.statut,
      timestamp: Date.now(),
    });

    console.log(
      `✅ Bilan semaine sauvegardé: ${validated.resultat >= 0 ? "+" : ""}${validated.resultat} FCFA (${validated.statut})`
    );

    return validated;
  } catch (error) {
    console.error("❌ Erreur création bilan semaine:", error);
    throw error;
  }
}

/**
 * Récupère le bilan d'un jour
 * @param {string} dayKey - Format DDMMYYYY
 * @returns {Promise<Object>} Bilan du jour
 */
export async function getBilanJour(dayKey) {
  try {
    // Les bilans journaliers ne sont pas stockés individuellement
    // On les calcule à la demande
    return await creerBilanJour(dayKey);
  } catch (error) {
    console.error("❌ Erreur récupération bilan jour:", error);
    throw error;
  }
}

/**
 * Récupère le bilan d'une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {Promise<Object>} Bilan de la semaine
 */
export async function getBilanSemaine(weekKey) {
  try {
    const weekRef = doc(db, `${BILAN_WEEKS_COLLECTION}/${weekKey}`);
    const weekSnap = await getDoc(weekRef);

    if (!weekSnap.exists()) {
      console.log(`ℹ️ Aucun bilan pour la semaine ${weekKey}, calcul...`);
      return await creerBilanSemaine(weekKey);
    }

    return weekBilanSchema.parse(weekSnap.data());
  } catch (error) {
    console.error("❌ Erreur récupération bilan semaine:", error);
    throw error;
  }
}

/**
 * Met à jour le bilan de la semaine en cours
 * Cette fonction est appelée via trigger RTDB
 */
export async function updateBilanSemaineEnCours() {
  try {
    const currentWeek = formatWeekKey();
    console.log("🔄 Mise à jour du bilan de la semaine en cours...");

    const bilan = await creerBilanSemaine(currentWeek);

    console.log("✅ Bilan de la semaine mis à jour");

    return bilan;
  } catch (error) {
    console.error("❌ Erreur mise à jour bilan semaine:", error);
    throw error;
  }
}

/**
 * Récupère les bilans de plusieurs semaines (pour les graphiques)
 * @param {number} nombreSemaines - Nombre de semaines à récupérer (par défaut 4)
 * @returns {Promise<Array>} Array de bilans hebdomadaires
 */
export async function getBilansPlusieuresSemaines(nombreSemaines = 4) {
  try {
    console.log(`📊 Récupération des bilans des ${nombreSemaines} dernières semaines...`);

    const bilans = [];
    const today = new Date();

    for (let i = 0; i < nombreSemaines; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() - i * 7);
      const weekKey = formatWeekKey(weekDate);

      try {
        const bilan = await getBilanSemaine(weekKey);
        bilans.push(bilan);
      } catch (error) {
        console.warn(`⚠️ Erreur récupération bilan ${weekKey}:`, error);
      }
    }

    // Trier par ordre chronologique (plus ancienne en premier)
    bilans.sort((a, b) => {
      const dateA = a.debut;
      const dateB = b.debut;
      return dateA.localeCompare(dateB);
    });

    console.log(`✅ ${bilans.length} bilans récupérés`);

    return bilans;
  } catch (error) {
    console.error("❌ Erreur récupération bilans multiples:", error);
    throw error;
  }
}

/**
 * Récupère les bilans de plusieurs jours (pour les graphiques)
 * @param {Array<string>} dayKeys - Array de clés de jours (format DDMMYYYY)
 * @returns {Promise<Array>} Array de bilans journaliers
 */
export async function getBilansPlusieursJours(dayKeys) {
  try {
    console.log(`📊 Récupération des bilans de ${dayKeys.length} jours...`);

    const bilans = [];

    for (const dayKey of dayKeys) {
      try {
        const bilan = await getBilanJour(dayKey);
        bilans.push(bilan);
      } catch (error) {
        console.warn(`⚠️ Erreur récupération bilan ${dayKey}:`, error);
      }
    }

    console.log(`✅ ${bilans.length} bilans récupérés`);

    return bilans;
  } catch (error) {
    console.error("❌ Erreur récupération bilans multiples jours:", error);
    throw error;
  }
}
