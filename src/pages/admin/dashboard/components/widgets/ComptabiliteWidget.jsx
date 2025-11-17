/**
 * ComptabiliteWidget - Widget détaillé de la comptabilité
 * Affiche un mini-graphique d'évolution et les dernières opérations
 */

import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import WidgetContainer from "./WidgetContainer";

/**
 * Tooltip personnalisé pour le graphique
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-sm border border-border">
        <p className="font-medium">
          {new Intl.NumberFormat("fr-FR").format(payload[0].value)} FCFA
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Composant ComptabiliteWidget
 */
const ComptabiliteWidget = ({ kpiData, onViewMore }) => {
  const { details, evolutionData = [] } = kpiData;

  const isPositive = details.balanceJour >= 0;

  return (
    <WidgetContainer
      titre="Comptabilité"
      icon={Wallet}
      color="blue"
      onViewMore={onViewMore}
      viewMoreLabel="Détails comptables"
    >
      <div className="space-y-6">
        {/* Mini statistiques */}
        <div className="grid grid-cols-3 gap-4">
          {/* Entrées */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-muted-foreground">Entrées</span>
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(details.entrees)}
            </p>
            <p className="text-xs text-muted-foreground">{details.nbOperations || 0} ops</p>
          </div>

          {/* Sorties */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">Sorties</span>
            </div>
            <p className="text-lg font-bold text-destructive">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(details.sorties)}
            </p>
          </div>

          {/* Balance */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs font-medium text-muted-foreground">Balance</span>
            </div>
            <p
              className={`text-lg font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
            >
              {isPositive ? "+" : ""}
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(details.balanceJour)}
            </p>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </div>
        </div>

        {/* Mini graphique d'évolution */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Évolution 7 jours</h4>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="solde"
                  stroke="#a41624"
                  strokeWidth={3}
                  fill="none"
                  dot={{ r: 3, fill: "#a41624", strokeWidth: 1, stroke: "#fff" }}
                  activeDot={{ r: 5, fill: "#a41624", strokeWidth: 2, stroke: "#fff" }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Solde total */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Solde Total</span>
            <span className="text-xl font-bold text-card-foreground">
              {new Intl.NumberFormat("fr-FR").format(details.soldeTotal)} FCFA
            </span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default ComptabiliteWidget;
