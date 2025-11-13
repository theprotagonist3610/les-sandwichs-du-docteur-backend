/**
 * livraisonStatistiquesToolkit.jsx
 * Gestion des statistiques de livraison avec cache local et synchronisation RTDB
 *
 * STRATÉGIE D'OPTIMISATION (formule Spark - limiter les lectures Firestore):
 * 1. Calcul à partir du cache des commandes (commandeToolkit)
 * 2. Récupération des adresses depuis le cache (adresseToolkit)
 * 3. Sauvegarde des stats calculées dans localStorage
 * 4. Écoute des notifications RTDB pour recalculer à la volée
 *
 * Structure des statistiques:
 * {
 *   periode: "MMYYYY" ou "DDMMYYYY",
 *   delais: {
 *     moyen: number,        // minutes
 *     mediane: number,
 *     min: number,
 *     max: number,
 *     parTrancheHoraire: Array<{heure: string, delaiMoyen: number}>
 *   },
 *   zones: {
 *     parCommune: Array<{commune, nombreLivraisons, montantTotal, delaiMoyen, arrondissements}>,
 *     parArrondissement: Array<{arrondissement, nombreLivraisons, montantTotal, delaiMoyen}>
 *   },
 *   horairesCourtants: {
 *     commandes: Array<{heure, count}>,
 *     livraisons: Array<{heure, count}>
 *   },
 *   statistiquesGlobales: {
 *     nombreTotalLivraisons: number,
 *     chiffreAffaire: number,
 *     tauxLivraisonsTerminees: number,
 *     tauxLivraisonsEnRetard: number
 *   }
 * }
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/firebase";

// ============================================================================
// CONSTANTES
// ============================================================================

const CACHE_KEY_PREFIX = "livraison_stats_";
const CACHE_TIMESTAMP_KEY = "livraison_stats_timestamp_";
const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

const RTDB_COMMANDES_NOTIFICATIONS = "notifications/commandes";
const RTDB_ADRESSES_NOTIFICATIONS = "notifications/adresses";

// Tranches horaires pour l'analyse
const TRANCHES_HORAIRES = [
  "06:00-08:00",
  "08:00-10:00",
  "10:00-12:00",
  "12:00-14:00",
  "14:00-16:00",
  "16:00-18:00",
  "18:00-20:00",
  "20:00-22:00",
];

// ============================================================================
// UTILITAIRES - CACHE
// ============================================================================

/**
 * Sauvegarder les statistiques dans le cache
 */
function saveToCache(key, stats) {
  try {
    const cached = {
      data: stats,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error("Erreur sauvegarde cache stats livraison:", error);
  }
}

/**
 * Récupérer les statistiques depuis le cache
 */
function getFromCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);

    // Vérifier la validité du cache
    if (Date.now() - parsed.timestamp > CACHE_VALIDITY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("Erreur lecture cache stats livraison:", error);
    return null;
  }
}

/**
 * Invalider le cache pour une période
 */
