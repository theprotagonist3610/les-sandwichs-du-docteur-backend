import { create } from "zustand";

/**
 * Store Zustand pour le formulaire de création de TODO
 * Chaque champ a son propre état pour éviter les rerenders inutiles
 */
export const useCreateTodoStore = create((set) => ({
  // Champs du formulaire
  title: "",
  description: "",
  concern: [], // Array de rôles
  concernBy: [], // Array d'IDs users
  deadline: null, // Timestamp ou null

  // Actions pour mettre à jour les champs individuellement
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setConcern: (concern) => set({ concern }),
  setConcernBy: (concernBy) => set({ concernBy }),
  setDeadline: (deadline) => set({ deadline }),

  // Réinitialiser le formulaire
  reset: () =>
    set({
      title: "",
      description: "",
      concern: [],
      concernBy: [],
      deadline: null,
    }),
}));
