/**
 * @fileoverview Module de comparaisons financières
 * Permet de comparer différentes périodes pour analyser l'évolution
 */

import { getStatistiquesByMonth, getStatistiquesJour, getStatistiquesSemaine } from "./statistiques";
import { formatDayKey, formatWeekKey, formatMonthKey } from "./utils";

/**
 * Compare deux mois
 * @param {string} mois1Key - Premier mois (format MMYYYY)
 * @param {string} mois2Key - Deuxième mois (format MMYYYY)
 * @returns {Promise<Object>} Comparaison détaillée
 */
export async function comparerDeuxMois(mois1Key, mois2Key) {
  const [stats1, stats2] = await Promise.all([
    getStatistiquesByMonth(mois1Key),
    getStatistiquesByMonth(mois2Key),
  ]);

  if (!stats1 || !stats2) {
    throw new Error("Impossible de charger les statistiques des mois à comparer");
  }

  // Calculer les variations
  const variationEntrees = stats2.total_entrees - stats1.total_entrees;
  const variationSorties = stats2.total_sorties - stats1.total_sorties;
  const variationSolde = (stats2.total_entrees - stats2.total_sorties) - (stats1.total_entrees - stats1.total_sorties);

  const tauxVariationEntrees = stats1.total_entrees > 0
    ? (variationEntrees / stats1.total_entrees) * 100
    : 0;
  const tauxVariationSorties = stats1.total_sorties > 0
    ? (variationSorties / stats1.total_sorties) * 100
    : 0;

  // Comparer par compte
  const comptesComparaison = [];
  const comptesMap1 = new Map(stats1.comptes.map(c => [c.compte_id, c]));
  const comptesMap2 = new Map(stats2.comptes.map(c => [c.compte_id, c]));

  const tousComptesIds = new Set([...comptesMap1.keys(), ...comptesMap2.keys()]);

  tousComptesIds.forEach(compteId => {
    const compte1 = comptesMap1.get(compteId);
    const compte2 = comptesMap2.get(compteId);

    if (compte1 || compte2) {
      const montant1 = compte1?.montant_total || 0;
      const montant2 = compte2?.montant_total || 0;
      const variation = montant2 - montant1;
      const tauxVariation = montant1 > 0 ? (variation / montant1) * 100 : (montant2 > 0 ? 100 : 0);

      comptesComparaison.push({
        compte_id: compteId,
        code_ohada: (compte2 || compte1).code_ohada,
        denomination: (compte2 || compte1).denomination,
        categorie: (compte2 || compte1).categorie,
        montant_periode1: montant1,
        montant_periode2: montant2,
        variation_absolue: variation,
        variation_pourcentage: tauxVariation,
      });
    }
  });

  // Trier par variation absolue décroissante
  comptesComparaison.sort((a, b) => Math.abs(b.variation_absolue) - Math.abs(a.variation_absolue));

  return {
    periode1: { mois: mois1Key, stats: stats1 },
    periode2: { mois: mois2Key, stats: stats2 },
    variations: {
      entrees: {
        absolue: variationEntrees,
        pourcentage: tauxVariationEntrees,
      },
      sorties: {
        absolue: variationSorties,
        pourcentage: tauxVariationSorties,
      },
      solde: {
        absolue: variationSolde,
      },
    },
    comptes: comptesComparaison,
    top_hausses: comptesComparaison.filter(c => c.variation_absolue > 0).slice(0, 5),
    top_baisses: comptesComparaison.filter(c => c.variation_absolue < 0).slice(0, 5),
  };
}

/**
 * Compare le mois en cours avec le mois précédent
 * @returns {Promise<Object>} Comparaison mois vs mois précédent
 */
export async function comparerMoisVsMoisPrecedent() {
  const maintenant = new Date();
  const moisActuel = formatMonthKey(maintenant);

  const moisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
  const moisPrecedentKey = formatMonthKey(moisPrecedent);

  return comparerDeuxMois(moisPrecedentKey, moisActuel);
}

/**
 * Compare deux années complètes
 * @param {number} annee1 - Première année (ex: 2024)
 * @param {number} annee2 - Deuxième année (ex: 2025)
 * @returns {Promise<Object>} Comparaison annuelle détaillée
 */
