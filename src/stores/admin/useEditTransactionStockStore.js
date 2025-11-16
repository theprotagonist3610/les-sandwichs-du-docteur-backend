/**
 * useEditTransactionStockStore.js
 * Store Zustand pour éditer une transaction dans l'historique
 */

import { create } from "zustand";

const useEditTransactionStockStore = create((set) => ({
  // Transaction sélectionnée
  selectedTransaction: null,
  isDialogOpen: false,

  // Champs éditables
  quantite: "",
  prixUnitaire: "",
  motif: "",

  // État de soumission
  isSubmitting: false,
  submitError: null,

  // Ouvrir le dialog avec une transaction
  openDialog: (transaction) =>
    set({
      selectedTransaction: transaction,
      isDialogOpen: true,
      quantite: transaction.quantite?.toString() || "",
      prixUnitaire: transaction.prix_unitaire?.toString() || "",
      motif: transaction.motif || "",
      submitError: null,
    }),

  // Fermer le dialog
  closeDialog: () =>
    set({
      selectedTransaction: null,
      isDialogOpen: false,
      quantite: "",
      prixUnitaire: "",
      motif: "",
      submitError: null,
    }),

  // Actions pour modifier les champs
  setQuantite: (quantite) => set({ quantite }),
  setPrixUnitaire: (prixUnitaire) => set({ prixUnitaire }),
  setMotif: (motif) => set({ motif }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmitError: (submitError) => set({ submitError }),

  // Validation
  validateForm: () => {
    const state = useEditTransactionStockStore.getState();
    const errors = [];

    if (!state.quantite || parseFloat(state.quantite) <= 0) {
      errors.push("La quantité doit être supérieure à 0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Récupérer les données du formulaire
  getFormData: () => {
    const state = useEditTransactionStockStore.getState();
    return {
      quantite: parseFloat(state.quantite) || 0,
      prix_unitaire: parseFloat(state.prixUnitaire) || 0,
      motif: state.motif,
    };
  },
}));

// Sélecteurs optimisés
export const selectSelectedTransaction = (state) => state.selectedTransaction;
export const selectIsDialogOpen = (state) => state.isDialogOpen;
export const selectQuantite = (state) => state.quantite;
export const selectPrixUnitaire = (state) => state.prixUnitaire;
export const selectMotif = (state) => state.motif;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectSubmitError = (state) => state.submitError;

export default useEditTransactionStockStore;
