/**
 * comptesCharts.js
 * Préparation des données pour les graphiques des comptes comptables
 */

import { getCompteOhadaConfig } from "./comptesFormatters";

// ============================================================================
// DONNÉES POUR LES GRAPHIQUES
// ============================================================================

/**
 * Prépare les données pour le graphique de répartition des comptes
 * @param {Array} comptes - Liste des comptes avec soldes
 * @param {number} soldeTotal - Solde total
 * @returns {Array} Données formatées pour le graphique
 */
export function calculerDataRepartition(comptes, soldeTotal) {
  if (soldeTotal === 0 || comptes.length === 0) {
    return [];
  }

  return comptes
    .filter((compte) => compte.solde > 0) // Uniquement les comptes avec un solde positif
    .map((compte) => {
      const config = getCompteOhadaConfig(compte.code_ohada);
      return {
        nom: compte.denomination,
        code: compte.code_ohada,
        solde: compte.solde || 0,
        pourcentage: parseFloat(((compte.solde / soldeTotal) * 100).toFixed(1)),
        color: config.strokeColor,
        category: config.category,
      };
    })
    .sort((a, b) => b.solde - a.solde); // Trier par solde décroissant
}

/**
 * Prépare les données pour le graphique de comparaison Entrées vs Sorties
 * @param {Array} comptesEntree - Comptes d'entrée avec soldes
 * @param {Array} comptesSortie - Comptes de sortie avec soldes
 * @returns {Object} Données formatées {totalEntrees, totalSorties, soldeNet}
 */
export function calculerDataEntreesSorties(comptesEntree, comptesSortie) {
  const totalEntrees = comptesEntree.reduce((sum, c) => sum + (c.solde || 0), 0);
  const totalSorties = comptesSortie.reduce((sum, c) => sum + (c.solde || 0), 0);
  const soldeNet = totalEntrees - totalSorties;

  return {
    totalEntrees,
    totalSorties,
    soldeNet,
    data: [
      {
        name: "Entrées",
        montant: totalEntrees,
        color: "#10b981",
      },
      {
        name: "Sorties",
        montant: totalSorties,
        color: "#ef4444",
      },
    ],
  };
}

/**
 * Prépare les données pour le graphique de flux financiers par catégorie
 * @param {Array} comptes - Liste des comptes avec soldes
 * @returns {Array} Données groupées par catégorie OHADA
 */
export function calculerDataFluxParCategorie(comptes) {
  // Grouper par catégorie
  const groupes = comptes.reduce((acc, compte) => {
    const config = getCompteOhadaConfig(compte.code_ohada);
    const categorie = config.category;

    if (!acc[categorie]) {
      acc[categorie] = {
        nom: categorie,
        total: 0,
        color: config.strokeColor,
        comptes: [],
      };
    }

    acc[categorie].total += compte.solde || 0;
    acc[categorie].comptes.push(compte);
    return acc;
  }, {});

  // Convertir en tableau et trier
  return Object.values(groupes)
    .sort((a, b) => b.total - a.total)
    .map((groupe) => ({
      nom: groupe.nom,
      montant: groupe.total,
      nombreComptes: groupe.comptes.length,
      color: groupe.color,
    }));
}

/**
 * Prépare les données pour le graphique d'évolution temporelle d'un compte
 * @param {Array} operationsHistorique - Opérations du compte triées par date
 * @returns {Array} Données pour LineChart avec cumul
 */
export function calculerDataEvolutionCompte(operationsHistorique) {
  if (!operationsHistorique || operationsHistorique.length === 0) {
    return [];
  }

  // Trier par date
  const operationsTries = [...operationsHistorique].sort((a, b) => a.date - b.date);

  // Calculer le cumul
  let cumul = 0;
  return operationsTries.map((op) => {
    cumul += op.montant;
    return {
      date: new Date(op.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      }),
      montant: op.montant,
      cumul: cumul,
      motif: op.motif,
      type: op.type_operation,
    };
  });
}

/**
 * Prépare les données pour le Top 5 des comptes
 * @param {Array} comptes - Liste des comptes avec soldes
 * @param {string} categorie - "entree" ou "sortie" (optionnel)
 * @returns {Array} Top 5 des comptes
 */
export function calculerTop5Comptes(comptes, categorie = null) {
  let comptesFiltered = comptes;

  if (categorie) {
    comptesFiltered = comptes.filter((c) => c.categorie === categorie);
  }

  return comptesFiltered
    .filter((c) => c.solde > 0)
    .sort((a, b) => b.solde - a.solde)
    .slice(0, 5)
    .map((compte) => {
      const config = getCompteOhadaConfig(compte.code_ohada);
      return {
        nom: compte.denomination,
        code: compte.code_ohada,
        solde: compte.solde,
        color: config.strokeColor,
        icon: config.icon,
      };
    });
}

/**
 * Prépare les données pour le graphique de répartition des opérations
 * @param {Array} operations - Liste des opérations
 * @returns {Object} Répartition {entrees, sorties, data}
 */
export function calculerDataRepartitionOperations(operations) {
  const entrees = operations.filter((op) => op.type_operation === "entree");
  const sorties = operations.filter((op) => op.type_operation === "sortie");

  const montantEntrees = entrees.reduce((sum, op) => sum + op.montant, 0);
  const montantSorties = sorties.reduce((sum, op) => sum + op.montant, 0);

  return {
    nombreEntrees: entrees.length,
    nombreSorties: sorties.length,
    montantEntrees,
    montantSorties,
    data: [
      {
        name: "Entrées",
        value: entrees.length,
        montant: montantEntrees,
        color: "#10b981",
      },
      {
        name: "Sorties",
        value: sorties.length,
        montant: montantSorties,
        color: "#ef4444",
      },
    ],
  };
}

/**
 * Calcule les données pour un graphique en barres des comptes
 * @param {Array} comptes - Liste des comptes avec soldes
 * @param {number} limit - Nombre maximum de comptes à afficher
 * @returns {Array} Données pour BarChart
 */
export function calculerDataBarChart(comptes, limit = 10) {
  return comptes
    .filter((c) => c.solde > 0)
    .sort((a, b) => b.solde - a.solde)
    .slice(0, limit)
    .map((compte) => {
      const config = getCompteOhadaConfig(compte.code_ohada);
      return {
        denomination: compte.denomination.substring(0, 20), // Limiter la longueur
        solde: compte.solde,
        fill: config.strokeColor,
      };
    });
}
