/**
 * useEditCommande.js
 * Store Zustand pour l'édition d'une commande existante
 * Gère les champs modifiables : emplacement, vendeur, type, details (articles), paiement, statut
 */

import { create } from "zustand";

const useEditCommande = create((set) => ({
  // Champs de la commande
  id: "",
  createdBy: "",
  updatedBy: "",
  createdAt: null,
  updatedAt: null,

  // Champs éditables
  point_de_vente: { id: "", denomination: "" },
  type: "sur place", // "sur place" | "a livrer"
  statut: "non servi", // "livree" | "non livree" | "servi" | "non servi"

  // Details de la commande (articles)
  details: [], // [{ id, denomination, quantite, prix }]

  // Client
  client: { nom: "", numero: "" },

  // Date/heure de livraison (optionnel)
  date_heure_livraison: { date: "", heure: "" },
  personne_a_livrer: { nom: "", contact: "" },

  // Paiement (éditable)
  paiement: {
    total: 0,
    livraison: 0,
    montant_total_recu: 0,
    monnaie_rendue: 0,
    montant_momo_recu: 0,
    montant_espece_recu: 0,
    reduction: 0,
    dette: 0,
  },

  // Incident et commentaire
  incident: "",
  commentaire: "",

  // États
  isLoading: false,
  isSaving: false,
  error: null,
  success: false,

  // Setters individuels
  setId: (id) => set({ id }),
  setCreatedBy: (createdBy) => set({ createdBy }),
  setUpdatedBy: (updatedBy) => set({ updatedBy }),
  setCreatedAt: (createdAt) => set({ createdAt }),
  setUpdatedAt: (updatedAt) => set({ updatedAt }),

  // Champs éditables
  setPointDeVente: (point_de_vente) => set({ point_de_vente, error: null }),
  setType: (type) => set({ type, error: null }),
  setStatut: (statut) => set({ statut, error: null }),

  setDetails: (details) => set({ details, error: null }),
  addDetail: (detail) =>
    set((state) => ({ details: [...state.details, detail], error: null })),
  updateDetail: (index, detail) =>
    set((state) => {
      const newDetails = [...state.details];
      newDetails[index] = detail;
      return { details: newDetails, error: null };
    }),
  removeDetail: (index) =>
    set((state) => ({
      details: state.details.filter((_, i) => i !== index),
      error: null,
    })),

  setClient: (client) => set({ client, error: null }),

  setDateHeureLivraison: (date_heure_livraison) =>
    set({ date_heure_livraison, error: null }),
  setPersonneALivrer: (personne_a_livrer) =>
    set({ personne_a_livrer, error: null }),

  setPaiement: (paiement) => set({ paiement, error: null }),
  updatePaiementField: (field, value) =>
    set((state) => ({
      paiement: { ...state.paiement, [field]: value },
      error: null,
    })),

  setIncident: (incident) => set({ incident, error: null }),
  setCommentaire: (commentaire) => set({ commentaire, error: null }),

  // Gestion des états
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error, success: false }),
  setSuccess: (success) => set({ success, error: null }),

  // Charger une commande complète
  loadCommande: (commandeData) =>
    set({
      id: commandeData.id || "",
      createdBy: commandeData.createdBy || "",
      updatedBy: commandeData.updatedBy || "",
      createdAt: commandeData.createdAt || null,
      updatedAt: commandeData.updatedAt || null,
      point_de_vente: commandeData.point_de_vente || { id: "", denomination: "" },
      type: commandeData.type || "sur place",
      statut: commandeData.statut || "non servi",
      details: commandeData.details || [],
      client: commandeData.client || { nom: "", numero: "" },
      date_heure_livraison: commandeData.date_heure_livraison || { date: "", heure: "" },
      personne_a_livrer: commandeData.personne_a_livrer || { nom: "", contact: "" },
      paiement: commandeData.paiement || {
        total: 0,
        livraison: 0,
        montant_total_recu: 0,
        monnaie_rendue: 0,
        montant_momo_recu: 0,
        montant_espece_recu: 0,
        reduction: 0,
        dette: 0,
      },
      incident: commandeData.incident || "",
      commentaire: commandeData.commentaire || "",
      isLoading: false,
      error: null,
    }),

  // Reset du store
  resetForm: () =>
    set({
      id: "",
      createdBy: "",
      updatedBy: "",
      createdAt: null,
      updatedAt: null,
      point_de_vente: { id: "", denomination: "" },
      type: "sur place",
      statut: "non servi",
      details: [],
      client: { nom: "", numero: "" },
      date_heure_livraison: { date: "", heure: "" },
      personne_a_livrer: { nom: "", contact: "" },
      paiement: {
        total: 0,
        livraison: 0,
        montant_total_recu: 0,
        monnaie_rendue: 0,
        montant_momo_recu: 0,
        montant_espece_recu: 0,
        reduction: 0,
        dette: 0,
      },
      incident: "",
      commentaire: "",
      isLoading: false,
      isSaving: false,
      error: null,
      success: false,
    }),
}));

export default useEditCommande;
