/**
 * utils.js
 * Utilitaires pour la comptabilité (dates, cache, etc.)
 */

import { CACHE_LIFETIME } from "./constants";

// ============================================================================
// UTILITAIRES DE DATES
// ============================================================================

/**
 * Formate une date en DDMMYYYY
 * @param {Date|number} date
 * @returns {string} Format DDMMYYYY
 */
export function formatDayKey(date = new Date()) {
  const d = typeof date === "number" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

/**
 * Retourne la clé de la semaine courante (lundi-dimanche)
 * @param {Date|number} date
 * @returns {string} Format DDMMYYYY-DDMMYYYY
 */
export function formatWeekKey(date = new Date()) {
  const d = typeof date === "number" ? new Date(date) : date;

  // Trouver le lundi de la semaine
  const currentDay = d.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // Si dimanche, reculer de 6 jours
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);

  // Trouver le dimanche de la semaine
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${formatDayKey(monday)}-${formatDayKey(sunday)}`;
}

/**
 * Retourne la clé du mois courant
 * @param {Date|number} date
 * @returns {string} Format MMYYYY
 */
export function formatMonthKey(date = new Date()) {
  const d = typeof date === "number" ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${month}${year}`;
}

/**
 * Détecte si on a changé de jour
 * @param {string} lastDayKey - Dernier jour stocké
 * @returns {boolean}
 */
export function isNewDay(lastDayKey) {
  const currentDay = formatDayKey();
  return currentDay !== lastDayKey;
}

/**
 * Détecte si on a changé de semaine
 * @param {string} lastWeekKey - Dernière semaine stockée
 * @returns {boolean}
 */
export function isNewWeek(lastWeekKey) {
  const currentWeek = formatWeekKey();
  return currentWeek !== lastWeekKey;
}

/**
 * Retourne le jour précédent
 * @param {string} dayKey - Format DDMMYYYY
 * @returns {string} Format DDMMYYYY
 */
export function getPreviousDay(dayKey) {
  const day = parseInt(dayKey.substring(0, 2), 10);
  const month = parseInt(dayKey.substring(2, 4), 10);
  const year = parseInt(dayKey.substring(4, 8), 10);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  return formatDayKey(date);
}

/**
 * Retourne la semaine précédente
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {string} Format DDMMYYYY-DDMMYYYY
 */
export function getPreviousWeek(weekKey) {
  const [startKey] = weekKey.split("-");

  const day = parseInt(startKey.substring(0, 2), 10);
  const month = parseInt(startKey.substring(2, 4), 10);
  const year = parseInt(startKey.substring(4, 8), 10);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 7); // Reculer d'une semaine

  return formatWeekKey(date);
}

/**
 * Parse une clé de semaine pour obtenir les dates de début et fin
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {{debut: Date, fin: Date}}
 */
export function parseWeekKey(weekKey) {
  const [debutKey, finKey] = weekKey.split("-");

  const debutDay = parseInt(debutKey.substring(0, 2), 10);
  const debutMonth = parseInt(debutKey.substring(2, 4), 10);
  const debutYear = parseInt(debutKey.substring(4, 8), 10);

  const finDay = parseInt(finKey.substring(0, 2), 10);
  const finMonth = parseInt(finKey.substring(2, 4), 10);
  const finYear = parseInt(finKey.substring(4, 8), 10);

  return {
    debut: new Date(debutYear, debutMonth - 1, debutDay),
    fin: new Date(finYear, finMonth - 1, finDay),
  };
}

/**
 * Retourne tous les jours d'une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {string[]} Array de DDMMYYYY
 */
export function getDaysInWeek(weekKey) {
  const { debut } = parseWeekKey(weekKey);
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(debut);
    date.setDate(debut.getDate() + i);
    days.push(formatDayKey(date));
  }

  return days;
}

/**
 * Retourne tous les jours d'un mois
 * @param {string} monthKey - Format MMYYYY
 * @returns {string[]} Array de DDMMYYYY
 */
export function getDaysInMonth(monthKey) {
  const month = parseInt(monthKey.substring(0, 2), 10);
  const year = parseInt(monthKey.substring(2, 6), 10);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const days = [];
  for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(formatDayKey(new Date(d)));
  }

  return days;
}

// ============================================================================
// FORMATAGE DE DATES LISIBLES
// ============================================================================

/**
 * Formate une clé de jour (DDMMYYYY) en format lisible français
 * @param {string} dayKey - Format DDMMYYYY
 * @param {Object} options - Options de formatage
 * @param {boolean} options.short - Format court (10 Nov. 2025) vs long (10 novembre 2025)
 * @returns {string} Date formatée
 */
