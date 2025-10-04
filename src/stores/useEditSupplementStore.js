// stores/useEditSupplementStore.js
import { create } from "zustand";

const useEditSupplementStore = create((set, get) => ({
  // État du supplément en édition
  originalSupplement: null,
  editedSupplement: null,
  hasChanges: false,
  isSubmitting: false,

  // Initialiser avec un supplément existant
  initializeSupplement: (supplement) => {
    set({
      originalSupplement: supplement,
      editedSupplement: { ...supplement },
      hasChanges: false,
    });
  },

  // Mettre à jour un champ
  updateField: (field, value) => {
    const { originalSupplement } = get();
    const newSupplement = { ...get().editedSupplement, [field]: value };

    // Vérifier si des changements ont été faits
    const hasChanges =
      JSON.stringify(originalSupplement) !== JSON.stringify(newSupplement);

    set({
      editedSupplement: newSupplement,
      hasChanges,
    });
  },

  // Définir l'état de soumission
  setSubmitting: (value) => set({ isSubmitting: value }),

  // Réinitialiser aux valeurs originales
  resetToOriginal: () => {
    const { originalSupplement } = get();
    set({
      editedSupplement: { ...originalSupplement },
      hasChanges: false,
    });
  },

  // Nettoyer le store
  cleanup: () =>
    set({
      originalSupplement: null,
      editedSupplement: null,
      hasChanges: false,
      isSubmitting: false,
    }),

  // Valider un champ spécifique
  validateField: (field) => {
    const { editedSupplement } = get();

    switch (field) {
      case "denomination":
        if (
          !editedSupplement.denomination ||
          editedSupplement.denomination.trim() === ""
        ) {
          return { valid: false, error: "La dénomination est obligatoire" };
        }
        if (editedSupplement.denomination.length < 3) {
          return {
            valid: false,
            error: "La dénomination doit contenir au moins 3 caractères",
          };
        }
        if (editedSupplement.denomination.length > 100) {
          return {
            valid: false,
            error: "La dénomination ne peut pas dépasser 100 caractères",
          };
        }
        break;

      case "groupe":
        if (!editedSupplement.groupe || editedSupplement.groupe.trim() === "") {
          return { valid: false, error: "Le groupe est obligatoire" };
        }
        break;

      case "prix":
        if (
          editedSupplement.prix === "" ||
          editedSupplement.prix === null ||
          editedSupplement.prix === undefined
        ) {
          return { valid: false, error: "Le prix est obligatoire" };
        }
        if (typeof editedSupplement.prix === "string") {
          if (editedSupplement.prix.toLowerCase() !== "gratuit") {
            return {
              valid: false,
              error: "Le prix doit être un nombre ou 'gratuit'",
            };
          }
        } else if (typeof editedSupplement.prix === "number") {
          if (editedSupplement.prix < 0) {
            return { valid: false, error: "Le prix ne peut pas être négatif" };
          }
          if (editedSupplement.prix > 1000000) {
            return {
              valid: false,
              error: "Le prix ne peut pas dépasser 1 000 000 FCFA",
            };
          }
        }
        break;

      case "imgURL":
        if (editedSupplement.imgURL && editedSupplement.imgURL.trim() !== "") {
          const urlPattern = /^https?:\/\/.+\..+/;
          if (!urlPattern.test(editedSupplement.imgURL)) {
            return { valid: false, error: "L'URL de l'image n'est pas valide" };
          }
        }
        break;

      case "description":
        if (
          editedSupplement.description &&
          editedSupplement.description.length > 1000
        ) {
          return {
            valid: false,
            error: "La description ne peut pas dépasser 1000 caractères",
          };
        }
        break;

      default:
        break;
    }

    return { valid: true, error: null };
  },

  // Valider tout le supplément
  validateSupplement: () => {
    const { validateField } = get();
    const fieldsToValidate = [
      "denomination",
      "groupe",
      "prix",
      "imgURL",
      "description",
    ];

    const errors = {};
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      const validation = validateField(field);
      if (!validation.valid) {
        errors[field] = validation.error;
        isValid = false;
      }
    });

    return { valid: isValid, errors };
  },

  // Obtenir les données formatées pour la soumission
  getFormattedData: () => {
    const { editedSupplement } = get();
    return {
      ...editedSupplement,
      denomination: editedSupplement.denomination?.trim() || "",
      groupe: editedSupplement.groupe?.trim() || "",
      description: editedSupplement.description?.trim() || "",
      imgURL: editedSupplement.imgURL?.trim() || "",
      // Prix reste tel quel (nombre ou "gratuit")
    };
  },

  // Vérifier si le supplément a des données valides
  hasValidData: () => {
    const { editedSupplement } = get();
    return (
      editedSupplement &&
      editedSupplement.denomination?.trim() !== "" &&
      editedSupplement.groupe?.trim() !== "" &&
      (editedSupplement.prix === "gratuit" ||
        (typeof editedSupplement.prix === "number" &&
          editedSupplement.prix >= 0))
    );
  },

  // Obtenir le pourcentage de completion
  getCompletionPercentage: () => {
    const { editedSupplement } = get();
    if (!editedSupplement) return 0;

    const requiredFields = ["denomination", "groupe", "prix"];
    const optionalFields = ["description", "imgURL"];

    let completed = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Champs obligatoires
    requiredFields.forEach((field) => {
      if (field === "prix") {
        if (
          editedSupplement[field] !== 0 &&
          editedSupplement[field] !== "" &&
          editedSupplement[field] !== null &&
          editedSupplement[field] !== undefined
        ) {
          completed++;
        }
      } else if (
        editedSupplement[field] &&
        editedSupplement[field].trim() !== ""
      ) {
        completed++;
      }
    });

    // Champs optionnels
    optionalFields.forEach((field) => {
      if (editedSupplement[field] && editedSupplement[field].trim() !== "") {
        completed++;
      }
    });

    return Math.round((completed / totalFields) * 100);
  },

  // Obtenir un résumé des modifications
  getChangesSummary: () => {
    const { originalSupplement, editedSupplement } = get();
    if (!originalSupplement || !editedSupplement) return [];

    const changes = [];

    Object.keys(editedSupplement).forEach((key) => {
      if (originalSupplement[key] !== editedSupplement[key]) {
        changes.push({
          field: key,
          oldValue: originalSupplement[key],
          newValue: editedSupplement[key],
        });
      }
    });

    return changes;
  },

  // Formater le prix pour l'affichage
  formatPrice: (prix) => {
    if (typeof prix === "string" && prix.toLowerCase() === "gratuit") {
      return "Gratuit";
    }
    if (typeof prix === "number") {
      return `${prix} FCFA`;
    }
    return "Non défini";
  },

  // Vérifier si le prix est gratuit
  isPriceGratuit: () => {
    const { editedSupplement } = get();
    return (
      editedSupplement &&
      typeof editedSupplement.prix === "string" &&
      editedSupplement.prix.toLowerCase() === "gratuit"
    );
  },

  // Définir un prix prédéfini
  setPredefinedPrice: (price) => {
    const { updateField } = get();
    updateField("prix", price);
  },

  // Basculer entre gratuit et un prix numérique
  toggleGratuitPrice: (defaultPrice = 200) => {
    const { editedSupplement, updateField } = get();
    const isCurrentlyGratuit =
      typeof editedSupplement.prix === "string" &&
      editedSupplement.prix.toLowerCase() === "gratuit";

    if (isCurrentlyGratuit) {
      updateField("prix", defaultPrice);
    } else {
      updateField("prix", "gratuit");
    }
  },
}));

export default useEditSupplementStore;
