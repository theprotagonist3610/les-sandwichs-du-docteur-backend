/**
 * gererUnMenuStore.js
 * Store Zustand pour la gestion d'un menu existant
 */

import { create } from "zustand";

const useGererUnMenuStore = create((set) => ({
  // Champs du menu
  id: "",
  denomination: "",
  imgURL: "",
  prix: 2000,
  ingredients: [],
  description: "",
  status: true,
  createdAt: null,
  updatedAt: null,

  // États
  isLoading: false,
  isSaving: false,
  error: null,
  success: false,

  // Setters individuels
  setId: (id) => set({ id }),
  setDenomination: (denomination) => set({ denomination, error: null }),
  setImgURL: (imgURL) => set({ imgURL, error: null }),
  setPrix: (prix) => set({ prix, error: null }),
  setIngredients: (ingredients) => set({ ingredients, error: null }),
  setDescription: (description) => set({ description, error: null }),
  setStatus: (status) => set({ status, error: null }),
  setCreatedAt: (createdAt) => set({ createdAt }),
  setUpdatedAt: (updatedAt) => set({ updatedAt }),

  // Gestion des états
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error, success: false }),
  setSuccess: (success) => set({ success, error: null }),

  // Charger un menu complet
  loadMenu: (menuData) =>
    set({
      id: menuData.id || "",
      denomination: menuData.denomination || "",
      imgURL: menuData.imgURL || "",
      prix: menuData.prix || 2000,
      ingredients: menuData.ingredients || [],
      description: menuData.description || "",
      status: menuData.status !== false,
      createdAt: menuData.createdAt || null,
      updatedAt: menuData.updatedAt || null,
      isLoading: false,
      error: null,
    }),

  // Reset du store
  resetForm: () =>
    set({
      id: "",
      denomination: "",
      imgURL: "",
      prix: 2000,
      ingredients: [],
      description: "",
      status: true,
      createdAt: null,
      updatedAt: null,
      isLoading: false,
      isSaving: false,
      error: null,
      success: false,
    }),
}));

export default useGererUnMenuStore;