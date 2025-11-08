/**
 * loadOperationsForPeriod.js
 * Fonction utilitaire pour charger intelligemment les opérations selon la période
 */

import {
  getOperationsToday,
  getOperationsForPeriod,
} from "@/toolkits/admin/comptabiliteToolkit";

/**
 * Charge les opérations pour une période donnée
 * Optimise le chargement en fonction de la plage de dates
 *
 * @param {number} dateDebut - Timestamp de début
 * @param {number} dateFin - Timestamp de fin
 * @returns {Promise<{operations: Array, daysLoaded: number}>}
 */
export async function loadOperationsForDateRange(dateDebut, dateFin) {
  // Calculer la différence en jours
  const daysDiff = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));

  // Vérifier si c'est aujourd'hui uniquement
  const aujourdhuiDebut = new Date().setHours(0, 0, 0, 0);
  const aujourdhuiFin = new Date().setHours(23, 59, 59, 999);

  const isToday = dateDebut >= aujourdhuiDebut && dateFin <= aujourdhuiFin;

  if (isToday) {
    // Charger uniquement aujourd'hui (plus rapide)
    console.log("📅 Chargement: aujourd'hui uniquement");
    const data = await getOperationsToday();
    return {
      operations: data.operations,
      daysLoaded: 0, // 0 = aujourd'hui seulement
    };
  }

  // Charger la période complète
  const nombreJours = daysDiff + 1;
  console.log(`📅 Chargement: ${nombreJours} jours`);

  const data = await getOperationsForPeriod(nombreJours, new Date(dateDebut));

  return {
    operations: data.operations,
    daysLoaded: nombreJours,
  };
}

/**
 * Détermine si un rechargement est nécessaire
 *
 * @param {number} currentDaysLoaded - Nombre de jours actuellement chargés
 * @param {number} requiredDays - Nombre de jours requis
 * @returns {boolean}
 */
export function shouldReload(currentDaysLoaded, requiredDays) {
  // Si on demande aujourd'hui (0) et qu'on a déjà chargé plus, pas besoin
  if (requiredDays === 0 && currentDaysLoaded >= 0) {
    return false;
  }

  // Si on demande une période plus grande que celle chargée, recharger
  return requiredDays > currentDaysLoaded;
}
