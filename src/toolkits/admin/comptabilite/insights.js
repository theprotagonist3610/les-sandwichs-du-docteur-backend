/**
 * @fileoverview Module d'insights et recommandations automatiques
 * Analyse les données comptables et génère des insights actionnables
 */

import { getStatistiquesByMonth } from "./statistiques";
import { formatMonthKey } from "./utils";

/**
 * Génère des insights automatiques pour un mois
 * @param {string} moisKey - Mois à analyser (format MMYYYY)
 * @param {Object} options - Options { includeHistorique: boolean }
 * @returns {Promise<Object>} Insights et recommandations
 */
export async function genererInsightsMois(moisKey, options = {}) {
  const { includeHistorique = true } = options;

  const stats = await getStatistiquesByMonth(moisKey);
  if (!stats) {
    throw new Error("Statistiques non disponibles pour ce mois");
  }

  const insights = [];
  const alertes = [];
  const recommandations = [];
  const ratios = {};

  // === ANALYSE DE BASE ===
  const solde = stats.total_entrees - stats.total_sorties;
  const margeGlobale = stats.total_entrees > 0
    ? (solde / stats.total_entrees) * 100
    : 0;

  ratios.marge_globale = margeGlobale;
  ratios.taux_conversion = stats.total_entrees > 0
    ? (stats.total_sorties / stats.total_entrees) * 100
    : 0;

  // Insight : Rentabilité
  if (solde > 0) {
    insights.push({
      type: "positif",
      categorie: "rentabilite",
      titre: "Mois rentable",
      message: `Votre activité a généré un excédent de ${solde.toLocaleString()} FCFA ce mois-ci.`,
      valeur: solde,
      indicateur: "solde",
    });
  } else if (solde < 0) {
    alertes.push({
      type: "negatif",
      severite: "haute",
      categorie: "rentabilite",
      titre: "Déficit mensuel",
      message: `Vos dépenses dépassent vos revenus de ${Math.abs(solde).toLocaleString()} FCFA.`,
      valeur: solde,
      indicateur: "solde",
    });

    recommandations.push({
      priorite: "haute",
      categorie: "reduction_couts",
      titre: "Réduire les dépenses",
      description: "Analysez vos comptes de charges pour identifier les postes à optimiser.",
      actions: [
        "Examinez les top 5 comptes de sorties",
        "Négociez avec vos fournisseurs principaux",
        "Éliminez les dépenses non essentielles",
      ],
    });
  }

  // === ANALYSE PAR COMPTE ===

  // Top comptes de charges
  const topCharges = stats.comptes
    .filter(c => c.categorie === "sortie")
    .sort((a, b) => b.montant_total - a.montant_total)
    .slice(0, 3);

  if (topCharges.length > 0) {
    const chargesPrincipale = topCharges[0];
    const ratioChargePrincipale = stats.total_sorties > 0
      ? (chargesPrincipale.montant_total / stats.total_sorties) * 100
      : 0;

    ratios.charge_principale = ratioChargePrincipale;

    if (ratioChargePrincipale > 40) {
      insights.push({
        type: "attention",
        categorie: "concentration_charges",
        titre: "Concentration des charges",
        message: `Le compte "${chargesPrincipale.denomination}" représente ${ratioChargePrincipale.toFixed(1)}% de vos dépenses totales.`,
        valeur: ratioChargePrincipale,
        compte: chargesPrincipale,
      });

      recommandations.push({
        priorite: "moyenne",
        categorie: "diversification",
        titre: "Diversifier les fournisseurs",
        description: `Votre dépendance au poste "${chargesPrincipale.denomination}" est élevée. Envisagez de diversifier.`,
        actions: [
          "Rechercher des fournisseurs alternatifs",
          "Négocier des prix de gros",
          "Mettre en place des contrats cadres",
        ],
      });
    }
  }

  // Ratio charges/CA
  if (stats.total_entrees > 0) {
    const ratioChargesCA = (stats.total_sorties / stats.total_entrees) * 100;
    ratios.charges_sur_ca = ratioChargesCA;

    if (ratioChargesCA > 80) {
      alertes.push({
        type: "attention",
        severite: "moyenne",
        categorie: "ratio_charges",
        titre: "Ratio charges/CA élevé",
        message: `Vos charges représentent ${ratioChargesCA.toFixed(1)}% de votre chiffre d'affaires (seuil recommandé: 70%).`,
        valeur: ratioChargesCA,
        indicateur: "charges_ca",
      });

      recommandations.push({
        priorite: "haute",
        categorie: "optimisation",
        titre: "Optimiser la structure de coûts",
        description: "Votre marge est faible. Augmentez vos prix ou réduisez vos coûts.",
        actions: [
          "Réviser votre grille tarifaire",
          "Optimiser les achats groupés",
          "Automatiser certaines tâches",
        ],
      });
    } else if (ratioChargesCA < 50) {
      insights.push({
        type: "positif",
        categorie: "marge",
        titre: "Excellente marge opérationnelle",
        message: `Vos charges ne représentent que ${ratioChargesCA.toFixed(1)}% du CA. Marge très saine !`,
        valeur: ratioChargesCA,
        indicateur: "charges_ca",
      });
    }
  }

  // === ANALYSE DE TRESORERIE ===
  const tresorerieTotale = stats.tresorerie?.reduce((sum, t) => sum + t.montant_total, 0) || 0;
  ratios.tresorerie_totale = tresorerieTotale;

  // Jours de trésorerie disponibles
  const depenseMoyenneJour = stats.total_sorties / 30;
  const joursTresorerie = depenseMoyenneJour > 0
    ? tresorerieTotale / depenseMoyenneJour
    : 999;

  ratios.jours_tresorerie = joursTresorerie;

  if (joursTresorerie < 15) {
    alertes.push({
      type: "negatif",
      severite: "haute",
      categorie: "tresorerie",
      titre: "Trésorerie faible",
      message: `Vous n'avez que ${joursTresorerie.toFixed(0)} jours de trésorerie disponible (minimum recommandé: 30 jours).`,
      valeur: joursTresorerie,
      indicateur: "jours_tresorerie",
    });

    recommandations.push({
      priorite: "urgente",
      categorie: "liquidite",
      titre: "Renforcer la trésorerie",
      description: "Votre coussin de sécurité est insuffisant.",
      actions: [
        "Reporter les investissements non urgents",
        "Accélérer le recouvrement des créances",
        "Négocier des délais de paiement avec fournisseurs",
      ],
    });
  } else if (joursTresorerie > 90) {
    insights.push({
      type: "positif",
      categorie: "tresorerie",
      titre: "Trésorerie confortable",
      message: `Vous disposez de ${joursTresorerie.toFixed(0)} jours de trésorerie. Vous pouvez envisager des investissements.`,
      valeur: joursTresorerie,
      indicateur: "jours_tresorerie",
    });

    recommandations.push({
      priorite: "basse",
      categorie: "investissement",
      titre: "Opportunité d'investissement",
      description: "Votre trésorerie est solide. C'est le moment d'investir.",
      actions: [
        "Moderniser votre équipement",
        "Développer de nouveaux produits",
        "Former votre équipe",
      ],
    });
  }

  // === ANALYSE HISTORIQUE ===
  const tendances = [];

  if (includeHistorique) {
    try {
      const maintenant = new Date();
      const moisPrecedent1 = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
      const moisPrecedent2 = new Date(maintenant.getFullYear(), maintenant.getMonth() - 2, 1);

      const [statsM1, statsM2] = await Promise.all([
        getStatistiquesByMonth(formatMonthKey(moisPrecedent1)).catch(() => null),
        getStatistiquesByMonth(formatMonthKey(moisPrecedent2)).catch(() => null),
      ]);

      if (statsM1 && statsM2) {
        // Tendance CA
        const ca1 = statsM2.total_entrees;
        const ca2 = statsM1.total_entrees;
        const ca3 = stats.total_entrees;

        if (ca1 > 0 && ca2 > 0 && ca3 > 0) {
          const croissance1 = ((ca2 - ca1) / ca1) * 100;
          const croissance2 = ((ca3 - ca2) / ca2) * 100;
          const croissanceMoyenne = (croissance1 + croissance2) / 2;

          if (croissanceMoyenne > 5) {
            tendances.push({
              type: "positif",
              indicateur: "ca",
              titre: "Croissance du CA",
              message: `Votre chiffre d'affaires croît de ${croissanceMoyenne.toFixed(1)}% par mois en moyenne.`,
              valeur: croissanceMoyenne,
            });

            insights.push({
              type: "positif",
              categorie: "croissance",
              titre: "Dynamique positive",
              message: `Votre activité est en croissance constante (+${croissanceMoyenne.toFixed(1)}% /mois).`,
              valeur: croissanceMoyenne,
              indicateur: "croissance_ca",
            });
          } else if (croissanceMoyenne < -5) {
            tendances.push({
              type: "negatif",
              indicateur: "ca",
              titre: "Baisse du CA",
              message: `Votre chiffre d'affaires baisse de ${Math.abs(croissanceMoyenne).toFixed(1)}% par mois en moyenne.`,
              valeur: croissanceMoyenne,
            });

            alertes.push({
              type: "negatif",
              severite: "haute",
              categorie: "tendance",
              titre: "Décroissance du CA",
              message: `Votre activité décroît de ${Math.abs(croissanceMoyenne).toFixed(1)}% /mois.`,
              valeur: croissanceMoyenne,
              indicateur: "croissance_ca",
            });

            recommandations.push({
              priorite: "urgente",
              categorie: "developpement",
              titre: "Relancer l'activité",
              description: "Votre CA baisse. Actions urgentes requises.",
              actions: [
                "Lancer une campagne promotionnelle",
                "Analyser la concurrence",
                "Sonder vos clients (satisfaction, besoins)",
                "Diversifier votre offre",
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error("Erreur analyse historique:", error);
    }
  }

  // === OPPORTUNITES ===
  const opportunites = [];

  // Opportunité: Compte en forte hausse
  if (includeHistorique) {
    const comptesCroissance = stats.comptes
      .filter(c => c.categorie === "entree")
      .sort((a, b) => b.montant_total - a.montant_total)
      .slice(0, 5);

    comptesCroissance.forEach(compte => {
      if (compte.montant_total > stats.total_entrees * 0.15) {
        opportunites.push({
          type: "compte_fort",
          compte: compte,
          titre: `Compte performant: ${compte.denomination}`,
          message: `Ce compte génère ${((compte.montant_total / stats.total_entrees) * 100).toFixed(1)}% de vos revenus.`,
          suggestion: "Renforcez vos efforts sur ce segment de marché.",
        });
      }
    });
  }

  return {
    mois: moisKey,
    resume: {
      solde,
      marge_globale: margeGlobale,
      tresorerie_totale: tresorerieTotale,
      jours_tresorerie: joursTresorerie,
    },
    ratios,
    insights,
    alertes: alertes.sort((a, b) => {
      const severiteOrder = { urgente: 0, haute: 1, moyenne: 2, basse: 3 };
      return severiteOrder[a.severite] - severiteOrder[b.severite];
    }),
    recommandations: recommandations.sort((a, b) => {
      const prioriteOrder = { urgente: 0, haute: 1, moyenne: 2, basse: 3 };
      return prioriteOrder[a.priorite] - prioriteOrder[b.priorite];
    }),
    tendances,
    opportunites,
    generatedAt: Date.now(),
  };
}

/**
 * Calcule les ratios financiers clés
 * @param {Object} stats - Statistiques du mois
 * @returns {Object} Ratios calculés
 */
export function calculerRatiosFinanciers(stats) {
  const ratios = {};

  const solde = stats.total_entrees - stats.total_sorties;

  // Marge brute
  ratios.marge_brute = stats.total_entrees > 0
    ? (solde / stats.total_entrees) * 100
    : 0;

  // Ratio charges/CA
  ratios.ratio_charges_ca = stats.total_entrees > 0
    ? (stats.total_sorties / stats.total_entrees) * 100
    : 0;

  // Montant moyen par opération
  ratios.montant_moyen_operation = stats.nombre_operations > 0
    ? (stats.total_entrees + stats.total_sorties) / stats.nombre_operations
    : 0;

  // Trésorerie
  const tresorerieTotale = stats.tresorerie?.reduce((sum, t) => sum + t.montant_total, 0) || 0;
  ratios.tresorerie_totale = tresorerieTotale;

  // Jours de trésorerie
  const depenseMoyenneJour = stats.total_sorties / 30;
  ratios.jours_tresorerie = depenseMoyenneJour > 0
    ? tresorerieTotale / depenseMoyenneJour
    : 999;

  // Concentration des comptes
  if (stats.comptes && stats.comptes.length > 0) {
    const topEntrees = stats.comptes
      .filter(c => c.categorie === "entree")
      .sort((a, b) => b.montant_total - a.montant_total)
      .slice(0, 3);

    const totalTop3Entrees = topEntrees.reduce((sum, c) => sum + c.montant_total, 0);
    ratios.concentration_top3_entrees = stats.total_entrees > 0
      ? (totalTop3Entrees / stats.total_entrees) * 100
      : 0;

    const topSorties = stats.comptes
      .filter(c => c.categorie === "sortie")
      .sort((a, b) => b.montant_total - a.montant_total)
      .slice(0, 3);

    const totalTop3Sorties = topSorties.reduce((sum, c) => sum + c.montant_total, 0);
    ratios.concentration_top3_sorties = stats.total_sorties > 0
      ? (totalTop3Sorties / stats.total_sorties) * 100
      : 0;
  }

  return ratios;
}

/**
 * Génère un score de santé financière (0-100)
 * @param {Object} stats - Statistiques du mois
 * @returns {Object} Score et détails
 */
export function calculerScoreSante(stats) {
  let score = 0;
  const details = [];

  // Critère 1: Rentabilité (30 points)
  const solde = stats.total_entrees - stats.total_sorties;
  const marge = stats.total_entrees > 0 ? (solde / stats.total_entrees) * 100 : 0;

  if (marge > 20) {
    score += 30;
    details.push({ critere: "Rentabilité", note: 30, max: 30, commentaire: "Excellente marge" });
  } else if (marge > 10) {
    score += 20;
    details.push({ critere: "Rentabilité", note: 20, max: 30, commentaire: "Bonne marge" });
  } else if (marge > 0) {
    score += 10;
    details.push({ critere: "Rentabilité", note: 10, max: 30, commentaire: "Marge faible" });
  } else {
    details.push({ critere: "Rentabilité", note: 0, max: 30, commentaire: "Déficitaire" });
  }

  // Critère 2: Trésorerie (30 points)
  const tresorerieTotale = stats.tresorerie?.reduce((sum, t) => sum + t.montant_total, 0) || 0;
  const depenseMoyenneJour = stats.total_sorties / 30;
  const joursTresorerie = depenseMoyenneJour > 0 ? tresorerieTotale / depenseMoyenneJour : 999;

  if (joursTresorerie > 60) {
    score += 30;
    details.push({ critere: "Trésorerie", note: 30, max: 30, commentaire: "Trésorerie très solide" });
  } else if (joursTresorerie > 30) {
    score += 20;
    details.push({ critere: "Trésorerie", note: 20, max: 30, commentaire: "Trésorerie correcte" });
  } else if (joursTresorerie > 15) {
    score += 10;
    details.push({ critere: "Trésorerie", note: 10, max: 30, commentaire: "Trésorerie juste" });
  } else {
    details.push({ critere: "Trésorerie", note: 0, max: 30, commentaire: "Trésorerie critique" });
  }

  // Critère 3: Ratio charges/CA (20 points)
  const ratioCharges = stats.total_entrees > 0 ? (stats.total_sorties / stats.total_entrees) * 100 : 100;

  if (ratioCharges < 60) {
    score += 20;
    details.push({ critere: "Maîtrise des coûts", note: 20, max: 20, commentaire: "Excellent contrôle" });
  } else if (ratioCharges < 75) {
    score += 15;
    details.push({ critere: "Maîtrise des coûts", note: 15, max: 20, commentaire: "Bon contrôle" });
  } else if (ratioCharges < 85) {
    score += 10;
    details.push({ critere: "Maîtrise des coûts", note: 10, max: 20, commentaire: "Contrôle moyen" });
  } else {
    score += 5;
    details.push({ critere: "Maîtrise des coûts", note: 5, max: 20, commentaire: "Coûts élevés" });
  }

  // Critère 4: Volume d'activité (20 points)
  const nbOperations = stats.nombre_operations || 0;

  if (nbOperations > 100) {
    score += 20;
    details.push({ critere: "Volume d'activité", note: 20, max: 20, commentaire: "Forte activité" });
  } else if (nbOperations > 50) {
    score += 15;
    details.push({ critere: "Volume d'activité", note: 15, max: 20, commentaire: "Activité correcte" });
  } else if (nbOperations > 20) {
    score += 10;
    details.push({ critere: "Volume d'activité", note: 10, max: 20, commentaire: "Activité modérée" });
  } else {
    score += 5;
    details.push({ critere: "Volume d'activité", note: 5, max: 20, commentaire: "Activité faible" });
  }

  let appreciation;
  let couleur;

  if (score >= 85) {
    appreciation = "Excellente";
    couleur = "green";
  } else if (score >= 70) {
    appreciation = "Bonne";
    couleur = "blue";
  } else if (score >= 50) {
    appreciation = "Moyenne";
    couleur = "orange";
  } else {
    appreciation = "Fragile";
    couleur = "red";
  }

  return {
    score,
    appreciation,
    couleur,
    details,
  };
}
