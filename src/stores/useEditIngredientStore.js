// stores/useEditIngredientStore.js
import { create } from "zustand";

const useEditIngredientStore = create((set, get) => ({
  // État
  originalIngredient: null,
  editedIngredient: null,
  hasChanges: false,
  isSubmitting: false,

  // Initialiser l'ingrédient
  initializeIngredient: (ingredient) => {
    set({
      originalIngredient: { ...ingredient },
      editedIngredient: { ...ingredient },
      hasChanges: false,
    });
  },

  // Mettre à jour un champ
  updateField: (field, value) => {
    set((state) => {
      const updatedIngredient = {
        ...state.editedIngredient,
        [field]: value,
      };

      const hasChanges =
        JSON.stringify(state.originalIngredient) !==
        JSON.stringify(updatedIngredient);

      return {
        editedIngredient: updatedIngredient,
        hasChanges,
      };
    });
  },

  // Réinitialiser aux valeurs d'origine
  resetToOriginal: () => {
    set((state) => ({
      editedIngredient: { ...state.originalIngredient },
      hasChanges: false,
    }));
  },

  // Définir l'état de soumission
  setSubmitting: (isSubmitting) => {
    set({ isSubmitting });
  },

  // Nettoyer le store (à appeler au démontage du composant)
  cleanup: () => {
    set({
      originalIngredient: null,
      editedIngredient: null,
      hasChanges: false,
      isSubmitting: false,
    });
  },
}));

export default useEditIngredientStore;
