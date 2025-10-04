import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cardStaggerContainer } from "@/lib/animations";
import { useComptaStore } from "@/stores/comptaStore";
import { MetricCard } from "../shared/MetricCard";
import { SyncIndicatorCompact } from "../shared/SyncIndicator";
import OverviewSection from "./components/OverviewSection";
import TransactionsSection from "./components/TransactionsSection";

/**
 * 📱 Dashboard Mobile
 * Disposition verticale: Vue d'ensemble (4 cards) + Transactions du jour
 */
const MobileDashboard = () => {
  const navigate = useNavigate();
  const { selectedDate, selectedWeek, selectedMonth, selectedYear } =
    useComptaStore();

  return (
    <div className="space-y-6">
      {/* Indicateur de sync (mobile) */}
      <div className="flex justify-end">
        <SyncIndicatorCompact />
      </div>

      {/* Section Vue d'ensemble */}
      <OverviewSection />

      {/* Section Transactions */}
      <TransactionsSection />
    </div>
  );
};

export default MobileDashboard;
