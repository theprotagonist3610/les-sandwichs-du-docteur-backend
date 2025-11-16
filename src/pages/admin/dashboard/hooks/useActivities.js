/**
 * Hook personnalisé pour gérer le flux d'activités en temps réel
 * Écoute les notifications RTDB et les convertit en activités pour la timeline
 */

import { useState, useEffect, useMemo } from "react";
import { ref, onChildAdded, query, limitToLast } from "firebase/database";
import { rtdb } from "@/firebase.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const RTDB_NOTIFICATIONS_PATHS = ["notification", "notifications"]; // Deux nœuds RTDB
const MAX_ACTIVITIES = 50; // Nombre max d'activités à garder en mémoire

// ============================================================================
// HELPERS - CONVERSION NOTIFICATION → ACTIVITÉ
// ============================================================================

/**
 * Détermine le type d'activité selon le titre de la notification
 */
const getActivityType = (title, message) => {
  if (title.includes("Transaction stock") || title.includes("stock")) {
    return "stock";
  }
  if (title.includes("Commande") || title.includes("Vente") || message.includes("commande")) {
    return "vente";
  }
  if (title.includes("Production") || message.includes("production")) {
    return "production";
  }
  if (title.includes("Livraison") || message.includes("livraison")) {
    return "livraison";
  }
  if (title.includes("comptable") || title.includes("Opération")) {
    return "comptabilite";
  }
  if (title.includes("alerte") || title.includes("Alerte")) {
    return "alerte";
  }

  return "vente"; // Défaut
};

/**
 * Convertit une notification RTDB en activité pour la timeline
 */
const notificationToActivity = (notificationKey, notification) => {
  const title = notification.title || "Activité";
  const message = notification.message || "";
  const timestamp = notification.timestamp || Date.now();

  return {
    id: notificationKey,
    type: getActivityType(title, message),
    titre: title,
    description: message,
    timestamp: timestamp,
    userName: notification.userName || notification.name || null,
    userId: notification.userId || null,
  };
};

// ============================================================================
// HOOK useActivities
// ============================================================================

/**
 * Hook pour récupérer et écouter les activités en temps réel
 * @param {Object} options - Options de configuration
 * @param {number} options.maxItems - Nombre max d'activités à afficher (défaut: 10)
 * @param {string} options.filterType - Filtrer par type d'activité (optionnel)
 * @returns {Object} { activities, loading, error }
 */
const useActivities = (options = {}) => {
  const { maxItems = 10, filterType = null } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // EFFET: ÉCOUTER LES NOTIFICATIONS RTDB (DEUX NŒUDS)
  // ============================================================================
  useEffect(() => {
    console.log("🔌 useActivities: Configuration des listeners RTDB...");
    console.log(`📡 useActivities: Écoute de ${RTDB_NOTIFICATIONS_PATHS.length} nœuds:`, RTDB_NOTIFICATIONS_PATHS);

    let isInitialLoad = true;
    const activityBuffer = new Map(); // Utiliser Map pour éviter les doublons

    // Handler pour les nouvelles notifications
    const handleNewNotification = (nodePath) => (snapshot) => {
      try {
        const notificationKey = snapshot.key;
        const notification = snapshot.val();

        if (!notification) return;

        // Créer un ID unique incluant le nœud source
        const uniqueId = `${nodePath}_${notificationKey}`;

        // Convertir la notification en activité
        const activity = notificationToActivity(uniqueId, notification);

        console.log(`📡 useActivities: Nouvelle activité depuis ${nodePath}`, {
          type: activity.type,
          titre: activity.titre,
          timestamp: activity.timestamp,
        });

        // Ajouter au buffer (Map élimine automatiquement les doublons)
        activityBuffer.set(uniqueId, activity);

        // Convertir Map en Array
        let activityArray = Array.from(activityBuffer.values());

        // Trier par timestamp décroissant (plus récent en premier)
        activityArray.sort((a, b) => b.timestamp - a.timestamp);

        // Limiter la taille
        if (activityArray.length > MAX_ACTIVITIES) {
          activityArray = activityArray.slice(0, MAX_ACTIVITIES);

          // Reconstruire le buffer avec les activités gardées
          activityBuffer.clear();
          activityArray.forEach((act) => activityBuffer.set(act.id, act));
        }

        // Mettre à jour l'état
        setActivities(activityArray);

        // Marquer le chargement initial comme terminé après la première notification
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
          console.log("✅ useActivities: Chargement initial terminé");
        }
      } catch (err) {
        console.error(`❌ useActivities: Erreur traitement notification (${nodePath}):`, err);
        setError(err.message);
      }
    };

    // Créer un listener pour chaque nœud
    const unsubscribers = RTDB_NOTIFICATIONS_PATHS.map((nodePath) => {
      const notificationsRef = ref(rtdb, nodePath);
      const notificationsQuery = query(notificationsRef, limitToLast(MAX_ACTIVITIES));

      console.log(`🔌 useActivities: Listener actif sur ${nodePath}`);

      return onChildAdded(notificationsQuery, handleNewNotification(nodePath));
    });

    // Timer de sécurité pour marquer le chargement comme terminé même sans notification
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("⏰ useActivities: Timeout chargement initial");
        setLoading(false);
      }
    }, 3000);

    return () => {
      console.log("🔌 useActivities: Nettoyage des listeners");
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      clearTimeout(loadingTimeout);
    };
  }, []);

  // ============================================================================
  // MÉMO: FILTRER ET LIMITER LES ACTIVITÉS
  // ============================================================================
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Appliquer le filtre de type si spécifié
    if (filterType) {
      filtered = filtered.filter((activity) => activity.type === filterType);
      console.log(
        `🔍 useActivities: Filtrage par type "${filterType}" - ${filtered.length}/${activities.length} activités`
      );
    }

    // Limiter au nombre max d'items
    const limited = filtered.slice(0, maxItems);

    console.log(
      `📋 useActivities: Retour de ${limited.length} activités (max: ${maxItems})`
    );

    return limited;
  }, [activities, filterType, maxItems]);

  // ============================================================================
  // RETOUR
  // ============================================================================
  return {
    activities: filteredActivities,
    allActivities: activities, // Toutes les activités non filtrées
    loading,
    error,
  };
};

export default useActivities;
