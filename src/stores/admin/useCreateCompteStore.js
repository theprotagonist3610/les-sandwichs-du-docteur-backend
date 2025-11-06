import { create } from "zustand";

/**
 * Store Zustand pour la création de compte comptable ou de trésorerie
 * Chaque champ est séparé pour éviter les re-renders inutiles
 */
const useCreateCompteStore = create((set) => ({
  // Champs du formulaire (basés sur CompteSchema et CompteTresorerieSchema)
  typeCompte: "comptable", // "comptable" | "tresorerie"
  code_ohada: "",
  denomination: "",
  description: "",
  categorie: "entree", // "entree" | "sortie" (pour comptable uniquement)
  numero: "", // Pour trésorerie uniquement (numéro de compte bancaire/Mobile Money)

  // État du formulaire
  isSubmitting: false,
  error: null,

  // Actions pour chaque champ
  setTypeCompte: (typeCompte) => set({ typeCompte }),
  setCodeOhada: (code_ohada) => set({ code_ohada }),
  setDenomination: (denomination) => set({ denomination }),
  setDescription: (description) => set({ description }),
  setCategorie: (categorie) => set({ categorie }),
  setNumero: (numero) => set({ numero }),

  // Actions globales
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),

  // Réinitialiser le formulaire
  reset: () =>
    set({
      typeCompte: "comptable",
      code_ohada: "",
      denomination: "",
      description: "",
      categorie: "entree",
      numero: "",
      isSubmitting: false,
      error: null,
    }),

  // Remplir le formulaire avec des données
  setFormData: (data) =>
    set({
      typeCompte: data.typeCompte || "comptable",
      code_ohada: data.code_ohada || "",
      denomination: data.denomination || "",
      description: data.description || "",
      categorie: data.categorie || "entree",
      numero: data.numero || "",
    }),
}));

// Sélecteurs optimisés pour éviter les re-renders
export const selectTypeCompte = (state) => state.typeCompte;
export const selectCodeOhada = (state) => state.code_ohada;
export const selectDenomination = (state) => state.denomination;
export const selectDescription = (state) => state.description;
export const selectCategorie = (state) => state.categorie;
export const selectNumero = (state) => state.numero;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectError = (state) => state.error;

export const selectSetTypeCompte = (state) => state.setTypeCompte;
export const selectSetCodeOhada = (state) => state.setCodeOhada;
export const selectSetDenomination = (state) => state.setDenomination;
export const selectSetDescription = (state) => state.setDescription;
export const selectSetCategorie = (state) => state.setCategorie;
export const selectSetNumero = (state) => state.setNumero;
export const selectSetIsSubmitting = (state) => state.setIsSubmitting;
export const selectSetError = (state) => state.setError;
export const selectReset = (state) => state.reset;

export default useCreateCompteStore;
