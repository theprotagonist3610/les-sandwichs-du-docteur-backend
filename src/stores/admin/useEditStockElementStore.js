/**
 * useEditStockElementStore.js
 * Store Zustand pour éditer les détails d'un élément de stock
 */

import { create } from "zustand";

const useEditStockElementStore = create((set) => ({
  // État de l'élément
  id: "",
  denomination: "",
  type: "",
  uniteNom: "",
  uniteSymbol: "",
  prixUnitaire: 0,
  seuilAlerte: 0,
  description: "",
  imgURL: "",
  status: true,

  // État de soumission
  isSubmitting: false,
  submitError: null,

  // Actions pour charger l'élément
  loadElement: (element) =>
    set({
      id: element.id || "",
      denomination: element.denomination || "",
      type: element.type || "",
      uniteNom: element.unite?.nom || "",
      uniteSymbol: element.unite?.symbol || "",
      prixUnitaire:
        element.prix_unitaire !== undefined && element.prix_unitaire !== null
          ? element.prix_unitaire.toString()
          : "0",
      seuilAlerte:
        element.seuil_alerte !== undefined && element.seuil_alerte !== null
          ? element.seuil_alerte.toString()
          : "0",
      description: element.description || "",
      imgURL: element.imgURL || "",
      status: element.status !== false, // true par défaut
    }),

  // Actions pour modifier les champs
  setDenomination: (denomination) => set({ denomination }),
  setType: (type) => set({ type }),
  setUniteNom: (uniteNom) => set({ uniteNom }),
  setUniteSymbol: (uniteSymbol) => set({ uniteSymbol }),
  setPrixUnitaire: (prixUnitaire) => set({ prixUnitaire }),
  setSeuilAlerte: (seuilAlerte) => set({ seuilAlerte }),
  setDescription: (description) => set({ description }),
  setImgURL: (imgURL) => set({ imgURL }),
  setStatus: (status) => set({ status }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmitError: (submitError) => set({ submitError }),

  // Réinitialiser
  resetForm: () =>
    set({
      id: "",
      denomination: "",
      type: "",
      uniteNom: "",
      uniteSymbol: "",
      prixUnitaire: "0",
      seuilAlerte: "0",
      description: "",
      imgURL: "",
      status: true,
      isSubmitting: false,
      submitError: null,
    }),

  // Validation
  validateForm: () => {
    const state = useEditStockElementStore.getState();
    const errors = [];

    if (!state.denomination?.trim()) {
      errors.push("La dénomination est requise");
    }

    if (!state.type) {
      errors.push("Le type est requis");
    }

    if (!state.uniteNom?.trim()) {
      errors.push("Le nom de l'unité est requis");
    }

    if (!state.uniteSymbol?.trim()) {
      errors.push("Le symbole de l'unité est requis");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Récupérer les données du formulaire
  getFormData: () => {
    const state = useEditStockElementStore.getState();
    return {
      denomination: state.denomination,
      type: state.type,
      unite: {
        nom: state.uniteNom,
        symbol: state.uniteSymbol,
      },
      prix_unitaire: parseFloat(state.prixUnitaire) || 0,
      seuil_alerte: parseFloat(state.seuilAlerte) || 0,
      description: state.description,
      imgURL: state.imgURL,
      status: state.status,
    };
  },
}));

// Sélecteurs optimisés
export const selectId = (state) => state.id;
export const selectDenomination = (state) => state.denomination;
export const selectType = (state) => state.type;
export const selectUniteNom = (state) => state.uniteNom;
export const selectUniteSymbol = (state) => state.uniteSymbol;
export const selectPrixUnitaire = (state) => state.prixUnitaire;
export const selectSeuilAlerte = (state) => state.seuilAlerte;
export const selectDescription = (state) => state.description;
export const selectImgURL = (state) => state.imgURL;
export const selectStatus = (state) => state.status;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectSubmitError = (state) => state.submitError;

export default useEditStockElementStore;
