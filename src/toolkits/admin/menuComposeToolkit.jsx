/**
 * admin/menuComposeToolkit.jsx
 * Gestion des menus composés avec cache local
 *
 * Structure Firestore :
 * - menus/liste_menus_composes: { menus_composes: [array de menus composés] }
 *
 * Schema menu composé:
 * - id: string (id du menu composé)
 * - denomination: string (nom du menu composé)
 * - contenu: array of objects (liste des items: menu ou boisson avec quantité)
 * - description: string (description du menu composé)
 * - prix: number (prix du menu composé)
 * - status: boolean (disponibilité du menu composé)
 * - createdAt: timestamp (date de création)
 * - updatedAt: timestamp (date de dernière mise à jour)
 *
 * Schema items du contenu:
 * - item: menuSchema ou boissonSchema (l'item complet)
 * - type: "menu" | "boisson" (type de l'item)
 * - quantite: number (quantité de l'item dans le menu composé)
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, onChildAdded } from "firebase/database";
import { db, rtdb } from "@/firebase.js";
import { nanoid } from "nanoid";
import { menuSchema } from "./menuToolkit";
import { boissonSchema } from "./boissonToolkit";
import {
  menuComposeNotifications,
  NOTIFICATION_PATHS,
  LEGACY_PATHS,
  setCacheWithTTL,
  getCacheWithTTL,
  CACHE_TTL,
} from "@/utils/notificationHelpers";

// ============================================================================
// CONSTANTES
// ============================================================================

const MENUS_COMPOSES_DOC_PATH = "menus/liste_menus_composes";
const LOCAL_MENUS_COMPOSES_KEY = "local_lsd_menus_composes";
// Paths RTDB à écouter pour synchronisation (legacy + nouveau)
const RTDB_SYNC_PATHS = [LEGACY_PATHS.NOTIFICATION, NOTIFICATION_PATHS.MENU_COMPOSE];

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

/**
 * Schema pour un item du menu composé (menu ou boisson avec quantité)
 */
export const menuComposeItemSchema = z.object({
  item: z.union([menuSchema, boissonSchema]),
  type: z.enum(["menu", "boisson"]),
  quantite: z.number().min(1, "La quantité doit être au moins 1").default(1),
});

/**
 * Schema pour un menu composé
 */
export const menuComposeSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  denomination: z.string().min(1, "La dénomination est requise"),
  contenu: z.array(menuComposeItemSchema).default([]),
  description: z.string().default(""),
  prix: z.number().min(0, "Le prix doit être positif").default(0),
  status: z.boolean().default(true),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

// ============================================================================
// GESTION DU CACHE LOCAL AVEC TTL - MENUS COMPOSES
// ============================================================================

/**
 * Sauvegarde les menus composés dans le LocalStorage avec TTL
 */
function saveMenusComposesToCache(menusComposes) {
  try {
    setCacheWithTTL(LOCAL_MENUS_COMPOSES_KEY, menusComposes, CACHE_TTL.MENUS);
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache menus composés:", error);
    return false;
  }
}

/**
 * Récupère les menus composés depuis le LocalStorage
 */
function getMenusComposesFromCache() {
  try {
    const cached = getCacheWithTTL(LOCAL_MENUS_COMPOSES_KEY);
    return cached; // Retourne null si expiré ou inexistant
  } catch (error) {
    console.error("❌ Erreur lecture cache menus composés:", error);
    return null;
  }
}

/**
 * Supprime le cache des menus composés
 */
export function clearMenusComposesCache() {
  localStorage.removeItem(LOCAL_MENUS_COMPOSES_KEY);
  console.log("✅ Cache menus composés supprimé");
}

// ============================================================================
// RTDB HELPERS - NOTIFICATIONS (utilise les helpers centralisés)
// ============================================================================
// Les notifications sont maintenant gérées par @/utils/notificationHelpers
// Voir: menuComposeNotifications.create(), menuComposeNotifications.update(), etc.

// ============================================================================
// CRUD MENUS COMPOSES
// ============================================================================

/**
 * Récupère tous les menus composés depuis Firestore
 */
