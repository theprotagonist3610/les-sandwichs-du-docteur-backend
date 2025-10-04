import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { pageVariants, pageTransition } from "@/lib/animations";
import { formatDateDisplay } from "@/lib/compta-utils";
import { dateUtils } from "@/toolkits/comptabilite/utils/dates";
import { NOMS_MOIS } from "@/toolkits/comptabilite/constants";
import { useComptaStore } from "@/stores/comptaStore";
import { OfflineBanner } from "../shared/OfflineBadge";
import { SyncIndicator } from "../shared/SyncIndicator";
import { ClotureBadge } from "../shared/ClotureBadge";
import MobileMonthView from "./MobileMonthView";
import DesktopMonthView from "./DesktopMonthView";

/**
 * 📅 MonthView - Vue mensuelle
 * Affiche les mouvements et transactions d'un mois
 */
const MonthView = () => {
  const { id } = useParams(); // Format: MM-YYYY
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const { setSelectedMonth } = useComptaStore();

  const [monthData, setMonthData] = useState(null);
  const [isCurrentMonth, setIsCurrentMonth] = useState(false);

  // Parser l'ID
  useEffect(() => {
    if (!id) return;

    const [monthStr, yearStr] = id.split("-");
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return;
    }

    setMonthData({ month, year });
    setSelectedMonth(id);

    // Vérifier si c'est le mois courant
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    setIsCurrentMonth(month === currentMonth && year === currentYear);
  }, [id, setSelectedMonth]);

  // Navigation entre mois
  const handlePreviousMonth = () => {
    if (!monthData) return;

    let newMonth = monthData.month - 1;
    let newYear = monthData.year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    const newId = `${newMonth.toString().padStart(2, "0")}-${newYear}`;
    navigate(`/admin/compta/monthview/${newId}`);
  };

  const handleNextMonth = () => {
    if (!monthData) return;

    let newMonth = monthData.month + 1;
    let newYear = monthData.year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    const newId = `${newMonth.toString().padStart(2, "0")}-${newYear}`;
    navigate(`/admin/compta/monthview/${newId}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const currentId = `${month.toString().padStart(2, "0")}-${year}`;
    navigate(`/admin/compta/monthview/${currentId}`);
  };

  const handleGoBack = () => {
    navigate("/admin/compta/dashboard");
  };

  // Vérifier si le mois est terminé (peut être clôturé)
  const isMonthComplete = () => {
    if (!monthData) return false;
    const now = new Date();
    const lastDayOfMonth = new Date(monthData.year, monthData.month, 0);
    return lastDayOfMonth < now;
  };

  if (!monthData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Mois invalide</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  const monthName = NOMS_MOIS[monthData.month - 1];
  const canClose = isMonthComplete();

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
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Bouton retour */}
                <button
                  onClick={handleGoBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Retour">
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      📅 {monthName} {monthData.year}
                    </h1>
                    {canClose && <ClotureBadge isClosed={false} />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Vue détaillée du mois
                  </p>
                </div>
              </div>

              {/* Indicateur de sync */}
              <SyncIndicator className="hidden sm:flex" />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Mois précédent">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Mois suivant">
                  <ChevronRight className="w-5 h-5" />
                </button>

                {!isCurrentMonth && (
                  <button
                    onClick={handleCurrentMonth}
                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Mois actuel
                  </button>
                )}
              </div>

              {/* Indicateur sync mobile */}
              <SyncIndicator className="sm:hidden" />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isMobile ? (
            <MobileMonthView monthData={monthData} monthId={id} />
          ) : (
            <DesktopMonthView monthData={monthData} monthId={id} />
          )}
        </div>
      </motion.div>
    </>
  );
};

export default MonthView;
