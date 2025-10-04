import { useMemo } from "react";
import { useWeek } from "@/toolkits/comptabilite";
import { SemaineModel } from "@/toolkits/comptabilite";
import { dateUtils } from "@/toolkits/comptabilite/utils/dates";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📈 Graphique de comparaison avec la semaine précédente (Area Chart)
 */
const WeekComparisonChart = ({ weekId, weekInfo }) => {
  const currentYear = dateUtils.getCurrentYear();

  // Semaine actuelle
  const { week: currentWeek, loading: currentLoading } = useWeek(weekId);

  // Semaine précédente
  const previousWeekInfo = SemaineModel.getPreviousWeek(currentYear, weekId);
  const { week: previousWeek, loading: previousLoading } = useWeek(
    previousWeekInfo?.weekId
  );

  const loading = currentLoading || previousLoading;

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    if (!currentWeek?.resume) return [];

    return [
      {
        categorie: "CA",
        actuel: currentWeek.resume.chiffre_affaires || 0,
        precedent: previousWeek?.resume?.chiffre_affaires || 0,
      },
      {
        categorie: "Charges",
        actuel:
          currentWeek.resume.charges_fixes +
            currentWeek.resume.charges_variables || 0,
        precedent:
          (previousWeek?.resume?.charges_fixes || 0) +
          (previousWeek?.resume?.charges_variables || 0),
      },
      {
        categorie: "Balance",
        actuel: currentWeek.resume.balance_nette || 0,
        precedent: previousWeek?.resume?.balance_nette || 0,
      },
    ];
  }, [currentWeek, previousWeek]);

  // Configuration du graphique
  const chartConfig = {
    xAxisKey: "categorie",
    areas: [
      {
        dataKey: "actuel",
        stroke: "#3b82f6",
        fill: "#3b82f6",
        name: "Semaine actuelle",
        fillOpacity: 0.6,
      },
      {
        dataKey: "precedent",
        stroke: "#94a3b8",
        fill: "#94a3b8",
        name: "Semaine précédente",
        fillOpacity: 0.3,
      },
    ],
    showLegend: true,
  };

  // Calculer les variations
  const caVariation = useMemo(() => {
    if (!previousWeek?.resume?.chiffre_affaires) return 0;
    return (
      (((currentWeek?.resume?.chiffre_affaires || 0) -
        previousWeek.resume.chiffre_affaires) /
        previousWeek.resume.chiffre_affaires) *
      100
    );
  }, [currentWeek, previousWeek]);

  const chargesVariation = useMemo(() => {
    const currentCharges =
      (currentWeek?.resume?.charges_fixes || 0) +
      (currentWeek?.resume?.charges_variables || 0);
    const previousCharges =
      (previousWeek?.resume?.charges_fixes || 0) +
      (previousWeek?.resume?.charges_variables || 0);

    if (!previousCharges) return 0;
    return ((currentCharges - previousCharges) / previousCharges) * 100;
  }, [currentWeek, previousWeek]);

  const balanceVariation = useMemo(() => {
    if (!previousWeek?.resume?.balance_nette) return 0;
    return (
      (((currentWeek?.resume?.balance_nette || 0) -
        previousWeek.resume.balance_nette) /
        Math.abs(previousWeek.resume.balance_nette)) *
      100
    );
  }, [currentWeek, previousWeek]);

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Info semaine précédente */}
      {previousWeekInfo && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Comparaison avec:{" "}
            <span className="font-medium">{previousWeekInfo.label}</span>
          </p>
        </div>
      )}

      {/* Graphique */}
      <ChartWrapper
        type="area"
        data={chartData}
        config={chartConfig}
        loading={loading}
        height={250}
      />

      {/* Variations */}
      {!loading && currentWeek && previousWeek && (
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

export default WeekComparisonChart;
