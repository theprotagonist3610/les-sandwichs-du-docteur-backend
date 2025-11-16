/**
 * KPICard - Carte d'affichage d'un indicateur clé de performance
 * Affiche la valeur, l'icône, la variation et le trend d'un KPI
 */

import { motion } from "framer-motion";
import {
  Wallet,
  ShoppingCart,
  Truck,
  ChefHat,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Minus,
} from "lucide-react";

// Map des icônes disponibles
const ICONS = {
  Wallet,
  ShoppingCart,
  Truck,
  ChefHat,
  Package,
  Users,
};

// Map des couleurs
const COLORS = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    border: "border-blue-200",
    accent: "bg-blue-600",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    border: "border-green-200",
    accent: "bg-green-600",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    border: "border-orange-200",
    accent: "bg-orange-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    border: "border-purple-200",
    accent: "bg-purple-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    border: "border-yellow-200",
    accent: "bg-yellow-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    border: "border-indigo-200",
    accent: "bg-indigo-600",
  },
};

/**
 * Formatte la valeur selon le type
 */
const formatValue = (value, format, fractionTotal = null) => {
  if (format === "currency") {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (format === "fraction" && fractionTotal !== null) {
    return `${value}/${fractionTotal}`;
  }

  return value.toString();
};

/**
 * Retourne l'icône de trend appropriée
 */
const getTrendIcon = (trend) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-4 h-4" />;
    case "down":
      return <TrendingDown className="w-4 h-4" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Minus className="w-4 h-4" />;
  }
};

/**
 * Retourne la couleur du trend
 */
const getTrendColor = (trend) => {
  switch (trend) {
    case "up":
      return "text-green-600 bg-green-50";
    case "down":
      return "text-red-600 bg-red-50";
    case "warning":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

/**
 * Composant KPICard
 */
const KPICard = ({
  titre,
  valeur,
  format = "number",
  fractionTotal = null,
  variation = null,
  trend = "neutral",
  icon = "Package",
  color = "blue",
  suffix = null,
  onClick = null,
}) => {
  const Icon = ICONS[icon] || Package;
  const colors = COLORS[color] || COLORS.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg border ${colors.border} bg-white
        shadow-sm hover:shadow-md transition-all duration-300
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {/* Barre d'accent en haut */}
      <div className={`h-1 w-full ${colors.accent}`} />

      <div className="p-6">
        {/* Header avec icône et titre */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>

          {variation !== null && (
            <div
              className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${getTrendColor(trend)}
            `}
            >
              {getTrendIcon(trend)}
              <span>{Math.abs(variation)}%</span>
            </div>
          )}
        </div>

        {/* Valeur principale */}
        <div className="mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(valeur, format, fractionTotal)}
            </span>
            {suffix && format === "currency" && (
              <span className="text-sm font-medium text-gray-600">{suffix}</span>
            )}
          </div>
        </div>

        {/* Titre */}
        <div className="text-sm font-medium text-gray-600">{titre}</div>
      </div>

      {/* Animation de hover */}
      {onClick && (
        <motion.div
          className={`absolute inset-0 ${colors.bg} opacity-0 pointer-events-none`}
          whileHover={{ opacity: 0.05 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};

export default KPICard;
