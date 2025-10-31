/**
 * useEditEmplacementStore.js
 * Store Zustand pour gérer l'édition d'un emplacement
 */

import { create } from "zustand";

const DEFAULT_HORAIRE = {
  ouvert: false,
  ouverture: "08:00",
  fermeture: "18:00",
};

const useEditEmplacementStore = create((set) => ({
  // Informations de base
  denomination: "",
  typeFamille: "",
  typeSousType: "",
  themeCentral: "",
  themeDescription: "",

  // Position
  departement: "",
  commune: "",
  arrondissement: "",
  quartier: "",
  longitude: "",
  latitude: "",

  // Vendeur
  vendeurId: "",
  vendeurNom: "",
  vendeurPrenoms: [],

  // Horaires
  horaireLundi: { ...DEFAULT_HORAIRE },
  horaireMardi: { ...DEFAULT_HORAIRE },
  horaireMercredi: { ...DEFAULT_HORAIRE },
  horaireJeudi: { ...DEFAULT_HORAIRE },
  horaireVendredi: { ...DEFAULT_HORAIRE },
  horaireSamedi: { ...DEFAULT_HORAIRE },
  horaireDimanche: { ...DEFAULT_HORAIRE },

  // Statut et métadonnées
  status: true,
  isSubmitting: false,

  // Actions - Informations de base
  setDenomination: (denomination) => set({ denomination }),
  setTypeFamille: (typeFamille) => set({ typeFamille }),
  setTypeSousType: (typeSousType) => set({ typeSousType }),
  setThemeCentral: (themeCentral) => set({ themeCentral }),
  setThemeDescription: (themeDescription) => set({ themeDescription }),

  // Actions - Position
  setDepartement: (departement) => set({ departement }),
  setCommune: (commune) => set({ commune }),
  setArrondissement: (arrondissement) => set({ arrondissement }),
  setQuartier: (quartier) => set({ quartier }),
  setLongitude: (longitude) => set({ longitude }),
  setLatitude: (latitude) => set({ latitude }),

  // Actions - Vendeur
  setVendeurId: (vendeurId) => set({ vendeurId }),
  setVendeurNom: (vendeurNom) => set({ vendeurNom }),
  setVendeurPrenoms: (vendeurPrenoms) => set({ vendeurPrenoms }),

  // Actions - Horaires
  setHoraireLundi: (horaire) => set({ horaireLundi: horaire }),
  setHoraireMardi: (horaire) => set({ horaireMardi: horaire }),
  setHoraireMercredi: (horaire) => set({ horaireMercredi: horaire }),
  setHoraireJeudi: (horaire) => set({ horaireJeudi: horaire }),
  setHoraireVendredi: (horaire) => set({ horaireVendredi: horaire }),
  setHoraireSamedi: (horaire) => set({ horaireSamedi: horaire }),
  setHoraireDimanche: (horaire) => set({ horaireDimanche: horaire }),

  // Actions - Autres
  setStatus: (status) => set({ status }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  // Charger un emplacement dans le store
  loadEmplacement: (emplacement) => {
    if (!emplacement) return;

    set({
      denomination: emplacement.denomination || "",
      typeFamille: emplacement.type?.famille || "",
      typeSousType: emplacement.type?.sous_type || "",
      themeCentral: emplacement.theme_central?.theme || "",
      themeDescription: emplacement.theme_central?.description || "",

      departement: emplacement.position?.actuelle?.departement || "",
      commune: emplacement.position?.actuelle?.commune || "",
      arrondissement: emplacement.position?.actuelle?.arrondissement || "",
      quartier: emplacement.position?.actuelle?.quartier || "",
      longitude: String(emplacement.position?.actuelle?.localisation?.longitude || ""),
      latitude: String(emplacement.position?.actuelle?.localisation?.latitude || ""),

      vendeurId: emplacement.vendeur_actuel?.id || "",
      vendeurNom: emplacement.vendeur_actuel?.nom || "",
      vendeurPrenoms: emplacement.vendeur_actuel?.prenoms || [],

      horaireLundi: emplacement.horaires?.lun || { ...DEFAULT_HORAIRE },
      horaireMardi: emplacement.horaires?.mar || { ...DEFAULT_HORAIRE },
      horaireMercredi: emplacement.horaires?.mer || { ...DEFAULT_HORAIRE },
      horaireJeudi: emplacement.horaires?.jeu || { ...DEFAULT_HORAIRE },
      horaireVendredi: emplacement.horaires?.ven || { ...DEFAULT_HORAIRE },
      horaireSamedi: emplacement.horaires?.sam || { ...DEFAULT_HORAIRE },
      horaireDimanche: emplacement.horaires?.dim || { ...DEFAULT_HORAIRE },

      status: emplacement.status !== undefined ? emplacement.status : true,
    });
  },

  // Réinitialiser le store
  resetStore: () =>
    set({
      denomination: "",
      typeFamille: "",
      typeSousType: "",
      themeCentral: "",
      themeDescription: "",
      departement: "",
      commune: "",
      arrondissement: "",
      quartier: "",
      longitude: "",
      latitude: "",
      vendeurId: "",
      vendeurNom: "",
      vendeurPrenoms: [],
      horaireLundi: { ...DEFAULT_HORAIRE },
      horaireMardi: { ...DEFAULT_HORAIRE },
      horaireMercredi: { ...DEFAULT_HORAIRE },
      horaireJeudi: { ...DEFAULT_HORAIRE },
      horaireVendredi: { ...DEFAULT_HORAIRE },
      horaireSamedi: { ...DEFAULT_HORAIRE },
      horaireDimanche: { ...DEFAULT_HORAIRE },
      status: true,
      isSubmitting: false,
    }),
}));

// Sélecteurs optimisés
export const selectDenomination = (state) => state.denomination;
export const selectTypeFamille = (state) => state.typeFamille;
export const selectTypeSousType = (state) => state.typeSousType;
export const selectThemeCentral = (state) => state.themeCentral;
export const selectThemeDescription = (state) => state.themeDescription;

export const selectDepartement = (state) => state.departement;
export const selectCommune = (state) => state.commune;
export const selectArrondissement = (state) => state.arrondissement;
export const selectQuartier = (state) => state.quartier;
export const selectLongitude = (state) => state.longitude;
export const selectLatitude = (state) => state.latitude;

export const selectVendeurId = (state) => state.vendeurId;
export const selectVendeurNom = (state) => state.vendeurNom;
export const selectVendeurPrenoms = (state) => state.vendeurPrenoms;

export const selectHoraireLundi = (state) => state.horaireLundi;
export const selectHoraireMardi = (state) => state.horaireMardi;
export const selectHoraireMercredi = (state) => state.horaireMercredi;
export const selectHoraireJeudi = (state) => state.horaireJeudi;
export const selectHoraireVendredi = (state) => state.horaireVendredi;
export const selectHoraireSamedi = (state) => state.horaireSamedi;
export const selectHoraireDimanche = (state) => state.horaireDimanche;

export const selectStatus = (state) => state.status;
export const selectIsSubmitting = (state) => state.isSubmitting;

export default useEditEmplacementStore;