function invalidateCache(periode) {
  try {
    const key = `${CACHE_KEY_PREFIX}${periode}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Erreur invalidation cache:", error);
  }
}

// ============================================================================
// UTILITAIRES - DATES & HEURES
// ============================================================================

/**
 * Formater une date en DDMMYYYY
 */
function formatDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Formater une date en MMYYYY
 */
function formatMonthKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}${year}`;
}

/**
 * Extraire l'heure au format HH:MM depuis un timestamp
 */
function extractHour(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Extraire l'heure arrondie (HH:00) depuis un timestamp
 */
function extractRoundedHour(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

/**
 * Trouver la tranche horaire pour une heure donnée
 */
function findTrancheHoraire(heure) {
  const [h] = heure.split(":");
  const hour = parseInt(h);

  for (const tranche of TRANCHES_HORAIRES) {
    const [debut, fin] = tranche.split("-");
    const [hDebut] = debut.split(":");
    const [hFin] = fin.split(":");

    if (hour >= parseInt(hDebut) && hour < parseInt(hFin)) {
      return tranche;
    }
  }

  return "Autre";
}

// ============================================================================
// CALCUL DES STATISTIQUES
// ============================================================================

/**
 * Calculer le délai de livraison en minutes
 * @param {Object} commande - Commande à analyser
 * @returns {number|null} - Délai en minutes ou null si non applicable
 */
function calculerDelai(commande) {
  if (commande.type !== "a livrer") return null;
  if (commande.statut !== "livree") return null;
  if (!commande.updatedAt || !commande.createdAt) return null;

  const delaiMs = commande.updatedAt - commande.createdAt;
  return Math.floor(delaiMs / 60000); // en minutes
}

/**
 * Calculer la médiane d'un tableau de nombres
 */
function calculerMediane(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Enrichir les commandes avec les données des adresses
 * @param {Array} commandes - Liste des commandes
 * @param {Array} adresses - Liste des adresses
 * @returns {Array} - Commandes enrichies
 */
function enrichirCommandesAvecAdresses(commandes, adresses) {
  // Créer un map des adresses pour un accès rapide
  const adressesMap = {};
  adresses.forEach(adresse => {
    adressesMap[adresse.id] = adresse;
  });

  return commandes.map(commande => {
    if (commande.type !== "a livrer" || !commande.adresse_livraison?.id) {
      return commande;
    }

    const adresse = adressesMap[commande.adresse_livraison.id];
    return {
      ...commande,
      adresse_complete: adresse || null,
    };
  });
}

/**
 * Calculer les statistiques de délais
 * @param {Array} commandes - Liste des commandes livrées
 * @returns {Object} - Statistiques de délais
 */
function calculerStatistiquesDelais(commandes) {
  const commandesLivrees = commandes.filter(
    cmd => cmd.type === "a livrer" && cmd.statut === "livree"
  );

  if (commandesLivrees.length === 0) {
    return {
      moyen: 0,
      mediane: 0,
      min: 0,
      max: 0,
      parTrancheHoraire: [],
    };
  }

  const delais = commandesLivrees
    .map(calculerDelai)
    .filter(d => d !== null && d > 0);

  if (delais.length === 0) {
    return {
      moyen: 0,
      mediane: 0,
      min: 0,
      max: 0,
      parTrancheHoraire: [],
    };
  }

  const moyen = Math.round(delais.reduce((sum, d) => sum + d, 0) / delais.length);
  const mediane = Math.round(calculerMediane(delais));
  const min = Math.min(...delais);
  const max = Math.max(...delais);

  // Calcul par tranche horaire
  const delaisParTranche = {};
  TRANCHES_HORAIRES.forEach(tranche => {
    delaisParTranche[tranche] = [];
  });

  commandesLivrees.forEach(cmd => {
    const delai = calculerDelai(cmd);
    if (delai === null) return;

    const heure = extractHour(cmd.createdAt);
    const tranche = findTrancheHoraire(heure);

    if (delaisParTranche[tranche]) {
      delaisParTranche[tranche].push(delai);
    }
  });

  const parTrancheHoraire = Object.entries(delaisParTranche)
    .map(([tranche, delaisArray]) => ({
      heure: tranche,
      delaiMoyen: delaisArray.length > 0
        ? Math.round(delaisArray.reduce((sum, d) => sum + d, 0) / delaisArray.length)
        : 0,
      nombreLivraisons: delaisArray.length,
    }))
    .filter(item => item.nombreLivraisons > 0);

  return {
    moyen,
    mediane,
    min,
    max,
    parTrancheHoraire,
  };
}

/**
 * Calculer les statistiques par zone géographique
 * @param {Array} commandes - Liste des commandes enrichies avec adresses
 * @returns {Object} - Statistiques par zone
 */
function calculerStatistiquesZones(commandes) {
  const commandesLivraison = commandes.filter(cmd => cmd.type === "a livrer");

  // Groupement par commune
  const communesMap = {};
  const arrondissementsMap = {};

  commandesLivraison.forEach(cmd => {
    const adresse = cmd.adresse_complete;
    if (!adresse) return;

    const commune = adresse.commune || "Inconnu";
    const arrondissement = adresse.arrondissement || "Inconnu";
    const delai = calculerDelai(cmd);

    // Stats par commune
    if (!communesMap[commune]) {
      communesMap[commune] = {
        commune,
        nombreLivraisons: 0,
        montantTotal: 0,
        delais: [],
        arrondissements: {},
      };
    }

    communesMap[commune].nombreLivraisons++;
    communesMap[commune].montantTotal += cmd.paiement?.total || 0;
    if (delai !== null) {
      communesMap[commune].delais.push(delai);
    }

    // Sous-groupement par arrondissement
    if (!communesMap[commune].arrondissements[arrondissement]) {
      communesMap[commune].arrondissements[arrondissement] = {
        nom: arrondissement,
        count: 0,
      };
    }
    communesMap[commune].arrondissements[arrondissement].count++;

    // Stats par arrondissement (global)
    const arrondissementKey = `${commune}-${arrondissement}`;
    if (!arrondissementsMap[arrondissementKey]) {
      arrondissementsMap[arrondissementKey] = {
        commune,
        arrondissement,
        nombreLivraisons: 0,
        montantTotal: 0,
        delais: [],
      };
    }

    arrondissementsMap[arrondissementKey].nombreLivraisons++;
    arrondissementsMap[arrondissementKey].montantTotal += cmd.paiement?.total || 0;
    if (delai !== null) {
      arrondissementsMap[arrondissementKey].delais.push(delai);
    }
  });

  // Formater les résultats
  const parCommune = Object.values(communesMap)
    .map(item => ({
      commune: item.commune,
      nombreLivraisons: item.nombreLivraisons,
      montantTotal: item.montantTotal,
      delaiMoyen: item.delais.length > 0
        ? Math.round(item.delais.reduce((sum, d) => sum + d, 0) / item.delais.length)
        : 0,
      arrondissements: Object.values(item.arrondissements).sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.nombreLivraisons - a.nombreLivraisons);

  const parArrondissement = Object.values(arrondissementsMap)
    .map(item => ({
      commune: item.commune,
      arrondissement: item.arrondissement,
      nombreLivraisons: item.nombreLivraisons,
      montantTotal: item.montantTotal,
      delaiMoyen: item.delais.length > 0
        ? Math.round(item.delais.reduce((sum, d) => sum + d, 0) / item.delais.length)
        : 0,
    }))
    .sort((a, b) => b.nombreLivraisons - a.nombreLivraisons);

  return {
    parCommune,
    parArrondissement,
  };
}

/**
 * Calculer les statistiques des horaires courtants
 * @param {Array} commandes - Liste des commandes
 * @returns {Object} - Distribution horaire
 */
function calculerHorairesCourtants(commandes) {
  const commandesMap = {};
  const livraisonsMap = {};

  // Initialiser toutes les heures (0-23)
  for (let h = 0; h < 24; h++) {
    const heure = `${String(h).padStart(2, "0")}:00`;
    commandesMap[heure] = 0;
    livraisonsMap[heure] = 0;
  }

  commandes.forEach(cmd => {
    if (cmd.type !== "a livrer") return;

    // Heure de création de la commande
    if (cmd.createdAt) {
      const heureCreation = extractRoundedHour(cmd.createdAt);
      if (commandesMap[heureCreation] !== undefined) {
        commandesMap[heureCreation]++;
      }
    }

    // Heure de livraison (updatedAt si statut = livree)
    if (cmd.statut === "livree" && cmd.updatedAt) {
      const heureLivraison = extractRoundedHour(cmd.updatedAt);
      if (livraisonsMap[heureLivraison] !== undefined) {
        livraisonsMap[heureLivraison]++;
      }
    }
  });

  const commandes_horaires = Object.entries(commandesMap)
    .map(([heure, count]) => ({ heure, count }))
    .filter(item => item.count > 0);

  const livraisons_horaires = Object.entries(livraisonsMap)
    .map(([heure, count]) => ({ heure, count }))
    .filter(item => item.count > 0);

  return {
    commandes: commandes_horaires,
    livraisons: livraisons_horaires,
  };
}

/**
 * Calculer les statistiques globales
 * @param {Array} commandes - Liste des commandes
 * @returns {Object} - Statistiques globales
 */
function calculerStatistiquesGlobales(commandes) {
  const commandesLivraison = commandes.filter(cmd => cmd.type === "a livrer");

  if (commandesLivraison.length === 0) {
    return {
      nombreTotalLivraisons: 0,
      chiffreAffaire: 0,
      tauxLivraisonsTerminees: 0,
      tauxLivraisonsEnRetard: 0,
      nombreLivraisonsTerminees: 0,
      nombreLivraisonsEnCours: 0,
    };
  }

  const nombreLivraisonsTerminees = commandesLivraison.filter(
    cmd => cmd.statut === "livree"
  ).length;

  const nombreLivraisonsEnCours = commandesLivraison.filter(
    cmd => cmd.statut === "non livree"
  ).length;

  const chiffreAffaire = commandesLivraison.reduce(
    (sum, cmd) => sum + (cmd.paiement?.total || 0),
    0
  );

  const tauxLivraisonsTerminees = commandesLivraison.length > 0
    ? Math.round((nombreLivraisonsTerminees / commandesLivraison.length) * 100)
    : 0;

  // Calcul du taux de retard (basé sur date_heure_livraison prévue)
  let nombreLivraisonsEnRetard = 0;
  commandesLivraison.forEach(cmd => {
    if (cmd.statut !== "livree" || !cmd.date_heure_livraison || !cmd.updatedAt) {
      return;
    }

    // Parser la date prévue (DDMMYYYY et HH:MM)
    try {
      const { date, heure } = cmd.date_heure_livraison;
      const jour = parseInt(date.substring(0, 2));
      const mois = parseInt(date.substring(2, 4)) - 1;
      const annee = parseInt(date.substring(4, 8));
      const [h, m] = heure.split(":");

      const datePrevue = new Date(annee, mois, jour, parseInt(h), parseInt(m));
      const dateReelle = new Date(cmd.updatedAt);

      if (dateReelle > datePrevue) {
        nombreLivraisonsEnRetard++;
      }
    } catch (error) {
      // Ignorer les erreurs de parsing
    }
  });

  const tauxLivraisonsEnRetard = nombreLivraisonsTerminees > 0
    ? Math.round((nombreLivraisonsEnRetard / nombreLivraisonsTerminees) * 100)
    : 0;

  return {
    nombreTotalLivraisons: commandesLivraison.length,
    nombreLivraisonsTerminees,
    nombreLivraisonsEnCours,
    chiffreAffaire,
    tauxLivraisonsTerminees,
    tauxLivraisonsEnRetard,
  };
}

/**
 * Calculer toutes les statistiques pour une période donnée
 * @param {Array} commandes - Liste des commandes (depuis cache)
 * @param {Array} adresses - Liste des adresses (depuis cache)
 * @param {string} periode - Période (DDMMYYYY ou MMYYYY)
 * @returns {Object} - Toutes les statistiques
 */
export function calculerStatistiquesPeriode(commandes, adresses, periode) {
  // Filtrer les commandes pour la période
  const commandesPeriode = commandes.filter(cmd => {
    if (!cmd.createdAt) return false;

    const cmdDate = new Date(cmd.createdAt);
    const cmdPeriode = periode.length === 8
      ? formatDayKey(cmdDate)
      : formatMonthKey(cmdDate);

    return cmdPeriode === periode;
  });

  // Enrichir avec les adresses
  const commandesEnrichies = enrichirCommandesAvecAdresses(commandesPeriode, adresses);

  // Calculer toutes les stats
  const delais = calculerStatistiquesDelais(commandesEnrichies);
  const zones = calculerStatistiquesZones(commandesEnrichies);
  const horairesCourtants = calculerHorairesCourtants(commandesEnrichies);
  const statistiquesGlobales = calculerStatistiquesGlobales(commandesEnrichies);

  return {
    periode,
    delais,
    zones,
    horairesCourtants,
    statistiquesGlobales,
    derniereMiseAJour: Date.now(),
  };
}

// ============================================================================
// HOOKS REACT
// ============================================================================

/**
 * Hook pour récupérer les statistiques de livraison pour une période
 * @param {string} periode - Période (DDMMYYYY ou MMYYYY)
 * @param {Array} commandes - Cache des commandes (depuis commandeToolkit)
 * @param {Array} adresses - Cache des adresses (depuis adresseToolkit)
 * @returns {Object} - { stats, loading, error, refresh }
 */
export function useStatistiquesLivraison(periode, commandes = [], adresses = []) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const calculer = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache
      const cacheKey = `${CACHE_KEY_PREFIX}${periode}`;
      const cached = getFromCache(cacheKey);

      if (cached && commandes.length === 0) {
        // Si on a un cache et pas de nouvelles commandes, utiliser le cache
        setStats(cached);
        setLoading(false);
        return;
      }

      // Calculer les stats
      const nouvelles_stats = calculerStatistiquesPeriode(commandes, adresses, periode);

      // Sauvegarder dans le cache
      saveToCache(cacheKey, nouvelles_stats);

      setStats(nouvelles_stats);
    } catch (err) {
      console.error("Erreur calcul stats livraison:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periode, commandes, adresses]);

  // Calculer au montage et quand les données changent
  useEffect(() => {
    if (commandes.length > 0 && adresses.length > 0) {
      calculer();
    }
  }, [calculer, commandes.length, adresses.length]);

  // Écouter les notifications RTDB pour recalculer
  useEffect(() => {
    const commandesRef = ref(rtdb, RTDB_COMMANDES_NOTIFICATIONS);
    const adressesRef = ref(rtdb, RTDB_ADRESSES_NOTIFICATIONS);

    const handleNotification = () => {
      // Invalider le cache et recalculer
      invalidateCache(periode);
      if (commandes.length > 0 && adresses.length > 0) {
        calculer();
      }
    };

    onValue(commandesRef, handleNotification);
    onValue(adressesRef, handleNotification);

    return () => {
      off(commandesRef, "value", handleNotification);
      off(adressesRef, "value", handleNotification);
    };
  }, [periode, calculer, commandes.length, adresses.length]);

  const refresh = useCallback(() => {
    invalidateCache(periode);
    calculer();
  }, [periode, calculer]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook pour récupérer les statistiques d'une zone spécifique
 * @param {Object} stats - Statistiques globales
 * @param {string} type - Type de zone ("commune" ou "arrondissement")
 * @param {string} nom - Nom de la zone
 * @returns {Object} - Statistiques de la zone
 */
export function useStatistiquesZone(stats, type, nom) {
  return useMemo(() => {
    if (!stats || !stats.zones) return null;

    if (type === "commune") {
      return stats.zones.parCommune.find(z => z.commune === nom) || null;
    }

    if (type === "arrondissement") {
      return stats.zones.parArrondissement.find(z => z.arrondissement === nom) || null;
    }

    return null;
  }, [stats, type, nom]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  formatDayKey,
  formatMonthKey,
  extractHour,
  calculerDelai,
  TRANCHES_HORAIRES,
};
