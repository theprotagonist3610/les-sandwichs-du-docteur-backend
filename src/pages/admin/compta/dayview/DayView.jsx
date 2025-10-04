import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { pageVariants, pageTransition } from "@/lib/animations";
import {
  parseUrlDate,
  formatDateForUrl,
  formatDateDisplay,
} from "@/lib/compta-utils";
import { dateUtils } from "@/toolkits/comptabilite/utils/dates";
import { useComptaStore } from "@/stores/comptaStore";
import { OfflineBanner } from "../shared/OfflineBadge";
import { SyncIndicator } from "../shared/SyncIndicator";
import { ClotureBadge } from "../shared/ClotureBadge";
import MobileDayView from "./MobileDayView";
import DesktopDayView from "./DesktopDayView";

/**
 * 📅 DayView - Vue journalière
 * Affiche les mouvements et transactions d'une journée
 */
const DayView = () => {
  const { id } = useParams(); // Format: DD-MM-YYYY
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const { setSelectedDate } = useComptaStore();

  // Parser la date depuis l'URL
  const currentDate = parseUrlDate(id, "day");
  const [date, setDate] = useState(currentDate);

  useEffect(() => {
    if (currentDate) {
      setDate(currentDate);
      setSelectedDate(id);
    }
  }, [id, currentDate, setSelectedDate]);

  // Navigation entre jours
  const handlePreviousDay = () => {
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevId = formatDateForUrl(prevDate, "day");
    navigate(`/admin/compta/dayview/${prevId}`);
  };

  const handleNextDay = () => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextId = formatDateForUrl(nextDate, "day");
    navigate(`/admin/compta/dayview/${nextId}`);
  };

  const handleToday = () => {
    const today = new Date();
    const todayId = formatDateForUrl(today, "day");
    navigate(`/admin/compta/dayview/${todayId}`);
  };

  const handleGoBack = () => {
    navigate("/admin/compta/dashboard");
  };

  // Vérifier si c'est aujourd'hui
  const isToday = dateUtils.formatISO(date) === dateUtils.getCurrentDate();

  // Vérifier si la journée peut être clôturée (> 24h)
  const canClose = new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));

  if (!date) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Date invalide</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

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
                      📅 {formatDateDisplay(date, "EEEE d MMMM yyyy")}
                    </h1>
                    {canClose && <ClotureBadge isClosed={false} />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Vue détaillée de la journée
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
                  onClick={handlePreviousDay}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Jour précédent">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextDay}
                  disabled={isToday}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Jour suivant">
                  <ChevronRight className="w-5 h-5" />
                </button>

                {!isToday && (
                  <button
                    onClick={handleToday}
                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Aujourd'hui
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
            <MobileDayView date={date} dateId={id} />
          ) : (
            <DesktopDayView date={date} dateId={id} />
          )}
        </div>
      </motion.div>
    </>
  );
};

export default DayView;
