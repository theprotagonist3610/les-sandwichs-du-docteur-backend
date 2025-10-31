/**
 * vendeur/menuToolkit.jsx
 * Gestion en lecture seule des menus et ingrédients pour les vendeurs
 *
 * Structure Firestore :
 * - menus/liste_menus: { menus: [array de menus] }
 * - menus/liste_ingredients: { ingredients: [array d'ingrédients] }
 */

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, rtdb } from "../../firebase.js";

// ============================================================================
// CONSTANTES
// ============================================================================

const MENUS_DOC_PATH = "menus/liste_menus";
const INGREDIENTS_DOC_PATH = "menus/liste_ingredients";
const LOCAL_MENUS_KEY = "local_lsd_menus_vendeur";
const LOCAL_INGREDIENTS_KEY = "local_lsd_ingredients_vendeur";
const RTDB_NOTIFICATIONS_PATH = "notification";

// ============================================================================
// GESTION DU CACHE LOCAL - INGREDIENTS
// ============================================================================

/**
 * Sauvegarde les ingrédients dans le LocalStorage
 */
function saveIngredientsToCache(ingredients) {
  try {
    const dataToStore = {
      ingredients,
      lastSync: Date.now(),
    };
    localStorage.setItem(LOCAL_INGREDIENTS_KEY, JSON.stringify(dataToStore));
    console.log(" Ingrédients sauvegardés en cache (vendeur)");
    return true;
  } catch (error) {
    console.error("L Erreur sauvegarde cache ingrédients:", error);
    return false;
  }
}

/**
 * Récupère les ingrédients depuis le LocalStorage
 */
function getIngredientsFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_INGREDIENTS_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log(" Ingrédients récupérés du cache (vendeur)");
    return parsed;
  } catch (error) {
    console.error("L Erreur lecture cache ingrédients:", error);
    return null;
  }
}

/**
 * Supprime le cache des ingrédients
 */
function clearIngredientsCache() {
  localStorage.removeItem(LOCAL_INGREDIENTS_KEY);
  console.log(" Cache ingrédients supprimé (vendeur)");
}

// ============================================================================
// GESTION DU CACHE LOCAL - MENUS
// ============================================================================

/**
 * Sauvegarde les menus dans le LocalStorage
 */
function saveMenusToCache(menus) {
  try {
    const dataToStore = {
      menus,
      lastSync: Date.now(),
    };
    localStorage.setItem(LOCAL_MENUS_KEY, JSON.stringify(dataToStore));
    console.log(" Menus sauvegardés en cache (vendeur)");
    return true;
  } catch (error) {
    console.error("L Erreur sauvegarde cache menus:", error);
    return false;
  }
}

/**
 * Récupère les menus depuis le LocalStorage
 */
function getMenusFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_MENUS_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log(" Menus récupérés du cache (vendeur)");
    return parsed;
  } catch (error) {
    console.error("L Erreur lecture cache menus:", error);
    return null;
  }
}

/**
 * Supprime le cache des menus
 */
function clearMenusCache() {
  localStorage.removeItem(LOCAL_MENUS_KEY);
  console.log(" Cache menus supprimé (vendeur)");
}

// ============================================================================
// READ ONLY - INGREDIENTS
// ============================================================================

/**
 * Récupère tous les ingrédients depuis Firestore (lecture seule)
 */
export async function getAllIngredients() {
  try {
    const ingredientsRef = doc(db, INGREDIENTS_DOC_PATH);
    const ingredientsSnap = await getDoc(ingredientsRef);

    if (!ingredientsSnap.exists()) {
      console.log("9 Aucun ingrédient trouvé");
      return [];
    }

    const data = ingredientsSnap.data();
    const ingredients = data.ingredients || [];

    // Filtrer uniquement les ingrédients actifs
    const activeIngredients = ingredients.filter((ing) => ing.status === true);

    // Sauvegarder dans le cache
    saveIngredientsToCache(activeIngredients);

    console.log(` ${activeIngredients.length} ingrédients actifs récupérés`);
    return activeIngredients;
  } catch (error) {
    console.error("L Erreur récupération ingrédients:", error);
    throw error;
  }
}

/**
 * Récupère un ingrédient par son ID
 */
export async function getIngredientById(ingredientId) {
  try {
    const ingredients = await getAllIngredients();
    const ingredient = ingredients.find((ing) => ing.id === ingredientId);

    if (!ingredient) {
      throw new Error(`Ingrédient ${ingredientId} introuvable`);
    }

    return ingredient;
  } catch (error) {
    console.error("L Erreur récupération ingrédient:", error);
    throw error;
  }
}

