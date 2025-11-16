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

const RTDB_NOTIFICATIONS_PATH = "notification";
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
  // EFFET: ÉCOUTER LES NOTIFICATIONS RTDB
  // ============================================================================
  useEffect(() => {
    console.log("🔌 useActivities: Configuration du listener RTDB...");

    // Créer une query pour récupérer les dernières notifications
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);
    const notificationsQuery = query(notificationsRef, limitToLast(MAX_ACTIVITIES));

    let isInitialLoad = true;
    const activityBuffer = [];

    // Handler pour les nouvelles notifications
    const handleNewNotification = (snapshot) => {
      try {
        const notificationKey = snapshot.key;
        const notification = snapshot.val();

        if (!notification) return;

        // Convertir la notification en activité
        const activity = notificationToActivity(notificationKey, notification);

        console.log("📡 useActivities: Nouvelle activité", {
          type: activity.type,
          titre: activity.titre,
          timestamp: activity.timestamp,
        });

        // Ajouter au buffer
        activityBuffer.push(activity);

        // Limiter la taille du buffer
        if (activityBuffer.length > MAX_ACTIVITIES) {
          activityBuffer.shift(); // Retirer le plus ancien
        }

        // Trier par timestamp décroissant (plus récent en premier)
        activityBuffer.sort((a, b) => b.timestamp - a.timestamp);

        // Mettre à jour l'état
        setActivities([...activityBuffer]);

        // Marquer le chargement initial comme terminé après la première notification
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
          console.log("✅ useActivities: Chargement initial terminé");
        }
      } catch (err) {
        console.error("❌ useActivities: Erreur lors du traitement de la notification:", err);
        setError(err.message);
      }
    };

    // Écouter les notifications (incluant les existantes avec limitToLast)
    const unsubscribe = onChildAdded(notificationsQuery, handleNewNotification);

    // Timer de sécurité pour marquer le chargement comme terminé même sans notification
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("⏰ useActivities: Timeout chargement initial");
        setLoading(false);
      }
    }, 3000);

    return () => {
      console.log("🔌 useActivities: Nettoyage du listener");
      unsubscribe();
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
