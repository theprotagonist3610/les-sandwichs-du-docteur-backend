// stores/useMenuFormStore.js
import { create } from "zustand";

const initialFormData = {
  denomination: "",
  groupe: "",
  recipient: "Box 16x16",
  description: "",
  prix: 1500,
  imgURL: "",
  ingredients: [],
  calories: 0,
};

const useMenuFormStore = create((set, get) => ({
  // État du formulaire
  formData: initialFormData,
  errors: {},
  currentStep: 0,
  isSubmitting: false,

  // Actions pour mettre à jour les champs
  updateField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
      errors: { ...state.errors, [field]: null }, // Clear error when field is updated
    })),

  // Actions pour la gestion des ingrédients
  addIngredient: (ingredient) =>
    set((state) => ({
      formData: {
        ...state.formData,
        ingredients: [...state.formData.ingredients, ingredient],
      },
    })),

  removeIngredient: (index) =>
    set((state) => ({
      formData: {
        ...state.formData,
        ingredients: state.formData.ingredients.filter((_, i) => i !== index),
      },
    })),

  updateIngredientQuantity: (index, quantite) =>
    set((state) => ({
      formData: {
        ...state.formData,
        ingredients: state.formData.ingredients.map((ing, i) =>
          i === index ? { ...ing, quantite } : ing
        ),
      },
    })),

  // Validation des champs
  validateField: (field) => {
    const { formData } = get();
    let error = null;

    switch (field) {
      case "denomination":
        if (!formData.denomination.trim()) {
          error = "La dénomination est obligatoire";
        } else if (formData.denomination.length < 2) {
          error = "La dénomination doit contenir au moins 2 caractères";
        }
        break;
      case "groupe":
        if (!formData.groupe.trim()) {
          error = "La catégorie est obligatoire";
        }
        break;
      case "prix":
        if (formData.prix < 0) {
          error = "Le prix doit être positif";
        }
        break;
      case "imgURL":
        if (formData.imgURL && !isValidUrl(formData.imgURL)) {
          error = "URL d'image invalide";
        }
        break;
      case "calories":
        if (formData.calories < 0) {
          error = "Les calories doivent être positives";
        }
        break;
    }

    set((state) => ({
      errors: { ...state.errors, [field]: error },
    }));

    return !error;
  },

  // Validation complète du formulaire
  validateForm: () => {
    const { formData } = get();
    const errors = {};

    // Validations obligatoires
    if (!formData.denomination.trim()) {
      errors.denomination = "La dénomination est obligatoire";
    }
    if (!formData.groupe.trim()) {
      errors.groupe = "La catégorie est obligatoire";
    }

    // Validations optionnelles
    if (formData.prix < 0) {
      errors.prix = "Le prix doit être positif";
    }
    if (formData.imgURL && !isValidUrl(formData.imgURL)) {
      errors.imgURL = "URL d'image invalide";
    }
    if (formData.calories < 0) {
      errors.calories = "Les calories doivent être positives";
    }

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  // Gestion des étapes (mobile)
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4),
    })),

  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  setStep: (step) => set({ currentStep: step }),

  // État de soumission
  setSubmitting: (value) => set({ isSubmitting: value }),

  // Réinitialiser le formulaire
  resetForm: () =>
    set({
      formData: initialFormData,
      errors: {},
      currentStep: 0,
      isSubmitting: false,
    }),

  // Remplir avec des valeurs par défaut
  fillDefaults: () =>
    set((state) => ({
      formData: {
        ...state.formData,
        recipient: state.formData.recipient || "Box 16x16",
        prix: state.formData.prix || 1500,
        calories: state.formData.calories || 0,
      },
    })),
}));

// Fonction utilitaire pour valider les URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return string === ""; // Accepter string vide
  }
}

export default useMenuFormStore;
