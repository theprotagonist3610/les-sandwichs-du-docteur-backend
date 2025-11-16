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

// Map des couleurs adaptées au thème
const COLORS = {
  blue: {
    bg: "bg-primary/10",
    icon: "text-primary",
    border: "border-primary/20",
    accent: "bg-primary",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    accent: "bg-green-600 dark:bg-green-500",
  },
  orange: {
    bg: "bg-accent/20",
    icon: "text-accent-foreground",
    border: "border-accent/30",
    accent: "bg-accent",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    accent: "bg-purple-600 dark:bg-purple-500",
  },
  yellow: {
    bg: "bg-accent/20",
    icon: "text-accent-foreground",
    border: "border-accent/30",
    accent: "bg-accent",
  },
  indigo: {
    bg: "bg-primary/10",
    icon: "text-primary",
    border: "border-primary/20",
    accent: "bg-primary",
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
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20";
    case "down":
      return "text-destructive bg-destructive/10";
    case "warning":
      return "text-accent-foreground bg-accent/20";
    default:
      return "text-muted-foreground bg-muted";
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
        relative overflow-hidden rounded-lg border ${colors.border} bg-card
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
            <span className="text-3xl font-bold text-card-foreground">
              {formatValue(valeur, format, fractionTotal)}
            </span>
            {suffix && format === "currency" && (
              <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
            )}
          </div>
        </div>

        {/* Titre */}
        <div className="text-sm font-medium text-muted-foreground">{titre}</div>
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
