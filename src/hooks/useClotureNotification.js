/**
 * useClotureNotification.js
 * Hook pour gérer les notifications de clôture journalière à 23h00
 * Solution D - Hybride : Timer + Vérifications horaires + LocalStorage
 */

import { useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { formatDayKey, getPreviousDay } from "@/toolkits/admin/comptabilite/utils";
import { HISTORIQUE_DAYS_COLLECTION } from "@/toolkits/admin/comptabilite/constants";

/**
 * Hook principal pour gérer les notifications de clôture
 * @returns {Object} Fonctions utilitaires
 */
export function useClotureNotification() {
  /**
   * Vérifie si la clôture a déjà été faite pour hier
   */
  const checkIfClotureAlreadyDone = useCallback(async () => {
    try {
      const today = formatDayKey();
      const yesterday = getPreviousDay(today);

      // Vérifier dans Firestore si historique existe pour hier
      const historyRef = doc(db, `${HISTORIQUE_DAYS_COLLECTION}/${yesterday}`);
      const historySnap = await getDoc(historyRef);

      // Vérifier aussi dans localStorage (pour éviter requêtes répétées)
      const lastCloture = localStorage.getItem("last_cloture_date");

      const isDone = historySnap.exists() || lastCloture === yesterday;

      if (isDone) {
        console.log(`✅ Clôture déjà effectuée pour ${yesterday}`);
      } else {
        console.log(`⚠️ Clôture pas encore faite pour ${yesterday}`);
      }

      return isDone;
    } catch (error) {
      console.error("❌ Erreur vérification clôture:", error);
      return false;
    }
  }, []);

  /**
   * Demande la permission pour les notifications
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("⚠️ Notifications non supportées par ce navigateur");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      console.warn("⚠️ Permission notifications refusée");
      return false;
    }

    // Demander permission
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("✅ Permission notifications accordée");
      return true;
    } else {
      console.warn("⚠️ Permission notifications refusée");
      return false;
    }
  }, []);

  /**
   * Affiche la notification de clôture
   */
  const showClotureNotification = useCallback(async () => {
    try {
      // Vérifier permission
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn("⚠️ Impossible d'afficher la notification (pas de permission)");
        return;
      }

      // Vérifier si clôture déjà faite
      const isAlreadyDone = await checkIfClotureAlreadyDone();
      if (isAlreadyDone) {
        console.log("✅ Clôture déjà effectuée, pas de notification");
        return;
      }

      // Vérifier si une notification similaire est déjà affichée
      const lastNotificationTime = localStorage.getItem("last_cloture_notification_time");
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (lastNotificationTime && (now - parseInt(lastNotificationTime)) < oneHour) {
        console.log("⏰ Notification déjà envoyée il y a moins d'1h");
        return;
      }

      // Afficher notification
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification("⏰ Clôture journalière", {
          body: "Il est temps de clôturer la journée comptable !",
          icon: "/icon-192.png",
          badge: "/badge-72.png",
          tag: "cloture-journaliere",
          requireInteraction: true,
          vibrate: [200, 100, 200],
          actions: [
            {
              action: "cloture",
              title: "✅ Faire la clôture",
              icon: "/icon-check.png",
            },
            {
              action: "later",
              title: "⏰ Me rappeler dans 1h",
              icon: "/icon-clock.png",
            },
          ],
          data: {
            url: "/admin/comptabilite/cloture",
            action: "cloture_journaliere",
            timestamp: now,
          },
        });

        // Sauvegarder le timestamp
        localStorage.setItem("last_cloture_notification_time", now.toString());

        console.log("🔔 Notification clôture envoyée");
      } else {
        // Fallback : notification simple (sans service worker)
        new Notification("⏰ Clôture journalière", {
          body: "Il est temps de clôturer la journée comptable !",
          tag: "cloture-journaliere",
          icon: "/icon-192.png",
        });

        localStorage.setItem("last_cloture_notification_time", now.toString());
        console.log("🔔 Notification clôture simple envoyée");
      }
    } catch (error) {
      console.error("❌ Erreur affichage notification:", error);
    }
  }, [checkIfClotureAlreadyDone, requestNotificationPermission]);

  /**
   * Planifie la vérification à 23h00
   */
  const scheduleClotureCheck = useCallback(() => {
    const now = new Date();
    const target = new Date();
    target.setHours(23, 0, 0, 0); // 23h00

    // Si déjà passé 23h, planifier pour demain
    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    console.log(`📅 Notification clôture planifiée pour ${target.toLocaleString("fr-FR")}`);

    const timerId = setTimeout(() => {
      showClotureNotification();

      // Replanifier pour le lendemain
      scheduleClotureCheck();
    }, delay);

    // Sauvegarder ID pour cleanup
    localStorage.setItem("cloture_timer_id", timerId.toString());

    return timerId;
  }, [showClotureNotification]);

  /**
   * Planifie des vérifications horaires entre 22h et 23h59
   */
  const scheduleHourlyChecks = useCallback(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();

      // Entre 22h et 23h59, vérifier
      if (hours >= 22 && hours <= 23) {
        console.log(`🔍 Vérification horaire clôture (${hours}h)`);

        checkIfClotureAlreadyDone().then((isDone) => {
          // Si pas fait et qu'il est 23h, notifier
          if (!isDone && hours === 23) {
            showClotureNotification();
          }
        });
      }
    }, 60 * 60 * 1000); // Toutes les heures

    return checkInterval;
  }, [checkIfClotureAlreadyDone, showClotureNotification]);

  /**
   * Planifie une notification dans X minutes (pour "rappeler plus tard")
   */
  const scheduleReminderIn = useCallback(
    (minutes = 60) => {
      const delay = minutes * 60 * 1000;

      console.log(`⏰ Rappel clôture planifié dans ${minutes} minutes`);

      const timerId = setTimeout(() => {
        showClotureNotification();
      }, delay);

      return timerId;
    },
    [showClotureNotification]
  );

  /**
   * Marque la clôture comme effectuée
   */
  const markClotureAsDone = useCallback(() => {
    const yesterday = getPreviousDay(formatDayKey());
    localStorage.setItem("last_cloture_date", yesterday);
    console.log(`✅ Clôture marquée comme effectuée pour ${yesterday}`);
  }, []);

  // Initialisation au montage du hook
  useEffect(() => {
    // Demander permission au démarrage
    requestNotificationPermission();

    // Planifier notification 23h00
    const timerId = scheduleClotureCheck();

    // Planifier vérifications horaires
    const intervalId = scheduleHourlyChecks();

    // Cleanup
    return () => {
      clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [scheduleClotureCheck, scheduleHourlyChecks, requestNotificationPermission]);

  return {
    showClotureNotification,
    checkIfClotureAlreadyDone,
    requestNotificationPermission,
    scheduleReminderIn,
    markClotureAsDone,
  };
}

export default useClotureNotification;