export function formatDayKeyReadable(dayKey, options = { short: true }) {
  if (!dayKey || dayKey.length !== 8) return dayKey;

  const day = parseInt(dayKey.substring(0, 2), 10);
  const month = parseInt(dayKey.substring(2, 4), 10);
  const year = parseInt(dayKey.substring(4, 8), 10);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: options.short ? 'short' : 'long',
    year: 'numeric'
  });
}

/**
 * Formate une clé de mois (MMYYYY) en format lisible français
 * @param {string} monthKey - Format MMYYYY
 * @param {Object} options - Options de formatage
 * @param {boolean} options.short - Format court (Nov. 2025) vs long (Novembre 2025)
 * @param {boolean} options.capitalize - Capitaliser le mois
 * @returns {string} Mois formaté
 */
export function formatMonthKeyReadable(monthKey, options = { short: false, capitalize: true }) {
  if (!monthKey || monthKey.length !== 6) return monthKey;

  const month = parseInt(monthKey.substring(0, 2), 10);
  const year = parseInt(monthKey.substring(2, 6), 10);

  const date = new Date(year, month - 1, 1);

  let formatted = date.toLocaleDateString('fr-FR', {
    month: options.short ? 'short' : 'long',
    year: 'numeric'
  });

  // Capitaliser la première lettre si demandé
  if (options.capitalize) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return formatted;
}

/**
 * Formate une clé de semaine (DDMMYYYY-DDMMYYYY) en format lisible
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @param {Object} options - Options de formatage
 * @param {boolean} options.short - Format court
 * @returns {string} Semaine formatée (ex: "10 Nov. - 16 Nov. 2025")
 */
export function formatWeekKeyReadable(weekKey, options = { short: true }) {
  if (!weekKey || !weekKey.includes('-')) return weekKey;

  const [debutKey, finKey] = weekKey.split('-');

  const debutDay = parseInt(debutKey.substring(0, 2), 10);
  const debutMonth = parseInt(debutKey.substring(2, 4), 10);
  const debutYear = parseInt(debutKey.substring(4, 8), 10);

  const finDay = parseInt(finKey.substring(0, 2), 10);
  const finMonth = parseInt(finKey.substring(2, 4), 10);
  const finYear = parseInt(finKey.substring(4, 8), 10);

  const debutDate = new Date(debutYear, debutMonth - 1, debutDay);
  const finDate = new Date(finYear, finMonth - 1, finDay);

  const formatOptions = {
    day: 'numeric',
    month: options.short ? 'short' : 'long'
  };

  const debutFormatted = debutDate.toLocaleDateString('fr-FR', formatOptions);

  // Si même année, on ne met l'année qu'à la fin
  if (debutYear === finYear) {
    const finFormatted = finDate.toLocaleDateString('fr-FR', {
      ...formatOptions,
      year: 'numeric'
    });
    return `${debutFormatted} - ${finFormatted}`;
  } else {
    // Années différentes, on met l'année pour les deux
    const debutWithYear = debutDate.toLocaleDateString('fr-FR', {
      ...formatOptions,
      year: 'numeric'
    });
    const finWithYear = finDate.toLocaleDateString('fr-FR', {
      ...formatOptions,
      year: 'numeric'
    });
    return `${debutWithYear} - ${finWithYear}`;
  }
}

// ============================================================================
// GESTION DU CACHE LOCAL
// ============================================================================

/**
 * Sauvegarde des données dans le cache avec timestamp
 * @param {string} key
 * @param {any} data
 */
export function saveToCache(key, data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    console.log(`✅ Cache sauvegardé: ${key}`);
  } catch (error) {
    console.error(`❌ Erreur sauvegarde cache ${key}:`, error);
  }
}

/**
 * Récupère des données du cache si elles ne sont pas expirées
 * @param {string} key
 * @returns {any|null}
 */
export function getFromCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (age > CACHE_LIFETIME) {
      console.log(`⏰ Cache expiré: ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    console.log(`✅ Cache récupéré: ${key}`);
    return cacheData.data;
  } catch (error) {
    console.error(`❌ Erreur lecture cache ${key}:`, error);
    return null;
  }
}

/**
 * Supprime une entrée du cache
 * @param {string} key
 */
export function clearCache(key) {
  try {
    localStorage.removeItem(key);
    console.log(`🗑️ Cache supprimé: ${key}`);
  } catch (error) {
    console.error(`❌ Erreur suppression cache ${key}:`, error);
  }
}

/**
 * Supprime tout le cache comptabilité
 */
export function clearAllComptaCache() {
  try {
    const keys = Object.keys(localStorage);
    const comptaKeys = keys.filter((key) => key.startsWith("local_compta") || key.startsWith("local_comptes") || key.startsWith("local_tresorerie"));

    comptaKeys.forEach((key) => localStorage.removeItem(key));
    console.log(`🗑️ ${comptaKeys.length} entrées de cache comptabilité supprimées`);
  } catch (error) {
    console.error("❌ Erreur suppression cache comptabilité:", error);
  }
}
