// stores/useSupplementFormStore.js
import { create } from "zustand";

const useSupplementFormStore = create((set, get) => ({
  // État du formulaire
  formData: {
    denomination: "",
    groupe: "",
    description: "",
    prix: 0, // peut être un nombre ou "gratuit"
    imgURL: "",
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
        } else if (formData.denomination.length < 3) {
          errors.denomination =
            "La dénomination doit contenir au moins 3 caractères";
        } else if (formData.denomination.length > 100) {
          errors.denomination =
            "La dénomination ne peut pas dépasser 100 caractères";
        }
        break;

      case "groupe":
        if (!formData.groupe || formData.groupe.trim() === "") {
          errors.groupe = "Le groupe est obligatoire";
        } else if (formData.groupe.length < 2) {
          errors.groupe = "Le groupe doit contenir au moins 2 caractères";
        }
        break;

      case "prix":
        if (
          formData.prix === "" ||
          formData.prix === null ||
          formData.prix === undefined
        ) {
          errors.prix = "Le prix est obligatoire";
        } else if (typeof formData.prix === "string") {
          if (formData.prix.toLowerCase() !== "gratuit") {
            errors.prix = "Le prix doit être un nombre ou 'gratuit'";
          }
        } else if (typeof formData.prix === "number") {
          if (formData.prix < 0) {
            errors.prix = "Le prix ne peut pas être négatif";
          } else if (formData.prix > 1000000) {
            errors.prix = "Le prix ne peut pas dépasser 1 000 000 FCFA";
          }
        } else {
          errors.prix = "Format de prix invalide";
        }
        break;

      case "imgURL":
        if (formData.imgURL && formData.imgURL.trim() !== "") {
          const urlPattern = /^https?:\/\/.+\..+/;
          if (!urlPattern.test(formData.imgURL)) {
            errors.imgURL = "L'URL de l'image n'est pas valide";
          }
        }
        break;

      case "description":
        if (formData.description && formData.description.length > 1000) {
          errors.description =
            "La description ne peut pas dépasser 1000 caractères";
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
    const fieldsToValidate = [
      "denomination",
      "groupe",
      "prix",
      "imgURL",
      "description",
    ];

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
      currentStep: Math.min(state.currentStep + 1, 3), // Max 3 étapes (0-3)
    }));
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  },

  setStep: (step) => {
    set({
      currentStep: Math.max(0, Math.min(step, 3)),
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
        description: "",
        prix: 0,
        imgURL: "",
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
        groupe: "Services divers", // Groupe par défaut
        description: "",
        prix: 0,
        imgURL: "",
      },
      errors: {},
      currentStep: 0,
      isSubmitting: false,
    });
  },

  // Pré-remplir le formulaire avec des données (pour l'édition)
  populateForm: (supplementData) => {
    set({
      formData: {
        denomination: supplementData.denomination || "",
        groupe: supplementData.groupe || "",
        description: supplementData.description || "",
        prix: supplementData.prix || 0,
        imgURL: supplementData.imgURL || "",
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
      description: formData.description.trim(),
      imgURL: formData.imgURL.trim(),
      // Prix reste tel quel (nombre ou "gratuit")
    };
  },

  // Vérifier si le formulaire a des données
  hasData: () => {
    const { formData } = get();
    return (
      formData.denomination.trim() !== "" ||
      formData.groupe.trim() !== "" ||
      formData.description.trim() !== "" ||
      formData.prix !== 0 ||
      formData.imgURL.trim() !== ""
    );
  },

  // Obtenir le pourcentage de completion du formulaire
  getCompletionPercentage: () => {
    const { formData } = get();
    const requiredFields = ["denomination", "groupe", "prix"];
    const optionalFields = ["description", "imgURL"];

    let completed = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Champs obligatoires
    requiredFields.forEach((field) => {
      if (field === "prix") {
        if (
          formData[field] !== 0 &&
          formData[field] !== "" &&
          formData[field] !== null
        ) {
          completed++;
        }
      } else if (formData[field] && formData[field].trim() !== "") {
        completed++;
      }
    });

    // Champs optionnels
    optionalFields.forEach((field) => {
      if (formData[field] && formData[field].trim() !== "") {
        completed++;
      }
    });

    return Math.round((completed / totalFields) * 100);
  },
}));

export default useSupplementFormStore;
