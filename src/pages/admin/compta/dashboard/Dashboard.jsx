import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useBreakpoint from "@/hooks/useBreakpoint";
import { pageVariants, pageTransition } from "@/lib/animations";
import { getCurrentPeriods } from "@/lib/compta-utils";
import { useComptaStore } from "@/stores/comptaStore";
import { OfflineBanner } from "../shared/OfflineBadge";
import { SyncIndicator } from "../shared/SyncIndicator";
import MobileDashboard from "./MobileDashboard";
import DesktopDashboard from "./DesktopDashboard";

/**
 * 📊 Dashboard principal - Point d'entrée
 * Détecte le breakpoint et affiche la vue appropriée
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const {
    setSelectedDate,
    setSelectedWeek,
    setSelectedMonth,
    setSelectedYear,
  } = useComptaStore();

  // Initialiser les périodes au chargement
  useEffect(() => {
    const periods = getCurrentPeriods();
    setSelectedDate(periods.day);
    setSelectedWeek(periods.week);
    setSelectedMonth(periods.month);
    setSelectedYear(periods.year);
  }, [setSelectedDate, setSelectedWeek, setSelectedMonth, setSelectedYear]);

  return (
    <>
      {/* Banner hors ligne */}
      <OfflineBanner />

      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  📊 Tableau de bord
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Vue d'ensemble de votre comptabilité
                </p>
              </div>

              {/* Indicateur de sync */}
              <SyncIndicator className="hidden sm:flex" />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isMobile ? <MobileDashboard /> : <DesktopDashboard />}
        </div>
      </motion.div>
    </>
  );
};

export default Dashboard;
