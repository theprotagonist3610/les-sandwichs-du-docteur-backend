/**
 * Store Zustand pour le formulaire de création d'utilisateur (preuser)
 * Chaque champ est géré individuellement pour éviter les rerenders inutiles
 */

import { create } from "zustand";

const useCreateUserStore = create((set) => ({
  // Champs du formulaire
  email: "",
  role: "",

  // États
  isLoading: false,
  error: null,
  success: false,

  // Setters individuels
  setEmail: (email) => set({ email, error: null }),
  setRole: (role) => set({ role, error: null }),

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, success: false }),
  setSuccess: (success) => set({ success, error: null }),

  // Reset du formulaire
  resetForm: () =>
    set({
      email: "",
      role: "",
      isLoading: false,
      error: null,
      success: false,
    }),
}));

export default useCreateUserStore;