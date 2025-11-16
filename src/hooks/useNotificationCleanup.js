/**
 * Hook pour le nettoyage automatique des notifications
 *
 * S'exécute automatiquement toutes les 48H pour supprimer
 * les notifications de plus de 48H des nœuds RTDB
 *
 * Usage:
 * ```jsx
 * function App() {
 *   useNotificationCleanup({ enabled: true, runOnMount: true });
 *   // ...
 * }
 * ```
 */

import { useEffect, useRef, useState } from "react";
import {
  cleanupOldNotifications,
  shouldRunCleanup,
  getLastCleanupDate,
  getTimeUntilNextCleanup,
} from "@/utils/notificationCleanup";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Vérifier toutes les 1 heure

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour gérer le nettoyage automatique des notifications
 *
 * @param {Object} options - Options de configuration
 * @param {boolean} options.enabled - Active/désactive le nettoyage automatique (défaut: true)
 * @param {boolean} options.runOnMount - Exécute le nettoyage au montage si nécessaire (défaut: false)
 * @param {number} options.checkInterval - Intervalle de vérification en ms (défaut: 1h)
 * @param {Function} options.onCleanupStart - Callback appelé au début du nettoyage
 * @param {Function} options.onCleanupComplete - Callback appelé à la fin du nettoyage
 * @param {Function} options.onCleanupError - Callback appelé en cas d'erreur
 *
 * @returns {Object} État et fonctions du nettoyage
 */
export default function useNotificationCleanup(options = {}) {
  const {
    enabled = true,
    runOnMount = false,
    checkInterval = CHECK_INTERVAL_MS,
    onCleanupStart = null,
    onCleanupComplete = null,
    onCleanupError = null,
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState(getLastCleanupDate());
  const [nextCleanup, setNextCleanup] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const hasRunOnMount = useRef(false);

  // ============================================================================
  // FONCTION DE NETTOYAGE
  // ============================================================================

  const runCleanup = async () => {
    if (isRunning) {
      console.log("⏭️  Nettoyage déjà en cours, skip");
      return;
    }

    try {
      console.log("🧹 useNotificationCleanup: Démarrage du nettoyage...");
      setIsRunning(true);
      setError(null);

      if (onCleanupStart) {
        onCleanupStart();
      }

      const cleanupStats = await cleanupOldNotifications();

      setStats(cleanupStats);
      setLastCleanup(new Date());
      updateNextCleanupTime();

      if (onCleanupComplete) {
        onCleanupComplete(cleanupStats);
      }

      console.log("✅ useNotificationCleanup: Nettoyage terminé", cleanupStats);
    } catch (err) {
      console.error("❌ useNotificationCleanup: Erreur nettoyage:", err);
      setError(err);

      if (onCleanupError) {
        onCleanupError(err);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // ============================================================================
  // VÉRIFICATION PÉRIODIQUE
  // ============================================================================

  const checkAndRunCleanup = async () => {
    if (!enabled) {
      return;
    }

    console.log("🔍 useNotificationCleanup: Vérification si nettoyage nécessaire...");

    if (shouldRunCleanup()) {
      console.log("✅ useNotificationCleanup: Nettoyage nécessaire");
      await runCleanup();
    } else {
      const timeUntil = getTimeUntilNextCleanup();
      const hoursUntil = (timeUntil / (1000 * 60 * 60)).toFixed(1);
      console.log(`⏰ useNotificationCleanup: Prochain nettoyage dans ${hoursUntil}h`);
      updateNextCleanupTime();
    }
  };

  // ============================================================================
  // MISE À JOUR DU TEMPS AVANT PROCHAIN NETTOYAGE
  // ============================================================================

  const updateNextCleanupTime = () => {
    const timeUntil = getTimeUntilNextCleanup();
    if (timeUntil > 0) {
      setNextCleanup(new Date(Date.now() + timeUntil));
    } else {
      setNextCleanup(null);
    }
  };

  // ============================================================================
  // EFFET: NETTOYAGE AU MONTAGE
  // ============================================================================

  useEffect(() => {
    if (enabled && runOnMount && !hasRunOnMount.current) {
      hasRunOnMount.current = true;
      console.log("🚀 useNotificationCleanup: Vérification au montage");
      checkAndRunCleanup();
    }
  }, [enabled, runOnMount]);

  // ============================================================================
  // EFFET: VÉRIFICATION PÉRIODIQUE
  // ============================================================================

  useEffect(() => {
    if (!enabled) {
      console.log("⏸️  useNotificationCleanup: Désactivé");
      return;
    }

    console.log(`⏰ useNotificationCleanup: Vérification toutes les ${checkInterval / (1000 * 60)}min`);

    // Vérifier immédiatement
    updateNextCleanupTime();

    // Puis vérifier périodiquement
    intervalRef.current = setInterval(checkAndRunCleanup, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, checkInterval]);

  // ============================================================================
  // RETOUR
  // ============================================================================

  return {
    // État
    isRunning,
    lastCleanup,
    nextCleanup,
    stats,
    error,

    // Actions
    runCleanup,
    checkAndRunCleanup,

    // Infos
    enabled,
  };
}
