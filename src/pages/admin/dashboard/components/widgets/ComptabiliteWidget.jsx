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
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
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
  const { details } = kpiData;

  // Données simulées pour le graphique (7 derniers jours)
  // TODO: Remplacer par vraies données depuis le toolkit
  const evolutionData = [
    { jour: "L", solde: 2200000 },
    { jour: "M", solde: 2280000 },
    { jour: "M", solde: 2150000 },
    { jour: "J", solde: 2320000 },
    { jour: "V", solde: 2400000 },
    { jour: "S", solde: 2380000 },
    { jour: "D", solde: 2450000 },
  ];

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
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Entrées</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(details.entrees)}
            </p>
            <p className="text-xs text-gray-500">{details.nbOperations || 0} ops</p>
          </div>

          {/* Sorties */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-gray-600">Sorties</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(details.sorties)}
            </p>
          </div>

          {/* Balance */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs font-medium text-gray-600">Balance</span>
            </div>
            <p
              className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}
              {new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(details.balanceJour)}
            </p>
            <p className="text-xs text-gray-500">Aujourd'hui</p>
          </div>
        </div>

        {/* Mini graphique d'évolution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Évolution 7 jours</h4>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="solde"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Solde total */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Solde Total</span>
            <span className="text-xl font-bold text-gray-900">
              {new Intl.NumberFormat("fr-FR").format(details.soldeTotal)} FCFA
            </span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default ComptabiliteWidget;
