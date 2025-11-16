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
  type_operation: "entree", // "entree", "sortie" ou "transfert"
  date: Date.now(),

  // Pour les transferts (type_operation === "transfert")
  compte_destination_id: "",
  compte_destination_ohada: "",
  compte_destination_denomination: "",

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
  setTypeOperation: (value) => {
    console.log("🔵 [STORE] setTypeOperation appelé avec:", value);
    set({ type_operation: value });
    console.log("🔵 [STORE] type_operation après set:", get().type_operation);
  },
  setDate: (value) => set({ date: value }),

  setCompteDestinationId: (value) => set({ compte_destination_id: value }),
  setCompteDestinationOhada: (value) => set({ compte_destination_ohada: value }),
  setCompteDestinationDenomination: (value) => set({ compte_destination_denomination: value }),

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
    console.log("🟢 [STORE] selectCompte appelé avec:", compte);

    if (!compte) {
      console.log("🟠 [STORE] Compte null, réinitialisation mais SANS changer type_operation");
      set({
        compte_id: "",
        compte_ohada: "",
        compte_denomination: "",
        // NE PAS réinitialiser type_operation ici !
      });
      return;
    }

    const currentType = get().type_operation;
    console.log("🟢 [STORE] Type actuel:", currentType);

    // Pour les transferts, ne JAMAIS changer le type
    if (currentType === "transfert") {
      console.log("🔵 [STORE] Mode transfert, on garde le type transfert");
      set({
        compte_id: compte.id,
        compte_ohada: compte.code_ohada,
        compte_denomination: compte.denomination,
      });
    } else {
      // Pour entree/sortie, on peut adapter selon la catégorie du compte
      const newType = compte.categorie === "sortie" ? "sortie" : "entree";
      console.log("🟢 [STORE] Mode entree/sortie, nouveau type:", newType);
      set({
        compte_id: compte.id,
        compte_ohada: compte.code_ohada,
        compte_denomination: compte.denomination,
        type_operation: newType,
      });
    }
  },

  /**
   * Sélectionne le compte de destination pour un transfert
   */
  selectCompteDestination: (compte) => {
    if (!compte) {
      set({
        compte_destination_id: "",
        compte_destination_ohada: "",
        compte_destination_denomination: "",
      });
      return;
    }

    set({
      compte_destination_id: compte.id,
      compte_destination_ohada: compte.code_ohada,
      compte_destination_denomination: compte.denomination,
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
    compte_destination_id: "",
    compte_destination_ohada: "",
    compte_destination_denomination: "",
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
    compte_destination_id: "",
    compte_destination_ohada: "",
    compte_destination_denomination: "",
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

export const selectCompteDestinationId = (state) => state.compte_destination_id;
export const selectCompteDestinationOhada = (state) => state.compte_destination_ohada;
export const selectCompteDestinationDenomination = (state) => state.compte_destination_denomination;

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

export const selectSetCompteDestinationId = (state) => state.setCompteDestinationId;
export const selectSetCompteDestinationOhada = (state) => state.setCompteDestinationOhada;
export const selectSetCompteDestinationDenomination = (state) => state.setCompteDestinationDenomination;

export const selectSetComptesDisponibles = (state) => state.setComptesDisponibles;
export const selectSetComptesComptables = (state) => state.setComptesComptables;
export const selectSetComptesTresorerie = (state) => state.setComptesTresorerie;

export const selectSetIsSubmitting = (state) => state.setIsSubmitting;
export const selectSetIsLoadingComptes = (state) => state.setIsLoadingComptes;
export const selectSetError = (state) => state.setError;
export const selectSetSuccess = (state) => state.setSuccess;

export const selectSelectCompte = (state) => state.selectCompte;
export const selectSelectCompteDestination = (state) => state.selectCompteDestination;
export const selectReset = (state) => state.reset;
export const selectResetAll = (state) => state.resetAll;

export default useCreateOperationStore;
