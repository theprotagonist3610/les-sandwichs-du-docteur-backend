/**
 * @fileoverview Système de prévisions intelligentes avec détection de tendances
 * Option B : Prévisions Intelligentes (Avec Tendances)
 * - Analyse de l'historique sur 6-12 mois
 * - Détection des tendances de croissance/décroissance
 * - Identification de la saisonnalité
 * - Génération de scénarios (pessimiste, réaliste, optimiste)
 */

import { getStatistiquesByMonth } from "./statistiques";
import { formatMonthKey } from "./utils";

/**
 * Calcule la tendance (taux de croissance moyen) d'un compte sur plusieurs mois
 * @param {Array} historique - Tableau des montants mensuels [{ mois, montant }]
 * @returns {number} Taux de croissance mensuel moyen (en décimal, ex: 0.05 = +5%)
 */
export function calculerTendance(historique) {
  if (!historique || historique.length < 2) return 0;

  const tauxCroissance = [];
  for (let i = 1; i < historique.length; i++) {
    const montantPrecedent = historique[i - 1].montant;
    const montantActuel = historique[i].montant;

    if (montantPrecedent > 0) {
      const taux = (montantActuel - montantPrecedent) / montantPrecedent;
      tauxCroissance.push(taux);
    }
  }

  if (tauxCroissance.length === 0) return 0;

  // Moyenne des taux de croissance
  const moyenneTaux = tauxCroissance.reduce((sum, t) => sum + t, 0) / tauxCroissance.length;
  return moyenneTaux;
}

/**
 * Calcule une moyenne mobile sur N périodes
 * @param {Array} historique - Tableau des montants
 * @param {number} periodes - Nombre de périodes pour la moyenne mobile (défaut: 3)
 * @returns {number} Moyenne mobile
 */
export function calculerMoyenneMobile(historique, periodes = 3) {
  if (!historique || historique.length === 0) return 0;

  const derniersValeurs = historique.slice(-periodes);
  const somme = derniersValeurs.reduce((sum, h) => sum + h.montant, 0);
  return somme / derniersValeurs.length;
}

/**
 * Détecte la saisonnalité en comparant les mois équivalents sur plusieurs années
 * @param {Array} historique - Historique sur au moins 12 mois
 * @returns {Object} Facteurs de saisonnalité par mois (1 = normal, >1 = mois fort, <1 = mois faible)
 */
export function detecterSaisonnalite(historique) {
  if (!historique || historique.length < 6) {
    // Pas assez de données, retourne des facteurs neutres
    return {
      "01": 1, "02": 1, "03": 1, "04": 1, "05": 1, "06": 1,
      "07": 1, "08": 1, "09": 1, "10": 1, "11": 1, "12": 1,
    };
  }

  // Calculer la moyenne globale
  const moyenneGlobale = historique.reduce((sum, h) => sum + h.montant, 0) / historique.length;

  if (moyenneGlobale === 0) {
    return {
      "01": 1, "02": 1, "03": 1, "04": 1, "05": 1, "06": 1,
      "07": 1, "08": 1, "09": 1, "10": 1, "11": 1, "12": 1,
    };
  }

  // Regrouper par mois
  const parMois = {};
  historique.forEach(h => {
    const mois = h.mois.substring(0, 2); // Extraire MM de MMYYYY
    if (!parMois[mois]) parMois[mois] = [];
    parMois[mois].push(h.montant);
  });

  // Calculer le facteur de saisonnalité pour chaque mois
  const facteurs = {};
  Object.keys(parMois).forEach(mois => {
    const montants = parMois[mois];
    const moyenneMois = montants.reduce((sum, m) => sum + m, 0) / montants.length;
    facteurs[mois] = moyenneMois / moyenneGlobale;
  });

  // Remplir les mois manquants avec 1 (neutre)
  for (let m = 1; m <= 12; m++) {
    const moisStr = m.toString().padStart(2, "0");
    if (!facteurs[moisStr]) facteurs[moisStr] = 1;
  }

  return facteurs;
}

/**
 * Génère des prévisions pour un compte sur N mois
 * @param {Object} compte - { compte_id, code_ohada, denomination, categorie }
 * @param {Array} historique - Historique mensuel [{ mois, montant }]
 * @param {number} nbMois - Nombre de mois à prévoir (1, 3, ou 6)
 * @param {Object} options - Options { saisonnalite, tendance }
 * @returns {Array} Prévisions [{ mois, montant_prevu, scenario_pessimiste, scenario_optimiste }]
 */
