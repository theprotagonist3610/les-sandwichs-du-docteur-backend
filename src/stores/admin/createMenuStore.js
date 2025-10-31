/**
 * createMenuStore.js
 * Store Zustand pour la création de menus
 */

import { create } from "zustand";

const useCreateMenuStore = create((set) => ({
  // Champs du formulaire
  denomination: "",
  imgURL: "",
  prix: 2000,
  ingredients: [],
  description: "",

  // États
  isLoading: false,
  error: null,
  success: false,

  // Setters individuels
  setDenomination: (denomination) => set({ denomination, error: null }),
  setImgURL: (imgURL) => set({ imgURL, error: null }),
  setPrix: (prix) => set({ prix, error: null }),
  setIngredients: (ingredients) => set({ ingredients, error: null }),
  setDescription: (description) => set({ description, error: null }),

  // Gestion des états
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, success: false }),
  setSuccess: (success) => set({ success, error: null }),

  // Reset du formulaire
  resetForm: () =>
    set({
      denomination: "",
      imgURL: "",
      prix: 2000,
      ingredients: [],
      description: "",
      isLoading: false,
      error: null,
      success: false,
    }),
}));

export default useCreateMenuStore;