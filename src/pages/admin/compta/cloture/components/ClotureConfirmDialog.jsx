import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, Unlock, X } from "lucide-react";
import { modalVariants, modalOverlayVariants } from "@/lib/animations";
import { formatDateDisplay } from "@/lib/compta-utils";

/**
 * ⚠️ Dialog de confirmation de clôture/déclôture
 */
const ClotureConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  week,
  year,
  actionType, // 'close' | 'open'
  isProcessing,
}) => {
  const isClosing = actionType === "close";
  const title = isClosing ? "Clôturer la période" : "Déclôturer la période";
  const description = week
    ? `${week.label} (${formatDateDisplay(
        week.dateDebut,
        "dd/MM/yy"
      )} - ${formatDateDisplay(week.dateFin, "dd/MM/yy")})`
    : `Exercice ${year}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={modalOverlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div
                className={`px-6 py-4 border-b ${
                  isClosing
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isClosing
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                      }`}>
                      {isClosing ? (
                        <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Unlock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          isClosing
                            ? "text-amber-900 dark:text-amber-100"
                            : "text-blue-900 dark:text-blue-100"
                        }`}>
                        {title}
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          isClosing
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-blue-700 dark:text-blue-300"
                        }`}>
                        {description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className={`p-1 rounded-lg transition-colors ${
                      isClosing
                        ? "hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        : "hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    }`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                {isClosing ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Êtes-vous sûr de vouloir clôturer cette période ?
                    </p>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                          <p className="font-medium mb-1">
                            ⚠️ Conséquences de la clôture :
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Aucune transaction ne pourra être ajoutée</li>
                            <li>
                              Les transactions existantes ne pourront plus être
                              modifiées
                            </li>
                            <li>Les résumés seront figés</li>
                            <li>Seul un administrateur pourra déclôturer</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Êtes-vous sûr de vouloir déclôturer cette période ?
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium mb-1">
                            ℹ️ Après déclôture :
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Les transactions pourront être modifiées</li>
                            <li>
                              De nouvelles transactions pourront être ajoutées
                            </li>
                            <li>
                              Les résumés seront recalculés automatiquement
                            </li>
                            <li>
                              Cette action nécessite des droits administrateur
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Annuler
                </button>

                <button
                  onClick={onConfirm}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed text-white ${
                    isClosing
                      ? "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400"
                      : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                  }`}>
                  {isProcessing ? (
                    "Traitement..."
                  ) : isClosing ? (
                    <>
                      <Lock className="w-4 h-4 inline mr-2" />
                      Clôturer
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 inline mr-2" />
                      Déclôturer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ClotureConfirmDialog;
