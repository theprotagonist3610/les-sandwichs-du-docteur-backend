/**
 * admin/boissonToolkit.jsx
 * Gestion des boissons avec cache local
 *
 * Structure Firestore :
 * - menus/liste_boissons: {boissons : [array de boissons] }
 */
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, onChildAdded } from "firebase/database";
import { db, rtdb } from "@/firebase.js";
import { nanoid } from "nanoid";
import {
  boissonNotifications,
  NOTIFICATION_PATHS,
  LEGACY_PATHS,
  setCacheWithTTL,
  getCacheWithTTL,
  CACHE_TTL,
} from "@/utils/notificationHelpers";

// ============================================================================
// CONSTANTES
// ============================================================================
const BOISSONS_DOC_PATH = "menus/liste_boissons";
const LOCAL_BOISSONS_KEY = "local_lsd_boissons";
// Paths RTDB à écouter pour synchronisation (legacy + nouveau)
const RTDB_SYNC_PATHS = [LEGACY_PATHS.NOTIFICATION, NOTIFICATION_PATHS.BOISSON];

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

/**
 * Schéma d’une boisson
 * (Aligné sur menuSchema : id, denomination, imgURL, prix, description, status, createdAt, updatedAt)
 * NB: On n’inclut pas d’ingredients ici par défaut (les boissons n’en ont pas nécessairement).
 *     Tu peux ajouter d’autres champs (ex: volume_ml) si besoin plus tard.
 */
export const boissonSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  denomination: z.string().min(1, "La dénomination est requise"),
  imgURL: z.string().optional().default(""),
  prix: z.number().min(0, "Le prix doit être positif").default(1000),
  description: z.string().default(""),
  status: z.boolean().default(true),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

// ============================================================================
// GESTION DU CACHE LOCAL AVEC TTL - BOISSONS
// ============================================================================

function saveBoissonsToCache(boissons) {
  try {
    setCacheWithTTL(LOCAL_BOISSONS_KEY, boissons, CACHE_TTL.BOISSONS);
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache boissons:", error);
    return false;
  }
}

function getBoissonsFromCache() {
  try {
    const cached = getCacheWithTTL(LOCAL_BOISSONS_KEY);
    return cached; // Retourne null si expiré ou inexistant
  } catch (error) {
    console.error("❌ Erreur lecture cache boissons:", error);
    return null;
  }
}

export function clearBoissonsCache() {
  localStorage.removeItem(LOCAL_BOISSONS_KEY);
  console.log("✅ Cache boissons supprimé");
}

// ============================================================================
// RTDB HELPERS - NOTIFICATIONS (utilise les helpers centralisés)
// ============================================================================
// Les notifications sont maintenant gérées par @/utils/notificationHelpers
// Voir: boissonNotifications.create(), boissonNotifications.update(), etc.

// ============================================================================
// CRUD BOISSONS
// ============================================================================

/**
 * Récupère toutes les boissons depuis Firestore
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

    // Mettre en cache
    saveBoissonsToCache(boissons);

    console.log(`✅ ${boissons.length} boissons récupérées`);
    return boissons;
  } catch (error) {
    console.error("❌ Erreur récupération boissons:", error);
    throw error;
  }
}

/**
 * Crée une nouvelle boisson
 */
