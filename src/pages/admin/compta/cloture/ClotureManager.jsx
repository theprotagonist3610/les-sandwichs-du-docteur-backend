import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Unlock, AlertTriangle } from "lucide-react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { pageVariants, pageTransition } from "@/lib/animations";
import { dateUtils } from "@/toolkits/comptabilite/utils/dates";
import { useCloture } from "@/toolkits/comptabilite";
import { OfflineBanner } from "../shared/OfflineBadge";
import { SyncIndicator } from "../shared/SyncIndicator";
import MobileClotureManager from "./MobileClotureManager";
import DesktopClotureManager from "./DesktopClotureManager";

/**
 * 🔒 ClotureManager - Gestion des clôtures périodiques
 * Permet de clôturer/déclôturer les semaines et années
 */
const ClotureManager = () => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const currentYear = dateUtils.getCurrentYear();

  const handleGoBack = () => {
    navigate("/admin/compta/dashboard");
  };

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Bouton retour */}
                <button
                  onClick={handleGoBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Retour">
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Lock className="w-6 h-6" />
                    Gestion des Clôtures
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Clôturer et gérer les périodes comptables
                  </p>
                </div>
              </div>

              {/* Indicateur de sync */}
              <SyncIndicator className="hidden sm:flex" />
            </div>

            {/* Warning */}
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    ⚠️ Action irréversible (sans droits admin)
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                    Une fois clôturée, une période ne peut plus être modifiée.
                    Seul un administrateur peut déclôturer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isMobile ? (
            <MobileClotureManager year={currentYear} />
          ) : (
            <DesktopClotureManager year={currentYear} />
          )}
        </div>
      </motion.div>
    </>
  );
};

export default ClotureManager;
