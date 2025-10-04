import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useComptaStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // 📅 PÉRIODE SÉLECTIONNÉE
      // ============================================
      selectedDate: null, // Format: DD-MM-YYYY
      selectedWeek: null, // Format: S01, S02...
      selectedMonth: null, // Format: MM-YYYY
      selectedYear: null, // Format: YYYY

      // ============================================
      // 🔍 FILTRES TRANSACTIONS
      // ============================================
      filters: {
        dateRange: { start: null, end: null },
        type: "all", // 'all' | 'entree' | 'sortie'
        paymentMode: "all", // 'all' | 'caisse' | 'mobile_money' | 'banque'
        account: "all", // 'all' | code_lsd
        amountRange: { min: null, max: null },
      },

      // ============================================
      // 💾 CACHE DONNÉES
      // ============================================
      cachedData: {
        dashboard: null,
        dayViews: {}, // { 'DD-MM-YYYY': data }
        weekViews: {}, // { 'S01': data }
        monthViews: {}, // { 'MM-YYYY': data }
        yearViews: {}, // { 'YYYY': data }
      },

      // ============================================
      // 🎨 UI STATE
      // ============================================
      activeView: "graphic", // 'graphic' | 'table'
      isOffline: false,
      lastSync: null, // ISO timestamp
      isSyncing: false,

      // ============================================
      // 🔧 ACTIONS - PÉRIODE
      // ============================================
      setSelectedDate: (date) => set({ selectedDate: date }),

      setSelectedWeek: (week) => set({ selectedWeek: week }),

      setSelectedMonth: (month) => set({ selectedMonth: month }),

      setSelectedYear: (year) => set({ selectedYear: year }),

      // Reset toutes les périodes
      resetPeriods: () =>
        set({
          selectedDate: null,
          selectedWeek: null,
          selectedMonth: null,
          selectedYear: null,
        }),

      // ============================================
      // 🔍 ACTIONS - FILTRES
      // ============================================
      setFilter: (filterKey, value) =>
        set((state) => ({
          filters: { ...state.filters, [filterKey]: value },
        })),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () =>
        set({
          filters: {
            dateRange: { start: null, end: null },
            type: "all",
            paymentMode: "all",
            account: "all",
            amountRange: { min: null, max: null },
          },
        }),

      // ============================================
      // 💾 ACTIONS - CACHE
      // ============================================
      setCachedData: (view, key, data) =>
        set((state) => {
          if (view === "dashboard") {
            return {
              cachedData: {
                ...state.cachedData,
                dashboard: data,
              },
            };
          }

          return {
            cachedData: {
              ...state.cachedData,
              [view]: {
                ...state.cachedData[view],
                [key]: data,
              },
            },
          };
        }),

      getCachedData: (view, key) => {
        const state = get();
        if (view === "dashboard") {
          return state.cachedData.dashboard;
        }
        return state.cachedData[view]?.[key] || null;
      },

      clearCache: () =>
        set({
          cachedData: {
            dashboard: null,
            dayViews: {},
            weekViews: {},
            monthViews: {},
            yearViews: {},
          },
        }),

      clearCacheByView: (view, key) =>
        set((state) => {
          if (view === "dashboard") {
            return {
              cachedData: {
                ...state.cachedData,
                dashboard: null,
              },
            };
          }

          const updatedViewCache = { ...state.cachedData[view] };
          delete updatedViewCache[key];

          return {
            cachedData: {
              ...state.cachedData,
              [view]: updatedViewCache,
            },
          };
        }),

      // ============================================
      // 🎨 ACTIONS - UI
      // ============================================
      setActiveView: (view) => set({ activeView: view }),

      setIsOffline: (status) => set({ isOffline: status }),

      setLastSync: (timestamp) => set({ lastSync: timestamp }),

      setIsSyncing: (status) => set({ isSyncing: status }),

      // ============================================
      // 🔄 ACTIONS - SYNC
      // ============================================
      updateSyncStatus: async () => {
        try {
          const isOnline = navigator.onLine;
          set({ isOffline: !isOnline });

          if (isOnline) {
            set({ isSyncing: true });
            // La synchronisation réelle est gérée par SyncService
            // On met juste à jour le timestamp
            set({
              lastSync: new Date().toISOString(),
              isSyncing: false,
            });
          }
        } catch (error) {
          console.error(
            "Erreur lors de la mise à jour du statut de sync:",
            error
          );
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "lsd-compta-storage",
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        selectedWeek: state.selectedWeek,
        selectedMonth: state.selectedMonth,
        selectedYear: state.selectedYear,
        filters: state.filters,
        activeView: state.activeView,
        lastSync: state.lastSync,
      }),
    }
  )
);
