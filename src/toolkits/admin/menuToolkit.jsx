/**
 * admin/menuToolkit.jsx
 * Gestion des menus et ingrédients avec cache local
 *
 * Structure Firestore :
 * - menus/liste_menus: { menus: [array de menus] }
 * - menus/liste_ingredients: { ingredients: [array d'ingrédients] }
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

const MENUS_DOC_PATH = "menus/liste_menus";
const INGREDIENTS_DOC_PATH = "menus/liste_ingredients";
const LOCAL_MENUS_KEY = "local_lsd_menus";
const LOCAL_INGREDIENTS_KEY = "local_lsd_ingredients";
const RTDB_NOTIFICATIONS_PATH = "notification";

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

/**
 * Schema pour une unité de mesure
 */
export const uniteSchema = z.object({
  nom: z.string().min(1, "Le nom de l'unité est requis"),
  symbol: z.string().min(1, "Le symbole de l'unité est requis"),
});

/**
 * Schema pour les valeurs énergétiques
 */
export const valeurEnergetiqueSchema = z.object({
  cal_100: z.number().min(0, "Les calories doivent être positives"),
  kj_100: z.number().min(0, "Les kilojoules doivent être positifs"),
});

/**
 * Schema pour un ingrédient
 */
export const ingredientSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  nom: z.string().min(1, "Le nom de l'ingrédient est requis"),
  quantite: z.string().optional().default(""),
  unite: uniteSchema.optional(),
  val_energetique: valeurEnergetiqueSchema.optional(),
  status: z.boolean().default(true),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

/**
 * Schema pour un menu
 */
export const menuSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  denomination: z.string().min(1, "La dénomination est requise"),
  imgURL: z.string().optional().default(""),
  prix: z.number().min(0, "Le prix doit être positif").default(2000),
  ingredients: z.array(z.string()).default([]), // Array d'IDs d'ingrédients
  description: z.string().default(""),
  status: z.boolean().default(true),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

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
    console.log("✅ Ingrédients sauvegardés en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache ingrédients:", error);
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
    console.log("✅ Ingrédients récupérés du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache ingrédients:", error);
    return null;
  }
}

/**
 * Supprime le cache des ingrédients
 */
function clearIngredientsCache() {
  localStorage.removeItem(LOCAL_INGREDIENTS_KEY);
  console.log("✅ Cache ingrédients supprimé");
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
    console.log("✅ Menus sauvegardés en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache menus:", error);
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
    console.log("✅ Menus récupérés du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache menus:", error);
    return null;
  }
}

/**
 * Supprime le cache des menus
 */
function clearMenusCache() {
  localStorage.removeItem(LOCAL_MENUS_KEY);
  console.log("✅ Cache menus supprimé");
}

// ============================================================================
// RTDB HELPERS - NOTIFICATIONS
// ============================================================================

/**
 * Crée une notification dans RTDB pour signaler une modification
 * @param {string} title - "Modification Menus" ou "Modification Ingredients"
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
    // Ne pas bloquer l'opération si la notification échoue
  }
}

// ============================================================================
// CRUD INGREDIENTS
// ============================================================================

/**
 * Récupère tous les ingrédients depuis Firestore
 */
export async function getAllIngredients() {
  try {
    const ingredientsRef = doc(db, INGREDIENTS_DOC_PATH);
    const ingredientsSnap = await getDoc(ingredientsRef);

    if (!ingredientsSnap.exists()) {
      console.log("ℹ️ Aucun ingrédient trouvé");
      return [];
    }

    const data = ingredientsSnap.data();
    const ingredients = data.ingredients || [];

    // Sauvegarder dans le cache
    saveIngredientsToCache(ingredients);

    console.log(`✅ ${ingredients.length} ingrédients récupérés`);
    return ingredients;
  } catch (error) {
    console.error("❌ Erreur récupération ingrédients:", error);
    throw error;
  }
}

/**
 * Crée un nouvel ingrédient
 */