export function genererPrevisionsCompte(compte, historique, nbMois = 1, options = {}) {
  if (!historique || historique.length === 0) {
    return [];
  }

  const { saisonnalite = {}, tendance = null } = options;

  // Calculer la tendance si non fournie
  const tauxCroissance = tendance !== null ? tendance : calculerTendance(historique);

  // Utiliser la moyenne mobile comme base
  const montantBase = calculerMoyenneMobile(historique, 3);

  // Générer les prévisions
  const previsions = [];
  const dernierMois = historique[historique.length - 1].mois;

  for (let i = 1; i <= nbMois; i++) {
    // Calculer le mois cible
    const [mm, yyyy] = [dernierMois.substring(0, 2), dernierMois.substring(2)];
    const date = new Date(parseInt(yyyy), parseInt(mm) - 1 + i, 1);
    const moisCible = (date.getMonth() + 1).toString().padStart(2, "0");
    const anneeCible = date.getFullYear().toString();
    const moisKey = moisCible + anneeCible;

    // Appliquer la tendance
    const montantAvecTendance = montantBase * Math.pow(1 + tauxCroissance, i);

    // Appliquer la saisonnalité
    const facteurSaison = saisonnalite[moisCible] || 1;
    const montantPrevu = montantAvecTendance * facteurSaison;

    // Scénarios : pessimiste -10%, optimiste +10%
    const scenarioPessimiste = montantPrevu * 0.9;
    const scenarioOptimiste = montantPrevu * 1.1;

    previsions.push({
      mois: moisKey,
      compte_id: compte.compte_id,
      code_ohada: compte.code_ohada,
      denomination: compte.denomination,
      categorie: compte.categorie,
      montant_prevu: Math.round(montantPrevu),
      scenario_pessimiste: Math.round(scenarioPessimiste),
      scenario_optimiste: Math.round(scenarioOptimiste),
      taux_croissance: tauxCroissance,
      facteur_saisonnalite: facteurSaison,
    });
  }

  return previsions;
}

/**
 * Charge l'historique d'un compte sur N mois
 * @param {string} compteId - ID du compte
 * @param {number} nbMoisHistorique - Nombre de mois d'historique à charger (défaut: 6)
 * @returns {Promise<Array>} Historique [{ mois, montant }]
 */
export async function chargerHistoriqueCompte(compteId, nbMoisHistorique = 6) {
  const aujourd = new Date();
  const mois = [];

  // Générer les clés de mois
  for (let i = nbMoisHistorique - 1; i >= 0; i--) {
    const date = new Date(aujourd.getFullYear(), aujourd.getMonth() - i, 1);
    const moisKey = formatMonthKey(date);
    mois.push(moisKey);
  }

  // Charger les statistiques pour chaque mois
  const historique = [];
  for (const moisKey of mois) {
    try {
      const stats = await getStatistiquesByMonth(moisKey);
      if (stats && stats.comptes) {
        const compte = stats.comptes.find(c => c.compte_id === compteId);
        if (compte) {
          historique.push({
            mois: moisKey,
            montant: compte.montant_total || 0,
          });
        } else {
          historique.push({ mois: moisKey, montant: 0 });
        }
      } else {
        historique.push({ mois: moisKey, montant: 0 });
      }
    } catch (error) {
      console.error(`Erreur chargement stats ${moisKey}:`, error);
      historique.push({ mois: moisKey, montant: 0 });
    }
  }

  return historique;
}

/**
 * Génère des prévisions complètes pour tous les comptes
 * @param {number} nbMois - Nombre de mois à prévoir (1, 3, ou 6)
 * @param {number} nbMoisHistorique - Nombre de mois d'historique à analyser (défaut: 6)
 * @returns {Promise<Object>} Prévisions globales avec tous les comptes
 */
