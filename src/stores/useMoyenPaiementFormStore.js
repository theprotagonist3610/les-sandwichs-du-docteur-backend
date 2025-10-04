import { create } from "zustand";
import { TYPES_PAIEMENT } from "@/toolkits/moyenPaiementToolkit";

const initialFormData = {
  type: TYPES_PAIEMENT.ESPECES,
  numero: "",
  groupe: "",
  denomination: "",
  actif: true,
};

const useMoyenPaiementFormStore = create((set, get) => ({
  formData: { ...initialFormData },
  errors: {},
  currentStep: 0,
  isSubmitting: false,

  updateField: (field, value) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
      errors: { ...state.errors, [field]: "" },
    }));
  },

  validateField: (field) => {
    const { formData } = get();
    const errors = {};

    switch (field) {
      case "denomination":
        if (
          formData.type !== TYPES_PAIEMENT.ESPECES &&
          !formData.denomination.trim()
        ) {
          errors.denomination =
            "La dénomination est optionnelle mais recommandée";
        }
        break;
      case "numero":
        if (
          formData.type !== TYPES_PAIEMENT.ESPECES &&
          !formData.numero.trim()
        ) {
          errors.numero = "Le numéro est obligatoire";
        } else if (formData.numero.length < 3) {
          errors.numero = "Minimum 3 caractères";
        }
        break;
      case "groupe":
        if (formData.type !== TYPES_PAIEMENT.ESPECES && !formData.groupe) {
          errors.groupe = "Le groupe est obligatoire";
        }
        break;
    }

    set((state) => ({
      errors: { ...state.errors, ...errors },
    }));

    return Object.keys(errors).length === 0;
  },

  validateForm: () => {
    const { formData } = get();
    const errors = {};

    // Validation selon le type
    if (formData.type === TYPES_PAIEMENT.ESPECES) {
      // Espèces ne nécessite aucune validation supplémentaire
    } else {
      // Mobile et Bancaire nécessitent un numéro et un groupe
      if (!formData.numero.trim()) {
        errors.numero = "Le numéro est obligatoire";
      }
      if (!formData.groupe) {
        errors.groupe = "Le groupe est obligatoire";
      }
    }

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 2) {
      set({ currentStep: currentStep + 1 });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  setStep: (step) => {
    set({ currentStep: step });
  },

  setSubmitting: (isSubmitting) => {
    set({ isSubmitting });
  },

  resetForm: () => {
    set({
      formData: { ...initialFormData },
      errors: {},
      currentStep: 0,
      isSubmitting: false,
    });
  },

  fillDefaults: () => {
    set((state) => ({
      formData: { ...state.formData, ...initialFormData },
    }));
  },
}));

export default useMoyenPaiementFormStore;
