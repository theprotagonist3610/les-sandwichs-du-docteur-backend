/**
 * createMenuComposeStore.js
 * Store Zustand pour la création de menus composés
 */

import { create } from "zustand";

const useCreateMenuComposeStore = create((set) => ({
  // Champs du formulaire
  denomination: "",
  contenu: [], // Array de { item, type, quantite }
  description: "",
  prix: 0,

  // États
  isLoading: false,
  error: null,
  success: false,

  // Setters individuels
  setDenomination: (denomination) => set({ denomination, error: null }),
  setContenu: (contenu) => set({ contenu, error: null }),
  setDescription: (description) => set({ description, error: null }),
  setPrix: (prix) => set({ prix, error: null }),

  // Gestion du contenu (ajout/suppression d'items)
  addItem: (item, type, quantite = 1) =>
    set((state) => {
      // Vérifier si l'item existe déjà
      const existingIndex = state.contenu.findIndex(
        (c) => c.item.id === item.id && c.type === type
      );

      if (existingIndex !== -1) {
        // L'item existe, augmenter la quantité
        const updatedContenu = [...state.contenu];
        updatedContenu[existingIndex] = {
          ...updatedContenu[existingIndex],
          quantite: updatedContenu[existingIndex].quantite + quantite,
        };
        return { contenu: updatedContenu, error: null };
      }

      // L'item n'existe pas, l'ajouter
      return {
        contenu: [...state.contenu, { item, type, quantite }],
        error: null,
      };
    }),

  removeItem: (itemId, type) =>
    set((state) => ({
      contenu: state.contenu.filter(
        (c) => !(c.item.id === itemId && c.type === type)
      ),
      error: null,
    })),

  updateItemQuantity: (itemId, type, newQuantite) =>
    set((state) => {
      if (newQuantite < 1) {
        // Si quantité < 1, supprimer l'item
        return {
          contenu: state.contenu.filter(
            (c) => !(c.item.id === itemId && c.type === type)
          ),
          error: null,
        };
      }

      return {
        contenu: state.contenu.map((c) => {
          if (c.item.id === itemId && c.type === type) {
            return { ...c, quantite: newQuantite };
          }
          return c;
        }),
        error: null,
      };
    }),

  // Gestion des états
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, success: false }),
  setSuccess: (success) => set({ success, error: null }),

  // Reset du formulaire
  resetForm: () =>
    set({
      denomination: "",
      contenu: [],
      description: "",
      prix: 0,
      isLoading: false,
      error: null,
      success: false,
    }),
}));

export default useCreateMenuComposeStore;
