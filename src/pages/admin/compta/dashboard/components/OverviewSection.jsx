import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Calendar,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { cardStaggerContainer } from "@/lib/animations";
import { formatDateForUrl } from "@/lib/compta-utils";
import { useComptaStore } from "@/stores/comptaStore";
import {
  useQuickStats,
  useWeek,
  useMonth,
  useYear,
} from "@/toolkits/comptabilite";
import { MetricCardCompact } from "../../shared/MetricCard";

/**
 * 📊 Section Vue d'ensemble (4 cards)
 * Utilisé dans MobileDashboard
 */
const OverviewSection = () => {
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

  // Données des cards
  const cards = useMemo(
    () => [
      {
        id: "year",
        title: "Année",
        value: yearData?.resume?.chiffre_affaires || 0,
        icon: "📅",
        subtitle: selectedYear,
        loading: yearLoading,
        isClosed: yearData?.cloture || false,
        onClick: () => navigate(`/admin/compta/yearview/${selectedYear}`),
      },
      {
        id: "month",
        title: "Mois",
        value: monthData?.resume?.chiffre_affaires || 0,
        icon: "📆",
        subtitle: monthData?.nom_mois || "",
        loading: monthLoading,
        isClosed: false,
        onClick: () => navigate(`/admin/compta/monthview/${selectedMonth}`),
      },
      {
        id: "week",
        title: "Semaine",
        value: week?.resume?.chiffre_affaires || 0,
        icon: "📋",
        subtitle: week?.label || selectedWeek,
        loading: weekLoading,
        isClosed: week?.cloture || false,
        onClick: () => navigate(`/admin/compta/weekview/${selectedWeek}`),
      },
      {
        id: "day",
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
        onClick: () => navigate(`/admin/compta/dayview/${selectedDate}`),
      },
    ],
    [
      dayStats,
      week,
      monthData,
      yearData,
      dayLoading,
      weekLoading,
      monthLoading,
      yearLoading,
      selectedDate,
      selectedWeek,
      selectedMonth,
      selectedYear,
      navigate,
    ]
  );

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Vue d'ensemble
      </h2>

      <motion.div
        variants={cardStaggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <MetricCardCompact
            key={card.id}
            title={card.title}
            value={card.value}
            icon={card.icon}
            onClick={card.onClick}
            loading={card.loading}
          />
        ))}
      </motion.div>
    </section>
  );
};

export default OverviewSection;
