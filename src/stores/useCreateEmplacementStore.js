import { create } from "zustand";

/**
 * Store Zustand pour le formulaire de création d'emplacement
 * Chaque champ est indépendant pour éviter les re-rendus inutiles
 */
const useCreateEmplacementStore = create((set) => ({
  // Type
  famille: "",
  setFamille: (famille) => set({ famille }),

  sous_type: "",
  setSousType: (sous_type) => set({ sous_type }),

  // Informations générales
  denomination: "",
  setDenomination: (denomination) => set({ denomination }),

  theme: "",
  setTheme: (theme) => set({ theme }),

  description: "",
  setDescription: (description) => set({ description }),

  // Position
  departement: "",
  setDepartement: (departement) => set({ departement }),

  commune: "",
  setCommune: (commune) => set({ commune }),

  arrondissement: "",
  setArrondissement: (arrondissement) => set({ arrondissement }),

  quartier: "",
  setQuartier: (quartier) => set({ quartier }),

  longitude: "",
  setLongitude: (longitude) => set({ longitude }),

  latitude: "",
  setLatitude: (latitude) => set({ latitude }),

  // Horaires - Lundi
  lun_ouvert: "",
  setLunOuvert: (lun_ouvert) => set({ lun_ouvert }),

  lun_ferme: "",
  setLunFerme: (lun_ferme) => set({ lun_ferme }),

  // Horaires - Mardi
  mar_ouvert: "",
  setMarOuvert: (mar_ouvert) => set({ mar_ouvert }),

  mar_ferme: "",
  setMarFerme: (mar_ferme) => set({ mar_ferme }),

  // Horaires - Mercredi
  mer_ouvert: "",
  setMerOuvert: (mer_ouvert) => set({ mer_ouvert }),

  mer_ferme: "",
  setMerFerme: (mer_ferme) => set({ mer_ferme }),

  // Horaires - Jeudi
  jeu_ouvert: "",
  setJeuOuvert: (jeu_ouvert) => set({ jeu_ouvert }),

  jeu_ferme: "",
  setJeuFerme: (jeu_ferme) => set({ jeu_ferme }),

  // Horaires - Vendredi
  ven_ouvert: "",
  setVenOuvert: (ven_ouvert) => set({ ven_ouvert }),

  ven_ferme: "",
  setVenFerme: (ven_ferme) => set({ ven_ferme }),

  // Horaires - Samedi
  sam_ouvert: "",
  setSamOuvert: (sam_ouvert) => set({ sam_ouvert }),

  sam_ferme: "",
  setSamFerme: (sam_ferme) => set({ sam_ferme }),

  // Horaires - Dimanche
  dim_ouvert: "",
  setDimOuvert: (dim_ouvert) => set({ dim_ouvert }),

  dim_ferme: "",
  setDimFerme: (dim_ferme) => set({ dim_ferme }),

  // État du formulaire
  loading: false,
  setLoading: (loading) => set({ loading }),

  // Sections pliables (pour mobile)
  expandedSections: {
    type: true,
    info: true,
    position: false,
    horaires: false,
  },
  toggleSection: (section) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    })),

  // Réinitialiser le formulaire
  reset: () =>
    set({
      famille: "",
      sous_type: "",
      denomination: "",
      theme: "",
      description: "",
      departement: "",
      commune: "",
      arrondissement: "",
      quartier: "",
      longitude: "",
      latitude: "",
      lun_ouvert: "",
      lun_ferme: "",
      mar_ouvert: "",
      mar_ferme: "",
      mer_ouvert: "",
      mer_ferme: "",
      jeu_ouvert: "",
      jeu_ferme: "",
      ven_ouvert: "",
      ven_ferme: "",
      sam_ouvert: "",
      sam_ferme: "",
      dim_ouvert: "",
      dim_ferme: "",
      loading: false,
      expandedSections: {
        type: true,
        info: true,
        position: false,
        horaires: false,
      },
    }),

  // Récupérer toutes les données du formulaire
  getFormData: (state) => ({
    famille: state.famille,
    sous_type: state.sous_type,
    denomination: state.denomination,
    theme: state.theme,
    description: state.description,
    departement: state.departement,
    commune: state.commune,
    arrondissement: state.arrondissement,
    quartier: state.quartier,
    longitude: state.longitude,
    latitude: state.latitude,
    lun_ouvert: state.lun_ouvert,
    lun_ferme: state.lun_ferme,
    mar_ouvert: state.mar_ouvert,
    mar_ferme: state.mar_ferme,
    mer_ouvert: state.mer_ouvert,
    mer_ferme: state.mer_ferme,
    jeu_ouvert: state.jeu_ouvert,
    jeu_ferme: state.jeu_ferme,
    ven_ouvert: state.ven_ouvert,
    ven_ferme: state.ven_ferme,
    sam_ouvert: state.sam_ouvert,
    sam_ferme: state.sam_ferme,
    dim_ouvert: state.dim_ouvert,
    dim_ferme: state.dim_ferme,
  }),
}));

export default useCreateEmplacementStore;