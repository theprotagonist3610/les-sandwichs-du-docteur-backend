/*
 - utilise InputGroup de shadcn
 - une icone telephone a gauche, un emoji drapeau ensuite suivi de l'indicatif du pays
 - si le pays est le benin, l'indication est 22901
 - le champ input text suit et ne recois que des caracteres numeriques, pas plus de 8 caracteres
 - phoneTaker retourne un getPhone() qui permet de recuperer en temps reel le numero saisi
 - un petit champ en dessous pour montrer les erreurs et un message "numero valide" si le numero saisi est valide
 - utilise libphonenumber-js
 */
import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const PhoneTaker = ({ onChange, value = "", className = "" }) => {
  const [phoneNumber, setPhoneNumber] = useState(value);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState("");

  const countryCode = "229"; // Bénin
  const prefix = "01"; // Préfixe mobile Bénin
  const flag = "🇧🇯"; // Drapeau Bénin

  useEffect(() => {
    validatePhone(phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    if (value !== phoneNumber) {
      setPhoneNumber(value);
    }
  }, [value]);

  const validatePhone = (number) => {
    if (!number) {
      setError("");
      setIsValid(false);
      return;
    }

    if (number.length < 8) {
      setError("Le numéro doit contenir 8 chiffres");
      setIsValid(false);
      return;
    }

    const fullNumber = `${number}`;

    try {
      console.log(fullNumber);
      const valid = isValidPhoneNumber(fullNumber, "BJ");
      if (valid) {
        setError("");
        setIsValid(true);
      } else {
        setError("Numéro invalide");
        setIsValid(false);
      }
    } catch (err) {
      setError("Format invalide");
      setIsValid(false);
    }
  };

  const handleChange = (e) => {
    const input = e.target.value;
    // N'accepter que les chiffres et limiter à 8 caractères
    const numericInput = input.replace(/\D/g, "").slice(0, 8);
    setPhoneNumber(numericInput);

    // Appeler onChange avec le numéro complet
    if (onChange) {
      const fullNumber =
        numericInput.length === 8
          ? `${countryCode}${prefix}${numericInput}`
          : numericInput;
      onChange(fullNumber);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <InputGroup>
        {/* Icône téléphone */}
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <Phone />
          </InputGroupText>
        </InputGroupAddon>

        {/* Drapeau + Indicatif */}
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <span className="text-base">{flag}</span>
            <span className="font-medium">
              {countryCode}
              {prefix}
            </span>
          </InputGroupText>
        </InputGroupAddon>

        {/* Input pour les 8 chiffres */}
        <InputGroupInput
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={phoneNumber}
          onChange={handleChange}
          placeholder="XX XX XX XX"
          maxLength={8}
          aria-invalid={error ? true : false}
        />
      </InputGroup>

      {/* Message de validation */}
      {phoneNumber && (
        <div
          className={cn(
            "text-xs px-2 py-1 rounded-md",
            isValid
              ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950"
              : error
              ? "text-destructive bg-destructive/10"
              : ""
          )}>
          {isValid ? "✓ Numéro valide" : error}
        </div>
      )}
    </div>
  );
};

export default PhoneTaker;
