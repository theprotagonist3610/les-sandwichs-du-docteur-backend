/**
 * useStockFilterStore.js
 * Store Zustand pour les filtres de gestion du stock
 * Utilise des sélecteurs optimisés pour éviter les re-renders inutiles
 */

import { create } from "zustand";

const useStockFilterStore = create((set) => ({
  // État des filtres
  searchQuery: "",
  typeFilter: "all",
  statusFilter: "all",

  // Actions
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  // Réinitialiser tous les filtres
  resetFilters: () =>
    set({
      searchQuery: "",
      typeFilter: "all",
      statusFilter: "all",
    }),
}));

// Sélecteurs optimisés
export const selectSearchQuery = (state) => state.searchQuery;
export const selectTypeFilter = (state) => state.typeFilter;
export const selectStatusFilter = (state) => state.statusFilter;
export const selectSetSearchQuery = (state) => state.setSearchQuery;
export const selectSetTypeFilter = (state) => state.setTypeFilter;
export const selectSetStatusFilter = (state) => state.setStatusFilter;
export const selectResetFilters = (state) => state.resetFilters;

export default useStockFilterStore;
