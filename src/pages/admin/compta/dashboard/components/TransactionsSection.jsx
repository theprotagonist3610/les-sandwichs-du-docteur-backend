import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTransactions } from "@/toolkits/comptabilite";
import { useComptaStore } from "@/stores/comptaStore";
import { filterTransactions } from "@/lib/compta-utils";
import { TransactionTableMobile } from "../../shared/TransactionTable";
import { FilterToolbarCompact } from "../../shared/FilterToolbar";

/**
 * 📋 Section Transactions du jour
 * Utilisé dans MobileDashboard
 */
const TransactionsSection = () => {
  const navigate = useNavigate();
  const { filters } = useComptaStore();
  const { transactions, loading } = useTransactions();

  // Filtrer les transactions
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filters);
  }, [transactions, filters]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Transactions du jour
        </h2>

        {/* Bouton ajouter */}
        <button
          onClick={() => navigate("/admin/compta/handleTransactions")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Ajouter</span>
        </button>
      </div>

      {/* Filtres */}
      <FilterToolbarCompact className="mb-4" />

      {/* Tableau */}
      <TransactionTableMobile
        transactions={filteredTransactions}
        loading={loading}
      />
    </section>
  );
};

export default TransactionsSection;
