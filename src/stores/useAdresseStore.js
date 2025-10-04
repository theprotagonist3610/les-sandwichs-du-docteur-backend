// stores/useAdresseStore.js
import { create } from "zustand";

export const useAdresseStore = create((set) => ({
  // État pour la recherche et sélection
  searchTerm: "",
  selectedAdresse: null,

  // État pour la localisation
  localisationForm: {
    denomination: "",
    longitude: "",
    latitude: "",
  },

  // État pour nouvelle adresse
  nouvelleAdresse: {
    departement: "",
    commune: "",
    arrondissement: "",
    quartier: "",
  },

  // États de loading
  loading: false,
  geoLoading: false,

  // Actions pour la recherche
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedAdresse: (adresse) => set({ selectedAdresse: adresse }),
  clearSearch: () => set({ searchTerm: "", selectedAdresse: null }),

  // Actions pour la localisation
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
        longitude: "",
        latitude: "",
      },
    }),

  // Actions pour nouvelle adresse
  setNouvelleAdresse: (adresse) => set({ nouvelleAdresse: adresse }),
  updateNouvelleAdresseField: (field, value) =>
    set((state) => ({
      nouvelleAdresse: { ...state.nouvelleAdresse, [field]: value },
    })),
  resetNouvelleAdresse: () =>
    set({
      nouvelleAdresse: {
        departement: "",
        commune: "",
        arrondissement: "",
        quartier: "",
      },
    }),

  // Actions pour loading
  setLoading: (loading) => set({ loading }),
  setGeoLoading: (geoLoading) => set({ geoLoading }),

  // Reset global
  resetStore: () =>
    set({
      searchTerm: "",
      selectedAdresse: null,
      localisationForm: {
        denomination: "",
        longitude: "",
        latitude: "",
      },
      nouvelleAdresse: {
        departement: "",
        commune: "",
        arrondissement: "",
        quartier: "",
      },
      loading: false,
      geoLoading: false,
    }),
}));
