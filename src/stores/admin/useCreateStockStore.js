/**
 * useCreateStockStore.js
 * Store Zustand pour le formulaire de création d'élément de stock
 * Chaque champ a son propre sélecteur pour éviter les re-rendus inutiles
 */

import { create } from "zustand";
import { STOCK_TYPES } from "@/toolkits/admin/stockToolkit.jsx";

const useCreateStockStore = create((set) => ({
  // Champs du formulaire
  denomination: "",
  type: STOCK_TYPES.INGREDIENT,
  unite: {
    nom: "",
    symbol: "",
  },
  prix_unitaire: "",
  seuil_alerte: "",
  description: "",
  imgURL: "",

  // État de soumission
  isSubmitting: false,
  submitError: null,

  // Actions pour chaque champ (évite les re-rendus)
  setDenomination: (value) => set({ denomination: value }),
  setType: (value) => set({ type: value }),
  setUniteNom: (value) =>
    set((state) => ({ unite: { ...state.unite, nom: value } })),
  setUniteSymbol: (value) =>
    set((state) => ({ unite: { ...state.unite, symbol: value } })),
  setPrixUnitaire: (value) => set({ prix_unitaire: value }),
  setSeuilAlerte: (value) => set({ seuil_alerte: value }),
  setDescription: (value) => set({ description: value }),
  setImgURL: (value) => set({ imgURL: value }),

  // Actions de soumission
  setIsSubmitting: (value) => set({ isSubmitting: value }),
  setSubmitError: (error) => set({ submitError: error }),

  // Réinitialiser le formulaire
  resetForm: () =>
    set({
      denomination: "",
      type: STOCK_TYPES.INGREDIENT,
      unite: { nom: "", symbol: "" },
      prix_unitaire: "",
      seuil_alerte: "",
      description: "",
      imgURL: "",
      isSubmitting: false,
      submitError: null,
    }),

  // Récupérer toutes les données du formulaire
  getFormData: () => {
    const state = useCreateStockStore.getState();
    return {
      denomination: state.denomination,
      type: state.type,
      unite: state.unite,
      prix_unitaire: parseFloat(state.prix_unitaire) || 0,
      seuil_alerte: parseFloat(state.seuil_alerte) || 0,
      description: state.description,
      imgURL: state.imgURL,
    };
  },

  // Valider le formulaire
  validateForm: () => {
    const state = useCreateStockStore.getState();
    const errors = [];

    if (!state.denomination.trim()) {
      errors.push("La dénomination est requise");
    }

    if (!state.unite.symbol.trim()) {
      errors.push("Le symbole de l'unité est requis");
    }

    if (!state.unite.nom.trim()) {
      errors.push("Le nom de l'unité est requis");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
}));

// Sélecteurs optimisés pour éviter les re-rendus
export const selectDenomination = (state) => state.denomination;
export const selectType = (state) => state.type;
export const selectUnite = (state) => state.unite;
export const selectUniteNom = (state) => state.unite.nom;
export const selectUniteSymbol = (state) => state.unite.symbol;
export const selectPrixUnitaire = (state) => state.prix_unitaire;
export const selectSeuilAlerte = (state) => state.seuil_alerte;
export const selectDescription = (state) => state.description;
export const selectImgURL = (state) => state.imgURL;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectSubmitError = (state) => state.submitError;

export default useCreateStockStore;