// ============================================================================
// READ ONLY - MENUS
// ============================================================================

/**
 * Récupère tous les menus depuis Firestore (lecture seule)
 */
export async function getAllMenus() {
  try {
    const menusRef = doc(db, MENUS_DOC_PATH);
    const menusSnap = await getDoc(menusRef);

    if (!menusSnap.exists()) {
      console.log("9 Aucun menu trouvé");
      return [];
    }

    const data = menusSnap.data();
    const menus = data.menus || [];

    // Filtrer uniquement les menus actifs
    const activeMenus = menus.filter((menu) => menu.status === true);

    // Sauvegarder dans le cache
    saveMenusToCache(activeMenus);

    console.log(` ${activeMenus.length} menus actifs récupérés`);
    return activeMenus;
  } catch (error) {
    console.error("L Erreur récupération menus:", error);
    throw error;
  }
}

/**
 * Récupère un menu par son ID
 */
export async function getMenuById(menuId) {
  try {
    const menus = await getAllMenus();
    const menu = menus.find((m) => m.id === menuId);

    if (!menu) {
      throw new Error(`Menu ${menuId} introuvable`);
    }

    return menu;
  } catch (error) {
    console.error("L Erreur récupération menu:", error);
    throw error;
  }
}

/**
 * Récupère un menu avec ses ingrédients détaillés
 */
export async function getMenuWithIngredients(menuId) {
  try {
    const [menu, allIngredients] = await Promise.all([
      getMenuById(menuId),
      getAllIngredients(),
    ]);

    // Mapper les IDs d'ingrédients aux objets complets
    const ingredientsDetails = menu.ingredients
      .map((ingId) => allIngredients.find((ing) => ing.id === ingId))
      .filter((ing) => ing !== undefined);

    return {
      ...menu,
      ingredientsDetails,
    };
  } catch (error) {
    console.error("L Erreur récupération menu avec ingrédients:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS REACT
// ============================================================================

/**
 * Hook pour gérer les ingrédients avec cache local (lecture seule)
 * Synchronisation automatique via RTDB notifications
 */
export function useIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou automatique)
   */
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const freshIngredients = await getAllIngredients();
      setIngredients(freshIngredients);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cached = getIngredientsFromCache();
    if (cached && cached.ingredients) {
      setIngredients(cached.ingredients);
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
      const notificationsList = Object.entries(notifications).map(([key, value]) => ({
        id: key,
        ...value,
      }));

      // Chercher une notification "Modification Ingredients" récente (< 5 secondes)
      const now = Date.now();
      const recentIngredientNotif = notificationsList.find(
        (notif) =>
          notif.title === "Modification Ingredients" &&
          now - notif.createdAt < 5000
      );

      if (recentIngredientNotif) {
        console.log("= Notification détectée: Modification Ingredients - Synchronisation...");
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
    ingredients,
    loading,
    error,
    sync, // Fonction manuelle de synchronisation (optionnelle)
  };
}

/**
 * Hook pour gérer les menus avec cache local (lecture seule)
 * Synchronisation automatique via RTDB notifications
 */
export function useMenus() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Synchroniser avec Firestore (appel manuel ou automatique)
   */
  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const freshMenus = await getAllMenus();
      setMenus(freshMenus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cached = getMenusFromCache();
    if (cached && cached.menus) {
      setMenus(cached.menus);
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
      const notificationsList = Object.entries(notifications).map(([key, value]) => ({
        id: key,
        ...value,
      }));

      // Chercher une notification "Modification Menus" récente (< 5 secondes)
      const now = Date.now();
      const recentMenuNotif = notificationsList.find(
        (notif) =>
          notif.title === "Modification Menus" &&
          now - notif.createdAt < 5000
      );

      if (recentMenuNotif) {
        console.log("= Notification détectée: Modification Menus - Synchronisation...");
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
    menus,
    loading,
    error,
    sync, // Fonction manuelle de synchronisation (optionnelle)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Read Only - Ingredients
  getAllIngredients,
  getIngredientById,

  // Read Only - Menus
  getAllMenus,
  getMenuById,
  getMenuWithIngredients,

  // Hooks
  useIngredients,
  useMenus,

  // Cache management
  clearIngredientsCache,
  clearMenusCache,
};