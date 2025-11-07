/**
 * comptesFormatters.js
 * Utilitaires de formatage pour les comptes comptables
 */

import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CreditCard,
  Briefcase,
  DollarSign,
  FileText,
  ShoppingCart,
  Truck,
  Building,
  Zap,
  Shield,
  Phone,
  Activity,
  Calculator,
} from "lucide-react";

// ============================================================================
// CONFIGURATION DES ICÔNES PAR CATÉGORIE OHADA
// ============================================================================

/**
 * Mapping des codes OHADA vers des configurations visuelles
 * Basé sur le plan comptable OHADA pour les PME
 */
export const COMPTE_OHADA_CONFIG = {
  // Classe 1 : Comptes de capitaux
  "101": { icon: DollarSign, color: "purple", strokeColor: "#9333ea", category: "Capitaux" },
  "108": { icon: Users, color: "purple", strokeColor: "#a855f7", category: "Capitaux" },

  // Classe 2 : Comptes d'immobilisations
  "2183": { icon: Package, color: "indigo", strokeColor: "#6366f1", category: "Immobilisations" },
  "2184": { icon: Briefcase, color: "indigo", strokeColor: "#818cf8", category: "Immobilisations" },
  "2186": { icon: Truck, color: "indigo", strokeColor: "#4f46e5", category: "Immobilisations" },

  // Classe 3 : Comptes de stocks
  "31": { icon: ShoppingCart, color: "blue", strokeColor: "#3b82f6", category: "Stocks" },
  "32": { icon: Package, color: "blue", strokeColor: "#60a5fa", category: "Stocks" },
  "37": { icon: FileText, color: "blue", strokeColor: "#2563eb", category: "Stocks" },

  // Classe 4 : Comptes de tiers
  "401": { icon: Users, color: "orange", strokeColor: "#f97316", category: "Tiers" },
  "4091": { icon: CreditCard, color: "orange", strokeColor: "#fb923c", category: "Tiers" },
  "411": { icon: Users, color: "green", strokeColor: "#10b981", category: "Tiers" },
  "421": { icon: Briefcase, color: "orange", strokeColor: "#f59e0b", category: "Tiers" },
  "4456": { icon: Calculator, color: "red", strokeColor: "#ef4444", category: "Tiers" },
  "4457": { icon: Calculator, color: "green", strokeColor: "#22c55e", category: "Tiers" },
  "467": { icon: FileText, color: "gray", strokeColor: "#6b7280", category: "Tiers" },

  // Classe 6 : Comptes de charges
  "601": { icon: ShoppingCart, color: "red", strokeColor: "#dc2626", category: "Charges" },
  "602": { icon: Package, color: "red", strokeColor: "#ef4444", category: "Charges" },
  "604": { icon: Zap, color: "red", strokeColor: "#f87171", category: "Charges" },
  "611": { icon: Truck, color: "red", strokeColor: "#dc2626", category: "Charges" },
  "613": { icon: Building, color: "red", strokeColor: "#b91c1c", category: "Charges" },
  "615": { icon: Zap, color: "red", strokeColor: "#ef4444", category: "Charges" },
  "616": { icon: Shield, color: "red", strokeColor: "#dc2626", category: "Charges" },
  "623": { icon: Activity, color: "red", strokeColor: "#f87171", category: "Charges" },
  "625": { icon: Truck, color: "red", strokeColor: "#dc2626", category: "Charges" },
  "626": { icon: Phone, color: "red", strokeColor: "#ef4444", category: "Charges" },
  "627": { icon: Briefcase, color: "red", strokeColor: "#dc2626", category: "Charges" },
  "628": { icon: FileText, color: "red", strokeColor: "#f87171", category: "Charges" },
  "635": { icon: Calculator, color: "red", strokeColor: "#b91c1c", category: "Charges" },
  "641": { icon: Users, color: "red", strokeColor: "#dc2626", category: "Charges" },
  "651": { icon: DollarSign, color: "red", strokeColor: "#ef4444", category: "Charges" },
  "658": { icon: FileText, color: "red", strokeColor: "#f87171", category: "Charges" },

  // Classe 7 : Comptes de produits
  "701": { icon: TrendingUp, color: "green", strokeColor: "#16a34a", category: "Produits" },
  "707": { icon: ShoppingCart, color: "green", strokeColor: "#22c55e", category: "Produits" },
  "758": { icon: DollarSign, color: "green", strokeColor: "#10b981", category: "Produits" },
};

