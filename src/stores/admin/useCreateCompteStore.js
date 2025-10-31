import { create } from "zustand";

/**
 * Store Zustand pour la création de compte comptable
 * Chaque champ est séparé pour éviter les re-renders inutiles
 */
const useCreateCompteStore = create((set) => ({
  // Champs du formulaire (basés sur CompteSchema)
  code_ohada: "",
  denomination: "",
  description: "",
  type: "entree", // "entree" | "sortie" | "entree/sortie"

  // État du formulaire
  isSubmitting: false,
  error: null,

  // Actions pour chaque champ
  setCodeOhada: (code_ohada) => set({ code_ohada }),
  setDenomination: (denomination) => set({ denomination }),
  setDescription: (description) => set({ description }),
  setType: (type) => set({ type }),

  // Actions globales
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),

  // Réinitialiser le formulaire
  reset: () =>
    set({
      code_ohada: "",
      denomination: "",
      description: "",
      type: "entree",
      isSubmitting: false,
      error: null,
    }),

  // Remplir le formulaire avec des données
  setFormData: (data) =>
    set({
      code_ohada: data.code_ohada || "",
      denomination: data.denomination || "",
      description: data.description || "",
      type: data.type || "entree",
    }),
}));

// Sélecteurs optimisés pour éviter les re-renders
export const selectCodeOhada = (state) => state.code_ohada;
export const selectDenomination = (state) => state.denomination;
export const selectDescription = (state) => state.description;
export const selectType = (state) => state.type;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectError = (state) => state.error;

export const selectSetCodeOhada = (state) => state.setCodeOhada;
export const selectSetDenomination = (state) => state.setDenomination;
export const selectSetDescription = (state) => state.setDescription;
export const selectSetType = (state) => state.setType;
export const selectSetIsSubmitting = (state) => state.setIsSubmitting;
export const selectSetError = (state) => state.setError;
export const selectReset = (state) => state.reset;

export default useCreateCompteStore;