export async function createIngredient(ingredientData) {
  try {
    const newIngredient = {
      id: `ingredient_${nanoid()}`,
      nom: ingredientData.nom,
      quantite: ingredientData.quantite || "",
      unite: ingredientData.unite || { nom: "", symbol: "" },
      val_energetique: ingredientData.val_energetique || {
        cal_100: 0,
        kj_100: 0,
      },
      status: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validation
    const validatedIngredient = ingredientSchema.parse(newIngredient);

    // Récupérer la liste actuelle
    const currentIngredients = await getAllIngredients();

    // Ajouter le nouvel ingrédient
    const updatedIngredients = [...currentIngredients, validatedIngredient];

    // Sauvegarder dans Firestore
    const ingredientsRef = doc(db, INGREDIENTS_DOC_PATH);
    await setDoc(ingredientsRef, { ingredients: updatedIngredients });

    // Mettre à jour le cache
    saveIngredientsToCache(updatedIngredients);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Modification Ingredients",
      `Nouvel ingrédient créé: ${validatedIngredient.nom}`,
      "success"
    );

    console.log("✅ Ingrédient créé:", validatedIngredient.id);
    return validatedIngredient;
  } catch (error) {
    console.error("❌ Erreur création ingrédient:", error);
    throw error;
  }
}

/**
 * Met à jour un ingrédient
 */
export async function updateIngredient(ingredientId, updateData) {
  try {
    // Récupérer la liste actuelle
    const currentIngredients = await getAllIngredients();

    // Trouver l'ingrédient
    const ingredientIndex = currentIngredients.findIndex(
      (ing) => ing.id === ingredientId
    );

    if (ingredientIndex === -1) {
      throw new Error(`Ingrédient ${ingredientId} introuvable`);
    }

    // Mettre à jour
    const updatedIngredient = {
      ...currentIngredients[ingredientIndex],
      ...updateData,
      updatedAt: Date.now(),
    };

    // Validation
    const validatedIngredient = ingredientSchema.parse(updatedIngredient);

    // Remplacer dans la liste
    currentIngredients[ingredientIndex] = validatedIngredient;

    // Sauvegarder dans Firestore
    const ingredientsRef = doc(db, INGREDIENTS_DOC_PATH);
    await setDoc(ingredientsRef, { ingredients: currentIngredients });

    // Mettre à jour le cache
    saveIngredientsToCache(currentIngredients);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Modification Ingredients",
      `Ingrédient modifié: ${validatedIngredient.nom}`,
      "info"
    );

    console.log("✅ Ingrédient mis à jour:", ingredientId);
    return validatedIngredient;
  } catch (error) {
    console.error("❌ Erreur mise à jour ingrédient:", error);
    throw error;
  }
}

/**
 * Supprime un ingrédient (soft delete - passe status à false)
 */
export async function deleteIngredient(ingredientId) {
  try {
    return await updateIngredient(ingredientId, { status: false });
  } catch (error) {
    console.error("❌ Erreur suppression ingrédient:", error);
    throw error;
  }
}

// ============================================================================
// CRUD MENUS
// ============================================================================

/**
 * Récupère tous les menus depuis Firestore
 */
export async function getAllMenus() {
  try {
    const menusRef = doc(db, MENUS_DOC_PATH);
    const menusSnap = await getDoc(menusRef);

    if (!menusSnap.exists()) {
      console.log("ℹ️ Aucun menu trouvé");
      return [];
    }

    const data = menusSnap.data();
    const menus = data.menus || [];

    // Sauvegarder dans le cache
    saveMenusToCache(menus);

    console.log(`✅ ${menus.length} menus récupérés`);
    return menus;
  } catch (error) {
    console.error("❌ Erreur récupération menus:", error);
    throw error;
  }
}

/**
 * Crée un nouveau menu
 */
export async function createMenu(menuData) {
  try {
    const newMenu = {
      id: `menu_${nanoid()}`,
      denomination: menuData.denomination,
      imgURL: menuData.imgURL || "",
      prix: menuData.prix || 2000,
      ingredients: menuData.ingredients || [],
      description: menuData.description || "",
      status: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validation
    const validatedMenu = menuSchema.parse(newMenu);

    // Récupérer la liste actuelle
    const currentMenus = await getAllMenus();

    // Ajouter le nouveau menu
    const updatedMenus = [...currentMenus, validatedMenu];

    // Sauvegarder dans Firestore
    const menusRef = doc(db, MENUS_DOC_PATH);
    await setDoc(menusRef, { menus: updatedMenus });

    // Mettre à jour le cache
    saveMenusToCache(updatedMenus);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Modification Menus",
      `Nouveau menu créé: ${validatedMenu.denomination}`,
      "success"
    );

    console.log("✅ Menu créé:", validatedMenu.id);
    return validatedMenu;
  } catch (error) {
    console.error("❌ Erreur création menu:", error);
    throw error;
  }
}

