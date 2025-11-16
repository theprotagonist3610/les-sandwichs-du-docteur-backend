import { create } from "zustand";

const useCreateProductionStore = create((set) => ({
  // Basic fields
  type: "menu", // "menu" | "boisson"
  denomination: "",

  // Main ingredient (ingredient_principal)
  ingredientPrincipalId: "",
  ingredientPrincipalDenomination: "",
  ingredientPrincipalQuantite: 0,
  ingredientPrincipalUniteNom: "",
  ingredientPrincipalUniteSymbol: "",

  // Recipe array (recette)
  recette: [], // Array of { ingredient, quantite, unite: { nom, symbol } }

  // Produit fini (resultat) - consommable du stock
  resultatId: "",
  resultatDenomination: "",
  resultatType: "menu", // "menu" | "boisson"
  resultatUniteNom: "",
  resultatUniteSymbol: "",

  // Form state
  isSubmitting: false,
  error: null,

  // Setters - Basic fields
  setType: (type) => set({ type }),
  setDenomination: (denomination) => set({ denomination }),

  // Setters - Main ingredient
  setIngredientPrincipalId: (id) => set({ ingredientPrincipalId: id }),
  setIngredientPrincipalDenomination: (denomination) =>
    set({ ingredientPrincipalDenomination: denomination }),
  setIngredientPrincipalQuantite: (quantite) =>
    set({ ingredientPrincipalQuantite: quantite }),
  setIngredientPrincipalUniteNom: (nom) =>
    set({ ingredientPrincipalUniteNom: nom }),
  setIngredientPrincipalUniteSymbol: (symbol) =>
    set({ ingredientPrincipalUniteSymbol: symbol }),

  // Setters - Complete ingredient principal
  setIngredientPrincipal: (ingredient) =>
    set({
      ingredientPrincipalId: ingredient.id || "",
      ingredientPrincipalDenomination: ingredient.denomination || "",
      ingredientPrincipalQuantite: ingredient.quantite_par_defaut || 0,
      ingredientPrincipalUniteNom: ingredient.unite?.nom || "",
      ingredientPrincipalUniteSymbol: ingredient.unite?.symbol || "",
    }),

  // Recipe management
  addRecetteLine: (line) =>
    set((state) => ({
      recette: [...state.recette, line],
    })),

  removeRecetteLine: (index) =>
    set((state) => ({
      recette: state.recette.filter((_, i) => i !== index),
    })),

  updateRecetteLine: (index, updates) =>
    set((state) => ({
      recette: state.recette.map((line, i) =>
        i === index ? { ...line, ...updates } : line
      ),
    })),

  setRecette: (recette) => set({ recette }),

  // Setters - Resultat (produit fini)
  setResultatId: (id) => set({ resultatId: id }),
  setResultatDenomination: (denomination) =>
    set({ resultatDenomination: denomination }),
  setResultatType: (type) => set({ resultatType: type }),
  setResultatUniteNom: (nom) => set({ resultatUniteNom: nom }),
  setResultatUniteSymbol: (symbol) => set({ resultatUniteSymbol: symbol }),

  // Setter - Complete resultat
  setResultat: (consommable) =>
    set({
      resultatId: consommable.id || "",
      resultatDenomination: consommable.denomination || "",
      resultatType: consommable.type || "menu",
      resultatUniteNom: consommable.unite?.nom || "",
      resultatUniteSymbol: consommable.unite?.symbol || "",
    }),

  // Form state management
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),

  // Reset all fields
  reset: () =>
    set({
      type: "menu",
      denomination: "",
      ingredientPrincipalId: "",
      ingredientPrincipalDenomination: "",
      ingredientPrincipalQuantite: 0,
      ingredientPrincipalUniteNom: "",
      ingredientPrincipalUniteSymbol: "",
      recette: [],
      resultatId: "",
      resultatDenomination: "",
      resultatType: "menu",
      resultatUniteNom: "",
      resultatUniteSymbol: "",
      isSubmitting: false,
      error: null,
    }),
}));

// Selectors - Basic fields
export const selectType = (state) => state.type;
export const selectDenomination = (state) => state.denomination;

// Selectors - Main ingredient
export const selectIngredientPrincipalId = (state) =>
  state.ingredientPrincipalId;
export const selectIngredientPrincipalDenomination = (state) =>
  state.ingredientPrincipalDenomination;
export const selectIngredientPrincipalQuantite = (state) =>
  state.ingredientPrincipalQuantite;
export const selectIngredientPrincipalUniteNom = (state) =>
  state.ingredientPrincipalUniteNom;
export const selectIngredientPrincipalUniteSymbol = (state) =>
  state.ingredientPrincipalUniteSymbol;

// Selector - Complete ingredient principal object
export const selectIngredientPrincipal = (state) => ({
  id: state.ingredientPrincipalId,
  denomination: state.ingredientPrincipalDenomination,
  quantite_par_defaut: state.ingredientPrincipalQuantite,
  unite: {
    nom: state.ingredientPrincipalUniteNom,
    symbol: state.ingredientPrincipalUniteSymbol,
  },
});

// Selectors - Recipe
export const selectRecette = (state) => state.recette;

// Selectors - Resultat (produit fini)
export const selectResultatId = (state) => state.resultatId;
export const selectResultatDenomination = (state) => state.resultatDenomination;
export const selectResultatType = (state) => state.resultatType;
export const selectResultatUniteNom = (state) => state.resultatUniteNom;
export const selectResultatUniteSymbol = (state) => state.resultatUniteSymbol;

// Selector - Complete resultat object
export const selectResultat = (state) => ({
  id: state.resultatId,
  denomination: state.resultatDenomination,
  type: state.resultatType,
  unite: {
    nom: state.resultatUniteNom,
    symbol: state.resultatUniteSymbol,
  },
});

// Selectors - Form state
export const selectIsSubmitting = (state) => state.isSubmitting;
export const selectError = (state) => state.error;

// Selectors - Setters
export const selectSetType = (state) => state.setType;
export const selectSetDenomination = (state) => state.setDenomination;

export const selectSetIngredientPrincipalId = (state) =>
  state.setIngredientPrincipalId;
export const selectSetIngredientPrincipalDenomination = (state) =>
  state.setIngredientPrincipalDenomination;
export const selectSetIngredientPrincipalQuantite = (state) =>
  state.setIngredientPrincipalQuantite;
export const selectSetIngredientPrincipalUniteNom = (state) =>
  state.setIngredientPrincipalUniteNom;
export const selectSetIngredientPrincipalUniteSymbol = (state) =>
  state.setIngredientPrincipalUniteSymbol;
export const selectSetIngredientPrincipal = (state) =>
  state.setIngredientPrincipal;

export const selectAddRecetteLine = (state) => state.addRecetteLine;
export const selectRemoveRecetteLine = (state) => state.removeRecetteLine;
export const selectUpdateRecetteLine = (state) => state.updateRecetteLine;
export const selectSetRecette = (state) => state.setRecette;

export const selectSetResultatId = (state) => state.setResultatId;
export const selectSetResultatDenomination = (state) =>
  state.setResultatDenomination;
export const selectSetResultatType = (state) => state.setResultatType;
export const selectSetResultatUniteNom = (state) => state.setResultatUniteNom;
export const selectSetResultatUniteSymbol = (state) =>
  state.setResultatUniteSymbol;
export const selectSetResultat = (state) => state.setResultat;

export const selectSetIsSubmitting = (state) => state.setIsSubmitting;
export const selectSetError = (state) => state.setError;

export const selectReset = (state) => state.reset;

export default useCreateProductionStore;