export async function genererPrevisionsGlobales(nbMois = 3, nbMoisHistorique = 6) {
  // Charger l'historique des derniers mois
  const aujourd = new Date();
  const historiqueGlobal = [];

  for (let i = nbMoisHistorique - 1; i >= 0; i--) {
    const date = new Date(aujourd.getFullYear(), aujourd.getMonth() - i, 1);
    const moisKey = formatMonthKey(date);

    try {
      const stats = await getStatistiquesByMonth(moisKey);
      if (stats) {
        historiqueGlobal.push({
          mois: moisKey,
          stats: stats,
        });
      }
    } catch (error) {
      console.error(`Erreur chargement stats ${moisKey}:`, error);
    }
  }

  if (historiqueGlobal.length === 0) {
    throw new Error("Aucun historique disponible pour générer des prévisions");
  }

  // Extraire tous les comptes uniques
  const comptesMap = new Map();
  historiqueGlobal.forEach(h => {
    if (h.stats.comptes) {
      h.stats.comptes.forEach(compte => {
        if (!comptesMap.has(compte.compte_id)) {
          comptesMap.set(compte.compte_id, {
            compte_id: compte.compte_id,
            code_ohada: compte.code_ohada,
            denomination: compte.denomination,
            categorie: compte.categorie,
          });
        }
      });
    }
  });

  // Générer les prévisions pour chaque compte
  const previsionsParCompte = [];

  for (const compte of comptesMap.values()) {
    // Construire l'historique du compte
    const historiqueCompte = historiqueGlobal.map(h => {
      const compteData = h.stats.comptes?.find(c => c.compte_id === compte.compte_id);
      return {
        mois: h.mois,
        montant: compteData?.montant_total || 0,
      };
    });

    // Détecter la saisonnalité
    const saisonnalite = detecterSaisonnalite(historiqueCompte);

    // Générer les prévisions
    const previsions = genererPrevisionsCompte(compte, historiqueCompte, nbMois, { saisonnalite });

    if (previsions.length > 0) {
      previsionsParCompte.push({
        compte,
        historique: historiqueCompte,
        previsions,
        tendance: calculerTendance(historiqueCompte),
        moyenne_mobile: calculerMoyenneMobile(historiqueCompte, 3),
      });
    }
  }

  // Calculer les totaux par mois prévu
  const previsionsParMois = [];
  for (let i = 0; i < nbMois; i++) {
    const moisPrevisions = {
      mois: previsionsParCompte[0]?.previsions[i]?.mois || "",
      total_entrees_prevu: 0,
      total_sorties_prevu: 0,
      total_entrees_pessimiste: 0,
      total_sorties_pessimiste: 0,
      total_entrees_optimiste: 0,
      total_sorties_optimiste: 0,
      comptes: [],
    };

    previsionsParCompte.forEach(pCompte => {
      const prev = pCompte.previsions[i];
      if (prev) {
        moisPrevisions.comptes.push(prev);

        if (prev.categorie === "entree") {
          moisPrevisions.total_entrees_prevu += prev.montant_prevu;
          moisPrevisions.total_entrees_pessimiste += prev.scenario_pessimiste;
          moisPrevisions.total_entrees_optimiste += prev.scenario_optimiste;
        } else if (prev.categorie === "sortie") {
          moisPrevisions.total_sorties_prevu += prev.montant_prevu;
          moisPrevisions.total_sorties_pessimiste += prev.scenario_pessimiste;
          moisPrevisions.total_sorties_optimiste += prev.scenario_optimiste;
        }
      }
    });

    moisPrevisions.solde_prevu = moisPrevisions.total_entrees_prevu - moisPrevisions.total_sorties_prevu;
    moisPrevisions.solde_pessimiste = moisPrevisions.total_entrees_pessimiste - moisPrevisions.total_sorties_pessimiste;
    moisPrevisions.solde_optimiste = moisPrevisions.total_entrees_optimiste - moisPrevisions.total_sorties_optimiste;

    previsionsParMois.push(moisPrevisions);
  }

  // Calculer les ratios clés
  const derniereStats = historiqueGlobal[historiqueGlobal.length - 1].stats;
  const tauxCroissanceMoyen = calculerTendance(
    historiqueGlobal.map(h => ({
      mois: h.mois,
      montant: h.stats.total_entrees - h.stats.total_sorties,
    }))
  );

  const margePrevisionnelle = previsionsParMois[0]?.total_entrees_prevu > 0
    ? ((previsionsParMois[0].solde_prevu / previsionsParMois[0].total_entrees_prevu) * 100)
    : 0;

  return {
    periode_analyse: {
      debut: historiqueGlobal[0].mois,
      fin: historiqueGlobal[historiqueGlobal.length - 1].mois,
      nb_mois: historiqueGlobal.length,
    },
    periode_previsions: {
      nb_mois: nbMois,
      debut: previsionsParMois[0]?.mois || "",
      fin: previsionsParMois[nbMois - 1]?.mois || "",
    },
    indicateurs_cles: {
      taux_croissance_moyen: tauxCroissanceMoyen,
      marge_previsionnelle: margePrevisionnelle,
      nombre_comptes_analyses: comptesMap.size,
    },
    previsions_par_mois: previsionsParMois,
    previsions_par_compte: previsionsParCompte,
    historique: historiqueGlobal,
    generatedAt: Date.now(),
  };
}

