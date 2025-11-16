/**
 * gererUneBoissonStore.js
 * Store Zustand pour la gestion d'une boisson existante
 */

import { create } from "zustand";

const useGererUneBoissonStore = create((set) => ({
  // Champs de la boisson
  id: "",
  denomination: "",
  imgURL: "",
  prix: 1000,
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
  setDescription: (description) => set({ description, error: null }),
  setStatus: (status) => set({ status, error: null }),
  setCreatedAt: (createdAt) => set({ createdAt }),
  setUpdatedAt: (updatedAt) => set({ updatedAt }),

  // Gestion des états
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error, success: false }),
  setSuccess: (success) => set({ success, error: null }),

  // Charger une boisson complète
  loadBoisson: (boissonData) =>
    set({
      id: boissonData.id || "",
      denomination: boissonData.denomination || "",
      imgURL: boissonData.imgURL || "",
      prix: boissonData.prix || 1000,
      description: boissonData.description || "",
      status: boissonData.status !== false,
      createdAt: boissonData.createdAt || null,
      updatedAt: boissonData.updatedAt || null,
      isLoading: false,
      error: null,
    }),

  // Reset du store
  resetForm: () =>
    set({
      id: "",
      denomination: "",
      imgURL: "",
      prix: 1000,
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

export default useGererUneBoissonStore;
