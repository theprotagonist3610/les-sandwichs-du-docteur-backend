/**
 * Hook personnalisé pour gérer les notifications du dashboard
 * Écoute les notifications RTDB et permet de les marquer comme lues
 * Nettoie automatiquement les notifications de plus de 48h
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ref, onChildAdded, query, limitToLast, update, remove, get } from "firebase/database";
import { rtdb } from "@/firebase.js";
import {
  NOTIFICATION_PATHS,
  LEGACY_PATHS,
} from "@/utils/notificationHelpers";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Tous les paths à écouter (legacy + nouveaux modules)
const RTDB_NOTIFICATIONS_PATHS = [
  // Legacy paths
  LEGACY_PATHS.NOTIFICATION,
  LEGACY_PATHS.NOTIFICATIONS,
  LEGACY_PATHS.COMMANDES_QUEUE,
  LEGACY_PATHS.COMPTABILITE_QUEUE,
  LEGACY_PATHS.ADRESSES,
  // Nouveaux paths par module
  NOTIFICATION_PATHS.STOCK,
  NOTIFICATION_PATHS.MENU,
  NOTIFICATION_PATHS.MENU_COMPOSE,
  NOTIFICATION_PATHS.BOISSON,
  NOTIFICATION_PATHS.PRODUCTION,
  NOTIFICATION_PATHS.EMPLACEMENT,
  NOTIFICATION_PATHS.COMMANDE,
  NOTIFICATION_PATHS.COMPTABILITE,
  NOTIFICATION_PATHS.ADRESSE,
  NOTIFICATION_PATHS.TODO,
  NOTIFICATION_PATHS.USER,
  NOTIFICATION_PATHS.SYSTEM,
];
const MAX_NOTIFICATIONS = 50; // Nombre max de notifications à garder
const NOTIFICATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 heures en millisecondes
const CLEANUP_LOCALSTORAGE_KEY = "lsd_notifications_last_cleanup";

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
  const cleanupRunRef = useRef(false); // Pour éviter les exécutions multiples

  // ============================================================================
  // FONCTION: NETTOYER LES NOTIFICATIONS OBSOLÈTES (> 48H)
  // ============================================================================
  const cleanupOldNotifications = useCallback(async () => {
    // Éviter les exécutions multiples dans la même session
    if (cleanupRunRef.current) {
      console.log("🧹 useNotifications: Cleanup déjà effectué dans cette session");
      return;
    }

    // Vérifier si un cleanup a été fait récemment (dans les 6 dernières heures)
    const lastCleanup = localStorage.getItem(CLEANUP_LOCALSTORAGE_KEY);
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;

    if (lastCleanup && parseInt(lastCleanup, 10) > sixHoursAgo) {
      console.log("🧹 useNotifications: Cleanup récent, skip");
      cleanupRunRef.current = true;
      return;
    }

    console.log("🧹 useNotifications: Démarrage du nettoyage des notifications > 48h...");
    const now = Date.now();
    const cutoffTime = now - NOTIFICATION_TTL_MS;
    let totalDeleted = 0;

    try {
      // Parcourir chaque nœud RTDB
      for (const nodePath of RTDB_NOTIFICATIONS_PATHS) {
        const nodeRef = ref(rtdb, nodePath);
        const snapshot = await get(nodeRef);

        if (!snapshot.exists()) {
          console.log(`🧹 useNotifications: Nœud ${nodePath} vide`);
          continue;
        }

        const notifications = snapshot.val();
        const deletePromises = [];

        // Vérifier chaque notification
        Object.entries(notifications).forEach(([key, notification]) => {
          const timestamp = notification.timestamp || 0;

          if (timestamp < cutoffTime) {
            console.log(`🗑️ useNotifications: Suppression ${nodePath}/${key} (${new Date(timestamp).toLocaleString("fr-FR")})`);
            const notifRef = ref(rtdb, `${nodePath}/${key}`);
            deletePromises.push(remove(notifRef));
            totalDeleted++;
          }
        });

        // Exécuter les suppressions en parallèle
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log(`🧹 useNotifications: ${deletePromises.length} notification(s) supprimée(s) de ${nodePath}`);
        }
      }

      // Marquer le cleanup comme effectué
      localStorage.setItem(CLEANUP_LOCALSTORAGE_KEY, now.toString());
      cleanupRunRef.current = true;

      console.log(`✅ useNotifications: Nettoyage terminé - ${totalDeleted} notification(s) supprimée(s) au total`);
    } catch (err) {
      console.error("❌ useNotifications: Erreur lors du nettoyage:", err);
    }
  }, []);

  // ============================================================================
  // EFFET: NETTOYER LES NOTIFICATIONS AU MONTAGE (CONNEXION ADMIN)
  // ============================================================================
  useEffect(() => {
    cleanupOldNotifications();
  }, [cleanupOldNotifications]);

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
