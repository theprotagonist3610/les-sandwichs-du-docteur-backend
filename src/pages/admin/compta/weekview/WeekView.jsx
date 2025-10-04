import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { pageVariants, pageTransition } from "@/lib/animations";
import { formatDateDisplay } from "@/lib/compta-utils";
import { dateUtils } from "@/toolkits/comptabilite/utils/dates";
import { SemaineModel } from "@/toolkits/comptabilite";
import { useComptaStore } from "@/stores/comptaStore";
import { OfflineBanner } from "../shared/OfflineBadge";
import { SyncIndicator } from "../shared/SyncIndicator";
import { ClotureBadge } from "../shared/ClotureBadge";
import MobileWeekView from "./MobileWeekView";
import DesktopWeekView from "./DesktopWeekView";

/**
 * 📅 WeekView - Vue hebdomadaire
 * Affiche les mouvements et transactions d'une semaine
 */
const WeekView = () => {
  const { id } = useParams(); // Format: S01, S02...
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const { setSelectedWeek } = useComptaStore();

  const currentYear = dateUtils.getCurrentYear();
  const [weekInfo, setWeekInfo] = useState(null);
  const [isCurrentWeek, setIsCurrentWeek] = useState(false);

  // Charger les infos de la semaine
  useEffect(() => {
    const semaines = SemaineModel.genererSemainesAnnee(currentYear);
    const week = semaines.find((s) => s.weekId === id);

    if (week) {
      setWeekInfo(week);
      setSelectedWeek(id);

      // Vérifier si c'est la semaine courante
      const currentDate = dateUtils.getCurrentDate();
      const currentWeekInfo = SemaineModel.getWeekFromDate(
        currentDate,
        currentYear
      );
      setIsCurrentWeek(currentWeekInfo?.weekId === id);
    }
  }, [id, currentYear, setSelectedWeek]);

  // Navigation entre semaines
  const handlePreviousWeek = () => {
    const prevWeek = SemaineModel.getPreviousWeek(currentYear, id);
    if (prevWeek) {
      navigate(`/admin/compta/weekview/${prevWeek.weekId}`);
    }
  };

  const handleNextWeek = () => {
    const nextWeek = SemaineModel.getNextWeek(currentYear, id);
    if (nextWeek) {
      navigate(`/admin/compta/weekview/${nextWeek.weekId}`);
    }
  };

  const handleCurrentWeek = () => {
    const currentDate = dateUtils.getCurrentDate();
    const currentWeekInfo = SemaineModel.getWeekFromDate(
      currentDate,
      currentYear
    );
    if (currentWeekInfo) {
      navigate(`/admin/compta/weekview/${currentWeekInfo.weekId}`);
    }
  };

  const handleGoBack = () => {
    navigate("/admin/compta/dashboard");
  };

  // Vérifier si la semaine peut être clôturée (terminée depuis > 30 jours)
  const canClose = weekInfo
    ? SemaineModel.shouldAutoClose(weekInfo.dateFin, 30)
    : false;

  if (!weekInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Semaine invalide</p>
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
                      📅 {weekInfo.label}
                    </h1>
                    {canClose && <ClotureBadge isClosed={false} />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDateDisplay(weekInfo.dateDebut, "dd MMMM")} -{" "}
                    {formatDateDisplay(weekInfo.dateFin, "dd MMMM yyyy")}
                    {" • "}
                    {weekInfo.nombreJours} jours
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
                  onClick={handlePreviousWeek}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Semaine précédente">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextWeek}
                  disabled={isCurrentWeek}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Semaine suivante">
                  <ChevronRight className="w-5 h-5" />
                </button>

                {!isCurrentWeek && (
                  <button
                    onClick={handleCurrentWeek}
                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Semaine actuelle
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
            <MobileWeekView weekId={id} weekInfo={weekInfo} />
          ) : (
            <DesktopWeekView weekId={id} weekInfo={weekInfo} />
          )}
        </div>
      </motion.div>
    </>
  );
};

export default WeekView;
