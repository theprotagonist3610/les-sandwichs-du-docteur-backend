/**
 * Store Zustand pour la gestion d'un utilisateur spécifique
 * Chaque champ est géré individuellement pour éviter les rerenders inutiles
 */

import { create } from "zustand";

const useGererUnUserStore = create((set) => ({
  // Données utilisateur
  id: "",
  nom: "",
  prenoms: [],
  email: "",
  contact: "",
  sexe: "",
  date_naissance: null,
  role: "",
  createdAt: null,
  updatedAt: null,

  // États
  isLoading: false,
  isSaving: false,
  error: null,
  success: false,

  // Setters individuels
  setId: (id) => set({ id }),
  setNom: (nom) => set({ nom }),
  setPrenoms: (prenoms) => set({ prenoms }),
  setEmail: (email) => set({ email }),
  setContact: (contact) => set({ contact }),
  setSexe: (sexe) => set({ sexe }),
  setDateNaissance: (date_naissance) => set({ date_naissance }),
  setRole: (role) => set({ role }),
  setCreatedAt: (createdAt) => set({ createdAt }),
  setUpdatedAt: (updatedAt) => set({ updatedAt }),

  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error, success: false }),
  setSuccess: (success) => set({ success, error: null }),

  // Charger toutes les données d'un utilisateur
  loadUser: (userData) =>
    set({
      id: userData.id || "",
      nom: userData.nom || "",
      prenoms: userData.prenoms || [],
      email: userData.email || "",
      contact: userData.contact || "",
      sexe: userData.sexe || "",
      date_naissance: userData.date_naissance || null,
      role: userData.role || "",
      createdAt: userData.createdAt || null,
      updatedAt: userData.updatedAt || null,
    }),

  // Reset du formulaire
  resetForm: () =>
    set({
      id: "",
      nom: "",
      prenoms: [],
      email: "",
      contact: "",
      sexe: "",
      date_naissance: null,
      role: "",
      createdAt: null,
      updatedAt: null,
      isLoading: false,
      isSaving: false,
      error: null,
      success: false,
    }),
}));

export default useGererUnUserStore;