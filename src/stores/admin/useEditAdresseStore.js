import { create } from "zustand";

/**
 * Store Zustand pour l'édition d'une adresse
 * Chaque champ a son propre sélecteur pour éviter les re-rendus inutiles
 */
const useEditAdresseStore = create((set) => ({
  // ID de l'adresse en cours d'édition
  adresseId: "",
  setAdresseId: (adresseId) => set({ adresseId }),

  // Nom optionnel de l'adresse
  nom: "",
  setNom: (nom) => set({ nom }),

  // Département
  departement: "",
  setDepartement: (departement) => set({ departement }),

  // Commune
  commune: "",
  setCommune: (commune) => set({ commune }),

  // Arrondissement
  arrondissement: "",
  setArrondissement: (arrondissement) => set({ arrondissement }),

  // Quartier
  quartier: "",
  setQuartier: (quartier) => set({ quartier }),

  // Localisation
  latitude: "",
  setLatitude: (latitude) => set({ latitude }),

  longitude: "",
  setLongitude: (longitude) => set({ longitude }),

  // Statut
  statut: true,
  setStatut: (statut) => set({ statut }),

  // État de chargement
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // État de géolocalisation
  isLocating: false,
  setIsLocating: (isLocating) => set({ isLocating }),

  // Fonction pour charger une adresse
  loadAdresse: (adresse) =>
    set({
      adresseId: adresse.id || "",
      nom: adresse.nom || "",
      departement: adresse.departement || "",
      commune: adresse.commune || "",
      arrondissement: adresse.arrondissement || "",
      quartier: adresse.quartier || "",
      latitude: adresse.localisation?.latitude?.toString() || "",
      longitude: adresse.localisation?.longitude?.toString() || "",
      statut: adresse.statut !== undefined ? adresse.statut : true,
    }),

  // Fonction pour réinitialiser le formulaire
  reset: () =>
    set({
      adresseId: "",
      nom: "",
      departement: "",
      commune: "",
      arrondissement: "",
      quartier: "",
      latitude: "",
      longitude: "",
      statut: true,
      isLoading: false,
      isLocating: false,
    }),
}));

// Sélecteurs granulaires pour éviter les re-rendus inutiles
export const useAdresseId = () => useEditAdresseStore((state) => state.adresseId);
export const useSetAdresseId = () => useEditAdresseStore((state) => state.setAdresseId);

export const useNom = () => useEditAdresseStore((state) => state.nom);
export const useSetNom = () => useEditAdresseStore((state) => state.setNom);

export const useDepartement = () => useEditAdresseStore((state) => state.departement);
export const useSetDepartement = () => useEditAdresseStore((state) => state.setDepartement);

export const useCommune = () => useEditAdresseStore((state) => state.commune);
export const useSetCommune = () => useEditAdresseStore((state) => state.setCommune);

export const useArrondissement = () => useEditAdresseStore((state) => state.arrondissement);
export const useSetArrondissement = () => useEditAdresseStore((state) => state.setArrondissement);

export const useQuartier = () => useEditAdresseStore((state) => state.quartier);
export const useSetQuartier = () => useEditAdresseStore((state) => state.setQuartier);

export const useLatitude = () => useEditAdresseStore((state) => state.latitude);
export const useSetLatitude = () => useEditAdresseStore((state) => state.setLatitude);

export const useLongitude = () => useEditAdresseStore((state) => state.longitude);
export const useSetLongitude = () => useEditAdresseStore((state) => state.setLongitude);

export const useStatut = () => useEditAdresseStore((state) => state.statut);
export const useSetStatut = () => useEditAdresseStore((state) => state.setStatut);

export const useIsLoading = () => useEditAdresseStore((state) => state.isLoading);
export const useSetIsLoading = () => useEditAdresseStore((state) => state.setIsLoading);

export const useIsLocating = () => useEditAdresseStore((state) => state.isLocating);
export const useSetIsLocating = () => useEditAdresseStore((state) => state.setIsLocating);

export const useLoadAdresse = () => useEditAdresseStore((state) => state.loadAdresse);
export const useResetEditAdresse = () => useEditAdresseStore((state) => state.reset);

export default useEditAdresseStore;
