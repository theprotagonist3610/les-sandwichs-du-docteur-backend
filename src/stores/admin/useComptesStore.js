/**
 * useComptesStore.js
 * Store Zustand pour la gestion des comptes comptables
 */

import { create } from "zustand";

const useComptesStore = create((set, get) => ({
  // ============================================================================
  // STATE - Données
  // ============================================================================

  comptesComptables: [], // Liste des comptes comptables
  soldeTotal: 0, // Solde total de tous les comptes
  variationPourcentage: 0, // Variation en % vs hier/période précédente

  // Compte sélectionné pour affichage détaillé
  compteSelectionne: null,

  // Historique des opérations du compte sélectionné
  operationsCompte: [],

  // ============================================================================
  // STATE - UI
  // ============================================================================

  isLoading: true,
  error: null,
  showCreateModal: false, // Afficher la modale de création/modification
  compteEnEdition: null, // Compte en cours d'édition (null = création)

  // Vue actuelle : "liste" ou "detail"
  vue: "liste",

  // Filtres
  filtreCategorie: null, // "entree", "sortie", ou null (tous)
  filtreRecherche: "", // Recherche par nom/code

  // ============================================================================
  // ACTIONS - Setters
  // ============================================================================

  setComptesComptables: (comptes) => {
    set({ comptesComptables: comptes });
    get().calculerSoldeTotal();
  },

  setSoldeTotal: (solde) => set({ soldeTotal: solde }),
  setVariationPourcentage: (variation) => set({ variationPourcentage: variation }),
  setCompteSelectionne: (compte) => set({ compteSelectionne: compte }),
  setOperationsCompte: (operations) => set({ operationsCompte: operations }),
  setIsLoading: (value) => set({ isLoading: value }),
  setError: (value) => set({ error: value }),
  setShowCreateModal: (value) => set({ showCreateModal: value }),
  setCompteEnEdition: (compte) => set({ compteEnEdition: compte }),
  setVue: (vue) => set({ vue }),
  setFiltreCategorie: (categorie) => set({ filtreCategorie: categorie }),
  setFiltreRecherche: (recherche) => set({ filtreRecherche: recherche }),

  // ============================================================================
  // ACTIONS - Logique métier
  // ============================================================================

  /**
   * Calcule le solde total de tous les comptes
   */
  calculerSoldeTotal: () => {
    const { comptesComptables } = get();
    const total = comptesComptables.reduce((sum, compte) => {
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
    const { comptesComptables } = get();
    return comptesComptables.find((c) => c.code_ohada === codeOhada);
  },

  /**
   * Obtient un compte par son ID
   */
  getCompteById: (id) => {
    const { comptesComptables } = get();
    return comptesComptables.find((c) => c.id === id);
  },

  /**
   * Met à jour le solde d'un compte
   */
  updateSoldeCompte: (compteId, nouveauSolde) => {
    const { comptesComptables } = get();
    const updatedComptes = comptesComptables.map((compte) =>
      compte.id === compteId ? { ...compte, solde: nouveauSolde } : compte
    );
    set({ comptesComptables: updatedComptes });
    get().calculerSoldeTotal();
  },

  /**
   * Navigue vers la vue détaillée d'un compte
   */
  allerVersDetail: (compte) => {
    set({
      compteSelectionne: compte,
      vue: "detail",
      operationsCompte: [],
    });
  },

  /**
   * Retourne à la liste des comptes
   */
  retourVersListe: () => {
    set({
      compteSelectionne: null,
      vue: "liste",
      operationsCompte: [],
    });
  },

  /**
   * Applique les filtres sur les comptes
   */
  getComptesFiltered: () => {
    const { comptesComptables, filtreCategorie, filtreRecherche } = get();

    let filtered = comptesComptables;

    // Filtre par catégorie
    if (filtreCategorie) {
      filtered = filtered.filter((c) => c.categorie === filtreCategorie);
    }

    // Filtre par recherche (nom ou code OHADA)
    if (filtreRecherche) {
      const rechercheLower = filtreRecherche.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.denomination.toLowerCase().includes(rechercheLower) ||
          c.code_ohada.includes(rechercheLower)
      );
    }

    return filtered;
  },

  /**
   * Réinitialise les filtres
   */
  resetFiltres: () => {
    set({
      filtreCategorie: null,
      filtreRecherche: "",
    });
  },

  /**
   * Réinitialise le store
   */
  reset: () => {
    set({
      comptesComptables: [],
      soldeTotal: 0,
      variationPourcentage: 0,
      compteSelectionne: null,
      operationsCompte: [],
      isLoading: true,
      error: null,
      showCreateModal: false,
      compteEnEdition: null,
      vue: "liste",
      filtreCategorie: null,
      filtreRecherche: "",
    });
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

// Sélecteurs pour les données
export const selectComptesComptables = (state) => state.comptesComptables;
export const selectSoldeTotal = (state) => state.soldeTotal;
export const selectVariationPourcentage = (state) => state.variationPourcentage;
export const selectCompteSelectionne = (state) => state.compteSelectionne;
export const selectOperationsCompte = (state) => state.operationsCompte;

// Sélecteurs pour l'UI
export const selectIsLoading = (state) => state.isLoading;
export const selectError = (state) => state.error;
export const selectShowCreateModal = (state) => state.showCreateModal;
export const selectCompteEnEdition = (state) => state.compteEnEdition;
export const selectVue = (state) => state.vue;
export const selectFiltreCategorie = (state) => state.filtreCategorie;
export const selectFiltreRecherche = (state) => state.filtreRecherche;

// Sélecteurs pour les actions
export const selectSetComptesComptables = (state) => state.setComptesComptables;
export const selectSetSoldeTotal = (state) => state.setSoldeTotal;
export const selectSetVariationPourcentage = (state) => state.setVariationPourcentage;
export const selectSetCompteSelectionne = (state) => state.setCompteSelectionne;
export const selectSetOperationsCompte = (state) => state.setOperationsCompte;
export const selectSetIsLoading = (state) => state.setIsLoading;
export const selectSetError = (state) => state.setError;
export const selectSetShowCreateModal = (state) => state.setShowCreateModal;
export const selectSetCompteEnEdition = (state) => state.setCompteEnEdition;
export const selectSetVue = (state) => state.setVue;
export const selectSetFiltreCategorie = (state) => state.setFiltreCategorie;
export const selectSetFiltreRecherche = (state) => state.setFiltreRecherche;

export const selectCalculerSoldeTotal = (state) => state.calculerSoldeTotal;
export const selectOuvrirCreationCompte = (state) => state.ouvrirCreationCompte;
export const selectOuvrirEditionCompte = (state) => state.ouvrirEditionCompte;
export const selectFermerModal = (state) => state.fermerModal;
export const selectGetCompteByCodeOhada = (state) => state.getCompteByCodeOhada;
export const selectGetCompteById = (state) => state.getCompteById;
export const selectUpdateSoldeCompte = (state) => state.updateSoldeCompte;
export const selectAllerVersDetail = (state) => state.allerVersDetail;
export const selectRetourVersListe = (state) => state.retourVersListe;
export const selectGetComptesFiltered = (state) => state.getComptesFiltered;
export const selectResetFiltres = (state) => state.resetFiltres;
export const selectReset = (state) => state.reset;

export default useComptesStore;
