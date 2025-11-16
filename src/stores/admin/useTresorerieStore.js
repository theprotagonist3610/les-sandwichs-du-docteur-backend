/**
 * useTresorerieStore.js
 * Store Zustand pour la gestion de la trésorerie
 */

import { create } from "zustand";

const useTresorerieStore = create((set, get) => ({
  // ============================================================================
  // STATE - Données
  // ============================================================================

  comptesTresorerie: [], // Liste des comptes de trésorerie
  soldeTotal: 0, // Solde total de tous les comptes
  variationPourcentage: 0, // Variation en % vs hier/période précédente

  // Compte sélectionné pour affichage détaillé
  compteSelectionne: null,

  // ============================================================================
  // STATE - UI
  // ============================================================================

  isLoading: true,
  error: null,
  showCreateModal: false, // Afficher la modale de création/modification
  compteEnEdition: null, // Compte en cours d'édition (null = création)

  // ============================================================================
  // ACTIONS - Setters
  // ============================================================================

  setComptesTresorerie: (comptes) => {
    set({ comptesTresorerie: comptes });
    get().calculerSoldeTotal();
  },

  setSoldeTotal: (solde) => set({ soldeTotal: solde }),
  setVariationPourcentage: (variation) => set({ variationPourcentage: variation }),
  setCompteSelectionne: (compte) => set({ compteSelectionne: compte }),
  setIsLoading: (value) => set({ isLoading: value }),
  setError: (value) => set({ error: value }),
  setShowCreateModal: (value) => set({ showCreateModal: value }),
  setCompteEnEdition: (compte) => set({ compteEnEdition: compte }),

  // ============================================================================
  // ACTIONS - Logique métier
  // ============================================================================

  /**
   * Calcule le solde total de tous les comptes
   */
  calculerSoldeTotal: () => {
    const { comptesTresorerie } = get();
    const total = comptesTresorerie.reduce((sum, compte) => {
      return sum + (compte.solde || 0);
    }, 0);
    set({ soldeTotal: total });
  },

  /**
   * Ouvre la modale de création d'un nouveau compte
   */
  ouvrirCreationCompte: () => {
    set({
      showCreateModal: true,
      compteEnEdition: null,
    });
  },

  /**
   * Ouvre la modale de modification d'un compte existant
   */
  ouvrirEditionCompte: (compte) => {
    set({
      showCreateModal: true,
      compteEnEdition: compte,
    });
  },

  /**
   * Ferme la modale de création/modification
   */
  fermerModal: () => {
    set({
      showCreateModal: false,
      compteEnEdition: null,
    });
  },

  /**
   * Obtient un compte par son code OHADA
   */
  getCompteByCodeOhada: (codeOhada) => {
    const { comptesTresorerie } = get();
    return comptesTresorerie.find((c) => c.code_ohada === codeOhada);
  },

  /**
   * Obtient un compte par son ID
   */
  getCompteById: (id) => {
    const { comptesTresorerie } = get();
    return comptesTresorerie.find((c) => c.id === id);
  },

  /**
   * Met à jour le solde d'un compte
   */
  updateSoldeCompte: (compteId, nouveauSolde) => {
    const { comptesTresorerie } = get();
    const updatedComptes = comptesTresorerie.map((compte) =>
      compte.id === compteId ? { ...compte, solde: nouveauSolde } : compte
    );
    set({ comptesTresorerie: updatedComptes });
    get().calculerSoldeTotal();
  },

  /**
   * Réinitialise le store
   */
  reset: () => {
    set({
      comptesTresorerie: [],
      soldeTotal: 0,
      variationPourcentage: 0,
      compteSelectionne: null,
      isLoading: true,
      error: null,
      showCreateModal: false,
      compteEnEdition: null,
    });
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

// Sélecteurs pour les données
export const selectComptesTresorerie = (state) => state.comptesTresorerie;
export const selectSoldeTotal = (state) => state.soldeTotal;
export const selectVariationPourcentage = (state) => state.variationPourcentage;
export const selectCompteSelectionne = (state) => state.compteSelectionne;

// Sélecteurs pour l'UI
export const selectIsLoading = (state) => state.isLoading;
export const selectError = (state) => state.error;
export const selectShowCreateModal = (state) => state.showCreateModal;
export const selectCompteEnEdition = (state) => state.compteEnEdition;

// Sélecteurs pour les actions
export const selectSetComptesTresorerie = (state) => state.setComptesTresorerie;
export const selectSetSoldeTotal = (state) => state.setSoldeTotal;
export const selectSetVariationPourcentage = (state) => state.setVariationPourcentage;
export const selectSetCompteSelectionne = (state) => state.setCompteSelectionne;
export const selectSetIsLoading = (state) => state.setIsLoading;
export const selectSetError = (state) => state.setError;
export const selectSetShowCreateModal = (state) => state.setShowCreateModal;
export const selectSetCompteEnEdition = (state) => state.setCompteEnEdition;

export const selectCalculerSoldeTotal = (state) => state.calculerSoldeTotal;
export const selectOuvrirCreationCompte = (state) => state.ouvrirCreationCompte;
export const selectOuvrirEditionCompte = (state) => state.ouvrirEditionCompte;
export const selectFermerModal = (state) => state.fermerModal;
export const selectGetCompteByCodeOhada = (state) => state.getCompteByCodeOhada;
export const selectGetCompteById = (state) => state.getCompteById;
export const selectUpdateSoldeCompte = (state) => state.updateSoldeCompte;
export const selectReset = (state) => state.reset;

export default useTresorerieStore;
