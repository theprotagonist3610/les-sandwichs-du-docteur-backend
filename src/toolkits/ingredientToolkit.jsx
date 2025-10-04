// toolkits/ingredientToolkit.js
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { ingredientSchema } from "@/toolkits/schema";

// ===========================================
// CONSTANTES
// ===========================================
const INGREDIENTS_KEY = "lsd_ingredients";
const COLLECTION = "ingredients";
const DOCUMENT = "liste";

// ===========================================
// FONCTIONS CRUD
// ===========================================

/**
 * Récupère tous les ingrédients
 */
export const getAllIngredients = async () => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: true, data: [], count: 0 };
    }

    const ingredients = docSnap.data().ingredients || [];

    // Mettre en cache
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));

    return { success: true, data: ingredients, count: ingredients.length };
  } catch (error) {
    console.error("❌ Erreur getAllIngredients:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Vérifie si un ingrédient existe déjà (par dénomination ET groupe)
 */
const ingredientExists = (ingredients, denomination, groupe) => {
  return ingredients.some(
    (i) =>
      i.denomination.toLowerCase().trim() ===
        denomination.toLowerCase().trim() &&
      i.groupe.toLowerCase().trim() === groupe.toLowerCase().trim()
  );
};

/**
 * Crée un nouveau ingrédient avec vérification des doublons
 */
export const createIngredient = async (ingredientData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let ingredients = [];
    if (docSnap.exists()) {
      ingredients = docSnap.data().ingredients || [];
    }

    // Vérifier les doublons
    if (
      ingredientExists(
        ingredients,
        ingredientData.denomination,
        ingredientData.groupe
      )
    ) {
      toast.error(
        `${ingredientData.denomination} existe déjà dans ${ingredientData.groupe}`
      );
      return {
        success: false,
        error: "Doublon détecté",
        isDuplicate: true,
      };
    }

    // Créer l'ingrédient avec validation
    const nouvelIngredient = {
      id: nanoid(10),
      denomination: ingredientData.denomination,
      groupe: ingredientData.groupe,
      emoji: ingredientData.emoji || "",
      calories: ingredientData.calories || 0,
      createdAt: Timestamp.now(),
      actif: true,
    };

    // Valider avec le schema
    const validation = ingredientSchema(nouvelIngredient);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Ajouter à la liste
    ingredients.push(nouvelIngredient);

    // Sauvegarder
    await setDoc(docRef, { ingredients, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));

    toast.success(`${ingredientData.denomination} créé avec succès`);
    return { success: true, data: nouvelIngredient };
  } catch (error) {
    console.error("❌ Erreur createIngredient:", error);
    toast.error("Erreur lors de la création");
    return { success: false, error: error.message };
  }
};

/**
 * Crée plusieurs ingrédients en batch
 */
export const createIngredientsBatch = async (ingredientsArray) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    let ingredients = [];
    if (docSnap.exists()) {
      ingredients = docSnap.data().ingredients || [];
    }

    const nouveaux = [];
    const doublons = [];
    const erreurs = [];

    for (const ingredientData of ingredientsArray) {
      // Vérifier les doublons
      if (
        ingredientExists(
          ingredients,
          ingredientData.denomination,
          ingredientData.groupe
        )
      ) {
        doublons.push(
          `${ingredientData.denomination} (${ingredientData.groupe})`
        );
        continue;
      }

      // Créer l'ingrédient
      const nouvelIngredient = {
        id: nanoid(10),
        denomination: ingredientData.denomination,
        groupe: ingredientData.groupe,
        emoji: ingredientData.emoji || "",
        calories: ingredientData.calories || 0,
        createdAt: Timestamp.now(),
        actif: true,
      };

      // Valider
      const validation = ingredientSchema(nouvelIngredient);
      if (!validation.success) {
        erreurs.push({
          ingredient: ingredientData.denomination,
          errors: validation.errors,
        });
        continue;
      }

      nouveaux.push(nouvelIngredient);
    }

    if (nouveaux.length > 0) {
      // Ajouter tous les nouveaux ingrédients
      ingredients = [...ingredients, ...nouveaux];

      // Sauvegarder
      await setDoc(docRef, { ingredients, updated_at: Timestamp.now() });

      // Mettre à jour le cache
      localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
    }

    // Notifications
    if (nouveaux.length > 0) {
      toast.success(`${nouveaux.length} ingrédients créés avec succès`);
    }
    if (doublons.length > 0) {
      toast.warning(`${doublons.length} doublons ignorés`);
    }
    if (erreurs.length > 0) {
      toast.error(`${erreurs.length} erreurs de validation`);
    }

    return {
      success: nouveaux.length > 0,
      created: nouveaux.length,
      duplicates: doublons,
      errors: erreurs,
      data: nouveaux,
    };
  } catch (error) {
    console.error("❌ Erreur createIngredientsBatch:", error);
    toast.error("Erreur lors de la création en batch");
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour un ingrédient existant
 */
export const updateIngredient = async (ingredientId, updatedData) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let ingredients = docSnap.data().ingredients || [];
    const index = ingredients.findIndex((i) => i.id === ingredientId);

    if (index === -1) {
      return { success: false, error: "Ingrédient introuvable" };
    }

    // Vérifier doublon si dénomination ou groupe changé
    if (
      (updatedData.denomination &&
        updatedData.denomination !== ingredients[index].denomination) ||
      (updatedData.groupe && updatedData.groupe !== ingredients[index].groupe)
    ) {
      const newDenom =
        updatedData.denomination || ingredients[index].denomination;
      const newGroupe = updatedData.groupe || ingredients[index].groupe;

      if (ingredientExists(ingredients, newDenom, newGroupe)) {
        toast.error("Un ingrédient avec cette combinaison existe déjà");
        return {
          success: false,
          error: "Doublon détecté",
          isDuplicate: true,
        };
      }
    }

    // Mettre à jour
    ingredients[index] = {
      ...ingredients[index],
      ...updatedData,
      id: ingredientId, // Préserver l'ID
      createdAt: ingredients[index].createdAt, // Préserver la date de création
    };

    // Valider
    const validation = ingredientSchema(ingredients[index]);
    if (!validation.success) {
      toast.error("Données invalides");
      return {
        success: false,
        error: "Validation échouée",
        errors: validation.errors,
      };
    }

    // Sauvegarder
    await setDoc(docRef, { ingredients, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));

    toast.success("Ingrédient mis à jour");
    return { success: true, data: ingredients[index] };
  } catch (error) {
    console.error("❌ Erreur updateIngredient:", error);
    toast.error("Erreur lors de la mise à jour");
    return { success: false, error: error.message };
  }
};