export async function getAllMenusComposes() {
  try {
    const menusComposesRef = doc(db, MENUS_COMPOSES_DOC_PATH);
    const menusComposesSnap = await getDoc(menusComposesRef);

    if (!menusComposesSnap.exists()) {
      console.log("ℹ️ Aucun menu composé trouvé");
      return [];
    }

    const data = menusComposesSnap.data();
    const menusComposes = data.menus_composes || [];

    // Sauvegarder dans le cache
    saveMenusComposesToCache(menusComposes);

    console.log(`✅ ${menusComposes.length} menus composés récupérés`);
    return menusComposes;
  } catch (error) {
    console.error("❌ Erreur récupération menus composés:", error);
    throw error;
  }
}

/**
 * Récupère un menu composé par son ID
 * @param {string} menuComposeId - ID du menu composé
 */
export async function getMenuComposeById(menuComposeId) {
  try {
    const menusComposes = await getAllMenusComposes();
    const menuCompose = menusComposes.find((mc) => mc.id === menuComposeId);

    if (!menuCompose) {
      throw new Error(`Menu composé ${menuComposeId} introuvable`);
    }

    return menuCompose;
  } catch (error) {
    console.error("❌ Erreur récupération menu composé:", error);
    throw error;
  }
}

/**
 * Crée un nouveau menu composé
 * @param {object} menuComposeData - Données du menu composé
 */
