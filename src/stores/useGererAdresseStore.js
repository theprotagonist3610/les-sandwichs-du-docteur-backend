// stores/useGererAdresseStore.js
import { create } from "zustand";

export const useGererAdresseStore = create((set) => ({
  // Informations de l'adresse
  adresseInfo: {
    departement: "",
    commune: "",
    arrondissement: "",
    quartier: "",
  },

  // Mode édition
  editMode: false,
  editingLocalisation: null,

  // Formulaire localisation
  localisationForm: {
    denomination: "",
    latitude: "",
    longitude: "",
  },

  // Dialog states
  showAddLocDialog: false,
  showEditLocDialog: false,
  showDeleteConfirm: false,
  locToDelete: null,

  // Loading states
  loading: false,
  geoLoading: false,

  // Actions pour l'adresse info
  setAdresseInfo: (info) => set({ adresseInfo: info }),
  updateAdresseField: (field, value) =>
    set((state) => ({
      adresseInfo: { ...state.adresseInfo, [field]: value },
    })),

  // Actions pour le mode édition
  setEditMode: (mode) => set({ editMode: mode }),
  setEditingLocalisation: (loc) => set({ editingLocalisation: loc }),

  // Actions pour le formulaire localisation
  setLocalisationForm: (form) => set({ localisationForm: form }),
  updateLocalisationField: (field, value) =>
    set((state) => ({
      localisationForm: { ...state.localisationForm, [field]: value },
    })),
  setGeoCoordinates: (latitude, longitude) =>
    set((state) => ({
      localisationForm: {
        ...state.localisationForm,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
    })),
  resetLocalisationForm: () =>
    set({
      localisationForm: {
        denomination: "",
        latitude: "",
        longitude: "",
      },
    }),

  // Actions pour les dialogs
  openAddLocDialog: () => set({ showAddLocDialog: true }),
  closeAddLocDialog: () =>
    set({
      showAddLocDialog: false,
      localisationForm: { denomination: "", latitude: "", longitude: "" },
    }),
  openEditLocDialog: (loc) =>
    set({
      showEditLocDialog: true,
      editingLocalisation: loc,
      localisationForm: {
        denomination: loc.denomination,
        latitude: loc.latitude?.toString() || "",
        longitude: loc.longitude?.toString() || "",
      },
    }),
  closeEditLocDialog: () =>
    set({
      showEditLocDialog: false,
      editingLocalisation: null,
      localisationForm: { denomination: "", latitude: "", longitude: "" },
    }),
  openDeleteConfirm: (loc) =>
    set({ showDeleteConfirm: true, locToDelete: loc }),
  closeDeleteConfirm: () =>
    set({ showDeleteConfirm: false, locToDelete: null }),

  // Actions pour loading
  setLoading: (loading) => set({ loading }),
  setGeoLoading: (geoLoading) => set({ geoLoading }),

  // Reset global
  resetStore: () =>
    set({
      adresseInfo: {
        departement: "",
        commune: "",
        arrondissement: "",
        quartier: "",
      },
      editMode: false,
      editingLocalisation: null,
      localisationForm: {
        denomination: "",
        latitude: "",
        longitude: "",
      },
      showAddLocDialog: false,
      showEditLocDialog: false,
      showDeleteConfirm: false,
      locToDelete: null,
      loading: false,
      geoLoading: false,
    }),
}));
