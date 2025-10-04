import { useMemo } from "react";
import { useWeek } from "@/toolkits/comptabilite";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📊 Graphique des mouvements de la semaine (Bar Chart)
 * 2 barres: Ventes vs Dépenses
 */
const WeekMovementsChart = ({ weekId, weekInfo }) => {
  const { week, loading, error } = useWeek(weekId);

  // Préparer les données pour le bar chart
  const chartData = useMemo(() => {
    if (!week?.resume) return [];

    return [
      {
        categorie: "Ventes",
        montant: week.resume.chiffre_affaires || 0,
      },
      {
        categorie: "Dépenses",
        montant: week.resume.charges_fixes + week.resume.charges_variables || 0,
      },
    ];
  }, [week]);

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
      {!loading && week?.resume && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300 mb-1">
              Ventes de la semaine
            </p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(week.resume.chiffre_affaires || 0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {week.resume.nombre_transactions} transaction(s)
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300 mb-1">
              Dépenses de la semaine
            </p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(
                week.resume.charges_fixes + week.resume.charges_variables || 0
              )}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Fixes:{" "}
              {new Intl.NumberFormat("fr-FR").format(week.resume.charges_fixes)}{" "}
              • Variables:{" "}
              {new Intl.NumberFormat("fr-FR").format(
                week.resume.charges_variables
              )}
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

      {/* Métriques supplémentaires */}
      {!loading && week?.resume && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance nette
            </span>
            <span
              className={`text-lg font-bold ${
                week.resume.balance_nette >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {week.resume.balance_nette >= 0 ? "+" : ""}
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(week.resume.balance_nette || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Capacité d'autofinancement
            </span>
            <span
              className={`text-lg font-bold ${
                week.resume.capacite_autofinancement >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(week.resume.capacite_autofinancement || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Trésorerie fin de semaine
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(week.resume.tresorerie_fin.total || 0)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WeekMovementsChart;
