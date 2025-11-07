import {
  Building2,
  Smartphone,
  Wallet,
  CreditCard,
} from "lucide-react";

/**
 * Mapping des icônes et couleurs par code OHADA
 * Utilisé pour personnaliser l'affichage de chaque type de compte
 */
export const COMPTE_CONFIG = {
  "511": {
    icon: Building2,
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    strokeColor: "#3b82f6",
  },
  "5121": {
    icon: Smartphone,
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    borderColor: "border-green-200",
    strokeColor: "#10b981",
  },
  "531": {
    icon: Wallet,
    color: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
    strokeColor: "#f97316",
  },
};

/**
 * Obtenir la configuration d'un compte selon son code OHADA
 * @param {string} codeOhada - Code OHADA du compte
 * @returns {Object} Configuration du compte (icône, couleurs, etc.)
 */
export const getCompteConfig = (codeOhada) => {
  return COMPTE_CONFIG[codeOhada] || {
    icon: CreditCard,
    color: "gray",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
    strokeColor: "#6b7280",
  };
};

/**
 * Formater un montant en FCFA avec séparateurs de milliers
 * @param {number} montant - Montant à formater
 * @returns {string} Montant formaté (ex: "1 234 567")
 */
export const formatMontant = (montant) => {
  if (typeof montant !== "number") {
    return "0";
  }
  return new Intl.NumberFormat("fr-FR").format(montant);
};

/**
 * Formater un montant complet avec devise
 * @param {number} montant - Montant à formater
 * @returns {string} Montant formaté avec devise (ex: "1 234 567 FCFA")
 */
export const formatMontantComplet = (montant) => {
  return `${formatMontant(montant)} FCFA`;
};

/**
 * Formater un pourcentage
 * @param {number} valeur - Valeur à formater
 * @param {number} decimales - Nombre de décimales (défaut: 1)
 * @returns {string} Pourcentage formaté (ex: "+12.5%")
 */
export const formatPourcentage = (valeur, decimales = 1) => {
  if (typeof valeur !== "number") {
    return "0%";
  }
  const signe = valeur >= 0 ? "+" : "";
  return `${signe}${valeur.toFixed(decimales)}%`;
};

/**
 * Obtenir la couleur d'un indicateur de variation
 * @param {number} variation - Valeur de variation
 * @returns {Object} Classes CSS pour l'indicateur
 */
export const getVariationStyle = (variation) => {
  if (variation >= 0) {
    return {
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      iconColor: "text-green-600",
      type: "positive",
    };
  }
  return {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    iconColor: "text-red-600",
    type: "negative",
  };
};