export async function createMenuCompose(menuComposeData) {
  try {
    const newMenuCompose = {
      id: `menu_compose_${nanoid()}`,
      denomination: menuComposeData.denomination,
      contenu: menuComposeData.contenu || [],
      description: menuComposeData.description || "",
      prix: menuComposeData.prix || 0,
      status: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validation
    const validatedMenuCompose = menuComposeSchema.parse(newMenuCompose);

    // Récupérer la liste actuelle
    const currentMenusComposes = await getAllMenusComposes();

    // Ajouter le nouveau menu composé
    const updatedMenusComposes = [...currentMenusComposes, validatedMenuCompose];

    // Sauvegarder dans Firestore
    const menusComposesRef = doc(db, MENUS_COMPOSES_DOC_PATH);
    await setDoc(menusComposesRef, { menus_composes: updatedMenusComposes });

    // Mettre à jour le cache
    saveMenusComposesToCache(updatedMenusComposes);

    // Notification RTDB (helper centralisé)
    await menuComposeNotifications.create(validatedMenuCompose.denomination);

    console.log("✅ Menu composé créé:", validatedMenuCompose.id);
    return validatedMenuCompose;
  } catch (error) {
    console.error("❌ Erreur création menu composé:", error);
    throw error;
  }
}

/**
 * Met à jour un menu composé
 * @param {string} menuComposeId - ID du menu composé
 * @param {object} updateData - Données à mettre à jour
 */
export async function updateMenuCompose(menuComposeId, updateData) {
  try {
    // Récupérer la liste actuelle
    const currentMenusComposes = await getAllMenusComposes();

    // Trouver le menu composé
    const menuComposeIndex = currentMenusComposes.findIndex(
      (mc) => mc.id === menuComposeId
    );

    if (menuComposeIndex === -1) {
      throw new Error(`Menu composé ${menuComposeId} introuvable`);
    }

    // Mettre à jour
    const updatedMenuCompose = {
      ...currentMenusComposes[menuComposeIndex],
      ...updateData,
      updatedAt: Date.now(),
    };

    // Validation
    const validatedMenuCompose = menuComposeSchema.parse(updatedMenuCompose);

    // Remplacer dans la liste
    currentMenusComposes[menuComposeIndex] = validatedMenuCompose;

    // Sauvegarder dans Firestore
    const menusComposesRef = doc(db, MENUS_COMPOSES_DOC_PATH);
    await setDoc(menusComposesRef, { menus_composes: currentMenusComposes });

    // Mettre à jour le cache
    saveMenusComposesToCache(currentMenusComposes);

    // Notification RTDB (helper centralisé)
    await menuComposeNotifications.update(validatedMenuCompose.denomination);

    console.log("✅ Menu composé mis à jour:", menuComposeId);
    return validatedMenuCompose;
  } catch (error) {
    console.error("❌ Erreur mise à jour menu composé:", error);
    throw error;
  }
}

/**
 * Supprime un menu composé (soft delete - passe status à false)
 * @param {string} menuComposeId - ID du menu composé
 */
export async function deleteMenuCompose(menuComposeId) {
  try {
    return await updateMenuCompose(menuComposeId, { status: false });
  } catch (error) {
    console.error("❌ Erreur suppression menu composé:", error);
    throw error;
  }
}

/**
 * Ajoute un item (menu ou boisson) au contenu d'un menu composé
 * @param {string} menuComposeId - ID du menu composé
 * @param {object} item - L'item à ajouter (menu ou boisson complet)
 * @param {string} type - "menu" | "boisson"
 * @param {number} quantite - Quantité de l'item
 */
export async function addItemToMenuCompose(menuComposeId, item, type, quantite = 1) {
  try {
    const menuCompose = await getMenuComposeById(menuComposeId);

    // Vérifier si l'item existe déjà
    const existingItemIndex = menuCompose.contenu.findIndex(
      (c) => c.item.id === item.id && c.type === type
    );

    let updatedContenu;
    if (existingItemIndex !== -1) {
      // L'item existe, mettre à jour la quantité
      updatedContenu = [...menuCompose.contenu];
      updatedContenu[existingItemIndex] = {
        ...updatedContenu[existingItemIndex],
        quantite: updatedContenu[existingItemIndex].quantite + quantite,
      };
    } else {
      // L'item n'existe pas, l'ajouter
      const newItem = menuComposeItemSchema.parse({ item, type, quantite });
      updatedContenu = [...menuCompose.contenu, newItem];
    }

    return await updateMenuCompose(menuComposeId, { contenu: updatedContenu });
  } catch (error) {
    console.error("❌ Erreur ajout item au menu composé:", error);
    throw error;
  }
}

/**
 * Retire un item du contenu d'un menu composé
 * @param {string} menuComposeId - ID du menu composé
 * @param {string} itemId - ID de l'item à retirer
 * @param {string} type - "menu" | "boisson"
 */
export async function removeItemFromMenuCompose(menuComposeId, itemId, type) {
  try {
    const menuCompose = await getMenuComposeById(menuComposeId);

    const updatedContenu = menuCompose.contenu.filter(
      (c) => !(c.item.id === itemId && c.type === type)
    );

    return await updateMenuCompose(menuComposeId, { contenu: updatedContenu });
  } catch (error) {
    console.error("❌ Erreur suppression item du menu composé:", error);
    throw error;
  }
}

/**
 * Met à jour la quantité d'un item dans un menu composé
 * @param {string} menuComposeId - ID du menu composé
 * @param {string} itemId - ID de l'item
 * @param {string} type - "menu" | "boisson"
 * @param {number} newQuantite - Nouvelle quantité
 */
export async function updateItemQuantityInMenuCompose(menuComposeId, itemId, type, newQuantite) {
  try {
    if (newQuantite < 1) {
      // Si quantité < 1, supprimer l'item
      return await removeItemFromMenuCompose(menuComposeId, itemId, type);
    }

    const menuCompose = await getMenuComposeById(menuComposeId);

    const updatedContenu = menuCompose.contenu.map((c) => {
      if (c.item.id === itemId && c.type === type) {
        return { ...c, quantite: newQuantite };
      }
      return c;
    });

    return await updateMenuCompose(menuComposeId, { contenu: updatedContenu });
  } catch (error) {
    console.error("❌ Erreur mise à jour quantité item:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS REACT
// ============================================================================

/**
 * Hook pour gérer les menus composés avec cache local
 * Synchronisation automatique via RTDB notifications
 */
export function useMenusComposes() {
  const [menusComposes, setMenusComposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou automatique)
   */
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const freshMenusComposes = await getAllMenusComposes();
      setMenusComposes(freshMenusComposes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage et synchroniser avec Firestore
  useEffect(() => {
    const cached = getMenusComposesFromCache();
    if (cached) {
      setMenusComposes(cached);
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
          (notification.title?.includes("menu composé") || // Détection flexible
            notification.title?.includes("Menu composé") ||
            notification.title?.includes("Menus Composés") ||
            notification.metadata?.toolkit === "menuCompose")
        ) {
          console.log("🔔 Notification menu composé détectée - Rechargement différé");

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
      console.log("✅ useMenusComposes - Écoute des nouvelles notifications activée");
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sync]);

  return {
    menusComposes,
    loading,
    error,
    sync, // Fonction manuelle de synchronisation (optionnelle)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Schemas
  menuComposeSchema,
  menuComposeItemSchema,

  // CRUD
  getAllMenusComposes,
  getMenuComposeById,
  createMenuCompose,
  updateMenuCompose,
  deleteMenuCompose,

  // Gestion du contenu
  addItemToMenuCompose,
  removeItemFromMenuCompose,
  updateItemQuantityInMenuCompose,

  // Hook
  useMenusComposes,

  // Cache management
  clearMenusComposesCache,
};