export async function createBoisson(boissonData) {
  try {
    const newBoisson = {
      id: `boisson_${nanoid()}`,
      denomination: boissonData.denomination,
      imgURL: boissonData.imgURL || "",
      prix: boissonData.prix ?? 1000,
      description: boissonData.description || "",
      status: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validation
    const validated = boissonSchema.parse(newBoisson);

    // Récupérer la liste actuelle
    const current = await getAllBoissons();

    // Ajouter
    const updated = [...current, validated];

    // Sauvegarder dans Firestore
    const boissonsRef = doc(db, BOISSONS_DOC_PATH);
    await setDoc(boissonsRef, { boissons: updated });

    // Cache
    saveBoissonsToCache(updated);

    // Notification RTDB (helper centralisé)
    await boissonNotifications.create(validated.denomination);

    console.log("✅ Boisson créée:", validated.id);
    return validated;
  } catch (error) {
    console.error("❌ Erreur création boisson:", error);
    throw error;
  }
}

/**
 * Met à jour une boisson
 */
export async function updateBoisson(boissonId, updateData) {
  try {
    const current = await getAllBoissons();

    const index = current.findIndex((b) => b.id === boissonId);
    if (index === -1) {
      throw new Error(`Boisson ${boissonId} introuvable`);
    }

    const updatedBoisson = {
      ...current[index],
      ...updateData,
      updatedAt: Date.now(),
    };

    // Validation
    const validated = boissonSchema.parse(updatedBoisson);

    // Remplacer dans la liste
    current[index] = validated;

    // Sauvegarder Firestore
    const boissonsRef = doc(db, BOISSONS_DOC_PATH);
    await setDoc(boissonsRef, { boissons: current });

    // Cache
    saveBoissonsToCache(current);

    // Notification RTDB (helper centralisé)
    await boissonNotifications.update(validated.denomination);

    console.log("✅ Boisson mise à jour:", boissonId);
    return validated;
  } catch (error) {
    console.error("❌ Erreur mise à jour boisson:", error);
    throw error;
  }
}

/**
 * Supprime une boisson (soft delete - passe status à false)
 */
export async function deleteBoisson(boissonId) {
  try {
    return await updateBoisson(boissonId, { status: false });
  } catch (error) {
    console.error("❌ Erreur suppression boisson:", error);
    throw error;
  }
}

// ============================================================================
// HOOK REACT
// ============================================================================

/**
 * Hook pour gérer les boissons avec cache local
 * Synchronisation automatique via notifications RTDB
 */
export function useBoissons() {
  const [boissons, setBoissons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronisation explicite (et déclenchée par notif)
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fresh = await getAllBoissons();
      setBoissons(fresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage et synchroniser avec Firestore
  useEffect(() => {
    const cached = getBoissonsFromCache();
    if (cached) {
      setBoissons(cached);
      setLoading(false);
    }

    // Vérification initiale avec Firestore pour s'assurer que le cache est à jour
    sync();
  }, [sync]);

  // Écouter RTDB pour synchronisation auto (pattern stockToolkit optimal)
  useEffect(() => {
    let isInitialLoad = true; // Grace period flag
    let debounceTimer = null; // Debounce timer
    const unsubscribers = [];

    // Écouter les deux paths (legacy et nouveau) avec onChildAdded
    RTDB_SYNC_PATHS.forEach((path) => {
      const notificationsRef = ref(rtdb, path);

      const handleNotification = (snapshot) => {
        if (isInitialLoad) return; // Ignorer pendant grace period

        const notification = snapshot.val();
        if (
          notification &&
          (notification.title?.includes("boisson") || // Détection flexible
            notification.title?.includes("Boisson") ||
            notification.metadata?.toolkit === "boisson")
        ) {
          console.log("🔔 Notification boisson détectée - Rechargement différé");

          // Debounce: annuler le timer précédent
          if (debounceTimer) clearTimeout(debounceTimer);
          // Lancer sync après 500ms
          debounceTimer = setTimeout(() => sync(), 500);
        }
      };

      const unsub = onChildAdded(notificationsRef, handleNotification);
      unsubscribers.push(unsub);
    });

    // Grace period: 1s pour ignorer les notifications initiales
    const initTimer = setTimeout(() => {
      isInitialLoad = false;
      console.log("✅ useBoissons - Écoute des nouvelles notifications activée");
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sync]);

  return {
    boissons,
    loading,
    error,
    sync, // pour forcer manuellement une synchro si besoin
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Schema
  boissonSchema,

  // CRUD
  getAllBoissons,
  createBoisson,
  updateBoisson,
  deleteBoisson,

  // Hook
  useBoissons,

  // Cache
  clearBoissonsCache,
};
