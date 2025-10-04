import { useMemo } from "react";
import { useMonth } from "@/toolkits/comptabilite";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { NOMS_MOIS } from "@/toolkits/comptabilite/constants";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📈 Graphique de comparaison avec le mois précédent (Area Chart)
 */
const MonthComparisonChart = ({ monthData, monthId }) => {
  // Mois actuel
  const { monthData: currentMonth, loading: currentLoading } = useMonth(
    monthData.year,
    monthData.month
  );

  // Mois précédent
  const prevMonth = monthData.month === 1 ? 12 : monthData.month - 1;
  const prevYear = monthData.month === 1 ? monthData.year - 1 : monthData.year;
  const { monthData: previousMonth, loading: previousLoading } = useMonth(
    prevYear,
    prevMonth
  );

  const loading = currentLoading || previousLoading;

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    if (!currentMonth?.resume) return [];

    return [
      {
        categorie: "CA",
        actuel: currentMonth.resume.chiffre_affaires || 0,
        precedent: previousMonth?.resume?.chiffre_affaires || 0,
      },
      {
        categorie: "Charges",
        actuel:
          currentMonth.resume.charges_fixes +
            currentMonth.resume.charges_variables || 0,
        precedent:
          (previousMonth?.resume?.charges_fixes || 0) +
          (previousMonth?.resume?.charges_variables || 0),
      },
      {
        categorie: "Balance",
        actuel: currentMonth.resume.balance_nette || 0,
        precedent: previousMonth?.resume?.balance_nette || 0,
      },
    ];
  }, [currentMonth, previousMonth]);

  // Configuration du graphique
  const chartConfig = {
    xAxisKey: "categorie",
    areas: [
      {
        dataKey: "actuel",
        stroke: "#3b82f6",
        fill: "#3b82f6",
        name: "Mois actuel",
        fillOpacity: 0.6,
      },
      {
        dataKey: "precedent",
        stroke: "#94a3b8",
        fill: "#94a3b8",
        name: "Mois précédent",
        fillOpacity: 0.3,
      },
    ],
    showLegend: true,
  };

  // Calculer les variations
  const caVariation = useMemo(() => {
    if (!previousMonth?.resume?.chiffre_affaires) return 0;
    return (
      (((currentMonth?.resume?.chiffre_affaires || 0) -
        previousMonth.resume.chiffre_affaires) /
        previousMonth.resume.chiffre_affaires) *
      100
    );
  }, [currentMonth, previousMonth]);

  const chargesVariation = useMemo(() => {
    const currentCharges =
      (currentMonth?.resume?.charges_fixes || 0) +
      (currentMonth?.resume?.charges_variables || 0);
    const previousCharges =
      (previousMonth?.resume?.charges_fixes || 0) +
      (previousMonth?.resume?.charges_variables || 0);

    if (!previousCharges) return 0;
    return ((currentCharges - previousCharges) / previousCharges) * 100;
  }, [currentMonth, previousMonth]);

  const balanceVariation = useMemo(() => {
    if (!previousMonth?.resume?.balance_nette) return 0;
    return (
      (((currentMonth?.resume?.balance_nette || 0) -
        previousMonth.resume.balance_nette) /
        Math.abs(previousMonth.resume.balance_nette)) *
      100
    );
  }, [currentMonth, previousMonth]);

  const previousMonthName = NOMS_MOIS[prevMonth - 1];

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Info mois précédent */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Comparaison avec:{" "}
          <span className="font-medium">
            {previousMonthName} {prevYear}
          </span>
        </p>
      </div>

      {/* Graphique */}
      <ChartWrapper
        type="area"
        data={chartData}
        config={chartConfig}
        loading={loading}
        height={250}
      />

      {/* Variations */}
      {!loading && currentMonth && previousMonth && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
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
              Variation Charges
            </p>
            <p
              className={`text-lg font-bold ${
                chargesVariation <= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {chargesVariation >= 0 ? "+" : ""}
              {chargesVariation.toFixed(1)}%
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Variation Balance
            </p>
            <p
              className={`text-lg font-bold ${
                balanceVariation >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {balanceVariation >= 0 ? "+" : ""}
              {balanceVariation.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MonthComparisonChart;
