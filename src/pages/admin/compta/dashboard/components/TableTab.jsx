import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTransactions, useQuickStats } from "@/toolkits/comptabilite";
import { useComptaStore } from "@/stores/comptaStore";
import { filterTransactions, formatMontant } from "@/lib/compta-utils";
import { TransactionTable } from "../../shared/TransactionTable";
import { FilterToolbar } from "../../shared/FilterToolbar";
import { cardStaggerContainer, cardStaggerItem } from "@/lib/animations";

/**
 * 📋 Onglet Tableau (Desktop)
 * Section filtre + résumé du jour + tableau transactions
 */
const TableTab = () => {
  const navigate = useNavigate();
  const { filters } = useComptaStore();
  const { transactions, loading } = useTransactions();
  const { stats: dayStats, loading: statsLoading } = useQuickStats(1);

  // Filtrer les transactions
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filters);
  }, [transactions, filters]);

  // Résumé du jour (cards)
  const summaryCards = useMemo(
    () => [
      {
        label: "Chiffre d'affaires",
        value: dayStats?.chiffre_affaires || 0,
        icon: TrendingUp,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/20",
      },
      {
        label: "Total encaissé",
        value: dayStats?.encaissements || 0,
        icon: TrendingUp,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
      },
      {
        label: "Total dépensé",
        value: dayStats?.decaissements || 0,
        icon: TrendingDown,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/20",
      },
      {
        label: "Trésorerie actuelle",
        value: dayStats?.tresorerie_actuelle?.total || 0,
        icon: Wallet,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
      },
    ],
    [dayStats]
  );

  return (
    <div className="space-y-6">
      {/* Bouton ajouter */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/admin/compta/handleTransactions")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nouvelle transaction</span>
        </button>
      </div>

      {/* Résumé du jour */}
      <motion.div
        variants={cardStaggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={index}
              variants={cardStaggerItem}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? "..." : formatMontant(card.value)}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filtres */}
      <FilterToolbar />

      {/* Tableau des transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Transactions du jour
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredTransactions.length} transaction(s) trouvée(s)
          </p>
        </div>

        <TransactionTable
          transactions={filteredTransactions}
          loading={loading}
          showActions={true}
        />
      </div>
    </div>
  );
};

export default TableTab;
