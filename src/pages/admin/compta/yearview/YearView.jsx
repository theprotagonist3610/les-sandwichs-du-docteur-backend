import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { pageVariants, pageTransition } from "@/lib/animations";
import { dateUtils } from "@/toolkits/comptabilite/utils/dates";
import { useComptaStore } from "@/stores/comptaStore";
import { OfflineBanner } from "../shared/OfflineBadge";
import { SyncIndicator } from "../shared/SyncIndicator";
import { ClotureBadge } from "../shared/ClotureBadge";
import MobileYearView from "./MobileYearView";
import DesktopYearView from "./DesktopYearView";

/**
 * 📅 YearView - Vue annuelle
 * Affiche les mouvements et transactions d'une année complète
 */
const YearView = () => {
  const { id } = useParams(); // Format: YYYY
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const { setSelectedYear } = useComptaStore();

  const [year, setYear] = useState(null);
  const [isCurrentYear, setIsCurrentYear] = useState(false);

  // Parser l'année depuis l'URL
  useEffect(() => {
    if (!id) return;

    const yearNum = parseInt(id);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return;
    }

    setYear(yearNum);
    setSelectedYear(id);

    // Vérifier si c'est l'année courante
    const currentYear = dateUtils.getCurrentYear();
    setIsCurrentYear(yearNum === currentYear);
  }, [id, setSelectedYear]);

  // Navigation entre années
  const handlePreviousYear = () => {
    if (!year) return;
    const prevYear = year - 1;
    navigate(`/admin/compta/yearview/${prevYear}`);
  };

  const handleNextYear = () => {
    if (!year) return;
    const nextYear = year + 1;
    navigate(`/admin/compta/yearview/${nextYear}`);
  };

  const handleCurrentYear = () => {
    const currentYear = dateUtils.getCurrentYear();
    navigate(`/admin/compta/yearview/${currentYear}`);
  };

  const handleGoBack = () => {
    navigate("/admin/compta/dashboard");
  };

  // Vérifier si l'année est terminée (peut être clôturée)
  const isYearComplete = () => {
    if (!year) return false;
    const now = new Date();
    return year < now.getFullYear();
  };

  if (!year) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Année invalide</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  const canClose = isYearComplete();

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
                      📅 Exercice {year}
                    </h1>
                    {canClose && <ClotureBadge isClosed={false} />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Vue détaillée de l'année fiscale
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
                  onClick={handlePreviousYear}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Année précédente">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextYear}
                  disabled={isCurrentYear}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Année suivante">
                  <ChevronRight className="w-5 h-5" />
                </button>

                {!isCurrentYear && (
                  <button
                    onClick={handleCurrentYear}
                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Année actuelle
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
            <MobileYearView year={year} yearId={id} />
          ) : (
            <DesktopYearView year={year} yearId={id} />
          )}
        </div>
      </motion.div>
    </>
  );
};

export default YearView;
