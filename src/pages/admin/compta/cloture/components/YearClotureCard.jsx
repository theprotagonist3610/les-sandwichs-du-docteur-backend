import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCloture } from "@/toolkits/comptabilite";
import { useYear } from "@/toolkits/comptabilite";
import { formatMontant } from "@/lib/compta-utils";
import { cardStaggerItem } from "@/lib/animations";
import { LoadingState } from "../../shared/LoadingState";
import ClotureConfirmDialog from "./ClotureConfirmDialog";

/**
 * 🗓️ Card de clôture annuelle
 */
const YearClotureCard = ({ year }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState(null);

  const { yearData, loading } = useYear(year);
  const { cloturerAnnee, loading: actionLoading } = useCloture();

  const isYearComplete = year < new Date().getFullYear();
  const isClosed = yearData?.cloture || false;
  const canClose = isYearComplete && !isClosed;

  const handleConfirm = async () => {
    try {
      await cloturerAnnee(year);
      toast.success(`Année ${year} clôturée avec succès`);
      setShowDialog(false);
      window.location.reload(); // Recharger pour voir les changements
    } catch (error) {
      console.error("Erreur clôture année:", error);
      toast.error(error.message || "Une erreur est survenue");
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      <motion.div
        variants={cardStaggerItem}
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6
          ${
            isClosed
              ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10"
              : "border-gray-200 dark:border-gray-700"
          }
        `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Exercice {year}
          </h3>
          {isClosed && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm rounded-full font-medium">
              <Lock className="w-4 h-4" />
              Clôturé
            </span>
          )}
        </div>

        {/* Métriques */}
        {yearData?.resume && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Chiffre d'affaires
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMontant(yearData.resume.chiffre_affaires)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Balance nette
              </span>
              <span
                className={`font-semibold ${
                  yearData.resume.balance_nette >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {formatMontant(yearData.resume.balance_nette)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                CAF
              </span>
              <span
                className={`font-semibold ${
                  yearData.resume.capacite_autofinancement >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {formatMontant(yearData.resume.capacite_autofinancement)}
              </span>
            </div>
          </div>
        )}

        {/* Warning si non terminée */}
        {!isYearComplete && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                L'année {year} est en cours. La clôture sera possible à partir
                du 1er janvier {year + 1}.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={() => {
            setActionType("close");
            setShowDialog(true);
          }}
          disabled={!canClose || actionLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors">
          <Lock className="w-5 h-5" />
          {isClosed ? "Année déjà clôturée" : "Clôturer l'année"}
        </button>

        {isClosed && (
          <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
            Contactez un administrateur pour déclôturer
          </p>
        )}
      </motion.div>

      {/* Dialog de confirmation */}
      <ClotureConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleConfirm}
        year={year}
        actionType={actionType}
        isProcessing={actionLoading}
      />
    </>
  );
};

export default YearClotureCard;
