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

const RTDB_NOTIFICATIONS_PATHS = ["notification", "notifications"]; // Deux nœuds RTDB
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
  // EFFET: ÉCOUTER LES NOTIFICATIONS RTDB (DEUX NŒUDS)
  // ============================================================================
  useEffect(() => {
    console.log("🔌 useNotifications: Configuration des listeners RTDB...");
    console.log(`📡 useNotifications: Écoute de ${RTDB_NOTIFICATIONS_PATHS.length} nœuds:`, RTDB_NOTIFICATIONS_PATHS);

    // Buffer partagé pour les deux nœuds
    const notificationBuffer = new Map(); // Utiliser Map pour éviter les doublons

    // Handler pour les nouvelles notifications
    const handleNewNotification = (nodePath) => (snapshot) => {
      try {
        const key = snapshot.key;
        const notification = snapshot.val();

        if (!notification) return;

        // Créer un ID unique incluant le nœud source pour éviter les collisions
        const uniqueId = `${nodePath}_${key}`;

        // Formater la notification
        const formattedNotif = formatNotification(uniqueId, notification);

        console.log(`📡 useNotifications: Nouvelle notification depuis ${nodePath}`, {
          type: formattedNotif.type,
          module: formattedNotif.module,
          titre: formattedNotif.titre,
        });

        // Ajouter au buffer (Map élimine automatiquement les doublons)
        notificationBuffer.set(uniqueId, formattedNotif);

        // Convertir Map en Array et limiter la taille
        let notifArray = Array.from(notificationBuffer.values());

        // Trier par timestamp décroissant
        notifArray.sort((a, b) => b.timestamp - a.timestamp);

        // Limiter la taille
        if (notifArray.length > MAX_NOTIFICATIONS) {
          notifArray = notifArray.slice(0, MAX_NOTIFICATIONS);

          // Reconstruire le buffer avec les notifications gardées
          notificationBuffer.clear();
          notifArray.forEach((notif) => notificationBuffer.set(notif.id, notif));
        }

        // Mettre à jour l'état
        setNotifications(notifArray);
        setLoading(false);
      } catch (err) {
        console.error(`❌ useNotifications: Erreur traitement notification (${nodePath}):`, err);
        setError(err.message);
      }
    };

    // Créer un listener pour chaque nœud
    const unsubscribers = RTDB_NOTIFICATIONS_PATHS.map((nodePath) => {
      const notificationsRef = ref(rtdb, nodePath);
      const notificationsQuery = query(notificationsRef, limitToLast(MAX_NOTIFICATIONS));

      console.log(`🔌 useNotifications: Listener actif sur ${nodePath}`);

      return onChildAdded(notificationsQuery, handleNewNotification(nodePath));
    });

    // Timer de sécurité
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("⏰ useNotifications: Timeout chargement");
        setLoading(false);
      }
    }, 3000);

    return () => {
      console.log("🔌 useNotifications: Nettoyage des listeners");
      unsubscribers.forEach((unsubscribe) => unsubscribe());
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

      // Extraire le nœud source et la clé depuis l'ID unique (format: "nodePath_key")
      const [nodePath, ...keyParts] = notificationId.split("_");
      const key = keyParts.join("_"); // Rejoindre au cas où la clé contient des underscores

      // Mettre à jour dans RTDB sur le bon nœud
      const notifRef = ref(rtdb, `${nodePath}/${key}`);
      await update(notifRef, { read: true });

      console.log(`✅ Notification marquée comme lue dans RTDB (${nodePath}/${key})`);
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
          // Extraire le nœud source et la clé depuis l'ID unique
          const [nodePath, ...keyParts] = notif.id.split("_");
          const key = keyParts.join("_");

          const notifRef = ref(rtdb, `${nodePath}/${key}`);
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
