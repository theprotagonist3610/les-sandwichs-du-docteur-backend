import { useMemo } from "react";
import { useYear } from "@/toolkits/comptabilite";
import { NOMS_MOIS } from "@/toolkits/comptabilite/constants";
import { ChartWrapper } from "../../shared/ChartWrapper";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

/**
 * 📈 Graphique de comparaison avec l'année précédente (Area Chart)
 */
const YearComparisonChart = ({ year, yearId }) => {
  // Année actuelle
  const { yearData: currentYear, loading: currentLoading } = useYear(year);

  // Année précédente
  const { yearData: previousYear, loading: previousLoading } = useYear(
    year - 1
  );

  const loading = currentLoading || previousLoading;

  // Préparer les données pour le graphique (CA mensuel)
  const chartData = useMemo(() => {
    if (!currentYear?.resume?.tresorerie_mensuelle) return [];

    const months = Object.keys(currentYear.resume.tresorerie_mensuelle).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    return months.map((mois) => ({
      mois: NOMS_MOIS[parseInt(mois) - 1].substring(0, 3),
      actuel:
        currentYear.resume.tresorerie_mensuelle[mois]?.resume
          ?.chiffre_affaires || 0,
      precedent:
        previousYear?.resume?.tresorerie_mensuelle?.[mois]?.resume
          ?.chiffre_affaires || 0,
    }));
  }, [currentYear, previousYear]);

  // Configuration du graphique
  const chartConfig = {
    xAxisKey: "mois",
    areas: [
      {
        dataKey: "actuel",
        stroke: "#3b82f6",
        fill: "#3b82f6",
        name: `${year}`,
        fillOpacity: 0.6,
      },
      {
        dataKey: "precedent",
        stroke: "#94a3b8",
        fill: "#94a3b8",
        name: `${year - 1}`,
        fillOpacity: 0.3,
      },
    ],
    showLegend: true,
  };

  // Calculer les variations globales
  const caVariation = useMemo(() => {
    if (!previousYear?.resume?.chiffre_affaires) return 0;
    return (
      (((currentYear?.resume?.chiffre_affaires || 0) -
        previousYear.resume.chiffre_affaires) /
        previousYear.resume.chiffre_affaires) *
      100
    );
  }, [currentYear, previousYear]);

  const chargesVariation = useMemo(() => {
    const currentCharges =
      (currentYear?.resume?.charges_fixes || 0) +
      (currentYear?.resume?.charges_variables || 0);
    const previousCharges =
      (previousYear?.resume?.charges_fixes || 0) +
      (previousYear?.resume?.charges_variables || 0);

    if (!previousCharges) return 0;
    return ((currentCharges - previousCharges) / previousCharges) * 100;
  }, [currentYear, previousYear]);

  const balanceVariation = useMemo(() => {
    if (!previousYear?.resume?.balance_nette) return 0;
    return (
      (((currentYear?.resume?.balance_nette || 0) -
        previousYear.resume.balance_nette) /
        Math.abs(previousYear.resume.balance_nette)) *
      100
    );
  }, [currentYear, previousYear]);

  const cafVariation = useMemo(() => {
    if (!previousYear?.resume?.capacite_autofinancement) return 0;
    return (
      (((currentYear?.resume?.capacite_autofinancement || 0) -
        previousYear.resume.capacite_autofinancement) /
        Math.abs(previousYear.resume.capacite_autofinancement)) *
      100
    );
  }, [currentYear, previousYear]);

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Info année précédente */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Comparaison avec:{" "}
          <span className="font-medium">Exercice {year - 1}</span>
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
      {!loading && currentYear && previousYear && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Δ CA
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
              Δ Charges
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
              Δ Balance
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

          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Δ CAF
            </p>
            <p
              className={`text-lg font-bold ${
                cafVariation >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {cafVariation >= 0 ? "+" : ""}
              {cafVariation.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default YearComparisonChart;
