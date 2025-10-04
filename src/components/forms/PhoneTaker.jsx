// components/forms/PhoneTaker.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Phone, ChevronDown } from "lucide-react";
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountryCallingCode,
  formatIncompletePhoneNumber,
} from "libphonenumber-js";

/**
 * Composant de saisie de numéro de téléphone avec gestion des indicatifs
 * Intègre libphonenumber.js pour la validation
 * Règle spéciale pour le Bénin (229) : commence par "22901" + 8 chiffres
 *
 * @param {Function} setNumber - Callback pour mettre à jour le numéro dans le formulaire parent
 * @param {string} value - Valeur actuelle (optionnelle)
 * @param {string} defaultCountry - Code pays par défaut (ex: "BJ" pour Bénin)
 * @param {string} placeholder - Placeholder pour l'input
 * @param {boolean} disabled - Si le composant est désactivé
 * @param {string} className - Classes CSS additionnelles
 * @param {Function} onValidation - Callback pour la validation (optionnel)
 */
const PhoneTaker = ({
  setNumber,
  value = "",
  defaultCountry = "BJ",
  placeholder,
  disabled = false,
  className = "",
  onValidation,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [phoneInput, setPhoneInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  // Liste des pays avec leurs codes et indicatifs
  const countries = useMemo(
    () => [
      { code: "BJ", name: "Bénin", flag: "🇧🇯", callingCode: "229" },
      { code: "FR", name: "France", flag: "🇫🇷", callingCode: "33" },
      { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", callingCode: "225" },
      { code: "SN", name: "Sénégal", flag: "🇸🇳", callingCode: "221" },
      { code: "ML", name: "Mali", flag: "🇲🇱", callingCode: "223" },
      { code: "BF", name: "Burkina Faso", flag: "🇧🇫", callingCode: "226" },
      { code: "NE", name: "Niger", flag: "🇳🇪", callingCode: "227" },
      { code: "TG", name: "Togo", flag: "🇹🇬", callingCode: "228" },
      { code: "NG", name: "Nigeria", flag: "🇳🇬", callingCode: "234" },
      { code: "GH", name: "Ghana", flag: "🇬🇭", callingCode: "233" },
      { code: "MA", name: "Maroc", flag: "🇲🇦", callingCode: "212" },
      { code: "DZ", name: "Algérie", flag: "🇩🇿", callingCode: "213" },
      { code: "TN", name: "Tunisie", flag: "🇹🇳", callingCode: "216" },
      { code: "US", name: "États-Unis", flag: "🇺🇸", callingCode: "1" },
      { code: "CA", name: "Canada", flag: "🇨🇦", callingCode: "1" },
      { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", callingCode: "44" },
      { code: "DE", name: "Allemagne", flag: "🇩🇪", callingCode: "49" },
      { code: "ES", name: "Espagne", flag: "🇪🇸", callingCode: "34" },
      { code: "IT", name: "Italie", flag: "🇮🇹", callingCode: "39" },
    ],
    []
  );

  const selectedCountryData = useMemo(() => {
    return countries.find((country) => country.code === selectedCountry);
  }, [countries, selectedCountry]);

  // Initialiser avec la valeur existante si fournie
  useEffect(() => {
    if (value) {
      try {
        if (value.startsWith("+22901")) {
          // Numéro béninois spécial - NE PAS inclure le préfixe dans l'input
          setSelectedCountry("BJ");
          setPhoneInput(value.slice(6)); // Enlever "+22901"
        } else if (value.startsWith("+229")) {
          // Autre format béninois possible
          setSelectedCountry("BJ");
          setPhoneInput(value.slice(4)); // Enlever "+229"
        } else if (value.startsWith("+")) {
          // Autres pays
          const parsedNumber = parsePhoneNumber(value);
          if (parsedNumber) {
            setSelectedCountry(parsedNumber.country);
            setPhoneInput(parsedNumber.nationalNumber);
          } else {
            // Si le parsing échoue, enlever juste le "+"
            setPhoneInput(value.slice(1));
          }
        } else {
          // Pas de préfixe international, garder tel quel
          setPhoneInput(value);
        }
      } catch (error) {
        // Si le parsing échoue, utiliser la valeur sans préfixe
        const cleanValue = value.replace(/^\+\d+/, ""); // Enlever tout préfixe international
        setPhoneInput(cleanValue);
      }
    }
  }, [value]);

  // Validation spécifique pour le Bénin
  const validateBeninNumber = (input) => {
    if (
      selectedCountry === "BJ" &&
      selectedCountryData?.callingCode === "229"
    ) {
      if (input.length < 8) {
        return "Le numéro béninois doit contenir 8 chiffres";
      }
      if (input.length > 8) {
        return "Le numéro béninois ne peut dépasser 8 chiffres";
      }
    }
    return "";
  };

  // Formater et valider le numéro
  const formatAndValidate = (input, countryCode) => {
    let formattedInput = input;
    let validationError = "";

    try {
      // Validation spécifique Bénin
      if (countryCode === "BJ") {
        validationError = validateBeninNumber(input);
        if (validationError) {
          return {
            formattedInput: input,
            error: validationError,
            isValid: false,
          };
        }

        // Pour le Bénin, le numéro complet est +22901 + input (sans ajouter 229 dans l'input!)
        const fullNumber = `+22901${input}`;
        const isValid = input.length === 8;

        return {
          formattedInput: input,
          error: "",
          isValid,
          fullNumber: fullNumber,
        };
      }

      // Pour les autres pays
      const callingCode = getCountryCallingCode(countryCode);
      const fullNumber = `+${callingCode}${input}`;

      // Formater le numéro avec libphonenumber (optionnel, peut être désactivé)
      // if (input.length > 2) {
      //   const formatted = formatIncompletePhoneNumber(input, countryCode);
      //   formattedInput = formatted || input;
      // }

      // Garder l'input tel quel sans formatage automatique
      formattedInput = input;

      // Valider le numéro complet
      const isValid =
        input.length >= 8 ? isValidPhoneNumber(fullNumber, countryCode) : false;

      if (input.length >= 8 && !isValid) {
        validationError = "Numéro de téléphone invalide";
      }

      return {
        formattedInput,
        error: validationError,
        isValid,
        fullNumber: fullNumber,
      };
    } catch (error) {
      return {
        formattedInput: input,
        error: "Format de numéro invalide",
        isValid: false,
      };
    }
  };

  // Gérer les changements d'input
  const handleInputChange = (e) => {
    let input = e.target.value.replace(/[^\d]/g, ""); // Garder seulement les chiffres

    // Règle spéciale pour le Bénin : maximum 8 chiffres
    if (
      selectedCountry === "BJ" &&
      selectedCountryData?.callingCode === "229"
    ) {
      if (input.length > 8) {
        input = input.slice(0, 8);
      }
    }

    const validation = formatAndValidate(input, selectedCountry);

    setPhoneInput(input); // Toujours garder l'input propre, sans préfixe
    setError(validation.error);

    // Callback vers le parent avec le numéro complet
    if (setNumber) {
      const fullNumber =
        validation.fullNumber ||
        (selectedCountry === "BJ"
          ? `+22901${input}`
          : `+${selectedCountryData?.callingCode}${input}`);
      setNumber(fullNumber, validation.isValid);
    }

    // Callback de validation optionnel
    if (onValidation) {
      onValidation(validation.isValid, validation.error);
    }
  };

  // Gérer le changement de pays
  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    setIsOpen(false);

    // Réinitialiser l'input et re-valider
    if (phoneInput) {
      // Conserver le numéro et revalider avec le nouveau pays
      const validation = formatAndValidate(phoneInput, countryCode);
      setError(validation.error);

      if (setNumber) {
        const newCountryData = countries.find((c) => c.code === countryCode);
        const fullNumber =
          countryCode === "BJ"
            ? `+22901${phoneInput}`
            : `+${newCountryData?.callingCode}${phoneInput}`;
        setNumber(fullNumber, validation.isValid);
      }
    } else {
      // Si pas de numéro, juste envoyer le préfixe
      setError("");
      if (setNumber) {
        const newCountryData = countries.find((c) => c.code === countryCode);
        if (countryCode === "BJ") {
          setNumber("+22901", false);
        } else {
          setNumber(`+${newCountryData?.callingCode}`, false);
        }
      }
    }
  };

  // Placeholder dynamique
  const getPlaceholder = () => {
    if (placeholder) return placeholder;

    if (selectedCountry === "BJ") {
      return "66 00 00 00";
    }

    return "Numéro de téléphone";
  };

  // Affichage du préfixe complet pour le Bénin
  const getDisplayPrefix = () => {
    if (selectedCountry === "BJ") {
      return `${selectedCountryData?.flag} +22901`;
    }
    return `${selectedCountryData?.flag} +${selectedCountryData?.callingCode}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Container avec bordure unifiée */}
      <div
        className={`
          flex items-center border rounded-lg bg-background
          focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent
          transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            error
              ? "border-destructive focus-within:ring-destructive/20"
              : "border-input"
          }
        `}>
        {/* Sélecteur de pays */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              flex items-center px-3 py-3 
              bg-transparent hover:bg-accent/50 transition-colors
              focus:outline-none rounded-l-lg
              ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}>
            <span className="text-sm mr-2 whitespace-nowrap">
              {getDisplayPrefix()}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
          </button>

          {/* Dropdown des pays */}
          {isOpen && !disabled && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              {/* Menu */}
              <div
                className="
                absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto
                bg-popover border border-border rounded-lg shadow-lg z-20
              ">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountryChange(country.code)}
                    className={`
                      w-full flex items-center px-3 py-2 text-left text-sm
                      hover:bg-accent transition-colors
                      ${selectedCountry === country.code ? "bg-accent" : ""}
                    `}>
                    <span className="mr-3">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {country.code === "BJ"
                        ? "+22901"
                        : `+${country.callingCode}`}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Séparateur visuel */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Input du numéro */}
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="tel"
            value={phoneInput}
            onChange={handleInputChange}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={`
              w-full pl-10 pr-4 py-3 
              bg-transparent text-foreground 
              focus:outline-none
              rounded-r-lg
              ${disabled ? "cursor-not-allowed" : ""}
            `}
          />
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <p className="text-xs text-destructive mt-1 flex items-center">
          <span>{error}</span>
        </p>
      )}

      {/* Info pour le Bénin */}
      {selectedCountry === "BJ" && !error && phoneInput.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Numéro complet : +22901{phoneInput}
        </p>
      )}
    </div>
  );
};

export default PhoneTaker;

// Hook pour utiliser PhoneTaker dans un formulaire
export const usePhoneNumber = (initialValue = "", initialCountry = "BJ") => {
  const [phoneNumber, setPhoneNumber] = useState(initialValue);
  const [isValid, setIsValid] = useState(false);

  const handlePhoneChange = (fullNumber, valid) => {
    setPhoneNumber(fullNumber);
    setIsValid(valid);
  };

  return {
    phoneNumber,
    isValid,
    handlePhoneChange,
  };
};

// Exemple d'utilisation dans un formulaire
/*
import PhoneTaker, { usePhoneNumber } from './components/forms/PhoneTaker';

const MyForm = () => {
  const { phoneNumber, isValid, handlePhoneChange } = usePhoneNumber();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      console.log('Numéro valide:', phoneNumber);
      // Pour le Bénin: phoneNumber sera "+2290166000000" (sans forcer 229 dans l'input)
      // L'utilisateur tape juste "66000000"
      // Envoyer le formulaire
    } else {
      console.log('Numéro invalide');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Numéro de téléphone
        </label>
        <PhoneTaker 
          setNumber={handlePhoneChange}
          defaultCountry="BJ"
          placeholder="66 00 00 00"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={!isValid}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
      >
        Valider
      </button>
    </form>
  );
};
*/
