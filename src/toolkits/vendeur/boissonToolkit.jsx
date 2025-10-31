/**
 * vendeur/boissonToolkit.jsx
 * Gestion en lecture seule des boissons pour les vendeurs
 *
 * Structure Firestore :
 * - menus/liste_boissons: { boissons: [array de boissons] }
 */

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, rtdb } from "../../firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================
const BOISSONS_DOC_PATH = "menus/liste_boissons";
const LOCAL_BOISSONS_KEY = "local_lsd_boissons_vendeur";
const RTDB_NOTIFICATIONS_PATH = "notification";

// ============================================================================
// GESTION DU CACHE LOCAL - BOISSONS
// ============================================================================

/**
 * Sauvegarde les boissons dans le LocalStorage (read-only vendeur)
 */
function saveBoissonsToCache(boissons) {
  try {
    const dataToStore = {
      boissons,
      lastSync: Date.now(),
    };
    localStorage.setItem(LOCAL_BOISSONS_KEY, JSON.stringify(dataToStore));
    console.log("✅ Boissons sauvegardées en cache (vendeur)");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache boissons (vendeur):", error);
    return false;
  }
}

/**
 * Récupère les boissons depuis le LocalStorage (read-only vendeur)
 */
function getBoissonsFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_BOISSONS_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log("✅ Boissons récupérées du cache (vendeur)");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache boissons (vendeur):", error);
    return null;
  }
}

/**
 * Supprime le cache des boissons (read-only vendeur)
 */
function clearBoissonsCache() {
  localStorage.removeItem(LOCAL_BOISSONS_KEY);
  console.log("✅ Cache boissons supprimé (vendeur)");
}

// ============================================================================
// READ ONLY - BOISSONS
// ============================================================================

/**
 * Récupère toutes les boissons actives depuis Firestore (lecture seule)
 */
export async function getAllBoissons() {
  try {
    const boissonsRef = doc(db, BOISSONS_DOC_PATH);
    const boissonsSnap = await getDoc(boissonsRef);

    if (!boissonsSnap.exists()) {
      console.log("ℹ️ Aucune boisson trouvée");
      return [];
    }

    const data = boissonsSnap.data();
    const boissons = data.boissons || [];

    // Filtrer uniquement les boissons actives
    const activeBoissons = boissons.filter((b) => b.status === true);

    // Sauvegarder dans le cache
    saveBoissonsToCache(activeBoissons);

    console.log(`✅ ${activeBoissons.length} boissons actives récupérées`);
    return activeBoissons;
  } catch (error) {
    console.error("❌ Erreur récupération boissons (vendeur):", error);
    throw error;
  }
}

/**
 * Récupère une boisson par son ID (lecture seule)
 */
export async function getBoissonById(boissonId) {
  try {
    const boissons = await getAllBoissons();
    const boisson = boissons.find((b) => b.id === boissonId);

    if (!boisson) {
      throw new Error(`Boisson ${boissonId} introuvable`);
    }

    return boisson;
  } catch (error) {
    console.error("❌ Erreur récupération boisson (vendeur):", error);
    throw error;
  }
}

// ============================================================================
// HOOK REACT
// ============================================================================

/**
 * Hook pour gérer les boissons (lecture seule + cache local)
 * Synchronisation automatique via notifications RTDB
 */
export function useBoissons() {
  const [boissons, setBoissons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou via notif)
   */
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const freshBoissons = await getAllBoissons();
      setBoissons(freshBoissons);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cached = getBoissonsFromCache();
    if (cached && cached.boissons) {
      setBoissons(cached.boissons);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Écouter les notifications RTDB pour synchronisation automatique
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      if (!snapshot.exists()) return;

      const notifications = snapshot.val();
      const notificationsList = Object.entries(notifications).map(
        ([key, value]) => ({
          id: key,
          ...value,
        })
      );

      // Chercher une notification "Modification Boissons" récente (< 5 secondes)
      const now = Date.now();
      const recentBoissonNotif = notificationsList.find(
        (notif) =>
          notif.title === "Modification Boissons" &&
          now - notif.createdAt < 5000
      );

      if (recentBoissonNotif) {
        console.log(
          "🔔 Notification détectée: Modification Boissons - Synchronisation..."
        );
        sync();
      }
    };

    // Écouter les changements
    onValue(notificationsRef, handleNotification);

    // Cleanup
    return () => {
      off(notificationsRef, "value", handleNotification);
    };
  }, [sync]);

  return {
    boissons,
    loading,
    error,
    sync, // Fonction manuelle de synchronisation (optionnelle)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
export default {
  // Read Only - Boissons
  getAllBoissons,
  getBoissonById,

  // Hook
  useBoissons,

  // Cache management
  clearBoissonsCache,
};
