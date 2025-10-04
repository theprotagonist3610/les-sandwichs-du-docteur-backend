import { useMemo } from "react";
import { useYear } from "@/toolkits/comptabilite";
import { NOMS_MOIS } from "@/toolkits/comptabilite/constants";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📊 Graphique d'évolution annuelle (Line Chart)
 * 3 lignes: CA, Entrées, Dépenses par mois
 */
const YearMovementsChart = ({ year, yearId }) => {
  const { yearData, loading, error } = useYear(year);

  // Préparer les données pour le line chart (par mois)
  const chartData = useMemo(() => {
    if (!yearData?.resume?.tresorerie_mensuelle) return [];

    return Object.entries(yearData.resume.tresorerie_mensuelle)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([mois, data]) => ({
        mois: NOMS_MOIS[parseInt(mois) - 1].substring(0, 3), // 3 premières lettres
        ca: data.resume.chiffre_affaires || 0,
        entrees: data.resume.total_encaissements.total || 0,
        depenses: data.resume.total_decaissements.total || 0,
      }));
  }, [yearData]);

  // Configuration du graphique
  const chartConfig = {
    xAxisKey: "mois",
    lines: [
      {
        dataKey: "ca",
        stroke: "#3b82f6",
        name: "CA",
        strokeWidth: 3,
      },
      {
        dataKey: "entrees",
        stroke: "#10b981",
        name: "Entrées",
        strokeWidth: 2,
      },
      {
        dataKey: "depenses",
        stroke: "#ef4444",
        name: "Dépenses",
        strokeWidth: 2,
      },
    ],
    showLegend: true,
  };

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Résumé en-tête */}
      {!loading && yearData?.resume && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
              CA Annuel
            </p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(yearData.resume.chiffre_affaires || 0)}
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300 mb-1">
              Entrées
            </p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(yearData.resume.total_encaissements.total || 0)}
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300 mb-1">
              Dépenses
            </p>
            <p className="text-xl font-bold text-red-900 dark:text-red-100">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(yearData.resume.total_decaissements.total || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Graphique */}
      <ChartWrapper
        type="line"
        data={chartData}
        config={chartConfig}
        loading={loading}
        error={error}
        height={300}
      />

      {/* Métriques annuelles */}
      {!loading && yearData?.resume && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Balance nette
              </span>
              <span
                className={`text-base font-bold ${
                  yearData.resume.balance_nette >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  minimumFractionDigits: 0,
                  notation: "compact",
                }).format(yearData.resume.balance_nette || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                CAF
              </span>
              <span
                className={`text-base font-bold ${
                  yearData.resume.capacite_autofinancement >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  minimumFractionDigits: 0,
                  notation: "compact",
                }).format(yearData.resume.capacite_autofinancement || 0)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Trésorerie fin
              </span>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  minimumFractionDigits: 0,
                  notation: "compact",
                }).format(yearData.resume.tresorerie_fin.total || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Taux de marge
              </span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                {yearData.resume.chiffre_affaires > 0
                  ? (
                      (yearData.resume.capacite_autofinancement /
                        yearData.resume.chiffre_affaires) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default YearMovementsChart;
