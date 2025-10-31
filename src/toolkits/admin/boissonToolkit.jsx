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
import { ref, push, onValue, off } from "firebase/database";
import { db, rtdb } from "@/firebase.js";
import { nanoid } from "nanoid";
import { auth } from "@/firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================
const BOISSONS_DOC_PATH = "menus/liste_boissons";
const LOCAL_BOISSONS_KEY = "local_lsd_boissons";
const RTDB_NOTIFICATIONS_PATH = "notification";

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
// GESTION DU CACHE LOCAL - BOISSONS
// ============================================================================

function saveBoissonsToCache(boissons) {
  try {
    const dataToStore = { boissons, lastSync: Date.now() };
    localStorage.setItem(LOCAL_BOISSONS_KEY, JSON.stringify(dataToStore));
    console.log("✅ Boissons sauvegardées en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache boissons:", error);
    return false;
  }
}

function getBoissonsFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_BOISSONS_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    console.log("✅ Boissons récupérées du cache");
    return parsed;
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
// RTDB HELPERS - NOTIFICATIONS
// ============================================================================

/**
 * Crée une notification dans RTDB pour signaler une modification
 * @param {string} title - "Modification Boissons"
 * @param {string} message - Message descriptif
 * @param {string} type - "info" | "success" | "warning" | "error"
 */
async function createRTDBNotification(title, message, type = "info") {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn(
        "⚠️ Utilisateur non authentifié, notification RTDB non envoyée"
      );
      return;
    }

    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);
    const notification = {
      userId: currentUser.uid,
      title,
      message,
      type,
      read: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await push(notificationsRef, notification);
    console.log(`✅ Notification RTDB créée: ${title}`);
  } catch (error) {
    console.error("❌ Erreur création notification RTDB:", error);
    // On ne bloque pas le flux si l'envoi de notif échoue
  }
}

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

    // Notification RTDB
    await createRTDBNotification(
      "Modification Boissons",
      `Nouvelle boisson créée: ${validated.denomination}`,
      "success"
    );

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

    // Notification RTDB
    await createRTDBNotification(
      "Modification Boissons",
      `Boisson modifiée: ${validated.denomination}`,
      "info"
    );

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

  // Écouter RTDB pour synchronisation auto
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      if (!snapshot.exists()) return;

      const notifications = snapshot.val();
      const notificationsList = Object.entries(notifications).map(
        ([key, value]) => ({ id: key, ...value })
      );

      // Détecter une notif récente "Modification Boissons" (< 5s)
      const now = Date.now();
      const recent = notificationsList.find(
        (n) => n.title === "Modification Boissons" && now - n.createdAt < 5000
      );

      if (recent) {
        console.log(
          "🔔 Notification détectée: Modification Boissons - Synchronisation…"
        );
        sync();
      }
    };

    onValue(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "value", handleNotification);
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
