/**
 * useGererOperationsStore.js
 * Store Zustand pour la gestion et le filtrage des opérations comptables
 */

import { create } from "zustand";

const useGererOperationsStore = create((set, get) => ({
  // ============================================================================
  // STATE - Données
  // ============================================================================

  operations: [], // Toutes les opérations chargées
  operationsFiltrees: [], // Opérations après filtrage
  comptesDisponibles: [], // Liste des comptes pour le filtre

  // ============================================================================
  // STATE - Filtres
  // ============================================================================

  // Filtre par compte OHADA
  filtreCompte: "", // ID du compte ou "" pour tous

  // Filtre par type d'opération
  filtreType: "tous", // "tous", "entree", "sortie"

  // Filtre par intervalle de montant
  montantMin: "",
  montantMax: "",

  // Filtre par période
  dateDebut: new Date().setHours(0, 0, 0, 0), // Aujourd'hui par défaut (début de journée)
  dateFin: new Date().setHours(23, 59, 59, 999), // Aujourd'hui par défaut (fin de journée)

  // Filtre par motif (recherche textuelle)
  filtreMotif: "",

  // ============================================================================
  // STATE - UI
  // ============================================================================

  isLoading: true,
  error: null,
  showFilters: true, // Afficher/masquer le panneau de filtres

  // ============================================================================
  // ACTIONS - Setters des filtres
  // ============================================================================

  setFiltreCompte: (value) => {
    set({ filtreCompte: value });
    get().appliquerFiltres();
  },

  setFiltreType: (value) => {
    set({ filtreType: value });
    get().appliquerFiltres();
  },

  setMontantMin: (value) => {
    set({ montantMin: value });
    get().appliquerFiltres();
  },

  setMontantMax: (value) => {
    set({ montantMax: value });
    get().appliquerFiltres();
  },

  setDateDebut: (value) => {
    set({ dateDebut: value });
    get().appliquerFiltres();
  },

  setDateFin: (value) => {
    set({ dateFin: value });
    get().appliquerFiltres();
  },

  setFiltreMotif: (value) => {
    set({ filtreMotif: value });
    get().appliquerFiltres();
  },

  setShowFilters: (value) => set({ showFilters: value }),

  // ============================================================================
  // ACTIONS - Gestion des données
  // ============================================================================

  setOperations: (operations) => {
    set({ operations });
    get().appliquerFiltres();
  },

  setComptesDisponibles: (comptes) => set({ comptesDisponibles: comptes }),

  setIsLoading: (value) => set({ isLoading: value }),

  setError: (value) => set({ error: value }),

  // ============================================================================
  // ACTIONS - Filtrage
  // ============================================================================

  /**
   * Applique tous les filtres actifs aux opérations
   */
  appliquerFiltres: () => {
    const {
      operations,
      filtreCompte,
      filtreType,
      montantMin,
      montantMax,
      dateDebut,
      dateFin,
      filtreMotif,
    } = get();

    let filtrees = [...operations];

    // Filtre par compte
    if (filtreCompte && filtreCompte !== "") {
      filtrees = filtrees.filter((op) => op.compte_id === filtreCompte);
    }

    // Filtre par type
    if (filtreType !== "tous") {
      filtrees = filtrees.filter((op) => op.type_operation === filtreType);
    }

    // Filtre par montant minimum
    if (montantMin && montantMin !== "") {
      const min = parseFloat(montantMin);
      filtrees = filtrees.filter((op) => op.montant >= min);
    }

    // Filtre par montant maximum
    if (montantMax && montantMax !== "") {
      const max = parseFloat(montantMax);
      filtrees = filtrees.filter((op) => op.montant <= max);
    }

    // Filtre par date de début
    if (dateDebut) {
      filtrees = filtrees.filter((op) => op.date >= dateDebut);
    }

    // Filtre par date de fin
    if (dateFin) {
      filtrees = filtrees.filter((op) => op.date <= dateFin);
    }

    // Filtre par motif (recherche textuelle insensible à la casse)
    if (filtreMotif && filtreMotif.trim() !== "") {
      const motifLower = filtreMotif.toLowerCase().trim();
      filtrees = filtrees.filter((op) =>
        op.motif.toLowerCase().includes(motifLower)
      );
    }

    // Trier par date décroissante (plus récent d'abord)
    filtrees.sort((a, b) => b.date - a.date);

    set({ operationsFiltrees: filtrees });
  },

  /**
   * Réinitialise tous les filtres aux valeurs par défaut
   */
  resetFiltres: () => {
    const aujourdhuiDebut = new Date().setHours(0, 0, 0, 0);
    const aujourdhuiFin = new Date().setHours(23, 59, 59, 999);

    set({
      filtreCompte: "",
      filtreType: "tous",
      montantMin: "",
      montantMax: "",
      dateDebut: aujourdhuiDebut,
      dateFin: aujourdhuiFin,
      filtreMotif: "",
    });

    get().appliquerFiltres();
  },

  /**
   * Définit une période prédéfinie
   */
  setPeriodePredefined: (periode) => {
    const now = new Date();
    let debut, fin;

    switch (periode) {
      case "aujourdhui":
        debut = new Date().setHours(0, 0, 0, 0);
        fin = new Date().setHours(23, 59, 59, 999);
        break;

      case "hier":
        const hier = new Date(now);
        hier.setDate(hier.getDate() - 1);
        debut = hier.setHours(0, 0, 0, 0);
        fin = hier.setHours(23, 59, 59, 999);
        break;

      case "7jours":
        debut = new Date(now);
        debut.setDate(debut.getDate() - 7);
        debut.setHours(0, 0, 0, 0);
        fin = new Date().setHours(23, 59, 59, 999);
        break;

      case "30jours":
        debut = new Date(now);
        debut.setDate(debut.getDate() - 30);
        debut.setHours(0, 0, 0, 0);
        fin = new Date().setHours(23, 59, 59, 999);
        break;

      case "moisActuel":
        debut = new Date(now.getFullYear(), now.getMonth(), 1);
        debut.setHours(0, 0, 0, 0);
        fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);
        break;

      default:
        debut = new Date().setHours(0, 0, 0, 0);
        fin = new Date().setHours(23, 59, 59, 999);
    }

    set({ dateDebut: debut, dateFin: fin });
    get().appliquerFiltres();
  },

  /**
   * Réinitialise tout le store
   */
  reset: () => {
    const aujourdhuiDebut = new Date().setHours(0, 0, 0, 0);
    const aujourdhuiFin = new Date().setHours(23, 59, 59, 999);

    set({
      operations: [],
      operationsFiltrees: [],
      comptesDisponibles: [],
      filtreCompte: "",
      filtreType: "tous",
      montantMin: "",
      montantMax: "",
      dateDebut: aujourdhuiDebut,
      dateFin: aujourdhuiFin,
      filtreMotif: "",
      isLoading: true,
      error: null,
      showFilters: true,
    });
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

// Sélecteurs pour les données
export const selectOperations = (state) => state.operations;
export const selectOperationsFiltrees = (state) => state.operationsFiltrees;
export const selectComptesDisponibles = (state) => state.comptesDisponibles;

// Sélecteurs pour les filtres
export const selectFiltreCompte = (state) => state.filtreCompte;
export const selectFiltreType = (state) => state.filtreType;
export const selectMontantMin = (state) => state.montantMin;
export const selectMontantMax = (state) => state.montantMax;
export const selectDateDebut = (state) => state.dateDebut;
export const selectDateFin = (state) => state.dateFin;
export const selectFiltreMotif = (state) => state.filtreMotif;

// Sélecteurs pour l'UI
export const selectIsLoading = (state) => state.isLoading;
export const selectError = (state) => state.error;
export const selectShowFilters = (state) => state.showFilters;

// Sélecteurs pour les actions
export const selectSetFiltreCompte = (state) => state.setFiltreCompte;
export const selectSetFiltreType = (state) => state.setFiltreType;
export const selectSetMontantMin = (state) => state.setMontantMin;
export const selectSetMontantMax = (state) => state.setMontantMax;
export const selectSetDateDebut = (state) => state.setDateDebut;
export const selectSetDateFin = (state) => state.setDateFin;
export const selectSetFiltreMotif = (state) => state.setFiltreMotif;
export const selectSetShowFilters = (state) => state.setShowFilters;

export const selectSetOperations = (state) => state.setOperations;
export const selectSetComptesDisponibles = (state) => state.setComptesDisponibles;
export const selectSetIsLoading = (state) => state.setIsLoading;
export const selectSetError = (state) => state.setError;

export const selectAppliquerFiltres = (state) => state.appliquerFiltres;
export const selectResetFiltres = (state) => state.resetFiltres;
export const selectSetPeriodePredefined = (state) => state.setPeriodePredefined;
export const selectReset = (state) => state.reset;

export default useGererOperationsStore;
