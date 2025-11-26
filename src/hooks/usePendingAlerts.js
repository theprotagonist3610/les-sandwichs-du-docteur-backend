/**
 * usePendingAlerts.js
 * Hook pour vérification cyclique des todos non terminés et notifications non lues
 * Intervalle: 1 heure
 */

import { useState, useEffect, useCallback } from "react";
import { useTodos } from "@/toolkits/admin/todoToolkit";
import useNotifications from "@/pages/admin/dashboard/hooks/useNotifications";

// Intervalle de vérification: 1 heure en millisecondes
const CHECK_INTERVAL = 60 * 60 * 1000; // 1h

/**
 * Hook pour surveiller les alertes en attente (todos + notifications)
 * @returns {Object} { pendingTodos, pendingNotifications, totalPending, showAlert, dismissAlert }
 */
export function usePendingAlerts() {
  const [showAlert, setShowAlert] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  // Récupérer les todos et notifications
  const { todos, loading: loadingTodos } = useTodos();
  const { unreadCount, loading: loadingNotifications } = useNotifications();

  // Calculer les todos non terminés (status = false)
  const pendingTodos = todos.filter((todo) => !todo.status).length;
  const pendingNotifications = unreadCount;
  const totalPending = pendingTodos + pendingNotifications;

  /**
   * Vérifie et affiche l'alerte si nécessaire
   */
  const checkAndShowAlert = useCallback(() => {
    if (loadingTodos || loadingNotifications) return;

    const hasPending = pendingTodos > 0 || pendingNotifications > 0;

    if (hasPending) {
      console.log("🔔 Alertes en attente détectées:", {
        todos: pendingTodos,
        notifications: pendingNotifications,
      });
      setShowAlert(true);
      setLastCheck(Date.now());
    }
  }, [pendingTodos, pendingNotifications, loadingTodos, loadingNotifications]);

  /**
   * Ferme manuellement l'alerte
   */
  const dismissAlert = useCallback(() => {
    setShowAlert(false);
  }, []);

  /**
   * Auto-dismiss après 5 secondes
   */
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000); // 5 secondes

      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  /**
   * Vérification initiale (au montage)
   */
  useEffect(() => {
    // Attendre que les données soient chargées
    if (!loadingTodos && !loadingNotifications) {
      // Petite temporisation pour laisser les données se stabiliser
      const initialTimer = setTimeout(() => {
        checkAndShowAlert();
      }, 2000); // 2 secondes après le chargement

      return () => clearTimeout(initialTimer);
    }
  }, [loadingTodos, loadingNotifications, checkAndShowAlert]);

  /**
   * Vérification cyclique (chaque heure)
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("⏰ Vérification cyclique des alertes en attente...");
      checkAndShowAlert();
    }, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [checkAndShowAlert]);

  return {
    pendingTodos,
    pendingNotifications,
    totalPending,
    showAlert,
    dismissAlert,
    lastCheck,
  };
}

export default usePendingAlerts;
