import { getCompteConfig } from "./tresorerieFormatters";

/**
 * Calculer les données de répartition de la trésorerie pour le BarChart
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @param {number} soldeTotal - Solde total de tous les comptes
 * @returns {Array} Données formatées pour le BarChart
 */
export const calculerDataRepartition = (comptesTresorerie, soldeTotal) => {
  if (!comptesTresorerie || comptesTresorerie.length === 0) {
    return [];
  }

  return comptesTresorerie.map((compte) => {
    const config = getCompteConfig(compte.code_ohada);
    const soldeCompte = compte.solde || 0;
    const pourcentage = soldeTotal > 0 ? (soldeCompte / soldeTotal) * 100 : 0;

    return {
      nom: compte.denomination,
      solde: soldeCompte,
      pourcentage: parseFloat(pourcentage.toFixed(1)),
      color: config.strokeColor,
    };
  });
};

/**
 * Calculer les données d'évolution de la trésorerie pour le LineChart
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @param {number} nombreJours - Nombre de jours d'historique (défaut: 7)
 * @returns {Array} Données formatées pour le LineChart
 */
export const calculerDataEvolution = (comptesTresorerie, nombreJours = 7) => {
  if (!comptesTresorerie || comptesTresorerie.length === 0) {
    return [];
  }

  const today = new Date();
  const evolutionData = [];

  for (let i = nombreJours - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

    const dataPoint = {
      date: dateStr,
    };

    // Pour chaque compte, ajouter son solde à ce point de temps
    comptesTresorerie.forEach((compte) => {
      // TODO: Remplacer par les vraies données historiques depuis Firestore
      // Pour l'instant, on simule une variation progressive
      const soldeActuel = compte.solde || 0;
      const variation = Math.random() * 0.2 - 0.1; // ±10%
      const facteurTemps = (nombreJours - i) / nombreJours;
      dataPoint[compte.denomination] = Math.max(
        0,
        soldeActuel * (1 + variation * facteurTemps)
      );
    });

    evolutionData.push(dataPoint);
  }

  return evolutionData;
};

/**
 * Calculer les statistiques globales de trésorerie
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @returns {Object} Statistiques (total, moyenne, min, max)
 */
export const calculerStatistiquesTresorerie = (comptesTresorerie) => {
  if (!comptesTresorerie || comptesTresorerie.length === 0) {
    return {
      total: 0,
      moyenne: 0,
      min: 0,
      max: 0,
      nombreComptes: 0,
    };
  }

  const soldes = comptesTresorerie.map((compte) => compte.solde || 0);
  const total = soldes.reduce((acc, solde) => acc + solde, 0);
  const moyenne = total / soldes.length;
  const min = Math.min(...soldes);
  const max = Math.max(...soldes);

  return {
    total,
    moyenne,
    min,
    max,
    nombreComptes: comptesTresorerie.length,
  };
};

/**
 * Grouper les comptes par type (basé sur le code OHADA)
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @returns {Object} Comptes groupés par type avec totaux
 */
export const grouperComptesParType = (comptesTresorerie) => {
  if (!comptesTresorerie || comptesTresorerie.length === 0) {
    return {};
  }

  const groupes = {};

  comptesTresorerie.forEach((compte) => {
    const codeOhada = compte.code_ohada;

    if (!groupes[codeOhada]) {
      const config = getCompteConfig(codeOhada);
      groupes[codeOhada] = {
        code: codeOhada,
        comptes: [],
        total: 0,
        config,
      };
    }

    groupes[codeOhada].comptes.push(compte);
    groupes[codeOhada].total += compte.solde || 0;
  });

  return groupes;
};

/**
 * Préparer les données pour un tooltip personnalisé des graphiques
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @returns {Object} Mapping des noms vers les configurations
 */
export const preparerConfigTooltip = (comptesTresorerie) => {
  if (!comptesTresorerie || comptesTresorerie.length === 0) {
    return {};
  }

  const mapping = {};

  comptesTresorerie.forEach((compte) => {
    const config = getCompteConfig(compte.code_ohada);
    mapping[compte.denomination] = {
      color: config.strokeColor,
      icon: config.icon,
      codeOhada: compte.code_ohada,
    };
  });

  return mapping;
};
