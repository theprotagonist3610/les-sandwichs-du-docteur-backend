import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
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
 * @param {string} hint - Texte d'aide/explication (tooltip)
 */
const KPICard = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  color = "blue",
  subtitle,
  hint,
  className,
}) => {
  const getTrendIcon = () => {
    if (trend === "hausse") return <TrendingUp className="h-4 w-4" />;
    if (trend === "baisse") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium opacity-70">{title}</p>
              {hint && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 opacity-50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{hint}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">{value}</p>

            {subtitle && (
              <p className="text-xs opacity-70 mt-1">{subtitle}</p>
            )}

            {trend && trendValue !== undefined && (
              <div className="flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium inline-flex border">
                {getTrendIcon()}
                <span>
                  {trendValue > 0 ? "+" : ""}
                  {trendValue.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {icon && (
            <div className="p-3 rounded-full border">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