export async function comparerDeuxAnnees(annee1, annee2) {
  const moisAnnee1 = [];
  const moisAnnee2 = [];

  // Charger tous les mois des deux années
  for (let m = 1; m <= 12; m++) {
    const moisKey1 = m.toString().padStart(2, "0") + annee1.toString();
    const moisKey2 = m.toString().padStart(2, "0") + annee2.toString();

    const [stats1, stats2] = await Promise.all([
      getStatistiquesByMonth(moisKey1).catch(() => null),
      getStatistiquesByMonth(moisKey2).catch(() => null),
    ]);

    if (stats1) moisAnnee1.push({ mois: moisKey1, stats: stats1 });
    if (stats2) moisAnnee2.push({ mois: moisKey2, stats: stats2 });
  }

  // Calculer les totaux annuels
  const totalAnnee1 = {
    entrees: moisAnnee1.reduce((sum, m) => sum + m.stats.total_entrees, 0),
    sorties: moisAnnee1.reduce((sum, m) => sum + m.stats.total_sorties, 0),
    operations: moisAnnee1.reduce((sum, m) => sum + (m.stats.nombre_operations || 0), 0),
  };

  const totalAnnee2 = {
    entrees: moisAnnee2.reduce((sum, m) => sum + m.stats.total_entrees, 0),
    sorties: moisAnnee2.reduce((sum, m) => sum + m.stats.total_sorties, 0),
    operations: moisAnnee2.reduce((sum, m) => sum + (m.stats.nombre_operations || 0), 0),
  };

  totalAnnee1.solde = totalAnnee1.entrees - totalAnnee1.sorties;
  totalAnnee2.solde = totalAnnee2.entrees - totalAnnee2.sorties;

  // Variations
  const variations = {
    entrees: {
      absolue: totalAnnee2.entrees - totalAnnee1.entrees,
      pourcentage: totalAnnee1.entrees > 0
        ? ((totalAnnee2.entrees - totalAnnee1.entrees) / totalAnnee1.entrees) * 100
        : 0,
    },
    sorties: {
      absolue: totalAnnee2.sorties - totalAnnee1.sorties,
      pourcentage: totalAnnee1.sorties > 0
        ? ((totalAnnee2.sorties - totalAnnee1.sorties) / totalAnnee1.sorties) * 100
        : 0,
    },
    solde: {
      absolue: totalAnnee2.solde - totalAnnee1.solde,
    },
    operations: {
      absolue: totalAnnee2.operations - totalAnnee1.operations,
      pourcentage: totalAnnee1.operations > 0
        ? ((totalAnnee2.operations - totalAnnee1.operations) / totalAnnee1.operations) * 100
        : 0,
    },
  };

  // Comparaison mois par mois
  const comparaisonMensuelle = [];
  for (let m = 1; m <= 12; m++) {
    const mois1 = moisAnnee1.find(mm => mm.mois.startsWith(m.toString().padStart(2, "0")));
    const mois2 = moisAnnee2.find(mm => mm.mois.startsWith(m.toString().padStart(2, "0")));

    if (mois1 || mois2) {
      const entrees1 = mois1?.stats.total_entrees || 0;
      const entrees2 = mois2?.stats.total_entrees || 0;
      const sorties1 = mois1?.stats.total_sorties || 0;
      const sorties2 = mois2?.stats.total_sorties || 0;

      comparaisonMensuelle.push({
        mois: m,
        mois_nom: new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' }),
        annee1: {
          entrees: entrees1,
          sorties: sorties1,
          solde: entrees1 - sorties1,
        },
        annee2: {
          entrees: entrees2,
          sorties: sorties2,
          solde: entrees2 - sorties2,
        },
        variation_entrees: entrees2 - entrees1,
        variation_sorties: sorties2 - sorties1,
      });
    }
  }

  return {
    annee1: {
      annee: annee1,
      nb_mois: moisAnnee1.length,
      totaux: totalAnnee1,
    },
    annee2: {
      annee: annee2,
      nb_mois: moisAnnee2.length,
      totaux: totalAnnee2,
    },
    variations,
    comparaison_mensuelle: comparaisonMensuelle,
  };
}

