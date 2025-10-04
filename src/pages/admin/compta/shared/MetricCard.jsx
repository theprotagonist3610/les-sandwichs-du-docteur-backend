import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cardStaggerItem } from "@/lib/animations";
import { formatMontant } from "@/lib/compta-utils";
import { ClotureBadge } from "./ClotureBadge";

/**
 * 📊 Card métrique réutilisable pour Dashboard
 *
 * @param {Object} props
 * @param {string} props.title - Titre de la métrique
 * @param {number} props.value - Valeur principale
 * @param {ReactNode} props.icon - Icône (emoji ou lucide-react)
 * @param {Object} props.trend - Tendance { value: number, direction: 'up'|'down'|'neutral' }
 * @param {string} props.subtitle - Sous-titre optionnel
 * @param {boolean} props.isClosed - Affiche badge "Clôturé"
 * @param {Function} props.onClick - Callback de clic (navigation)
 * @param {boolean} props.loading - État de chargement
 * @param {string} props.className - Classes CSS additionnelles
 */
export const MetricCard = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  isClosed = false,
  onClick,
  loading = false,
  className = "",
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";
    return trend.direction === "up"
      ? "text-green-600 dark:text-green-400"
      : trend.direction === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-gray-600 dark:text-gray-400";
  };

  if (loading) {
    return (
      <motion.div
        variants={cardStaggerItem}
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardStaggerItem}
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm 
        border border-gray-200 dark:border-gray-700
        transition-all duration-200
        ${
          onClick
            ? "cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600"
            : ""
        }
        ${className}
      `}>
      {/* Header avec titre et icône */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </h3>
          {isClosed && <ClotureBadge isClosed={true} />}
        </div>

        <div className="text-2xl ml-2">
          {typeof icon === "string" ? icon : icon}
        </div>
      </div>

      {/* Valeur principale */}
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {typeof value === "number" ? formatMontant(value) : value}
        </p>
      </div>

      {/* Footer avec tendance et subtitle */}
      <div className="flex items-center justify-between">
        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {trend.value.toFixed(1)}%
            </span>
          </div>
        )}

        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 📊 Variant compact pour mobile
 */
export const MetricCardCompact = ({
  title,
  value,
  icon,
  onClick,
  loading = false,
  className = "",
}) => {
  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={cardStaggerItem}
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm
        border border-gray-200 dark:border-gray-700
        ${onClick ? "cursor-pointer active:scale-95" : ""}
        transition-transform duration-150
        ${className}
      `}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{typeof icon === "string" ? icon : icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
            {typeof value === "number" ? formatMontant(value) : value}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