/**
 * Détecte les anomalies en comparant les réalisations aux prévisions
 * @param {Object} previsions - Prévisions générées
 * @param {Object} realisations - Statistiques réelles du mois
 * @returns {Array} Liste des anomalies détectées
 */
export function detecterAnomalies(previsions, realisations) {
  if (!previsions || !realisations) return [];

  const anomalies = [];
  const seuilAlerte = 0.2; // 20% d'écart

  // Comparer les totaux
  const ecartEntrees = Math.abs(realisations.total_entrees - previsions.total_entrees_prevu);
  const tauxEcartEntrees = previsions.total_entrees_prevu > 0
    ? ecartEntrees / previsions.total_entrees_prevu
    : 0;

  if (tauxEcartEntrees > seuilAlerte) {
    anomalies.push({
      type: "total",
      categorie: "entree",
      severite: tauxEcartEntrees > 0.3 ? "haute" : "moyenne",
      message: `Les entrées réelles (${realisations.total_entrees.toLocaleString()} FCFA) s'écartent de ${(tauxEcartEntrees * 100).toFixed(1)}% des prévisions (${previsions.total_entrees_prevu.toLocaleString()} FCFA)`,
      ecart_montant: realisations.total_entrees - previsions.total_entrees_prevu,
      ecart_pourcentage: tauxEcartEntrees,
    });
  }

  const ecartSorties = Math.abs(realisations.total_sorties - previsions.total_sorties_prevu);
  const tauxEcartSorties = previsions.total_sorties_prevu > 0
    ? ecartSorties / previsions.total_sorties_prevu
    : 0;

  if (tauxEcartSorties > seuilAlerte) {
    anomalies.push({
      type: "total",
      categorie: "sortie",
      severite: tauxEcartSorties > 0.3 ? "haute" : "moyenne",
      message: `Les sorties réelles (${realisations.total_sorties.toLocaleString()} FCFA) s'écartent de ${(tauxEcartSorties * 100).toFixed(1)}% des prévisions (${previsions.total_sorties_prevu.toLocaleString()} FCFA)`,
      ecart_montant: realisations.total_sorties - previsions.total_sorties_prevu,
      ecart_pourcentage: tauxEcartSorties,
    });
  }

  // Comparer par compte
  if (previsions.comptes && realisations.comptes) {
    previsions.comptes.forEach(prevCompte => {
      const realCompte = realisations.comptes.find(c => c.compte_id === prevCompte.compte_id);
      if (realCompte) {
        const ecart = Math.abs(realCompte.montant_total - prevCompte.montant_prevu);
        const tauxEcart = prevCompte.montant_prevu > 0
          ? ecart / prevCompte.montant_prevu
          : 0;

        if (tauxEcart > seuilAlerte) {
          anomalies.push({
            type: "compte",
            compte_id: prevCompte.compte_id,
            code_ohada: prevCompte.code_ohada,
            denomination: prevCompte.denomination,
            categorie: prevCompte.categorie,
            severite: tauxEcart > 0.3 ? "haute" : "moyenne",
            message: `${prevCompte.denomination} : écart de ${(tauxEcart * 100).toFixed(1)}% (prévu: ${prevCompte.montant_prevu.toLocaleString()} FCFA, réalisé: ${realCompte.montant_total.toLocaleString()} FCFA)`,
            ecart_montant: realCompte.montant_total - prevCompte.montant_prevu,
            ecart_pourcentage: tauxEcart,
            montant_prevu: prevCompte.montant_prevu,
            montant_realise: realCompte.montant_total,
          });
        }
      }
    });
  }

  // Trier par sévérité (haute en premier)
  return anomalies.sort((a, b) => {
    if (a.severite === "haute" && b.severite !== "haute") return -1;
    if (a.severite !== "haute" && b.severite === "haute") return 1;
    return b.ecart_pourcentage - a.ecart_pourcentage;
  });
}
