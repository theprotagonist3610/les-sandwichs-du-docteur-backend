import { create } from "zustand";

const useRegisterStore = create((set) => ({
  // Champs du formulaire
  nom: "",
  prenoms: [""],
  email: "",
  password: "",
  confirmPassword: "",
  contact: "",
  sexe: "",
  date_naissance: null,

  // États
  isLoading: false,
  error: null,

  // Actions individuelles pour chaque champ (évite les rerenders multiples)
  setNom: (nom) => set({ nom }),
  setPrenoms: (prenoms) => set({ prenoms }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setContact: (contact) => set({ contact }),
  setSexe: (sexe) => set({ sexe }),
  setDateNaissance: (date_naissance) => set({ date_naissance }),

  // États de chargement et d'erreur
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Réinitialiser le formulaire
  resetForm: () =>
    set({
      nom: "",
      prenoms: [""],
      email: "",
      password: "",
      confirmPassword: "",
      contact: "",
      sexe: "",
      date_naissance: null,
      isLoading: false,
      error: null,
    }),
}));

export default useRegisterStore;