/**
 * Met à jour un menu
 */
export async function updateMenu(menuId, updateData) {
  try {
    // Récupérer la liste actuelle
    const currentMenus = await getAllMenus();

    // Trouver le menu
    const menuIndex = currentMenus.findIndex((menu) => menu.id === menuId);

    if (menuIndex === -1) {
      throw new Error(`Menu ${menuId} introuvable`);
    }

    // Mettre à jour
    const updatedMenu = {
      ...currentMenus[menuIndex],
      ...updateData,
      updatedAt: Date.now(),
    };

    // Validation
    const validatedMenu = menuSchema.parse(updatedMenu);

    // Remplacer dans la liste
    currentMenus[menuIndex] = validatedMenu;

    // Sauvegarder dans Firestore
    const menusRef = doc(db, MENUS_DOC_PATH);
    await setDoc(menusRef, { menus: currentMenus });

    // Mettre à jour le cache
    saveMenusToCache(currentMenus);

    // Créer une notification RTDB
    await createRTDBNotification(
      "Modification Menus",
      `Menu modifié: ${validatedMenu.denomination}`,
      "info"
    );

    console.log("✅ Menu mis à jour:", menuId);
    return validatedMenu;
  } catch (error) {
    console.error("❌ Erreur mise à jour menu:", error);
    throw error;
  }
}

/**
 * Supprime un menu (soft delete - passe status à false)
 */
export async function deleteMenu(menuId) {
  try {
    return await updateMenu(menuId, { status: false });
  } catch (error) {
    console.error("❌ Erreur suppression menu:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS REACT
// ============================================================================

/**
 * Hook pour gérer les ingrédients avec cache local
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

  // Charger depuis le cache au montage et synchroniser avec Firestore
  useEffect(() => {
    const cached = getIngredientsFromCache();
    if (cached && cached.ingredients) {
      setIngredients(cached.ingredients);
      setLoading(false);
    }
    
    // Vérification initiale avec Firestore pour s'assurer que le cache est à jour
    sync();
  }, [sync]);

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

      // Chercher une notification "Modification Ingredients" récente (< 5 secondes)
      const now = Date.now();
      const recentIngredientNotif = notificationsList.find(
        (notif) =>
          notif.title === "Modification Ingredients" &&
          now - notif.createdAt < 5000
      );

      if (recentIngredientNotif) {
        console.log(
          "🔔 Notification détectée: Modification Ingredients - Synchronisation..."
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
    ingredients,
    loading,
    error,
    sync, // Fonction manuelle de synchronisation (optionnelle)
  };
}

/**
 * Hook pour gérer les menus avec cache local
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

  // Charger depuis le cache au montage et synchroniser avec Firestore
  useEffect(() => {
    const cached = getMenusFromCache();
    if (cached && cached.menus) {
      setMenus(cached.menus);
      setLoading(false);
    }
    
    // Vérification initiale avec Firestore pour s'assurer que le cache est à jour
    sync();
  }, [sync]);

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

      // Chercher une notification "Modification Menus" récente (< 5 secondes)
      const now = Date.now();
      const recentMenuNotif = notificationsList.find(
        (notif) =>
          notif.title === "Modification Menus" && now - notif.createdAt < 5000
      );

      if (recentMenuNotif) {
        console.log(
          "🔔 Notification détectée: Modification Menus - Synchronisation..."
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
  // Schemas
  ingredientSchema,
  menuSchema,
  uniteSchema,
  valeurEnergetiqueSchema,

  // CRUD Ingredients
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,

  // CRUD Menus
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,

  // Hooks
  useIngredients,
  useMenus,

  // Cache management
  clearIngredientsCache,
  clearMenusCache,
};
