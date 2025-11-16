/**
 * createBoissonStore.js
 * Store Zustand pour la création de boissons
 */

import { create } from "zustand";

const useCreateBoissonStore = create((set) => ({
  // Champs du formulaire
  denomination: "",
  imgURL: "",
  prix: 1000,
  description: "",

  // États
  isLoading: false,
  error: null,
  success: false,

  // Setters individuels
  setDenomination: (denomination) => set({ denomination, error: null }),
  setImgURL: (imgURL) => set({ imgURL, error: null }),
  setPrix: (prix) => set({ prix, error: null }),
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
      prix: 1000,
      description: "",
      isLoading: false,
      error: null,
      success: false,
    }),
}));

export default useCreateBoissonStore;
