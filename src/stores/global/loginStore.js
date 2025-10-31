import { create } from "zustand";

const useLoginStore = create((set) => ({
  // État du formulaire
  email: "",
  password: "",
  isLoading: false,
  error: null,

  // Setters individuels
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Reset
  resetForm: () =>
    set({
      email: "",
      password: "",
      isLoading: false,
      error: null,
    }),
}));

export default useLoginStore;