/**
 * Désactive un ingrédient (soft delete)
 */
export const desactiverIngredient = async (ingredientId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let ingredients = docSnap.data().ingredients || [];
    const index = ingredients.findIndex((i) => i.id === ingredientId);

    if (index === -1) {
      return { success: false, error: "Ingrédient introuvable" };
    }

    // Désactiver
    ingredients[index].actif = false;

    // Sauvegarder
    await setDoc(docRef, { ingredients, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));

    toast.success("Ingrédient désactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur desactiverIngredient:", error);
    toast.error("Erreur lors de la désactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Réactive un ingrédient
 */
export const reactiverIngredient = async (ingredientId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let ingredients = docSnap.data().ingredients || [];
    const index = ingredients.findIndex((i) => i.id === ingredientId);

    if (index === -1) {
      return { success: false, error: "Ingrédient introuvable" };
    }

    // Réactiver
    ingredients[index].actif = true;

    // Sauvegarder
    await setDoc(docRef, { ingredients, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));

    toast.success("Ingrédient réactivé");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur reactiverIngredient:", error);
    toast.error("Erreur lors de la réactivation");
    return { success: false, error: error.message };
  }
};

/**
 * Supprime définitivement un ingrédient
 */
export const deleteIngredient = async (ingredientId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable" };
    }

    let ingredients = docSnap.data().ingredients || [];
    ingredients = ingredients.filter((i) => i.id !== ingredientId);

    // Sauvegarder
    await setDoc(docRef, { ingredients, updated_at: Timestamp.now() });

    // Mettre à jour le cache
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));

    toast.success("Ingrédient supprimé définitivement");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur deleteIngredient:", error);
    toast.error("Erreur lors de la suppression");
    return { success: false, error: error.message };
  }
};

/**
 * Récupère un ingrédient par son ID
 */
