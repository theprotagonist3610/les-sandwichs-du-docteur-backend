import { create } from "zustand";

/**
 * Store Zustand pour la création d'adresse
 * Chaque champ est séparé pour éviter les re-renders inutiles
 */
const useCreateAdresseStore = create((set) => ({
  // Champs du formulaire
  nom: "",
  departement: "",
  commune: "",
  arrondissement: "",
  quartier: "",
  longitude: 0,
  latitude: 0,
  statut: true,

  // État du formulaire
  isSubmitting: false,
  error: null,
  duplicates: [],

  // États d'ouverture des autocompletes
  isDepartementOpen: false,
  isCommuneOpen: false,
  isArrondissementOpen: false,
  isQuartierOpen: false,

  // Actions pour chaque champ
  setNom: (nom) => set({ nom }),
  setDepartement: (departement) => set({ departement }),
  setCommune: (commune) => set({ commune }),
  setArrondissement: (arrondissement) => set({ arrondissement }),
  setQuartier: (quartier) => set({ quartier }),
  setLongitude: (longitude) => set({ longitude: parseFloat(longitude) || 0 }),
  setLatitude: (latitude) => set({ latitude: parseFloat(latitude) || 0 }),
  setStatut: (statut) => set({ statut }),

  // Actions globales
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  setDuplicates: (duplicates) => set({ duplicates }),

  // Actions pour contrôler l'ouverture des autocompletes
  setIsDepartementOpen: (isOpen) => set({ isDepartementOpen: isOpen }),
  setIsCommuneOpen: (isOpen) => set({ isCommuneOpen: isOpen }),
  setIsArrondissementOpen: (isOpen) => set({ isArrondissementOpen: isOpen }),
  setIsQuartierOpen: (isOpen) => set({ isQuartierOpen: isOpen }),

  // Réinitialiser le formulaire
  reset: () =>
    set({
      nom: "",
      departement: "",
      commune: "",
      arrondissement: "",
      quartier: "",
      longitude: 0,
      latitude: 0,
      statut: true,
      isSubmitting: false,
      error: null,
      duplicates: [],
      isDepartementOpen: false,
      isCommuneOpen: false,
      isArrondissementOpen: false,
      isQuartierOpen: false,
    }),

  // Remplir le formulaire avec des données
  setFormData: (data) =>
    set({
      nom: data.nom || "",
      departement: data.departement || "",
      commune: data.commune || "",
      arrondissement: data.arrondissement || "",
      quartier: data.quartier || "",
      longitude: data.longitude || 0,
      latitude: data.latitude || 0,
      statut: data.statut !== undefined ? data.statut : true,
    }),

  // Obtenir la position actuelle via l'API Geolocation
  getCurrentPosition: () => {
    if (!navigator.geolocation) {
      set({ error: "La géolocalisation n'est pas supportée par votre navigateur" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          error: null,
        });
      },
      (error) => {
        let errorMessage = "Erreur de géolocalisation";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission de géolocalisation refusée";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position non disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Délai de géolocalisation expiré";
            break;
          default:
            errorMessage = "Erreur inconnue de géolocalisation";
        }
        set({ error: errorMessage });
      }
    );
  },
}));

export default useCreateAdresseStore;

// Sélecteurs pour éviter les re-renders
export const useNom = () => useCreateAdresseStore((state) => state.nom);
export const useDepartement = () => useCreateAdresseStore((state) => state.departement);
export const useCommune = () => useCreateAdresseStore((state) => state.commune);
export const useArrondissement = () => useCreateAdresseStore((state) => state.arrondissement);
export const useQuartier = () => useCreateAdresseStore((state) => state.quartier);
export const useLongitude = () => useCreateAdresseStore((state) => state.longitude);
export const useLatitude = () => useCreateAdresseStore((state) => state.latitude);
export const useStatut = () => useCreateAdresseStore((state) => state.statut);

export const useIsSubmitting = () => useCreateAdresseStore((state) => state.isSubmitting);
export const useError = () => useCreateAdresseStore((state) => state.error);
export const useDuplicates = () => useCreateAdresseStore((state) => state.duplicates);

export const useSetNom = () => useCreateAdresseStore((state) => state.setNom);
export const useSetDepartement = () => useCreateAdresseStore((state) => state.setDepartement);
export const useSetCommune = () => useCreateAdresseStore((state) => state.setCommune);
export const useSetArrondissement = () => useCreateAdresseStore((state) => state.setArrondissement);
export const useSetQuartier = () => useCreateAdresseStore((state) => state.setQuartier);
export const useSetLongitude = () => useCreateAdresseStore((state) => state.setLongitude);
export const useSetLatitude = () => useCreateAdresseStore((state) => state.setLatitude);
export const useSetStatut = () => useCreateAdresseStore((state) => state.setStatut);

export const useReset = () => useCreateAdresseStore((state) => state.reset);
export const useGetCurrentPosition = () => useCreateAdresseStore((state) => state.getCurrentPosition);