/**
 * Compare budget vs réalisations pour un mois
 * @param {string} budgetId - ID du budget
 * @param {string} moisKey - Mois à comparer (format MMYYYY)
 * @returns {Promise<Object>} Comparaison budget vs réel
 */
export async function comparerBudgetVsReel(budgetId, moisKey) {
  const { calculerRealisationBudget } = await import("./budgets");
  const budgetAvecRealisation = await calculerRealisationBudget(budgetId);

  const stats = await getStatistiquesByMonth(moisKey);

  if (!stats) {
    throw new Error("Statistiques non disponibles pour ce mois");
  }

  // Comparer ligne par ligne
  const lignesComparaison = budgetAvecRealisation.lignes_budget_avec_realisation.map(ligne => ({
    compte_id: ligne.compte_id,
    code_ohada: ligne.code_ohada,
    denomination: ligne.denomination,
    categorie: ligne.categorie,
    budget: ligne.montant_previsionnel,
    realise: ligne.montant_realise,
    ecart: ligne.montant_realise - ligne.montant_previsionnel,
    taux_realisation: ligne.taux_realisation,
    alerte: ligne.alerte_active,
  }));

  return {
    budget: {
      id: budgetAvecRealisation.id,
      nom: budgetAvecRealisation.nom,
      mois: budgetAvecRealisation.mois,
      montant_total: budgetAvecRealisation.montant_total_previsionnel,
    },
    realisations: {
      mois: moisKey,
      montant_total: budgetAvecRealisation.montant_total_realise,
    },
    ecart_global: budgetAvecRealisation.montant_total_realise - budgetAvecRealisation.montant_total_previsionnel,
    taux_realisation_global: budgetAvecRealisation.taux_realisation_global,
    lignes: lignesComparaison,
    top_depassements: lignesComparaison
      .filter(l => l.ecart > 0)
      .sort((a, b) => b.ecart - a.ecart)
      .slice(0, 5),
    top_economies: lignesComparaison
      .filter(l => l.ecart < 0)
      .sort((a, b) => a.ecart - b.ecart)
      .slice(0, 5),
  };
}

/**
 * Génère une matrice de comparaison multi-périodes
 * @param {Array<string>} periodesKeys - Liste des clés de périodes (mois)
 * @returns {Promise<Object>} Matrice de comparaison
 */
export async function genererMatriceComparaison(periodesKeys) {
  const periodes = await Promise.all(
    periodesKeys.map(async (key) => {
      const stats = await getStatistiquesByMonth(key);
      return { key, stats };
    })
  );

  // Calculer la moyenne
  const totalEntrees = periodes.reduce((sum, p) => sum + (p.stats?.total_entrees || 0), 0);
  const totalSorties = periodes.reduce((sum, p) => sum + (p.stats?.total_sorties || 0), 0);
  const nbPeriodes = periodes.filter(p => p.stats).length;

  const moyenne = {
    entrees: totalEntrees / nbPeriodes,
    sorties: totalSorties / nbPeriodes,
    solde: (totalEntrees - totalSorties) / nbPeriodes,
  };

  // Comparer chaque période à la moyenne
  const comparaisons = periodes.map(p => {
    if (!p.stats) return null;

    const ecartEntrees = p.stats.total_entrees - moyenne.entrees;
    const ecartSorties = p.stats.total_sorties - moyenne.sorties;
    const solde = p.stats.total_entrees - p.stats.total_sorties;
    const ecartSolde = solde - moyenne.solde;

    return {
      periode: p.key,
      entrees: p.stats.total_entrees,
      sorties: p.stats.total_sorties,
      solde,
      ecart_moyenne_entrees: ecartEntrees,
      ecart_moyenne_sorties: ecartSorties,
      ecart_moyenne_solde: ecartSolde,
      performance: solde >= moyenne.solde ? "superieur" : "inferieur",
    };
  }).filter(Boolean);

  return {
    periodes: periodesKeys,
    nb_periodes: nbPeriodes,
    moyenne,
    comparaisons,
    meilleure_periode: comparaisons.reduce((best, curr) =>
      curr.solde > best.solde ? curr : best
    , comparaisons[0]),
    pire_periode: comparaisons.reduce((worst, curr) =>
      curr.solde < worst.solde ? curr : worst
    , comparaisons[0]),
  };
}