export const getIngredientById = async (ingredientId) => {
  try {
    const docRef = doc(db, COLLECTION, DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Document introuvable", data: null };
    }

    const ingredients = docSnap.data().ingredients || [];
    const ingredient = ingredients.find((i) => i.id === ingredientId);

    if (!ingredient) {
      return { success: false, error: "Ingrédient introuvable", data: null };
    }

    return { success: true, data: ingredient };
  } catch (error) {
    console.error("❌ Erreur getIngredientById:", error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Rechercher des ingrédients par nom ou groupe
 */
export const searchIngredients = async (searchTerm, groupe = null) => {
  try {
    const result = await getAllIngredients();
    if (!result.success) {
      return result;
    }

    let filteredIngredients = result.data;

    // Filtrer par terme de recherche
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filteredIngredients = filteredIngredients.filter(
        (ingredient) =>
          ingredient.denomination.toLowerCase().includes(term) ||
          ingredient.groupe.toLowerCase().includes(term)
      );
    }

    // Filtrer par groupe
    if (groupe && groupe.trim() !== "") {
      filteredIngredients = filteredIngredients.filter(
        (ingredient) => ingredient.groupe.toLowerCase() === groupe.toLowerCase()
      );
    }

    return {
      success: true,
      data: filteredIngredients,
      count: filteredIngredients.length,
    };
  } catch (error) {
    console.error("❌ Erreur searchIngredients:", error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Calcule les calories totales d'une liste d'ingrédients avec quantités
 */
export const calculateIngredientsCalories = (ingredientsWithQuantity) => {
  if (!ingredientsWithQuantity || ingredientsWithQuantity.length === 0) {
    return 0;
  }

  return ingredientsWithQuantity.reduce((total, ingredient) => {
    const calories = ingredient.calories || 0;
    const quantite = ingredient.quantite || 0;
    return total + calories * quantite;
  }, 0);
};

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook pour récupérer tous les ingrédients avec synchronisation temps réel
 */
export const useIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger depuis le cache
        const cached = localStorage.getItem(INGREDIENTS_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.length > 0) {
            setIngredients(parsedCache);
          }
        }

        // Synchronisation temps réel
        const docRef = doc(db, COLLECTION, DOCUMENT);

        unsubscribeRef.current = onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data().ingredients || [];
              setIngredients(data);
              setLoading(false);

              // Mettre à jour le cache
              localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(data));
            } else {
              setIngredients([]);
              setLoading(false);
            }
          },
          (error) => {
            console.error("❌ Erreur snapshot ingrédients:", error);
            setError(error.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("❌ Erreur loadIngredients:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadIngredients();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Fonctions utilitaires
  const ingredientsActifs = ingredients.filter((i) => i.actif !== false);
  const ingredientsInactifs = ingredients.filter((i) => i.actif === false);

  // Grouper par catégorie
  const ingredientsByGroupe = ingredientsActifs.reduce((acc, ingredient) => {
    const groupe = ingredient.groupe || "Non classé";
    if (!acc[groupe]) {
      acc[groupe] = [];
    }
    acc[groupe].push(ingredient);
    return acc;
  }, {});

  // Obtenir tous les groupes uniques
  const groupes = [
    ...new Set(ingredients.map((i) => i.groupe).filter(Boolean)),
  ];

  // Fonction pour obtenir un ingrédient par ID
  const getIngredientById = (id) => {
    return ingredients.find((i) => i.id === id);
  };

  // Fonction de recherche locale
  const searchLocal = (searchTerm, groupe = null) => {
    let filtered = ingredientsActifs;

    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (ingredient) =>
          ingredient.denomination.toLowerCase().includes(term) ||
          ingredient.groupe.toLowerCase().includes(term)
      );
    }

    if (groupe && groupe.trim() !== "") {
      filtered = filtered.filter(
        (ingredient) => ingredient.groupe.toLowerCase() === groupe.toLowerCase()
      );
    }

    return filtered;
  };

  return {
    ingredients,
    ingredientsActifs,
    ingredientsInactifs,
    ingredientsByGroupe,
    groupes,
    loading,
    error,
    totalCount: ingredients.length,
    activeCount: ingredientsActifs.length,
    inactiveCount: ingredientsInactifs.length,
    getIngredientById,
    searchLocal,
  };
};

// ===========================================
// EXPORTS
// ===========================================

export default {
  // CRUD
  getAllIngredients,
  createIngredient,
  createIngredientsBatch,
  updateIngredient,
  desactiverIngredient,
  reactiverIngredient,
  deleteIngredient,

  // Fonctions utilitaires
  getIngredientById,
  searchIngredients,
  calculateIngredientsCalories,

  // Hook
  useIngredients,
};
