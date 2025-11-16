/**
 * useTransactionStockStore.js
 * Store Zustand pour gérer les transactions de stock (entrée/sortie/transfert)
 */

import { create } from "zustand";

const useTransactionStockStore = create((set, get) => ({
  // État du formulaire de transaction
  type: "entree", // "entree" | "sortie" | "transfert"
  emplacementId: "",
  emplacementDestId: "", // Pour les transferts uniquement
  quantite: "",
  coutTotal: "", // Coût total de l'achat
  motif: "",
  isSubmitting: false,
  submitError: null,

  // Actions
  setType: (type) => set({ type }),
  setEmplacementId: (emplacementId) => set({ emplacementId }),
  setEmplacementDestId: (emplacementDestId) => set({ emplacementDestId }),
  setQuantite: (quantite) => set({ quantite }),
  setCoutTotal: (coutTotal) => set({ coutTotal }),
  setMotif: (motif) => set({ motif }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmitError: (submitError) => set({ submitError }),

  // Calculer le prix unitaire dynamiquement
  getPrixUnitaire: () => {
    const state = get();
    const quantite = parseFloat(state.quantite) || 0;
    const coutTotal = parseFloat(state.coutTotal) || 0;
    if (quantite === 0) return 0;
    return coutTotal / quantite;
  },

  // Réinitialiser le formulaire
  resetForm: () =>
    set({
      type: "entree",
      emplacementId: "",
      emplacementDestId: "",
      quantite: "",
      coutTotal: "",
      motif: "",
      isSubmitting: false,
      submitError: null,
    }),

  // Validation
  validateForm: () => {
    const state = useTransactionStockStore.getState();
    const errors = [];

    if (!state.quantite || parseFloat(state.quantite) <= 0) {
      errors.push("La quantité doit être supérieure à 0");
    }

    if (!state.emplacementId) {
      errors.push("Veuillez sélectionner un emplacement");
    }

    // Coût total requis uniquement pour les entrées
    if (state.type === "entree" && (!state.coutTotal || parseFloat(state.coutTotal) <= 0)) {
      errors.push("Le coût total doit être supérieur à 0 pour une entrée");
    }

    if (state.type === "transfert" && !state.emplacementDestId) {
      errors.push("Veuillez sélectionner un emplacement de destination");
    }

    if (state.type === "transfert" && state.emplacementId === state.emplacementDestId) {
      errors.push("L'emplacement source et destination doivent être différents");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Récupérer les données du formulaire
  getFormData: () => {
    const state = useTransactionStockStore.getState();
    const formData = {
      type: state.type,
      emplacement_id: state.emplacementId,
      emplacement_dest_id: state.emplacementDestId,
      quantite: parseFloat(state.quantite) || 0,
      motif: state.motif,
    };

    // Prix unitaire uniquement pour les entrées (les sorties et transferts ne coûtent rien)
    if (state.type === "entree") {
      const prixUnitaire = state.getPrixUnitaire();
      formData.prix_unitaire = prixUnitaire;
    }

    return formData;
  },
}));

// Sélecteurs optimisés
export const selectType = (state) => state.type;
export const selectEmplacementId = (state) => state.emplacementId;
export const selectEmplacementDestId = (state) => state.emplacementDestId;
export const selectQuantite = (state) => state.quantite;
export const selectCoutTotal = (state) => state.coutTotal;
export const selectMotif = (state) => state.motif;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectSubmitError = (state) => state.submitError;
export const selectPrixUnitaireCalcule = (state) => state.getPrixUnitaire();

export default useTransactionStockStore;
