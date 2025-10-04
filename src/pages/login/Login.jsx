import { useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { loginUser, useUser } from "@/toolkits/userToolkit";
import PhoneTaker, { usePhoneNumber } from "@/components/forms/PhoneTaker";
import MiniLoader from "@/components/loaders/MiniLoader";
const Login = () => {
  // Utilisation du hook usePhoneNumber pour gérer le téléphone
  const {
    phoneNumber,
    isValid: phoneIsValid,
    handlePhoneChange,
  } = usePhoneNumber("", "BJ"); // Initialisation avec code pays Bénin par défaut

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { user } = useUser();
  const location = useLocation();

  // Rediriger si déjà connecté
  if (user) {
    const from = location.state?.from || "/";
    return <Navigate to={from} replace />;
  }

  const validateForm = () => {
    const newErrors = {};

    // Validation email
    if (!credentials.email.trim()) {
      newErrors.email = "Email requis";
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = "Format email invalide";
    }

    // Validation téléphone avec le hook
    if (!phoneNumber || phoneNumber.length < 7) {
      newErrors.telephone = "Numéro de téléphone requis";
    } else if (!phoneIsValid) {
      newErrors.telephone = "Numéro de téléphone invalide";
    }

    // Validation mot de passe
    if (!credentials.password) {
      newErrors.password = "Mot de passe requis";
    } else if (credentials.password.length < 1) {
      newErrors.password = "Minimum 1 caractère";
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
      console.log("=== DONNÉES DE CONNEXION ===");
      console.log("Email:", credentials.email);
      console.log("Téléphone:", phoneNumber);
      console.log("Téléphone valide:", phoneIsValid);
      console.log("Password length:", credentials.password?.length);

      const result = await loginUser({
        email: credentials.email,
        telephone: phoneNumber, // Utilise le phoneNumber du hook
        password: credentials.password,
      });

      if (result.success) {
        console.log("✅ Connexion réussie");
        const from = location.state?.from || "/";
        window.location.href = from; // Force redirect pour refresh l'app
      } else {
        console.error("❌ Échec connexion:", result.error);
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error("❌ Erreur connexion:", error);
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pour l'email avec clear des erreurs
  const handleEmailChange = (e) => {
    setCredentials((prev) => ({
      ...prev,
      email: e.target.value,
    }));
    // Clear error when user types
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Handler pour le mot de passe avec clear des erreurs
  const handlePasswordChange = (e) => {
    setCredentials((prev) => ({
      ...prev,
      password: e.target.value,
    }));
    // Clear error when user types
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  // Wrapper pour handlePhoneChange avec gestion des erreurs
  const handlePhoneChangeWithErrorClear = (fullNumber, isValid) => {
    handlePhoneChange(fullNumber, isValid);
    // Clear error when user types
    if (errors.telephone) {
      setErrors((prev) => ({ ...prev, telephone: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Connexion</h2>
        <p className="text-muted-foreground text-sm">
          Connectez-vous à votre compte
        </p>
      </div>

      {/* Erreur générale */}
      {errors.submit && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* Champ Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Adresse email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <input
            type="email"
            value={credentials.email}
            onChange={handleEmailChange}
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
            autoComplete="email"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      {/* Champ Téléphone avec PhoneTaker */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Numéro de téléphone
        </label>
        <PhoneTaker
          setNumber={handlePhoneChangeWithErrorClear}
          value={phoneNumber}
          defaultCountry="BJ"
          placeholder="66 00 00 00"
          disabled={isLoading}
          className={errors.telephone ? "error" : ""}
        />
        {errors.telephone && (
          <p className="text-xs text-destructive mt-1">{errors.telephone}</p>
        )}
        {/* Indicateur de validation en temps réel */}
        {phoneNumber && phoneNumber.length > 7 && !errors.telephone && (
          <p className="text-xs text-green-600 mt-1">
            {phoneIsValid
              ? "✓ Numéro valide"
              : "⚠ Numéro en cours de saisie..."}
          </p>
        )}
      </div>

      {/* Champ Mot de passe */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <input
            type={showPassword ? "text" : "password"}
            value={credentials.password}
            onChange={handlePasswordChange}
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
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
            disabled={isLoading}>
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive mt-1">{errors.password}</p>
        )}
      </div>

      {/* Options supplémentaires */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2 rounded border-input"
            defaultChecked
          />
          <span className="text-muted-foreground">Se souvenir de moi</span>
        </label>
        <Link
          to="/forgot-password"
          className="text-primary hover:text-primary/80 transition-colors">
          Mot de passe oublié ?
        </Link>
      </div>

      {/* Bouton de connexion */}
      <button
        type="submit"
        disabled={isLoading || !phoneIsValid}
        className={`
                w-full bg-primary text-primary-foreground 
                py-3 px-4 rounded-lg font-medium
                hover:opacity-90 active:scale-[0.98]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              `}>
        {isLoading ? (
          <MiniLoader />
        ) : (
          <span className="flex items-center justify-center">
            <LogIn className="h-4 w-4 mr-2" />
            Se connecter
          </span>
        )}
      </button>

      {/* Lien vers inscription */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-primary/80 font-medium transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Login;
