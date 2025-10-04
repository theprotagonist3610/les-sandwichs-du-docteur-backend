import { useMemo } from "react";
import { useQuickStats } from "@/toolkits/comptabilite";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📊 Graphique des mouvements du jour (Bar Chart)
 * 2 barres: Ventes vs Dépenses
 */
const DayMovementsChart = ({ date, dateId }) => {
  const { stats, loading, error } = useQuickStats(1);

  // Préparer les données pour le bar chart
  const chartData = useMemo(() => {
    if (!stats) return [];

    return [
      {
        categorie: "Ventes",
        montant: stats.chiffre_affaires || 0,
        color: "#10b981",
      },
      {
        categorie: "Dépenses",
        montant: stats.decaissements || 0,
        color: "#ef4444",
      },
    ];
  }, [stats]);

  // Configuration du graphique
  const chartConfig = {
    xAxisKey: "categorie",
    bars: [
      {
        dataKey: "montant",
        fill: "#3b82f6",
        name: "Montant",
        radius: [8, 8, 0, 0],
      },
    ],
    showLegend: false,
  };

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Résumé en-tête */}
      {!loading && stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300 mb-1">
              Ventes du jour
            </p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(stats.chiffre_affaires || 0)}
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300 mb-1">
              Dépenses du jour
            </p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(stats.decaissements || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Graphique */}
      <ChartWrapper
        type="bar"
        data={chartData}
        config={chartConfig}
        loading={loading}
        error={error}
        height={250}
      />

      {/* Balance nette */}
      {!loading && stats && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance nette du jour
            </span>
            <span
              className={`text-lg font-bold ${
                stats.balance >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {stats.balance >= 0 ? "+" : ""}
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(stats.balance || 0)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DayMovementsChart;
