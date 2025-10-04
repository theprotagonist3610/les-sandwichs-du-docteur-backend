import { useMemo } from "react";
import { useQuickStats } from "@/toolkits/comptabilite";
import { calculateAverageDays } from "@/lib/compta-utils";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📈 Graphique de comparaison avec la moyenne des 30 derniers jours
 */
const DayComparisonChart = ({ date, dateId }) => {
  // Stats du jour
  const { stats: dayStats, loading: dayLoading } = useQuickStats(1);

  // Stats des 30 derniers jours pour calculer la moyenne
  const { stats: monthStats, loading: monthLoading } = useQuickStats(30);

  const loading = dayLoading || monthLoading;

  // Calculer la moyenne
  const averageCA = useMemo(() => {
    if (!monthStats) return 0;
    return monthStats.chiffre_affaires / 30;
  }, [monthStats]);

  const averageExpenses = useMemo(() => {
    if (!monthStats) return 0;
    return monthStats.decaissements / 30;
  }, [monthStats]);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    if (!dayStats) return [];

    return [
      {
        categorie: "Ventes",
        aujourdhui: dayStats.chiffre_affaires || 0,
        moyenne: averageCA,
      },
      {
        categorie: "Dépenses",
        aujourdhui: dayStats.decaissements || 0,
        moyenne: averageExpenses,
      },
    ];
  }, [dayStats, averageCA, averageExpenses]);

  // Configuration du graphique
  const chartConfig = {
    xAxisKey: "categorie",
    bars: [
      {
        dataKey: "aujourdhui",
        fill: "#3b82f6",
        name: "Aujourd'hui",
        radius: [8, 8, 0, 0],
      },
      {
        dataKey: "moyenne",
        fill: "#94a3b8",
        name: "Moyenne 30j",
        radius: [8, 8, 0, 0],
      },
    ],
    showLegend: true,
  };

  // Calculer les variations
  const caVariation = useMemo(() => {
    if (averageCA === 0) return 0;
    return (((dayStats?.chiffre_affaires || 0) - averageCA) / averageCA) * 100;
  }, [dayStats, averageCA]);

  const expensesVariation = useMemo(() => {
    if (averageExpenses === 0) return 0;
    return (
      (((dayStats?.decaissements || 0) - averageExpenses) / averageExpenses) *
      100
    );
  }, [dayStats, averageExpenses]);

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Graphique */}
      <ChartWrapper
        type="bar"
        data={chartData}
        config={chartConfig}
        loading={loading}
        height={250}
      />

      {/* Variations */}
      {!loading && dayStats && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Variation CA
            </p>
            <p
              className={`text-lg font-bold ${
                caVariation >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {caVariation >= 0 ? "+" : ""}
              {caVariation.toFixed(1)}%
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Variation Dépenses
            </p>
            <p
              className={`text-lg font-bold ${
                expensesVariation <= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {expensesVariation >= 0 ? "+" : ""}
              {expensesVariation.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DayComparisonChart;
