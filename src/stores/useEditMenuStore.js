// stores/useEditMenuStore.js
import { create } from "zustand";
import { shallow } from "zustand/shallow";

const useEditMenuStore = create((set, get) => ({
  // État
  originalMenu: null,
  editedMenu: null,
  hasChanges: false,
  isSubmitting: false,
  loading: false,
  availableIngredients: [],
  expandedSections: {
    general: true,
    prix: true,
    ingredients: true,
    image: true,
    nutrition: true,
  },

  // Initialiser le menu
  initializeMenu: (menu) => {
    set({
      originalMenu: { ...menu },
      editedMenu: { ...menu },
      hasChanges: false,
    });
  },

  // Mettre à jour un champ - VERSION OPTIMISÉE
  updateField: (field, value) => {
    set((state) => {
      // Éviter le re-render si la valeur n'a pas changé
      if (state.editedMenu[field] === value) {
        return state;
      }

      const updatedMenu = {
        ...state.editedMenu,
        [field]: value,
      };

      const hasChanges =
        JSON.stringify(state.originalMenu) !== JSON.stringify(updatedMenu);

      return {
        editedMenu: updatedMenu,
        hasChanges,
      };
    });
  },

  // Mettre à jour plusieurs champs en une seule opération
  updateFields: (updates) => {
    set((state) => {
      const updatedMenu = {
        ...state.editedMenu,
        ...updates,
      };

      const hasChanges =
        JSON.stringify(state.originalMenu) !== JSON.stringify(updatedMenu);

      return {
        editedMenu: updatedMenu,
        hasChanges,
      };
    });
  },

  // Ajouter un ingrédient
  addIngredient: (ingredient) => {
    set((state) => {
      const newIngredient = {
        ...ingredient,
        quantite: 0,
      };

      const updatedIngredients = [
        ...(state.editedMenu.ingredients || []),
        newIngredient,
      ];

      const updatedMenu = {
        ...state.editedMenu,
        ingredients: updatedIngredients,
      };

      return {
        editedMenu: updatedMenu,
        hasChanges: true,
      };
    });
  },

  // Retirer un ingrédient
  removeIngredient: (ingredientId) => {
    set((state) => {
      const updatedIngredients = state.editedMenu.ingredients.filter(
        (ing) => ing.id !== ingredientId
      );

      const updatedMenu = {
        ...state.editedMenu,
        ingredients: updatedIngredients,
      };

      return {
        editedMenu: updatedMenu,
        hasChanges: true,
      };
    });
  },

  // Mettre à jour la quantité d'un ingrédient
  updateIngredientQuantity: (ingredientId, quantity) => {
    set((state) => {
      const updatedIngredients = state.editedMenu.ingredients.map((ing) =>
        ing.id === ingredientId ? { ...ing, quantite: quantity } : ing
      );

      const updatedMenu = {
        ...state.editedMenu,
        ingredients: updatedIngredients,
      };

      return {
        editedMenu: updatedMenu,
        hasChanges: true,
      };
    });
  },

  // Définir les ingrédients disponibles
  setAvailableIngredients: (ingredients) => {
    set({ availableIngredients: ingredients });
  },

  // Définir l'état de soumission
  setSubmitting: (isSubmitting) => {
    set({ isSubmitting });
  },

  // Définir l'état de chargement
  setLoading: (loading) => {
    set({ loading });
  },

  // Réinitialiser aux valeurs d'origine
  resetToOriginal: () => {
    set((state) => ({
      editedMenu: { ...state.originalMenu },
      hasChanges: false,
    }));
  },

  // Toggle section (pour mobile)
  toggleSection: (section) => {
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    }));
  },

  // Nettoyer le store (à appeler au démontage du composant)
  cleanup: () => {
    set({
      originalMenu: null,
      editedMenu: null,
      hasChanges: false,
      isSubmitting: false,
      loading: false,
      availableIngredients: [],
      expandedSections: {
        general: true,
        prix: true,
        ingredients: true,
        image: true,
        nutrition: true,
      },
    });
  },
}));

// Sélecteurs optimisés pour éviter les re-renders inutiles
export const useEditMenuField = (field) =>
  useEditMenuStore((state) => state.editedMenu?.[field], shallow);

export const useEditMenuActions = () =>
  useEditMenuStore(
    (state) => ({
      updateField: state.updateField,
      updateFields: state.updateFields,
      addIngredient: state.addIngredient,
      removeIngredient: state.removeIngredient,
      updateIngredientQuantity: state.updateIngredientQuantity,
      resetToOriginal: state.resetToOriginal,
      toggleSection: state.toggleSection,
    }),
    shallow
  );

export default useEditMenuStore;
