// stores/useEditBoissonStore.js
import { create } from "zustand";

const useEditBoissonStore = create((set, get) => ({
  // État de la boisson en édition
  originalBoisson: null,
  editedBoisson: null,
  hasChanges: false,
  isSubmitting: false,

  // Ingrédients disponibles
  availableIngredients: [],
  selectedIngredient: null,

  // Initialiser avec une boisson existante
  initializeBoisson: (boisson) => {
    set({
      originalBoisson: boisson,
      editedBoisson: { ...boisson },
      hasChanges: false,
    });
  },

  // Mettre à jour un champ
  updateField: (field, value) => {
    const { originalBoisson } = get();
    const newBoisson = { ...get().editedBoisson, [field]: value };

    // Vérifier si des changements ont été faits
    const hasChanges =
      JSON.stringify(originalBoisson) !== JSON.stringify(newBoisson);

    set({
      editedBoisson: newBoisson,
      hasChanges,
    });
  },

  // Ajouter un ingrédient
  addIngredient: (ingredient) => {
    const { editedBoisson, originalBoisson } = get();
    const currentIngredients = editedBoisson.ingredients || [];

    // Vérifier si l'ingrédient n'est pas déjà présent
    if (!currentIngredients.find((ing) => ing.id === ingredient.id)) {
      const newIngredients = [
        ...currentIngredients,
        {
          id: ingredient.id || Date.now().toString(),
          denomination: ingredient.denomination,
          quantite: ingredient.quantite || 0,
          valeur_calorique: ingredient.valeur_calorique || 0,
          symbole: ingredient.symbole || "",
        },
      ];

      const newBoisson = { ...editedBoisson, ingredients: newIngredients };
      const hasChanges =
        JSON.stringify(originalBoisson) !== JSON.stringify(newBoisson);

      set({
        editedBoisson: newBoisson,
        hasChanges,
      });
    }
  },

  // Retirer un ingrédient
  removeIngredient: (ingredientId) => {
    const { editedBoisson, originalBoisson } = get();
    const newIngredients = (editedBoisson.ingredients || []).filter(
      (ing) => ing.id !== ingredientId
    );

    const newBoisson = { ...editedBoisson, ingredients: newIngredients };
    const hasChanges =
      JSON.stringify(originalBoisson) !== JSON.stringify(newBoisson);

    set({
      editedBoisson: newBoisson,
      hasChanges,
    });
  },

  // Mettre à jour la quantité d'un ingrédient
  updateIngredientQuantity: (ingredientId, quantite) => {
    const { editedBoisson, originalBoisson } = get();
    const newIngredients = (editedBoisson.ingredients || []).map((ing) =>
      ing.id === ingredientId ? { ...ing, quantite } : ing
    );

    const newBoisson = { ...editedBoisson, ingredients: newIngredients };
    const hasChanges =
      JSON.stringify(originalBoisson) !== JSON.stringify(newBoisson);

    set({
      editedBoisson: newBoisson,
      hasChanges,
    });
  },

  // Définir les ingrédients disponibles
  setAvailableIngredients: (ingredients) =>
    set({ availableIngredients: ingredients }),

  // Définir l'état de soumission
  setSubmitting: (value) => set({ isSubmitting: value }),

  // Réinitialiser aux valeurs originales
  resetToOriginal: () => {
    const { originalBoisson } = get();
    set({
      editedBoisson: { ...originalBoisson },
      hasChanges: false,
    });
  },

  // Nettoyer le store
  cleanup: () =>
    set({
      originalBoisson: null,
      editedBoisson: null,
      hasChanges: false,
      isSubmitting: false,
      selectedIngredient: null,
    }),
}));

export default useEditBoissonStore;
