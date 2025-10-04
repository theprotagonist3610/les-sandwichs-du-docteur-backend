import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMonth } from "@/toolkits/comptabilite";
import {
  TransactionTable,
  TransactionTableMobile,
} from "../../shared/TransactionTable";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";
import useBreakpoint from "@/hooks/useBreakpoint";

/**
 * 📋 Tableaux des transactions du mois
 * 2 tableaux: Entrées et Sorties (ou switch sur desktop)
 */
const MonthTransactionsTables = ({ monthData, monthId, activeTable }) => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const { monthData: data, loading } = useMonth(
    monthData.year,
    monthData.month
  );

  // Agréger toutes les transactions du mois
  const allTransactions = useMemo(() => {
    if (!data?.weeks) return [];

    return data.weeks.flatMap((week) => week.transactions || []);
  }, [data]);

  // Séparer les entrées et sorties
  const entrees = useMemo(() => {
    return allTransactions.filter((t) => t.type === "entree");
  }, [allTransactions]);

  const sorties = useMemo(() => {
    return allTransactions.filter((t) => t.type === "sortie");
  }, [allTransactions]);

  // Calculer les totaux
  const totalEntrees = useMemo(() => {
    return entrees.reduce((sum, t) => sum + t.montant, 0);
  }, [entrees]);

  const totalSorties = useMemo(() => {
    return sorties.reduce((sum, t) => sum + t.montant, 0);
  }, [sorties]);

  const handleAddTransaction = () => {
    navigate("/admin/compta/handleTransactions");
  };

  // Vue mobile: 2 tableaux séparés
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Entrées */}
        <motion.div
          variants={cardStaggerItem}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                <span>📈</span> Entrées
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {entrees.length} transaction(s) • Total:{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                    minimumFractionDigits: 0,
                  }).format(totalEntrees)}
                </span>
              </p>
            </div>

            <button
              onClick={handleAddTransaction}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              aria-label="Ajouter une entrée">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <TransactionTableMobile transactions={entrees} loading={loading} />
        </motion.div>

        {/* Sorties */}
        <motion.div
          variants={cardStaggerItem}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                <span>📉</span> Sorties
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {sorties.length} transaction(s) • Total:{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                    minimumFractionDigits: 0,
                  }).format(totalSorties)}
                </span>
              </p>
            </div>

            <button
              onClick={handleAddTransaction}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              aria-label="Ajouter une sortie">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <TransactionTableMobile transactions={sorties} loading={loading} />
        </motion.div>
      </div>
    );
  }

  // Vue desktop: tableau unique avec switch
  const currentTransactions = activeTable === "entrees" ? entrees : sorties;
  const currentTotal = activeTable === "entrees" ? totalEntrees : totalSorties;

  return (
    <motion.div
      variants={cardStaggerItem}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className={`text-lg font-semibold flex items-center gap-2 ${
              activeTable === "entrees"
                ? "text-green-900 dark:text-green-100"
                : "text-red-900 dark:text-red-100"
            }`}>
            {activeTable === "entrees" ? (
              <>
                <span>📈</span> Entrées
              </>
            ) : (
              <>
                <span>📉</span> Sorties
              </>
            )}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {currentTransactions.length} transaction(s) • Total:{" "}
            <span
              className={`font-semibold ${
                activeTable === "entrees"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              }).format(currentTotal)}
            </span>
          </p>
        </div>

        <button
          onClick={handleAddTransaction}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white ${
            activeTable === "entrees"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}>
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      <TransactionTable
        transactions={currentTransactions}
        loading={loading}
        showActions={true}
      />
    </motion.div>
  );
};

export default MonthTransactionsTables;
