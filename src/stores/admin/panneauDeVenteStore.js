/**
 * panneauDeVenteStore.js
 * Store Zustand pour gérer l'état du panneau de vente
 * Correspond rigoureusement au schema CommandeSchema de commandeToolkit
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

const usePanneauDeVenteStore = create(
  devtools(
    (set, get) => ({
      // ========================================
      // État de la commande actuelle
      // ========================================

      // Point de vente
      pointDeVente: null, // { id, denomination }

      // Client
      client: {
        nom: "",
        numero: "",
      },

      // Détails (articles de la commande)
      details: [], // [{ id, denomination, quantite, prix }]

      // Type de commande
      type: null, // "sur place" | "a livrer"

      // Statut (pour les commandes à livrer)
      statut: "non servi", // "servi" | "non servi" | "livree" | "non livree"

      // Date et heure de livraison (pour type "a livrer")
      dateHeureLivraison: null, // { date: "DDMMYYYY", heure: "HH:MM" }

      // Personne à livrer (pour type "a livrer")
      personneALivrer: null, // { nom, contact }

      // Paiement
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

      // ========================================
      // Actions - Point de vente
      // ========================================

      setPointDeVente: (pointDeVente) =>
        set({ pointDeVente }, false, "setPointDeVente"),

      // ========================================
      // Actions - Client
      // ========================================

      setClientNom: (nom) =>
        set(
          (state) => ({
            client: { ...state.client, nom },
          }),
          false,
          "setClientNom"
        ),

      setClientNumero: (numero) =>
        set(
          (state) => ({
            client: { ...state.client, numero },
          }),
          false,
          "setClientNumero"
        ),

      // ========================================
      // Actions - Détails (articles)
      // ========================================

      addDetail: (item) =>
        set(
          (state) => {
            // Vérifier si l'article existe déjà
            const existingIndex = state.details.findIndex(
              (d) => d.id === item.id
            );

            if (existingIndex !== -1) {
              // Incrémenter la quantité
              const newDetails = [...state.details];
              newDetails[existingIndex] = {
                ...newDetails[existingIndex],
                quantite: newDetails[existingIndex].quantite + item.quantite,
              };

              // Recalculer le total
              const total = newDetails.reduce(
                (sum, d) => sum + d.prix * d.quantite,
                0
              );

              return {
                details: newDetails,
                paiement: { ...state.paiement, total },
              };
            } else {
              // Ajouter le nouvel article
              const newDetails = [...state.details, item];

              // Recalculer le total
              const total = newDetails.reduce(
                (sum, d) => sum + d.prix * d.quantite,
                0
              );

              return {
                details: newDetails,
                paiement: { ...state.paiement, total },
              };
            }
          },
          false,
          "addDetail"
        ),

      updateDetailQuantite: (id, quantite) =>
        set(
          (state) => {
            const newDetails = state.details.map((d) =>
              d.id === id ? { ...d, quantite } : d
            );

            // Recalculer le total
            const total = newDetails.reduce(
              (sum, d) => sum + d.prix * d.quantite,
              0
            );

            return {
              details: newDetails,
              paiement: { ...state.paiement, total },
            };
          },
          false,
          "updateDetailQuantite"
        ),

      removeDetail: (id) =>
        set(
          (state) => {
            const newDetails = state.details.filter((d) => d.id !== id);

            // Recalculer le total
            const total = newDetails.reduce(
              (sum, d) => sum + d.prix * d.quantite,
              0
            );

            return {
              details: newDetails,
              paiement: { ...state.paiement, total },
            };
          },
          false,
          "removeDetail"
        ),

      clearDetails: () =>
        set(
          {
            details: [],
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
          },
          false,
          "clearDetails"
        ),

      // ========================================
      // Actions - Type et Statut
      // ========================================

      setType: (type) => {
        const statut = type === "sur place" ? "non servi" : "non livree";
        set({ type, statut }, false, "setType");
      },

      setStatut: (statut) => set({ statut }, false, "setStatut"),

      // ========================================
      // Actions - Livraison
      // ========================================

      setDateHeureLivraison: (dateHeureLivraison) =>
        set({ dateHeureLivraison }, false, "setDateHeureLivraison"),

      setPersonneALivrer: (personneALivrer) =>
        set({ personneALivrer }, false, "setPersonneALivrer"),

      // ========================================
      // Actions - Paiement
      // ========================================

      setPaiement: (paiement) =>
        set({ paiement }, false, "setPaiement"),

      setPaiementField: (field, value) =>
        set(
          (state) => ({
            paiement: { ...state.paiement, [field]: value },
          }),
          false,
          "setPaiementField"
        ),

      // ========================================
      // Actions - Incident et commentaire
      // ========================================

      setIncident: (incident) => set({ incident }, false, "setIncident"),

      setCommentaire: (commentaire) =>
        set({ commentaire }, false, "setCommentaire"),

      // ========================================
      // Actions - Reset
      // ========================================

      resetCommande: () =>
        set(
          {
            client: { nom: "", numero: "" },
            details: [],
            type: null,
            statut: "non servi",
            dateHeureLivraison: null,
            personneALivrer: null,
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
          },
          false,
          "resetCommande"
        ),

      // ========================================
      // Selectors (pour éviter les re-renders)
      // ========================================

      getTotal: () => get().paiement.total,
      getDetailsCount: () => get().details.length,
      canSubmit: () => {
        const state = get();
        return (
          state.pointDeVente !== null &&
          state.details.length > 0 &&
          state.type !== null
        );
      },
    }),
    { name: "PanneauDeVenteStore" }
  )
);

export default usePanneauDeVenteStore;
