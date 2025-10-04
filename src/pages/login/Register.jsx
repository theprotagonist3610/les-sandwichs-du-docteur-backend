// pages/auth/Register.jsx
import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, X, Plus } from "lucide-react";
import { registerUser, useUser } from "@/toolkits/userToolkit";
import { Timestamp } from "firebase/firestore";
import PhoneTaker from "@/components/forms/PhoneTaker";

const Register = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenoms: [""], // Array de prénoms
    sexe: "",
    telephone: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const { user } = useUser();

  // Options pour les selects
  const sexeOptions = [
    { value: "F", label: "Femme" },
    { value: "H", label: "Homme" },
  ];

  const roleOptions = [
    // { value: 'superviseur', label: 'Superviseur' },
    { value: "vendeuse", label: "Vendeuse" },
    { value: "cuisiniere", label: "Cuisinière" },
    { value: "livreur", label: "Livreur" },
  ];

  // Rediriger si déjà connecté
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Gestion des prénoms (tableau)
  const addPrenom = () => {
    setFormData((prev) => ({
      ...prev,
      prenoms: [...prev.prenoms, ""],
    }));
  };

  const removePrenom = (index) => {
    if (formData.prenoms.length > 1) {
      setFormData((prev) => ({
        ...prev,
        prenoms: prev.prenoms.filter((_, i) => i !== index),
      }));
    }
  };

  const updatePrenom = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      prenoms: prev.prenoms.map((prenom, i) => (i === index ? value : prenom)),
    }));
  };

  // Callback pour PhoneTaker
  const handlePhoneChange = (fullPhoneNumber, isValid) => {
    setFormData((prev) => ({
      ...prev,
      telephone: fullPhoneNumber,
    }));
    setIsPhoneValid(isValid);

    // Clear phone error if number becomes valid
    if (isValid && errors.telephone) {
      setErrors((prev) => ({ ...prev, telephone: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nom - uniquement lettres
    if (!formData.nom.trim()) {
      newErrors.nom = "Nom requis";
    } else if (!/^[a-zA-ZÀ-ÿ]+$/.test(formData.nom)) {
      newErrors.nom = "Nom doit contenir uniquement des lettres";
    }

    // Prénoms - array non vide avec éléments valides
    if (!formData.prenoms.length || formData.prenoms.every((p) => !p.trim())) {
      newErrors.prenoms = "Au moins un prénom requis";
    } else if (
      formData.prenoms.some((p) => p.trim() && !/^[a-zA-ZÀ-ÿ\s]+$/.test(p))
    ) {
      newErrors.prenoms = "Les prénoms doivent contenir uniquement des lettres";
    }

    // Sexe
    if (!formData.sexe) {
      newErrors.sexe = "Sexe requis";
    }

    // Role
    if (!formData.role) {
      newErrors.role = "Rôle requis";
    }

    // Téléphone - utiliser la validation de PhoneTaker
    if (!formData.telephone.trim()) {
      newErrors.telephone = "Numéro de téléphone requis";
    } else if (!isPhoneValid) {
      newErrors.telephone = "Numéro de téléphone invalide";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email invalide";
    }

    // Mot de passe
    if (!formData.password) {
      newErrors.password = "Mot de passe requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 caractères";
    }

    // Confirmation mot de passe
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { confirmPassword, ...registerData } = formData;
      // Nettoyer les prénoms (enlever les vides)
      const cleanedData = {
        ...registerData,
        telephone: registerData.telephone.replace(/\+/, ""),
        prenoms: registerData.prenoms.filter((p) => p.trim() !== ""),
        // Extraire seulement les chiffres du numéro pour l'UID (sans indicatif)
        app_id: `user_${registerData.telephone.replace(/\+/, "")}`,
        level: "user",
        status: true,
        createdAt: Timestamp.fromDate(new Date()),
        old_roles: [],
      };

      console.log(cleanedData);

      const result = await registerUser(cleanedData);

      if (result.success) {
        window.location.href = "/";
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Inscription</h2>
        <p className="text-muted-foreground text-sm">
          Créez votre compte pour commencer
        </p>
      </div>

      {errors.submit && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Nom
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              className={`
                w-full pl-10 pr-4 py-3 
                border rounded-lg 
                bg-background text-foreground 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-all duration-200
                ${
                  errors.nom
                    ? "border-destructive focus:ring-destructive/20"
                    : "border-input"
                }
              `}
              placeholder="Dupont"
              disabled={isLoading}
            />
          </div>
          {errors.nom && (
            <p className="text-xs text-destructive">{errors.nom}</p>
          )}
        </div>

        {/* Prénoms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground">
              Prénoms
            </label>
            <button
              type="button"
              onClick={addPrenom}
              className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded hover:opacity-80"
              disabled={isLoading}>
              <Plus className="h-3 w-3 inline mr-1" />
              Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {formData.prenoms.map((prenom, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => updatePrenom(index, e.target.value)}
                    className={`
                    w-full pl-10 pr-4 py-3 
                    border rounded-lg 
                    bg-background text-foreground 
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    transition-all duration-200
                    ${
                      errors.prenoms
                        ? "border-destructive focus:ring-destructive/20"
                        : "border-input"
                    }
                  `}
                    placeholder={`Prénom ${index + 1}`}
                    disabled={isLoading}
                  />
                </div>
                {formData.prenoms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrenom(index)}
                    className="p-3 text-destructive hover:bg-destructive/10 rounded-lg"
                    disabled={isLoading}>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.prenoms && (
            <p className="text-xs text-destructive">{errors.prenoms}</p>
          )}
        </div>

        {/* Sexe */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Sexe
          </label>
          <select
            value={formData.sexe}
            onChange={(e) => handleInputChange("sexe", e.target.value)}
            className={`
              w-full px-4 py-3 
              border rounded-lg 
              bg-background text-foreground 
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-all duration-200
              ${
                errors.sexe
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-input"
              }
            `}
            disabled={isLoading}>
            <option value="">Sélectionner...</option>
            {sexeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.sexe && (
            <p className="text-xs text-destructive">{errors.sexe}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Téléphone avec PhoneTaker */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Numéro de téléphone
          </label>
          <PhoneTaker
            setNumber={handlePhoneChange}
            value={formData.telephone}
            defaultCountry="BJ"
            placeholder="01 23 45 67"
            disabled={isLoading}
            className={errors.telephone ? "phone-error" : ""}
          />
          {errors.telephone && (
            <p className="text-xs text-destructive">{errors.telephone}</p>
          )}
        </div>

        {/* Rôle */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Rôle
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleInputChange("role", e.target.value)}
            className={`
              w-full px-4 py-3 
              border rounded-lg 
              bg-background text-foreground 
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-all duration-200
              ${
                errors.role
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-input"
              }
            `}
            disabled={isLoading}>
            <option value="">Sélectionner un rôle...</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Adresse email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`
              w-full pl-10 pr-4 py-3 
              border rounded-lg 
              bg-background text-foreground 
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-all duration-200
              ${
                errors.email
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-input"
              }
            `}
            placeholder="votre@email.com"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mot de passe */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`
                w-full pl-10 pr-12 py-3 
                border rounded-lg 
                bg-background text-foreground 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-all duration-200
                ${
                  errors.password
                    ? "border-destructive focus:ring-destructive/20"
                    : "border-input"
                }
              `}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}>
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        {/* Confirmer mot de passe */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className={`
                w-full pl-10 pr-12 py-3 
                border rounded-lg 
                bg-background text-foreground 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-all duration-200
                ${
                  errors.confirmPassword
                    ? "border-destructive focus:ring-destructive/20"
                    : "border-input"
                }
              `}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}>
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Bouton d'inscription */}
      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full bg-primary text-primary-foreground 
          py-3 px-4 rounded-lg font-medium
          hover:opacity-90 active:scale-[0.98]
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ">
        {isLoading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Création du compte...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Créer mon compte
          </span>
        )}
      </button>

      {/* Lien vers connexion */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link
            to="/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Register;
