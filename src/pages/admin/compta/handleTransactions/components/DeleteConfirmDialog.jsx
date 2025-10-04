import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { modalVariants, modalOverlayVariants } from "@/lib/animations";
import { formatMontant, formatDateDisplay } from "@/lib/compta-utils";

/**
 * ⚠️ Dialog de confirmation de suppression
 */
const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  isDeleting,
}) => {
  if (!transaction) return null;

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
              <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                        Supprimer la transaction
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Cette action est irréversible
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Êtes-vous sûr de vouloir supprimer cette transaction ?
                </p>

                {/* Détails de la transaction */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Date
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDateDisplay(transaction.date)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Compte
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {transaction.compte_denomination}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Montant
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        transaction.type === "entree"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {transaction.type === "sortie" && "-"}
                      {formatMontant(transaction.montant)}
                    </span>
                  </div>

                  {transaction.description && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Description
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {transaction.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ La suppression de cette transaction mettra à jour tous
                    les résumés et la trésorerie automatiquement.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Annuler
                </button>

                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed">
                  {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmDialog;