/**
 * Récupère la configuration d'un compte par son code OHADA
 * @param {string} codeOhada - Code OHADA du compte (ex: "701", "601")
 * @returns {Object} Configuration avec icon, color, strokeColor, category
 */
export function getCompteOhadaConfig(codeOhada) {
  return (
    COMPTE_OHADA_CONFIG[codeOhada] || {
      icon: FileText,
      color: "gray",
      strokeColor: "#6b7280",
      category: "Autre",
    }
  );
}

/**
 * Détermine l'icône de tendance basée sur la variation
 * @param {number} variation - Variation en pourcentage
 * @returns {Object} Icône (TrendingUp ou TrendingDown)
 */
export function getTendanceIcon(variation) {
  return variation >= 0 ? TrendingUp : TrendingDown;
}

/**
 * Détermine la couleur de la variation
 * @param {number} variation - Variation en pourcentage
 * @param {string} categorieCompte - "entree" ou "sortie"
 * @returns {string} Classe CSS de couleur
 */
export function getVariationColor(variation, categorieCompte) {
  // Pour les comptes d'entrée : augmentation = positif (vert)
  // Pour les comptes de sortie : augmentation = négatif (rouge)
  if (categorieCompte === "entree") {
    return variation >= 0 ? "text-green-600" : "text-red-600";
  } else {
    return variation >= 0 ? "text-red-600" : "text-green-600";
  }
}

/**
 * Formate un montant en FCFA
 * @param {number} montant - Montant à formater
 * @returns {string} Montant formaté (ex: "150 000")
 */
export function formatMontant(montant) {
  if (typeof montant !== "number") return "0";
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant));
}

/**
 * Formate un pourcentage
 * @param {number} pourcentage - Pourcentage à formater
 * @returns {string} Pourcentage formaté (ex: "+12.5%", "-3.2%")
 */
export function formatPourcentage(pourcentage) {
  if (typeof pourcentage !== "number" || isNaN(pourcentage)) return "0%";

  const signe = pourcentage > 0 ? "+" : "";
  const valeur = pourcentage.toFixed(1);
  return `${signe}${valeur}%`;
}

/**
 * Formate une date timestamp en format court
 * @param {number} timestamp - Timestamp en millisecondes
 * @returns {string} Date formatée (ex: "15 Jan")
 */
export function formatDateCourte(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Formate une date timestamp en format complet
 * @param {number} timestamp - Timestamp en millisecondes
 * @returns {string} Date formatée (ex: "15 janvier 2024")
 */
export function formatDateComplete(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Obtient le label de catégorie en français
 * @param {string} categorie - "entree" ou "sortie"
 * @returns {string} Label formaté
 */
export function getCategorieLabel(categorie) {
  return categorie === "entree" ? "Entrée" : "Sortie";
}

/**
 * Obtient le label de type d'opération
 * @param {string} type - "entree" ou "sortie"
 * @returns {string} Label formaté avec emoji
 */
export function getTypeOperationLabel(type) {
  return type === "entree" ? "📈 Entrée" : "📉 Sortie";
}

/**
 * Groupe les comptes par catégorie OHADA
 * @param {Array} comptes - Liste des comptes
 * @returns {Object} Comptes groupés par catégorie
 */
export function grouperComptesParCategorie(comptes) {
  return comptes.reduce((acc, compte) => {
    const config = getCompteOhadaConfig(compte.code_ohada);
    const categorie = config.category;

    if (!acc[categorie]) {
      acc[categorie] = [];
    }
    acc[categorie].push(compte);
    return acc;
  }, {});
}

/**
 * Filtre les comptes par catégorie (entree/sortie)
 * @param {Array} comptes - Liste des comptes
 * @param {string} categorie - "entree" ou "sortie"
 * @returns {Array} Comptes filtrés
 */
export function filtrerComptesParCategorie(comptes, categorie) {
  if (!categorie) return comptes;
  return comptes.filter((c) => c.categorie === categorie);
}

/**
 * Calcule le total des soldes pour une liste de comptes
 * @param {Array} comptes - Liste des comptes avec soldes
 * @returns {number} Total des soldes
 */
export function calculerTotalSoldes(comptes) {
  return comptes.reduce((total, compte) => total + (compte.solde || 0), 0);
}
