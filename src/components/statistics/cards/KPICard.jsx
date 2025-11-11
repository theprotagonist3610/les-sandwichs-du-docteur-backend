import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carte KPI avec valeur, tendance et icône
 * @param {string} title - Titre du KPI
 * @param {string|number} value - Valeur principale
 * @param {string} trend - Tendance: "hausse" | "baisse" | "stable"
 * @param {number} trendValue - Valeur de la tendance en %
 * @param {ReactNode} icon - Icône du KPI
 * @param {string} color - Couleur: "green" | "blue" | "purple" | "orange" | "red"
 * @param {string} subtitle - Sous-titre optionnel
 */
const KPICard = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  color = "blue",
  subtitle,
  className,
}) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-50 text-gray-600",
  };

  const getTrendIcon = () => {
    if (trend === "hausse") return <TrendingUp className="h-4 w-4" />;
    if (trend === "baisse") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === "hausse") return "text-green-600 bg-green-50";
    if (trend === "baisse") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>

            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}

            {trend && trendValue !== undefined && (
              <div className={cn("flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium inline-flex", getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {trendValue > 0 ? "+" : ""}
                  {trendValue.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {icon && (
            <div className={cn("p-3 rounded-full", colorClasses[color])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
