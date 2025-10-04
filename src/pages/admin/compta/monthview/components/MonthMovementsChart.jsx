import { useMemo } from "react";
import { useMonth } from "@/toolkits/comptabilite";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📊 Graphique des mouvements du mois (Bar Chart)
 * Agrégation par semaines: Charges vs Produits
 */
const MonthMovementsChart = ({ monthData, monthId }) => {
  const {
    monthData: data,
    loading,
    error,
  } = useMonth(monthData.year, monthData.month);

  // Préparer les données pour le bar chart (par semaine)
  const chartData = useMemo(() => {
    if (!data?.weeks) return [];

    return data.weeks.map((week) => ({
      semaine: week.label.split("[")[0].trim(), // Ex: "S01"
      charges: week.resume.charges_fixes + week.resume.charges_variables || 0,
      produits: week.resume.chiffre_affaires || 0,
    }));
  }, [data]);

  // Configuration du graphique
  const chartConfig = {
    xAxisKey: "semaine",
    bars: [
      {
        dataKey: "produits",
        fill: "#10b981",
        name: "Produits",
        radius: [4, 4, 0, 0],
      },
      {
        dataKey: "charges",
        fill: "#ef4444",
        name: "Charges",
        radius: [4, 4, 0, 0],
      },
    ],
    showLegend: true,
  };

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Résumé en-tête */}
      {!loading && data?.resume && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300 mb-1">
              Produits du mois
            </p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(data.resume.chiffre_affaires || 0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {data.weeks?.length || 0} semaine(s)
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300 mb-1">
              Charges du mois
            </p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(
                data.resume.charges_fixes + data.resume.charges_variables || 0
              )}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Fixes:{" "}
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(data.resume.charges_fixes)}{" "}
              • Variables:{" "}
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(data.resume.charges_variables)}
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
        height={280}
      />

      {/* Métriques supplémentaires */}
      {!loading && data?.resume && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance nette
            </span>
            <span
              className={`text-lg font-bold ${
                data.resume.balance_nette >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {data.resume.balance_nette >= 0 ? "+" : ""}
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(data.resume.balance_nette || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Capacité d'autofinancement
            </span>
            <span
              className={`text-lg font-bold ${
                data.resume.capacite_autofinancement >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(data.resume.capacite_autofinancement || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Trésorerie fin de mois
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(data.resume.tresorerie_fin.total || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Taux de marge
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {data.resume.chiffre_affaires > 0
                ? (
                    (data.resume.capacite_autofinancement /
                      data.resume.chiffre_affaires) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MonthMovementsChart;
