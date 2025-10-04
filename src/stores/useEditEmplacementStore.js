// stores/useEditEmplacementStore.js
import { create } from "zustand";

const useEditEmplacementStore = create((set, get) => ({
  // État
  emplacement: null,
  loading: false,
  activeDialog: null,
  editData: {},
  showStock: false,
  geoLoading: false,
  loadingAction: false,

  // Actions - Gestion de l'emplacement
  setEmplacement: (emplacement) => set({ emplacement }),
  setLoading: (loading) => set({ loading }),

  // Actions - Gestion des dialogs
  openDialog: (dialogType, initialData = {}) =>
    set({ activeDialog: dialogType, editData: initialData }),

  closeDialog: () => set({ activeDialog: null, editData: {} }),

  // Actions - Gestion des données d'édition
  updateEditData: (field, value) =>
    set((state) => ({
      editData: { ...state.editData, [field]: value },
    })),

  setEditData: (data) => set({ editData: data }),

  updateCoordinates: (latitude, longitude) =>
    set((state) => ({
      editData: {
        ...state.editData,
        coordonnees: { latitude, longitude },
      },
    })),

  // Actions - Gestion du stock
  toggleStock: () => set((state) => ({ showStock: !state.showStock })),

  // Actions - Géolocalisation
  setGeoLoading: (geoLoading) => set({ geoLoading }),

  // Actions - Loading des actions
  setLoadingAction: (loadingAction) => set({ loadingAction }),

  // Cleanup
  cleanup: () =>
    set({
      emplacement: null,
      loading: false,
      activeDialog: null,
      editData: {},
      showStock: false,
      geoLoading: false,
      loadingAction: false,
    }),
}));

export default useEditEmplacementStore;
