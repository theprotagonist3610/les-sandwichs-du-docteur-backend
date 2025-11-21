/**
 * budgetAnalysis.js
 * Fonctions d'analyse détaillée des budgets avec analyse des motifs d'opérations
 */

import { getOperationsByDay } from "./operations";
import { getDaysInMonth } from "./utils";

/**
 * Analyse les motifs pour une ligne budgétaire given
 * @param {Object} ligneBudget - Ligne budgétaire avec compte_id
 * @param {string} moisKey - Format MMYYYY
 * @returns {Promise<Object>} Analyse des motifs
 */
export async function analyserMotifsLigneBudget(ligneBudget, moisKey) {
  try {
    console.log(`🔍 Analyse motifs pour ${ligneBudget.denomination} du mois ${moisKey}...`);

    // Récupérer tous les jours du mois
    const jours = getDaysInMonth(moisKey);

    // Récupérer toutes les opérations du mois pour ce compte
    const operationsCompte = [];

    for (const dayKey of jours) {
      try {
        const { operations } = await getOperationsByDay(dayKey);
        const opsCompte = operations.filter(
          (op) => op.compte_id === ligneBudget.compte_id
        );
        operationsCompte.push(...opsCompte);
      } catch (error) {
        // Jour sans opérations, on continue
        continue;
      }
    }

    if (operationsCompte.length === 0) {
      return {
        disponible: false,
        raison: "Aucune opération enregistrée pour ce compte",
        nombreOperations: 0,
      };
    }

    // Grouper par motif
    const motifsMap = new Map();

    operationsCompte.forEach((op) => {
      const motif = op.motif || "Non spécifié";

      if (!motifsMap.has(motif)) {
        motifsMap.set(motif, {
          motif,
          nombreOperations: 0,
          montantTotal: 0,
          montantMoyen: 0,
          operations: [],
        });
      }

      const motifData = motifsMap.get(motif);
      motifData.nombreOperations++;
      motifData.montantTotal += op.montant;
      motifData.operations.push({
        id: op.id,
        date: op.date,
        montant: op.montant,
      });
    });

    // Calculer montant moyen et trier
    const motifsArray = Array.from(motifsMap.values()).map((motifData) => ({
      ...motifData,
      montantMoyen: motifData.montantTotal / motifData.nombreOperations,
      pourcentageOccurrences:
        (motifData.nombreOperations / operationsCompte.length) * 100,
      pourcentageMontant:
        (motifData.montantTotal / ligneBudget.montant_realise) * 100,
    }));

    // Trier par nombre d'occurrences
    const plusCourants = [...motifsArray]
      .sort((a, b) => b.nombreOperations - a.nombreOperations)
      .slice(0, 5);

    // Trier par montant total
    const plusGourmands = [...motifsArray]
      .sort((a, b) => b.montantTotal - a.montantTotal)
      .slice(0, 5);

    // Statistiques globales
    const nombreMotifsUniques = motifsArray.length;
    const motifDominant = plusGourmands[0];

    const analyse = {
      disponible: true,
      nombreOperations: operationsCompte.length,
      nombreMotifsUniques,
      montantTotal: ligneBudget.montant_realise,
      motifDominant: {
        motif: motifDominant.motif,
        montantTotal: motifDominant.montantTotal,
        pourcentage: motifDominant.pourcentageMontant,
        nombreOperations: motifDominant.nombreOperations,
      },
      top5Courants: plusCourants.map((m) => ({
        motif: m.motif,
        nombreOperations: m.nombreOperations,
        pourcentageOccurrences: Math.round(m.pourcentageOccurrences * 100) / 100,
        montantTotal: m.montantTotal,
      })),
      top5Gourmands: plusGourmands.map((m) => ({
        motif: m.motif,
        montantTotal: m.montantTotal,
        pourcentageMontant: Math.round(m.pourcentageMontant * 100) / 100,
        nombreOperations: m.nombreOperations,
        montantMoyen: Math.round(m.montantMoyen),
      })),
      tousLesMotifs: motifsArray
        .sort((a, b) => b.montantTotal - a.montantTotal)
        .map((m) => ({
          motif: m.motif,
          nombreOperations: m.nombreOperations,
          montantTotal: m.montantTotal,
          montantMoyen: Math.round(m.montantMoyen),
          pourcentageOccurrences: Math.round(m.pourcentageOccurrences * 100) / 100,
          pourcentageMontant: Math.round(m.pourcentageMontant * 100) / 100,
        })),
    };

    console.log(
      `✅ Analyse terminée: ${nombreMotifsUniques} motifs uniques, ${operationsCompte.length} opérations`
    );

    return analyse;
  } catch (error) {
    console.error("❌ Erreur analyse motifs:", error);
    return {
      disponible: false,
      raison: "Erreur lors de l'analyse des motifs",
      nombreOperations: 0,
    };
  }
}

/**
 * Analyse les motifs pour toutes les lignes d'un budget
 * @param {Object} budget - Budget avec lignes_budget_avec_realisation
 * @returns {Promise<Map>} Map des analyses par compte_id
 */
export async function analyserMotifsBudgetComplet(budget) {
  try {
    console.log(`🔍 Analyse complète des motifs pour le budget ${budget.id}...`);

    const analysesMap = new Map();

    for (const ligne of budget.lignes_budget_avec_realisation) {
      // Analyser seulement les lignes avec des opérations
      if (ligne.nombre_operations > 0) {
        const analyse = await analyserMotifsLigneBudget(ligne, budget.mois);
        analysesMap.set(ligne.compte_id, analyse);
      }
    }

    console.log(`✅ Analyse complète terminée: ${analysesMap.size} lignes analysées`);

    return analysesMap;
  } catch (error) {
    console.error("❌ Erreur analyse budget complet:", error);
    return new Map();
  }
}
