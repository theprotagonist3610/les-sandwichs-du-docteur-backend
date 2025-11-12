/**
 * operationStockStore.js
 * Store Zustand pour la gestion optimisée du wizard d'opérations de stock
 * Évite les rerenders inutiles grâce aux selectors granulaires
 */

import { create } from "zustand";
import { TRANSACTION_TYPES } from "@/toolkits/admin/stockToolkit";

const initialState = {
  // Navigation
  currentStep: 1,
  maxStepReached: 1,
  initialStep: 1, // Étape initiale selon le contexte (query params)
  skippedSteps: [], // Étapes à ignorer dans le stepper

  // Données de l'opération
  operationType: null, // 'entree', 'sortie', 'transfert'
  selectedElement: null,
  sourceEmplacement: null,
  destEmplacement: null,
  quantite: "",
  prixUnitaire: "",
  motif: "",

  // État UI
  errors: {},
  isValidating: false,
  isSubmitting: false,
  submitSuccess: false,
  submitError: null,

  // Données contextuelles
  availableStock: 0, // Stock disponible à l'emplacement source
  prefilledEmplacementId: null, // Emplacement pré-rempli depuis URL
};

export const useOperationStockStore = create((set, get) => ({
  ...initialState,

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  setStep: (step) => {
    const { maxStepReached } = get();
    set({
      currentStep: step,
      maxStepReached: Math.max(maxStepReached, step),
    });
  },

  nextStep: () => {
    const { currentStep, maxStepReached } = get();
    const newStep = Math.min(currentStep + 1, 4);
    set({
      currentStep: newStep,
      maxStepReached: Math.max(maxStepReached, newStep),
    });
  },

  prevStep: () => {
    const { currentStep } = get();
    set({ currentStep: Math.max(currentStep - 1, 1) });
  },

  // ============================================================================
  // SETTERS OPTIMISÉS (ne déclenchent un rerender que pour le champ modifié)
  // ============================================================================

  setOperationType: (type) => set({ operationType: type }),

  setSelectedElement: (element) =>
    set({
      selectedElement: element,
      // Reset les emplacements si on change d'élément
      sourceEmplacement: null,
      destEmplacement: null,
      availableStock: 0,
    }),

  setSourceEmplacement: (emplacement, stockDisponible = 0) =>
    set({
      sourceEmplacement: emplacement,
      availableStock: stockDisponible,
    }),

  setDestEmplacement: (emplacement) => set({ destEmplacement: emplacement }),

  setQuantite: (value) => {
    const quantite = value === "" ? "" : parseFloat(value) || 0;
    set({ quantite });
  },

  setPrixUnitaire: (value) => {
    const prixUnitaire = value === "" ? "" : parseFloat(value) || 0;
    set({ prixUnitaire });
  },

  setMotif: (motif) => set({ motif }),

  // ============================================================================
  // VALIDATION
  // ============================================================================

  validateStep: (step) => {
    const state = get();
    const errors = {};

    switch (step) {
      case 1:
        if (!state.operationType) {
          errors.operationType = "Veuillez sélectionner un type d'opération";
        }
        break;

      case 2:
        if (!state.selectedElement) {
          errors.selectedElement = "Veuillez sélectionner un élément";
        }
        break;

      case 3:
        // Validation selon le type d'opération
        if (state.operationType === TRANSACTION_TYPES.ENTREE) {
          if (!state.destEmplacement) {
            errors.destEmplacement =
              "Veuillez sélectionner un emplacement de destination";
          }
        } else if (state.operationType === TRANSACTION_TYPES.SORTIE) {
          if (!state.sourceEmplacement) {
            errors.sourceEmplacement =
              "Veuillez sélectionner un emplacement source";
          }
        } else if (state.operationType === TRANSACTION_TYPES.TRANSFERT) {
          if (!state.sourceEmplacement) {
            errors.sourceEmplacement =
              "Veuillez sélectionner un emplacement source";
          }
          if (!state.destEmplacement) {
            errors.destEmplacement =
              "Veuillez sélectionner un emplacement de destination";
          }
          if (
            state.sourceEmplacement &&
            state.destEmplacement &&
            state.sourceEmplacement.id === state.destEmplacement.id
          ) {
            errors.destEmplacement =
              "L'emplacement de destination doit être différent de la source";
          }
        }

        // Validation quantité
        if (!state.quantite || state.quantite <= 0) {
          errors.quantite = "La quantité doit être supérieure à 0";
        }

        // Validation stock disponible pour sortie/transfert
        if (
          (state.operationType === TRANSACTION_TYPES.SORTIE ||
            state.operationType === TRANSACTION_TYPES.TRANSFERT) &&
          state.quantite > state.availableStock
        ) {
          errors.quantite = `Stock insuffisant (${state.availableStock} disponible)`;
        }

        // Validation prix unitaire pour entrée
        if (
          state.operationType === TRANSACTION_TYPES.ENTREE &&
          (!state.prixUnitaire || state.prixUnitaire < 0)
        ) {
          errors.prixUnitaire = "Le prix unitaire doit être positif";
        }

        break;

      case 4:
        // Pas de validation supplémentaire, juste la confirmation
        break;

      default:
        break;
    }

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  // ============================================================================
  // ÉTAT UI
  // ============================================================================

  setError: (field, message) =>
    set((state) => ({
      errors: { ...state.errors, [field]: message },
    })),

  clearError: (field) =>
    set((state) => {
      const newErrors = { ...state.errors };
      delete newErrors[field];
      return { errors: newErrors };
    }),

  clearAllErrors: () => set({ errors: {} }),

  setValidating: (isValidating) => set({ isValidating }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  setSubmitSuccess: (success) => set({ submitSuccess: success }),

  setSubmitError: (error) => set({ submitError: error }),

  // ============================================================================
  // RESET
  // ============================================================================

  reset: () => set(initialState),

  resetForNewOperation: () =>
    set({
      ...initialState,
      // Garder le type d'opération pour faciliter les opérations répétitives
      operationType: get().operationType,
    }),

  /**
   * Initialise le wizard depuis le contexte (query params)
   * @param {Object} context - { type?, elementId?, element?, emplacementId? }
   */
  initializeFromContext: (context) => {
    const { type, element, emplacementId } = context;

    const skippedSteps = [];
    let initialStep = 1;

    // Déterminer les étapes à sauter et l'étape initiale
    if (type && element) {
      // Scénario A: Type + Element connus → Commencer à l'étape 3 (Configuration)
      skippedSteps.push(1, 2);
      initialStep = 3;
    } else if (type && emplacementId) {
      // Scénario B: Type + Emplacement connus → Commencer à l'étape 2 (Sélection article)
      skippedSteps.push(1);
      initialStep = 2;
    } else if (type) {
      // Scénario C: Seulement le type → Commencer à l'étape 2 (Sélection article)
      skippedSteps.push(1);
      initialStep = 2;
    }
    // Sinon: wizard complet (initialStep = 1)

    set({
      operationType: type || null,
      selectedElement: element || null,
      prefilledEmplacementId: emplacementId || null,
      currentStep: initialStep,
      initialStep,
      skippedSteps,
      maxStepReached: initialStep,
    });
  },

  // ============================================================================
  // SELECTORS OPTIMISÉS (pour éviter les rerenders)
  // ============================================================================

  // Ces selectors peuvent être utilisés avec useOperationStockStore(selector)
  // pour ne rerender que quand la valeur spécifique change
}));

// Selectors externes pour optimisation maximale
export const selectCurrentStep = (state) => state.currentStep;
export const selectInitialStep = (state) => state.initialStep;
export const selectSkippedSteps = (state) => state.skippedSteps;
export const selectOperationType = (state) => state.operationType;
export const selectSelectedElement = (state) => state.selectedElement;
export const selectSourceEmplacement = (state) => state.sourceEmplacement;
export const selectDestEmplacement = (state) => state.destEmplacement;
export const selectQuantite = (state) => state.quantite;
export const selectPrixUnitaire = (state) => state.prixUnitaire;
export const selectMotif = (state) => state.motif;
export const selectErrors = (state) => state.errors;
export const selectIsValidating = (state) => state.isValidating;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectAvailableStock = (state) => state.availableStock;
export const selectPrefilledEmplacementId = (state) => state.prefilledEmplacementId;

// Selector composé pour le récapitulatif
export const selectSummary = (state) => ({
  operationType: state.operationType,
  element: state.selectedElement,
  source: state.sourceEmplacement,
  destination: state.destEmplacement,
  quantite: state.quantite,
  prixUnitaire: state.prixUnitaire,
  motif: state.motif,
});

// Selector pour l'état de validation global
export const selectCanProceed = (state) => {
  const step = state.currentStep;
  const errors = state.errors;

  if (Object.keys(errors).length > 0) return false;

  switch (step) {
    case 1:
      return !!state.operationType;
    case 2:
      return !!state.selectedElement;
    case 3:
      if (state.operationType === TRANSACTION_TYPES.ENTREE) {
        return (
          !!state.destEmplacement &&
          state.quantite > 0 &&
          state.prixUnitaire >= 0
        );
      } else if (state.operationType === TRANSACTION_TYPES.SORTIE) {
        return (
          !!state.sourceEmplacement &&
          state.quantite > 0 &&
          state.quantite <= state.availableStock
        );
      } else if (state.operationType === TRANSACTION_TYPES.TRANSFERT) {
        return (
          !!state.sourceEmplacement &&
          !!state.destEmplacement &&
          state.sourceEmplacement.id !== state.destEmplacement.id &&
          state.quantite > 0 &&
          state.quantite <= state.availableStock
        );
      }
      return false;
    case 4:
      return true;
    default:
      return false;
  }
};
