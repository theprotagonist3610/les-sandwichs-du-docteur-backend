/**
 * Service de nettoyage des notifications RTDB
 *
 * Supprime automatiquement les notifications de plus de 48H
 * des nœuds "notification" et "notifications"
 */

import { ref, query, orderByChild, endAt, get, remove } from "firebase/database";
import { rtdb } from "@/firebase.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const RTDB_NOTIFICATIONS_PATHS = ["notification", "notifications"];
const RETENTION_PERIOD_MS = 48 * 60 * 60 * 1000; // 48 heures en millisecondes
const CLEANUP_INTERVAL_MS = 48 * 60 * 60 * 1000; // Vérifier toutes les 48H
const LAST_CLEANUP_KEY = "notificationCleanup_lastRun";

// ============================================================================
// FONCTION PRINCIPALE DE NETTOYAGE
// ============================================================================

/**
 * Nettoie les notifications de plus de 48H sur les deux nœuds RTDB
 * @returns {Promise<Object>} Statistiques du nettoyage
 */
export async function cleanupOldNotifications() {
  console.log("🧹 Démarrage du nettoyage des notifications...");

  const now = Date.now();
  const cutoffTimestamp = now - RETENTION_PERIOD_MS;
  const cutoffDate = new Date(cutoffTimestamp);

  console.log(`📅 Suppression des notifications avant: ${cutoffDate.toLocaleString("fr-FR")}`);

  const stats = {
    totalDeleted: 0,
    deletedByNode: {},
    errors: [],
    startTime: now,
    endTime: null,
  };

  try {
    // Nettoyer chaque nœud
    for (const nodePath of RTDB_NOTIFICATIONS_PATHS) {
      try {
        const deletedCount = await cleanupNode(nodePath, cutoffTimestamp);
        stats.deletedByNode[nodePath] = deletedCount;
        stats.totalDeleted += deletedCount;
      } catch (err) {
        console.error(`❌ Erreur nettoyage ${nodePath}:`, err);
        stats.errors.push({
          node: nodePath,
          error: err.message,
        });
      }
    }

    stats.endTime = Date.now();
    const duration = ((stats.endTime - stats.startTime) / 1000).toFixed(2);

    console.log(`✅ Nettoyage terminé en ${duration}s`);
    console.log(`📊 Statistiques:`, {
      total: stats.totalDeleted,
      details: stats.deletedByNode,
    });

    // Sauvegarder la date du dernier nettoyage
    localStorage.setItem(LAST_CLEANUP_KEY, now.toString());

    return stats;
  } catch (err) {
    console.error("❌ Erreur lors du nettoyage des notifications:", err);
    stats.errors.push({
      error: err.message,
      stack: err.stack,
    });
    stats.endTime = Date.now();
    throw err;
  }
}

/**
 * Nettoie les notifications d'un seul nœud RTDB
 * @param {string} nodePath - Chemin du nœud RTDB
 * @param {number} cutoffTimestamp - Timestamp limite (supprimer avant)
 * @returns {Promise<number>} Nombre de notifications supprimées
 */
async function cleanupNode(nodePath, cutoffTimestamp) {
  console.log(`🔍 Analyse du nœud: ${nodePath}`);

  const nodeRef = ref(rtdb, nodePath);

  // Query pour obtenir toutes les notifications avant le cutoff
  // Note: orderByChild nécessite un index dans les règles Firebase
  const oldNotificationsQuery = query(
    nodeRef,
    orderByChild("timestamp"),
    endAt(cutoffTimestamp)
  );

  try {
    const snapshot = await get(oldNotificationsQuery);

    if (!snapshot.exists()) {
      console.log(`✨ ${nodePath}: Aucune notification à supprimer`);
      return 0;
    }

    const notificationsToDelete = snapshot.val();
    const keysToDelete = Object.keys(notificationsToDelete);
    const count = keysToDelete.length;

    console.log(`🗑️  ${nodePath}: ${count} notification(s) à supprimer`);

    // Supprimer chaque notification individuellement
    // (Firebase RTDB ne supporte pas la suppression par batch dans le SDK web)
    const deletePromises = keysToDelete.map((key) => {
      const notifRef = ref(rtdb, `${nodePath}/${key}`);
      return remove(notifRef);
    });

    await Promise.all(deletePromises);

    console.log(`✅ ${nodePath}: ${count} notification(s) supprimée(s)`);
    return count;
  } catch (err) {
    console.error(`❌ Erreur lecture/suppression ${nodePath}:`, err);
    throw err;
  }
}

// ============================================================================
// VÉRIFICATION SI NETTOYAGE NÉCESSAIRE
// ============================================================================

/**
 * Vérifie si un nettoyage est nécessaire (basé sur la dernière exécution)
 * @returns {boolean} True si nettoyage nécessaire
 */
export function shouldRunCleanup() {
  const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);

  if (!lastCleanup) {
    console.log("📋 Aucun nettoyage précédent trouvé");
    return true;
  }

  const lastCleanupTime = parseInt(lastCleanup, 10);
  const now = Date.now();
  const timeSinceLastCleanup = now - lastCleanupTime;
  const hoursSinceLastCleanup = (timeSinceLastCleanup / (1000 * 60 * 60)).toFixed(1);

  console.log(`⏱️  Dernier nettoyage il y a ${hoursSinceLastCleanup}h`);

  return timeSinceLastCleanup >= CLEANUP_INTERVAL_MS;
}

/**
 * Obtient la date du dernier nettoyage
 * @returns {Date|null} Date du dernier nettoyage ou null
 */
export function getLastCleanupDate() {
  const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
  return lastCleanup ? new Date(parseInt(lastCleanup, 10)) : null;
}

/**
 * Obtient le temps restant avant le prochain nettoyage (en millisecondes)
 * @returns {number} Temps en ms, ou 0 si nettoyage immédiat nécessaire
 */
export function getTimeUntilNextCleanup() {
  const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);

  if (!lastCleanup) {
    return 0;
  }

  const lastCleanupTime = parseInt(lastCleanup, 10);
  const nextCleanupTime = lastCleanupTime + CLEANUP_INTERVAL_MS;
  const now = Date.now();
  const timeRemaining = nextCleanupTime - now;

  return Math.max(0, timeRemaining);
}

// ============================================================================
// NETTOYAGE MANUEL
// ============================================================================

/**
 * Force le nettoyage immédiatement (ignore la dernière exécution)
 * Utile pour les tests ou nettoyage manuel
 * @returns {Promise<Object>} Statistiques du nettoyage
 */
export async function forceCleanup() {
  console.log("⚡ Nettoyage forcé (ignore la dernière exécution)");
  return cleanupOldNotifications();
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  cleanupOldNotifications,
  shouldRunCleanup,
  getLastCleanupDate,
  getTimeUntilNextCleanup,
  forceCleanup,
  RETENTION_PERIOD_MS,
  CLEANUP_INTERVAL_MS,
};
