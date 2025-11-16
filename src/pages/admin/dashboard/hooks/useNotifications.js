/**
 * Hook personnalisé pour gérer les notifications du dashboard
 * Écoute les notifications RTDB et permet de les marquer comme lues
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { ref, onChildAdded, query, limitToLast, update } from "firebase/database";
import { rtdb } from "@/firebase.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const RTDB_NOTIFICATIONS_PATH = "notification";
const MAX_NOTIFICATIONS = 50; // Nombre max de notifications à garder

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Détermine le type de notification selon le titre
 */
const getNotificationType = (title, message) => {
  // Priorité aux erreurs et urgences
  if (
    title.includes("Erreur") ||
    title.includes("Échec") ||
    title.includes("échou") ||
    message.includes("erreur")
  ) {
    return "error";
  }

  if (
    title.includes("Alerte") ||
    title.includes("Attention") ||
    title.includes("Retard") ||
    title.includes("critique") ||
    message.includes("alerte")
  ) {
    return "warning";
  }

  if (
    title.includes("Succès") ||
    title.includes("Terminé") ||
    title.includes("Validé") ||
    title.includes("validée")
  ) {
    return "success";
  }

  return "info"; // Par défaut
};

/**
 * Détermine le module concerné par la notification
 */
const getNotificationModule = (title, message) => {
  if (title.includes("stock") || title.includes("Stock")) return "Stock";
  if (title.includes("Commande") || title.includes("Vente")) return "Ventes";
  if (title.includes("Production")) return "Production";
  if (title.includes("Livraison")) return "Livraisons";
  if (title.includes("comptable") || title.includes("Opération"))
    return "Comptabilité";
  if (title.includes("Utilisateur") || title.includes("User")) return "Équipe";

  return "Système";
};

/**
 * Convertit une notification RTDB en notification formatée
 */
const formatNotification = (key, notification) => {
  return {
    id: key,
    titre: notification.title || "Notification",
    message: notification.message || "",
    type: getNotificationType(notification.title || "", notification.message || ""),
    module: getNotificationModule(notification.title || "", notification.message || ""),
    timestamp: notification.timestamp || Date.now(),
    read: notification.read || false,
    userName: notification.userName || null,
    userId: notification.userId || null,
  };
};

// ============================================================================
// HOOK useNotifications
// ============================================================================

/**
 * Hook pour gérer les notifications du dashboard
 * @returns {Object} { notifications, unreadCount, loading, error, markAsRead, clearAll }
 */
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // EFFET: ÉCOUTER LES NOTIFICATIONS RTDB
  // ============================================================================
  useEffect(() => {
    console.log("🔌 useNotifications: Configuration du listener RTDB...");

    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);
    const notificationsQuery = query(notificationsRef, limitToLast(MAX_NOTIFICATIONS));

    const notificationBuffer = [];

    // Handler pour les nouvelles notifications
    const handleNewNotification = (snapshot) => {
      try {
        const key = snapshot.key;
        const notification = snapshot.val();

        if (!notification) return;

        // Formater la notification
        const formattedNotif = formatNotification(key, notification);

        console.log("📡 useNotifications: Nouvelle notification", {
          type: formattedNotif.type,
          module: formattedNotif.module,
          titre: formattedNotif.titre,
        });

        // Ajouter au buffer
        notificationBuffer.push(formattedNotif);

        // Limiter la taille
        if (notificationBuffer.length > MAX_NOTIFICATIONS) {
          notificationBuffer.shift();
        }

        // Trier par timestamp décroissant
        notificationBuffer.sort((a, b) => b.timestamp - a.timestamp);

        // Mettre à jour l'état
        setNotifications([...notificationBuffer]);
        setLoading(false);
      } catch (err) {
        console.error("❌ useNotifications: Erreur traitement notification:", err);
        setError(err.message);
      }
    };

    // Écouter les notifications
    const unsubscribe = onChildAdded(notificationsQuery, handleNewNotification);

    // Timer de sécurité
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("⏰ useNotifications: Timeout chargement");
        setLoading(false);
      }
    }, 3000);

    return () => {
      console.log("🔌 useNotifications: Nettoyage du listener");
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // ============================================================================
  // MÉMO: NOMBRE DE NOTIFICATIONS NON LUES
  // ============================================================================
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // ============================================================================
  // ACTION: MARQUER COMME LUE
  // ============================================================================
  const markAsRead = useCallback(async (notificationId) => {
    try {
      console.log("✅ Marquage notification comme lue:", notificationId);

      // Mettre à jour localement immédiatement (optimistic update)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );

      // Mettre à jour dans RTDB
      const notifRef = ref(rtdb, `${RTDB_NOTIFICATIONS_PATH}/${notificationId}`);
      await update(notifRef, { read: true });

      console.log("✅ Notification marquée comme lue dans RTDB");
    } catch (err) {
      console.error("❌ Erreur marquage notification:", err);
      // Revenir à l'état précédent en cas d'erreur
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
    }
  }, []);

  // ============================================================================
  // ACTION: TOUT MARQUER COMME LU
  // ============================================================================
  const markAllAsRead = useCallback(async () => {
    try {
      console.log("✅ Marquage de toutes les notifications comme lues");

      // Obtenir toutes les notifications non lues
      const unreadNotifications = notifications.filter((n) => !n.read);

      // Mettre à jour localement immédiatement
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      // Mettre à jour dans RTDB en parallèle
      await Promise.all(
        unreadNotifications.map((notif) => {
          const notifRef = ref(rtdb, `${RTDB_NOTIFICATIONS_PATH}/${notif.id}`);
          return update(notifRef, { read: true });
        })
      );

      console.log("✅ Toutes les notifications marquées comme lues dans RTDB");
    } catch (err) {
      console.error("❌ Erreur marquage toutes notifications:", err);
    }
  }, [notifications]);

  // ============================================================================
  // ACTION: SUPPRIMER TOUTES LES NOTIFICATIONS
  // ============================================================================
  const clearAll = useCallback(() => {
    console.log("🗑️ Suppression de toutes les notifications (local uniquement)");
    // Note: On ne supprime que localement pour ne pas affecter les autres utilisateurs
    setNotifications([]);
  }, []);

  // ============================================================================
  // RETOUR
  // ============================================================================
  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};

export default useNotifications;
