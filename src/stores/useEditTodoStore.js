import { create } from "zustand";

/**
 * Store Zustand pour le formulaire d'édition de TODO
 * Chaque champ a son propre état pour éviter les rerenders inutiles
 */
export const useEditTodoStore = create((set) => ({
  // Champs du formulaire
  id: "",
  title: "",
  description: "",
  concern: [],
  concernBy: [],
  deadline: null,
  status: false,

  // Actions pour mettre à jour les champs individuellement
  setId: (id) => set({ id }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setConcern: (concern) => set({ concern }),
  setConcernBy: (concernBy) => set({ concernBy }),
  setDeadline: (deadline) => set({ deadline }),
  setStatus: (status) => set({ status }),

  // Fonction pour charger un TODO existant
  loadTodo: (todo) =>
    set({
      id: todo.id,
      title: todo.title,
      description: todo.description || "",
      concern: todo.concern || [],
      concernBy: todo.concernBy || [],
      deadline: todo.deadline || null,
      status: todo.status || false,
    }),

  // Réinitialiser le formulaire
  reset: () =>
    set({
      id: "",
      title: "",
      description: "",
      concern: [],
      concernBy: [],
      deadline: null,
      status: false,
    }),
}));
