import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { pageVariants, pageTransition } from "@/lib/animations";
import { useTransaction } from "@/toolkits/comptabilite";
import { LoadingState } from "../shared/LoadingState";
import { ErrorState } from "../shared/ErrorState";
import { OfflineBanner } from "../shared/OfflineBadge";
import TransactionForm from "./TransactionForm";

/**
 * ✏️ HandleTransactions - Formulaire CRUD des transactions
 * Détecte l'ID en paramètre pour mode création/édition
 */
const HandleTransactions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const isEditMode = !!id;

  // Charger la transaction si mode édition
  const { transaction, loading, error } = useTransaction(
    isEditMode ? id : null
  );

  // Titre dynamique
  const pageTitle = isEditMode
    ? "✏️ Modifier la transaction"
    : "➕ Nouvelle transaction";

  // Gestion du retour
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingState message="Chargement de la transaction..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
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
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Bouton retour */}
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Retour">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {pageTitle}
                </h1>
                {isEditMode && transaction && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ID: {transaction.id}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TransactionForm
            transaction={transaction}
            isEditMode={isEditMode}
            isMobile={isMobile}
          />
        </div>
      </motion.div>
    </>
  );
};

export default HandleTransactions;
