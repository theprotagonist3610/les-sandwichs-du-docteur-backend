import { create } from "zustand";

/**
 * Store Zustand pour l'édition de compte comptable
 * Chaque champ est séparé pour éviter les re-renders inutiles
 */
const useEditCompteStore = create((set) => ({
  // Champs du formulaire (basés sur CompteSchema)
  id: "",
  code_ohada: "",
  denomination: "",
  description: "",
  type: "entree", // "entree" | "sortie" | "entree/sortie"

  // État du formulaire
  isSubmitting: false,
  isDeleting: false,
  error: null,
  isLoaded: false,

  // Actions pour chaque champ
  setId: (id) => set({ id }),
  setCodeOhada: (code_ohada) => set({ code_ohada }),
  setDenomination: (denomination) => set({ denomination }),
  setDescription: (description) => set({ description }),
  setType: (type) => set({ type }),

  // Actions globales
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsDeleting: (isDeleting) => set({ isDeleting }),
  setError: (error) => set({ error }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),

  // Réinitialiser le formulaire
  reset: () =>
    set({
      id: "",
      code_ohada: "",
      denomination: "",
      description: "",
      type: "entree",
      isSubmitting: false,
      isDeleting: false,
      error: null,
      isLoaded: false,
    }),

  // Remplir le formulaire avec des données
  setFormData: (data) =>
    set({
      id: data.id || "",
      code_ohada: data.code_ohada || "",
      denomination: data.denomination || "",
      description: data.description || "",
      type: data.type || "entree",
      isLoaded: true,
    }),
}));

// Sélecteurs optimisés pour éviter les re-renders
export const selectId = (state) => state.id;
export const selectCodeOhada = (state) => state.code_ohada;
export const selectDenomination = (state) => state.denomination;
export const selectDescription = (state) => state.description;
export const selectType = (state) => state.type;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectIsDeleting = (state) => state.isDeleting;
export const selectError = (state) => state.error;
export const selectIsLoaded = (state) => state.isLoaded;

export const selectSetId = (state) => state.setId;
export const selectSetCodeOhada = (state) => state.setCodeOhada;
export const selectSetDenomination = (state) => state.setDenomination;
export const selectSetDescription = (state) => state.setDescription;
export const selectSetType = (state) => state.setType;
export const selectSetIsSubmitting = (state) => state.setIsSubmitting;
export const selectSetIsDeleting = (state) => state.setIsDeleting;
export const selectSetError = (state) => state.setError;
export const selectSetIsLoaded = (state) => state.setIsLoaded;
export const selectReset = (state) => state.reset;
export const selectSetFormData = (state) => state.setFormData;

export default useEditCompteStore;
