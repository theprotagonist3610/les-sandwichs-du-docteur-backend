/**
 * useCreateOperationStore.js
 * Store Zustand pour la création d'opérations comptables
 * Chaque champ utilise une variable unique pour éviter les re-renders inutiles
 */

import { create } from "zustand";

const useCreateOperationStore = create((set, get) => ({
  // ============================================================================
  // STATE
  // ============================================================================

  // Données de l'opération
  compte_id: "",
  compte_ohada: "",
  compte_denomination: "",
  montant: "",
  motif: "",
  type_operation: "entree", // ou "sortie"
  date: Date.now(),

  // Listes pour les selects
  comptesDisponibles: [], // Tous les comptes (comptables + trésorerie)
  comptesComptables: [],
  comptesTresorerie: [],

  // État du formulaire
  isSubmitting: false,
  isLoadingComptes: true,
  error: null,
  success: false,

  // ============================================================================
  // ACTIONS - Setters individuels pour éviter les re-renders
  // ============================================================================

  setCompteId: (value) => set({ compte_id: value }),
  setCompteOhada: (value) => set({ compte_ohada: value }),
  setCompteDenomination: (value) => set({ compte_denomination: value }),
  setMontant: (value) => set({ montant: value }),
  setMotif: (value) => set({ motif: value }),
  setTypeOperation: (value) => set({ type_operation: value }),
  setDate: (value) => set({ date: value }),

  setComptesDisponibles: (value) => set({ comptesDisponibles: value }),
  setComptesComptables: (value) => set({ comptesComptables: value }),
  setComptesTresorerie: (value) => set({ comptesTresorerie: value }),

  setIsSubmitting: (value) => set({ isSubmitting: value }),
  setIsLoadingComptes: (value) => set({ isLoadingComptes: value }),
  setError: (value) => set({ error: value }),
  setSuccess: (value) => set({ success: value }),

  // ============================================================================
  // ACTIONS - Logique métier
  // ============================================================================

  /**
   * Sélectionne un compte et remplit automatiquement les champs associés
   */
  selectCompte: (compte) => {
    if (!compte) {
      set({
        compte_id: "",
        compte_ohada: "",
        compte_denomination: "",
        type_operation: "entree",
      });
      return;
    }

    set({
      compte_id: compte.id,
      compte_ohada: compte.code_ohada,
      compte_denomination: compte.denomination,
      // Définir le type_operation selon la catégorie du compte
      type_operation: compte.categorie === "sortie" ? "sortie" : "entree",
    });
  },

  /**
   * Réinitialise le formulaire
   */
  reset: () => set({
    compte_id: "",
    compte_ohada: "",
    compte_denomination: "",
    montant: "",
    motif: "",
    type_operation: "entree",
    date: Date.now(),
    isSubmitting: false,
    error: null,
    success: false,
  }),

  /**
   * Réinitialise tout le store (y compris les listes)
   */
  resetAll: () => set({
    compte_id: "",
    compte_ohada: "",
    compte_denomination: "",
    montant: "",
    motif: "",
    type_operation: "entree",
    date: Date.now(),
    comptesDisponibles: [],
    comptesComptables: [],
    comptesTresorerie: [],
    isSubmitting: false,
    isLoadingComptes: true,
    error: null,
    success: false,
  }),
}));

// ============================================================================
// SELECTORS - Pour optimiser les re-renders
// ============================================================================

// Sélecteurs pour les champs du formulaire
export const selectCompteId = (state) => state.compte_id;
export const selectCompteOhada = (state) => state.compte_ohada;
export const selectCompteDenomination = (state) => state.compte_denomination;
export const selectMontant = (state) => state.montant;
export const selectMotif = (state) => state.motif;
export const selectTypeOperation = (state) => state.type_operation;
export const selectDate = (state) => state.date;

// Sélecteurs pour les listes
export const selectComptesDisponibles = (state) => state.comptesDisponibles;
export const selectComptesComptables = (state) => state.comptesComptables;
export const selectComptesTresorerie = (state) => state.comptesTresorerie;

// Sélecteurs pour l'état
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectIsLoadingComptes = (state) => state.isLoadingComptes;
export const selectError = (state) => state.error;
export const selectSuccess = (state) => state.success;

// Sélecteurs pour les actions
export const selectSetCompteId = (state) => state.setCompteId;
export const selectSetCompteOhada = (state) => state.setCompteOhada;
export const selectSetCompteDenomination = (state) => state.setCompteDenomination;
export const selectSetMontant = (state) => state.setMontant;
export const selectSetMotif = (state) => state.setMotif;
export const selectSetTypeOperation = (state) => state.setTypeOperation;
export const selectSetDate = (state) => state.setDate;

export const selectSetComptesDisponibles = (state) => state.setComptesDisponibles;
export const selectSetComptesComptables = (state) => state.setComptesComptables;
export const selectSetComptesTresorerie = (state) => state.setComptesTresorerie;

export const selectSetIsSubmitting = (state) => state.setIsSubmitting;
export const selectSetIsLoadingComptes = (state) => state.setIsLoadingComptes;
export const selectSetError = (state) => state.setError;
export const selectSetSuccess = (state) => state.setSuccess;

export const selectSelectCompte = (state) => state.selectCompte;
export const selectReset = (state) => state.reset;
export const selectResetAll = (state) => state.resetAll;

export default useCreateOperationStore;
