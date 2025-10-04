// components/AjouterUser.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import useBreakpoint from "@/hooks/useBreakpoint";
import { addUser, validateUserData } from "@/toolkits/userToolkit";
import { useLoader } from "@/context/LoaderContext";
import { Check, Mail, User, Briefcase, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import PhoneTaker, { usePhoneNumber } from "@/components/forms/PhoneTaker";

/**
 * Composant de champ de formulaire avec validation visuelle
 */
const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  isValid,
  children,
  icon: Icon,
  required = true,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      <div className="relative">
        {Icon && !children && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}

        {children || (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3 border rounded-lg bg-background text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-all duration-200
              ${Icon ? "pl-10" : "pl-4"}
              ${
                error
                  ? "border-destructive focus:ring-destructive/20 pr-10"
                  : isValid && value
                  ? "border-green-500 focus:ring-green-500/20 pr-10"
                  : "border-input"
              }
            `}
          />
        )}

        {/* Indicateur de validation pour les inputs classiques */}
        {!children && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {error ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : isValid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : null}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

/**
 * Composant spécial pour les champs avec validation externe (comme PhoneTaker)
 */
const FormFieldWithExternalValidation = ({
  label,
  children,
  error,
  isValid,
  required = true,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      <div className="relative">
        {children}

        {/* Indicateur de validation externe */}
        {isValid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

/**
 * Composant principal AjouterUser
 */
const AjouterUser = ({ onSuccess, onCancel, className = "" }) => {
  const { isMobile, isDesktop } = useBreakpoint(1024);
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();

  // Hook pour gérer le numéro de téléphone
  const {
    phoneNumber,
    isValid: phoneIsValid,
    handlePhoneChange,
  } = usePhoneNumber();

  // État du formulaire
  const [formData, setFormData] = useState({
    email: "",
    sexe: "H",
    fonction: "vendeuse",
  });

  // État des erreurs de validation
  const [errors, setErrors] = useState({});

  // État de validation des champs
  const [fieldValidation, setFieldValidation] = useState({
    email: false,
    telephone: false,
    sexe: true, // Toujours valide car sélection
    fonction: true, // Toujours valide car sélection
  });

  // État du formulaire
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Key pour forcer la réinitialisation de PhoneTaker
  const [phoneKey, setPhoneKey] = React.useState(0);

  // Options pour les sélects
  const sexeOptions = [
    { value: "H", label: "Homme" },
    { value: "F", label: "Femme" },
  ];

  const fonctionOptions = [
    { value: "superviseur", label: "Superviseur" },
    { value: "vendeuse", label: "Vendeuse" },
    { value: "cuisiniere", label: "Cuisinière" },
    { value: "livreur", label: "Livreur" },
  ];

  // Fonction de réinitialisation du formulaire
  const resetForm = React.useCallback(() => {
    setFormData({
      email: "",
      sexe: "H",
      fonction: "vendeuse",
    });

    setErrors({});

    setFieldValidation({
      email: false,
      telephone: false,
      sexe: true,
      fonction: true,
    });
  }, []);

  // Modifier resetForm pour inclure la réinitialisation de PhoneTaker
  const resetFormWithPhone = React.useCallback(() => {
    resetForm();
    setPhoneKey((prev) => prev + 1); // Force le remount de PhoneTaker
  }, [resetForm]);

  // Actions par défaut
  const defaultOnSuccess = React.useCallback(() => {
    navigate("/admin/users/users/");
  }, [navigate]);

  const defaultOnCancel = React.useCallback(() => {
    resetFormWithPhone();
  }, [resetFormWithPhone]);

  // Utiliser les fonctions fournies ou les actions par défaut
  const handleSuccess = onSuccess || defaultOnSuccess;
  const handleCancel = onCancel || defaultOnCancel;

  // Synchroniser la validation du téléphone avec l'état global
  React.useEffect(() => {
    setFieldValidation((prev) => ({
      ...prev,
      telephone: phoneIsValid,
    }));
  }, [phoneIsValid]);

  // Validation en temps réel pour l'email (optimisée avec useMemo)
  const validationResult = React.useMemo(() => {
    const newErrors = {};
    const newFieldValidation = { ...fieldValidation };

    // Validation email
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Format d'email invalide";
        newFieldValidation.email = false;
      } else {
        newFieldValidation.email = true;
      }
    } else {
      newFieldValidation.email = false;
    }

    // La validation du téléphone est gérée par PhoneTaker
    // Conserver l'état actuel du téléphone
    newFieldValidation.telephone = fieldValidation.telephone;

    // Sexe et fonction toujours valides (sélection)
    newFieldValidation.sexe = true;
    newFieldValidation.fonction = true;

    return { errors: newErrors, fieldValidation: newFieldValidation };
  }, [formData.email, fieldValidation.telephone]);

  // Mise à jour des états basée sur la validation mémorisée
  React.useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      email: validationResult.errors.email,
    }));
    setFieldValidation(validationResult.fieldValidation);
  }, [validationResult]);

  // Gestion des changements de champs (mémorisée pour éviter les re-renders)
  const handleInputChange = React.useCallback((field) => {
    return (e) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };
  }, []);

  // Handlers mémorisés pour chaque champ
  const handleEmailChange = React.useMemo(
    () => handleInputChange("email"),
    [handleInputChange]
  );
  const handleSexeChange = React.useMemo(
    () => handleInputChange("sexe"),
    [handleInputChange]
  );
  const handleFonctionChange = React.useMemo(
    () => handleInputChange("fonction"),
    [handleInputChange]
  );

  // Callback pour la validation du téléphone depuis PhoneTaker
  const handlePhoneValidation = React.useCallback((isValid, errorMessage) => {
    setErrors((prev) => ({
      ...prev,
      telephone: errorMessage,
    }));
  }, []);

  // Validation finale avant soumission
  const validateForm = () => {
    const formDataWithPhone = {
      ...formData,
      telephone: phoneNumber,
    };

    const validation = validateUserData(formDataWithPhone);
    if (!validation.isValid) {
      const newErrors = {};
      validation.errors.forEach((error) => {
        if (error.includes("Email")) newErrors.email = error;
        if (error.includes("Téléphone")) newErrors.telephone = error;
        if (error.includes("Sexe")) newErrors.sexe = error;
        if (error.includes("Fonction")) newErrors.fonction = error;
      });
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  // Soumission du formulaire (mémorisée)
  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault();

      const formDataWithPhone = {
        ...formData,
        telephone: phoneNumber.replace(/\+/, ""),
      };

      if (!validateForm()) {
        toast.error("Veuillez corriger les erreurs du formulaire");
        return;
      }

      setIsSubmitting(true);
      showLoader("Création de l'utilisateur...");

      try {
        const result = await addUser(formDataWithPhone);

        if (result.success) {
          toast.success("Utilisateur créé avec succès !");

          // Réinitialiser complètement le formulaire avec PhoneTaker
          resetFormWithPhone();

          handleSuccess(result);
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
        toast.error("Une erreur inattendue s'est produite");
      } finally {
        setIsSubmitting(false);
        hideLoader();
      }
    },
    [
      formData,
      phoneNumber,
      showLoader,
      hideLoader,
      handleSuccess,
      resetFormWithPhone,
    ]
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Ajouter un utilisateur
        </h2>
        <p className="text-sm text-muted-foreground">
          Pré-créer un compte utilisateur qui pourra ensuite s'inscrire
        </p>
      </div>

      {/* Email */}
      <FormField
        label="Adresse email"
        type="email"
        value={formData.email}
        onChange={handleEmailChange}
        placeholder="utilisateur@example.com"
        error={errors.email}
        isValid={fieldValidation.email}
        icon={Mail}
      />

      {/* Téléphone avec PhoneTaker */}
      <FormFieldWithExternalValidation
        label="Numéro de téléphone"
        error={errors.telephone}
        isValid={fieldValidation.telephone}>
        <PhoneTaker
          key={phoneKey}
          setNumber={handlePhoneChange}
          defaultCountry="BJ"
          placeholder="Votre numéro de téléphone"
          onValidation={handlePhoneValidation}
          className="w-full"
        />
      </FormFieldWithExternalValidation>

      {/* Sexe */}
      <FormField
        label="Sexe"
        error={errors.sexe}
        isValid={fieldValidation.sexe}
        icon={User}>
        <select
          value={formData.sexe}
          onChange={handleSexeChange}
          className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
          {sexeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Fonction */}
      <FormField
        label="Fonction"
        error={errors.fonction}
        isValid={fieldValidation.fonction}
        icon={Briefcase}>
        <select
          value={formData.fonction}
          onChange={handleFonctionChange}
          className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
          {fonctionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <button
          type="submit"
          disabled={
            isSubmitting || !Object.values(fieldValidation).every(Boolean)
          }
          className="
            flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium
            hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center justify-center space-x-2
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ">
          <User className="h-4 w-4" />
          <span>{isSubmitting ? "Création..." : "Créer l'utilisateur"}</span>
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="
            px-6 py-3 border border-border rounded-lg font-medium
            text-foreground hover:bg-accent hover:text-accent-foreground
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ">
          Annuler
        </button>
      </div>

      {/* Indicateur de progression */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="flex space-x-1">
            {Object.entries(fieldValidation).map(([field, isValid]) => (
              <div
                key={field}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  isValid ? "bg-green-500" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <span>
            {Object.values(fieldValidation).filter(Boolean).length}/4 champs
            valides
          </span>
        </div>
      </div>
    </form>
  );

  return (
    <div className={className}>
      {isMobile ? (
        <ScrollArea className="h-[80vh] w-full">
          <div className="p-4">{renderForm()}</div>
        </ScrollArea>
      ) : (
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg shadow-sm">
          {renderForm()}
        </div>
      )}
    </div>
  );
};

export default AjouterUser;
