// stores/useIngredientFormStore.js
import { create } from "zustand";

const useIngredientFormStore = create((set, get) => ({
  // État du formulaire
  formData: {
    denomination: "",
    groupe: "",
    emoji: "",
    calories: 0,
  },

  // État des erreurs de validation
  errors: {},

  // État de l'étape actuelle (pour mobile)
  currentStep: 0,

  // État de soumission
  isSubmitting: false,

  // Mettre à jour un champ
  updateField: (field, value) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
      // Nettoyer l'erreur du champ quand il est modifié
      errors: {
        ...state.errors,
        [field]: null,
      },
    }));
  },

  // Valider un champ spécifique
  validateField: (field) => {
    const { formData } = get();
    const errors = {};

    switch (field) {
      case "denomination":
        if (!formData.denomination || formData.denomination.trim() === "") {
          errors.denomination = "La dénomination est obligatoire";
        } else if (formData.denomination.length < 2) {
          errors.denomination =
            "La dénomination doit contenir au moins 2 caractères";
        } else if (formData.denomination.length > 50) {
          errors.denomination =
            "La dénomination ne peut pas dépasser 50 caractères";
        }
        break;

      case "groupe":
        if (!formData.groupe || formData.groupe.trim() === "") {
          errors.groupe = "Le groupe est obligatoire";
        } else if (formData.groupe.length < 2) {
          errors.groupe = "Le groupe doit contenir au moins 2 caractères";
        } else if (formData.groupe.length > 30) {
          errors.groupe = "Le groupe ne peut pas dépasser 30 caractères";
        }
        break;

      case "calories":
        if (formData.calories < 0) {
          errors.calories = "Les calories ne peuvent pas être négatives";
        } else if (formData.calories > 10000) {
          errors.calories =
            "Les calories ne peuvent pas dépasser 10 000 kcal/100g";
        }
        break;

      case "emoji":
        if (formData.emoji && formData.emoji.length > 10) {
          errors.emoji = "L'emoji ne peut pas dépasser 10 caractères";
        }
        break;

      default:
        break;
    }

    set((state) => ({
      errors: {
        ...state.errors,
        ...errors,
      },
    }));

    return Object.keys(errors).length === 0;
  },

  // Valider tout le formulaire
  validateForm: () => {
    const { validateField } = get();
    const fieldsToValidate = ["denomination", "groupe", "calories", "emoji"];

    let isValid = true;
    fieldsToValidate.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  },

  // Navigation entre les étapes (mobile)
  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 2), // Max 2 étapes (0-2)
    }));
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  },

  setStep: (step) => {
    set({
      currentStep: Math.max(0, Math.min(step, 2)),
    });
  },

  // Définir l'état de soumission
  setSubmitting: (value) => {
    set({ isSubmitting: value });
  },

  // Réinitialiser le formulaire
  resetForm: () => {
    set({
      formData: {
        denomination: "",
        groupe: "",
        emoji: "",
        calories: 0,
      },
      errors: {},
      currentStep: 0,
      isSubmitting: false,
    });
  },

  // Remplir avec des valeurs par défaut
  fillDefaults: () => {
    set({
      formData: {
        denomination: "",
        groupe: "Légumes", // Groupe par défaut
        emoji: "",
        calories: 0,
      },
      errors: {},
      currentStep: 0,
      isSubmitting: false,
    });
  },

  // Pré-remplir le formulaire avec des données (pour l'édition)
  populateForm: (ingredientData) => {
    set({
      formData: {
        denomination: ingredientData.denomination || "",
        groupe: ingredientData.groupe || "",
        emoji: ingredientData.emoji || "",
        calories: ingredientData.calories || 0,
      },
      errors: {},
      currentStep: 0,
      isSubmitting: false,
    });
  },

  // Obtenir les données du formulaire formatées pour la soumission
  getFormattedData: () => {
    const { formData } = get();
    return {
      ...formData,
      denomination: formData.denomination.trim(),
      groupe: formData.groupe.trim(),
      emoji: formData.emoji.trim(),
      // Calories reste tel quel (nombre)
    };
  },

  // Vérifier si le formulaire a des données
  hasData: () => {
    const { formData } = get();
    return (
      formData.denomination.trim() !== "" ||
      formData.groupe.trim() !== "" ||
      formData.emoji.trim() !== "" ||
      formData.calories !== 0
    );
  },

  // Obtenir le pourcentage de completion du formulaire
  getCompletionPercentage: () => {
    const { formData } = get();
    const requiredFields = ["denomination", "groupe"];
    const optionalFields = ["emoji", "calories"];

    let completed = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Champs obligatoires
    requiredFields.forEach((field) => {
      if (formData[field] && formData[field].trim() !== "") {
        completed++;
      }
    });

    // Champs optionnels
    optionalFields.forEach((field) => {
      if (field === "calories") {
        if (formData[field] > 0) {
          completed++;
        }
      } else if (formData[field] && formData[field].trim() !== "") {
        completed++;
      }
    });

    return Math.round((completed / totalFields) * 100);
  },

  // Obtenir des suggestions d'emojis basées sur le groupe
  getEmojiSuggestions: () => {
    const { formData } = get();
    const groupe = formData.groupe.toLowerCase();

    if (groupe.includes("fruit")) {
      return ["🍎", "🍌", "🍇", "🍊", "🥭", "🍓", "🫐", "🍑"];
    }
    if (groupe.includes("légume") || groupe.includes("legume")) {
      return ["🥕", "🥬", "🧅", "🌶️", "🫑", "🥒", "🍅", "🥦"];
    }
    if (groupe.includes("viande")) {
      return ["🥩", "🍗", "🥓", "🐄", "🐷", "🐑", "🦆", "🐔"];
    }
    if (groupe.includes("poisson")) {
      return ["🐟", "🐠", "🦐", "🦀", "🐙", "🍤", "🦞", "🐡"];
    }
    if (groupe.includes("épice") || groupe.includes("epice")) {
      return ["🧂", "🌶️", "🧄", "🫚", "🥄", "⚫", "🌿", "🍃"];
    }

    // Suggestions par défaut
    return ["🥄", "🍽️", "🥫", "🫙", "🌾", "🍬", "🧊", "💧"];
  },

  // Valider l'emoji
  isValidEmoji: (emoji) => {
    if (!emoji) return true; // Emoji optionnel

    // Vérification basique pour les emojis
    const emojiRegex =
      /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(emoji) || emoji.length <= 2;
  },

  // Nettoyer l'emoji (garder seulement le premier caractère/emoji)
  cleanEmoji: (emoji) => {
    if (!emoji) return "";

    // Prendre seulement le premier caractère/emoji
    return [...emoji][0] || "";
  },

  // Obtenir des statistiques nutritionnelles comparatives
  getNutritionStats: () => {
    const { formData } = get();
    const calories = formData.calories;

    let category = "Très faible";
    let color = "text-green-500";

    if (calories >= 500) {
      category = "Très élevé";
      color = "text-red-500";
    } else if (calories >= 200) {
      category = "Élevé";
      color = "text-orange-500";
    } else if (calories >= 50) {
      category = "Modéré";
      color = "text-yellow-500";
    } else if (calories >= 20) {
      category = "Faible";
      color = "text-blue-500";
    }

    return { category, color, calories };
  },

  // Générer un ID unique pour l'ingrédient
  generateIngredientId: () => {
    const { formData } = get();
    const denomination = formData.denomination
      .toLowerCase()
      .replace(/\s+/g, "-");
    const groupe = formData.groupe.toLowerCase().replace(/\s+/g, "-");
    const timestamp = Date.now().toString().slice(-6);

    return `${groupe}-${denomination}-${timestamp}`;
  },
}));

export default useIngredientFormStore;
