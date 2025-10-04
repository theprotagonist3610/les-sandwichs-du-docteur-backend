import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cardStaggerContainer } from "@/lib/animations";
import { useComptaStore } from "@/stores/comptaStore";
import {
  useQuickStats,
  useWeek,
  useMonth,
  useYear,
} from "@/toolkits/comptabilite";
import { MetricCard } from "../../shared/MetricCard";
import {
  EvolutionCAChart,
  ChargesProduitChart,
  ComparisonChart,
  ModePaiementChart,
} from "../../shared/ChartWrapper";

/**
 * 📊 Onglet Graphique (Desktop)
 * Grid 4x1: chaque ligne = card à gauche + graphique à droite
 */
const GraphicTab = () => {
  const navigate = useNavigate();
  const { selectedDate, selectedWeek, selectedMonth, selectedYear } =
    useComptaStore();

  // Hooks pour charger les données
  const { stats: dayStats, loading: dayLoading } = useQuickStats(1);
  const { week, loading: weekLoading } = useWeek(selectedWeek);
  const { monthData, loading: monthLoading } = useMonth(
    parseInt(selectedYear),
    parseInt(selectedMonth?.split("-")[0])
  );
  const { yearData, loading: yearLoading } = useYear(parseInt(selectedYear));

  // Préparer les données pour les graphiques

  // 1. Année - Line Chart (Évolution mensuelle CA)
  const yearChartData = useMemo(() => {
    if (!yearData?.resume?.tresorerie_mensuelle) return [];

    return Object.entries(yearData.resume.tresorerie_mensuelle).map(
      ([mois, data]) => ({
        mois: data.nom_mois,
        ca: data.resume.chiffre_affaires,
        entrees: data.resume.total_encaissements.total,
        depenses: data.resume.total_decaissements.total,
      })
    );
  }, [yearData]);

  // 2. Mois - Bar Chart (Charges vs Produits par semaine)
  const monthChartData = useMemo(() => {
    if (!monthData?.weeks) return [];

    return monthData.weeks.map((week) => ({
      periode: week.label,
      charges: week.resume.charges_fixes + week.resume.charges_variables,
      produits: week.resume.chiffre_affaires,
    }));
  }, [monthData]);

  // 3. Semaine - Area Chart (Comparaison avec semaine précédente)
  const weekChartData = useMemo(() => {
    // TODO: Implémenter la comparaison avec la semaine précédente
    // Pour l'instant, données mock
    if (!week?.transactions) return [];

    const dailyData = {};
    week.transactions.forEach((t) => {
      const date = new Date(t.date).toLocaleDateString("fr-FR", {
        weekday: "short",
      });
      if (!dailyData[date]) {
        dailyData[date] = { jour: date, actuel: 0, precedent: 0 };
      }
      dailyData[date].actuel += t.type === "entree" ? t.montant : 0;
    });

    return Object.values(dailyData);
  }, [week]);

  // 4. Jour - Pie Chart (Modes de paiement)
  const dayChartData = useMemo(() => {
    if (!dayStats?.tresorerie_actuelle) return [];

    return [
      { mode: "Caisse", montant: dayStats.tresorerie_actuelle.caisse },
      {
        mode: "Mobile Money",
        montant: dayStats.tresorerie_actuelle.mobile_money,
      },
      { mode: "Banque", montant: dayStats.tresorerie_actuelle.banque },
    ].filter((item) => item.montant > 0);
  }, [dayStats]);

  const sections = [
    {
      id: "year",
      card: {
        title: "Année",
        value: yearData?.resume?.chiffre_affaires || 0,
        icon: "📅",
        subtitle: selectedYear,
        loading: yearLoading,
        isClosed: yearData?.cloture || false,
        trend: null, // TODO: Calculer la tendance
        onClick: () => navigate(`/admin/compta/yearview/${selectedYear}`),
      },
      chart: {
        component: EvolutionCAChart,
        data: yearChartData,
        loading: yearLoading,
      },
    },
    {
      id: "month",
      card: {
        title: "Mois",
        value: monthData?.resume?.chiffre_affaires || 0,
        icon: "📆",
        subtitle: monthData?.nom_mois || "",
        loading: monthLoading,
        isClosed: false,
        trend: null,
        onClick: () => navigate(`/admin/compta/monthview/${selectedMonth}`),
      },
      chart: {
        component: ChargesProduitChart,
        data: monthChartData,
        loading: monthLoading,
      },
    },
    {
      id: "week",
      card: {
        title: "Semaine",
        value: week?.resume?.chiffre_affaires || 0,
        icon: "📋",
        subtitle: week?.label || selectedWeek,
        loading: weekLoading,
        isClosed: week?.cloture || false,
        trend: null,
        onClick: () => navigate(`/admin/compta/weekview/${selectedWeek}`),
      },
      chart: {
        component: ComparisonChart,
        data: weekChartData,
        loading: weekLoading,
      },
    },
    {
      id: "day",
      card: {
        title: "Aujourd'hui",
        value: dayStats?.chiffre_affaires || 0,
        icon: "📝",
        subtitle: new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        loading: dayLoading,
        isClosed: false,
        trend: null,
        onClick: () => navigate(`/admin/compta/dayview/${selectedDate}`),
      },
      chart: {
        component: ModePaiementChart,
        data: dayChartData,
        loading: dayLoading,
      },
    },
  ];

  return (
    <motion.div
      variants={cardStaggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6">
      {sections.map((section) => {
        const ChartComponent = section.chart.component;

        return (
          <div
            key={section.id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card à gauche */}
            <MetricCard {...section.card} />

            {/* Graphique à droite */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <ChartComponent
                data={section.chart.data}
                loading={section.chart.loading}
              />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default GraphicTab;
