/**
 * useCreateEmplacementStore.js
 * Store Zustand pour gérer le formulaire de création d'emplacement
 */

import { create } from "zustand";
import { EMPLACEMENT_TYPES } from "@/toolkits/admin/emplacementToolkit.jsx";
import { getAllUsers } from "@/toolkits/admin/userToolkit.jsx";

const DEFAULT_HORAIRE = {
  ouvert: false,
  ouverture: "08:00",
  fermeture: "18:00",
};

const useCreateEmplacementStore = create((set, get) => ({
  // Informations de base
  typeFamille: EMPLACEMENT_TYPES.POINT_DE_VENTE,
  typeSousType: "",
  denomination: "",

  // Thème central
  theme: "",
  themeDescription: "",

  // Position
  departement: "",
  commune: "",
  arrondissement: "",
  quartier: "",
  longitude: "",
  latitude: "",

  // Vendeur actuel (optionnel)
  vendeurId: "",

  // Horaires
  horaireLundi: { ...DEFAULT_HORAIRE },
  horaireMardi: { ...DEFAULT_HORAIRE },
  horaireMercredi: { ...DEFAULT_HORAIRE },
  horaireJeudi: { ...DEFAULT_HORAIRE },
  horaireVendredi: { ...DEFAULT_HORAIRE },
  horaireSamedi: { ...DEFAULT_HORAIRE },
  horaireDimanche: { ...DEFAULT_HORAIRE },

  // État du formulaire
  isSubmitting: false,
  submitError: null,

  // Actions - Type
  setTypeFamille: (typeFamille) => set({ typeFamille }),
  setTypeSousType: (typeSousType) => set({ typeSousType }),

  // Actions - Informations de base
  setDenomination: (denomination) => set({ denomination }),

  // Actions - Thème
  setTheme: (theme) => set({ theme }),
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

  // Actions - Horaires
  setHoraireLundi: (horaire) => set({ horaireLundi: horaire }),
  setHoraireMardi: (horaire) => set({ horaireMardi: horaire }),
  setHoraireMercredi: (horaire) => set({ horaireMercredi: horaire }),
  setHoraireJeudi: (horaire) => set({ horaireJeudi: horaire }),
  setHoraireVendredi: (horaire) => set({ horaireVendredi: horaire }),
  setHoraireSamedi: (horaire) => set({ horaireSamedi: horaire }),
  setHoraireDimanche: (horaire) => set({ horaireDimanche: horaire }),

  // Actions - État
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmitError: (submitError) => set({ submitError }),

  // Validation du formulaire
  validateForm: () => {
    const state = get();
    const errors = [];

    if (!state.denomination || state.denomination.trim() === "") {
      errors.push("La dénomination est requise");
    }

    if (!state.theme || state.theme.trim() === "") {
      errors.push("Le thème central est requis");
    }

    if (!state.departement || state.departement.trim() === "") {
      errors.push("Le département est requis");
    }

    if (!state.commune || state.commune.trim() === "") {
      errors.push("La commune est requise");
    }

    const lon = parseFloat(state.longitude);
    const lat = parseFloat(state.latitude);

    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.push("Longitude invalide (doit être entre -180 et 180)");
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push("Latitude invalide (doit être entre -90 et 90)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Récupérer les données formatées pour l'API
  getFormData: async () => {
    const state = get();

    // Construire l'objet vendeur uniquement si un ID est fourni
    let vendeur = undefined;
    if (state.vendeurId && state.vendeurId.trim()) {
      try {
        const users = await getAllUsers();
        const selectedUser = users.find((u) => u.id === state.vendeurId.trim());
        if (selectedUser) {
          vendeur = {
            id: selectedUser.id,
            nom: selectedUser.nom,
            prenoms: selectedUser.prenoms || [],
          };
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du vendeur:", error);
      }
    }

    return {
      type: {
        famille: state.typeFamille,
        sous_type: state.typeSousType.trim(),
      },
      denomination: state.denomination.trim(),
      theme_central: {
        theme: state.theme.trim(),
        description: state.themeDescription.trim(),
      },
      position: {
        actuelle: {
          departement: state.departement.trim(),
          commune: state.commune.trim(),
          arrondissement: state.arrondissement.trim(),
          quartier: state.quartier.trim(),
          localisation: {
            longitude: parseFloat(state.longitude),
            latitude: parseFloat(state.latitude),
          },
        },
        historique: [],
      },
      vendeur_actuel: vendeur,
      horaires: {
        lun: state.horaireLundi,
        mar: state.horaireMardi,
        mer: state.horaireMercredi,
        jeu: state.horaireJeudi,
        ven: state.horaireVendredi,
        sam: state.horaireSamedi,
        dim: state.horaireDimanche,
      },
    };
  },

  // Réinitialiser le formulaire
  resetForm: () =>
    set({
      typeFamille: EMPLACEMENT_TYPES.POINT_DE_VENTE,
      typeSousType: "",
      denomination: "",
      theme: "",
      themeDescription: "",
      departement: "",
      commune: "",
      arrondissement: "",
      quartier: "",
      longitude: "",
      latitude: "",
      vendeurId: "",
      horaireLundi: { ...DEFAULT_HORAIRE },
      horaireMardi: { ...DEFAULT_HORAIRE },
      horaireMercredi: { ...DEFAULT_HORAIRE },
      horaireJeudi: { ...DEFAULT_HORAIRE },
      horaireVendredi: { ...DEFAULT_HORAIRE },
      horaireSamedi: { ...DEFAULT_HORAIRE },
      horaireDimanche: { ...DEFAULT_HORAIRE },
      isSubmitting: false,
      submitError: null,
    }),
}));

// Sélecteurs optimisés pour éviter les re-rendus inutiles
export const selectTypeFamille = (state) => state.typeFamille;
export const selectTypeSousType = (state) => state.typeSousType;
export const selectDenomination = (state) => state.denomination;
export const selectTheme = (state) => state.theme;
export const selectThemeDescription = (state) => state.themeDescription;
export const selectDepartement = (state) => state.departement;
export const selectCommune = (state) => state.commune;
export const selectArrondissement = (state) => state.arrondissement;
export const selectQuartier = (state) => state.quartier;
export const selectLongitude = (state) => state.longitude;
export const selectLatitude = (state) => state.latitude;
export const selectVendeurId = (state) => state.vendeurId;
export const selectHoraireLundi = (state) => state.horaireLundi;
export const selectHoraireMardi = (state) => state.horaireMardi;
export const selectHoraireMercredi = (state) => state.horaireMercredi;
export const selectHoraireJeudi = (state) => state.horaireJeudi;
export const selectHoraireVendredi = (state) => state.horaireVendredi;
export const selectHoraireSamedi = (state) => state.horaireSamedi;
export const selectHoraireDimanche = (state) => state.horaireDimanche;
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectSubmitError = (state) => state.submitError;

export default useCreateEmplacementStore;
