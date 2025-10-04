import { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useYear } from "@/toolkits/comptabilite";
import { SemaineModel } from "@/toolkits/comptabilite";
import {
  TransactionTable,
  TransactionTableMobile,
} from "../../shared/TransactionTable";
import { cardStaggerItem } from "@/lib/animations";
import { motion } from "framer-motion";
import useBreakpoint from "@/hooks/useBreakpoint";
import { toast } from "sonner";

/**
 * 📋 Tableaux des transactions de l'année
 * 2 tableaux: Entrées et Sorties (ou switch sur desktop)
 * Avec pagination optimisée pour grande quantité de données
 */
const YearTransactionsTables = ({ year, yearId, activeTable }) => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);
  const { yearData, loading, loadAllWeeks } = useYear(year);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Agréger toutes les transactions de l'année
  const allTransactions = useMemo(() => {
    if (!yearData?.weeks) return [];

    return Object.values(yearData.weeks).flatMap(
      (week) => week.transactions || []
    );
  }, [yearData]);

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

  // Charger toutes les semaines si nécessaire
  const handleLoadAllWeeks = async () => {
    if (isLoadingAll) return;

    try {
      setIsLoadingAll(true);
      await loadAllWeeks();
      toast.success("Toutes les transactions ont été chargées");
    } catch (error) {
      console.error("Erreur chargement transactions:", error);
      toast.error("Erreur lors du chargement des transactions");
    } finally {
      setIsLoadingAll(false);
    }
  };

  // Export CSV (simplifié)
  const handleExportCSV = () => {
    const transactions = activeTable === "entrees" ? entrees : sorties;

    let csv = "Date;Compte;Montant;Mode Paiement;Description\n";
    transactions.forEach((t) => {
      csv += `${t.date};${t.compte_denomination};${t.montant};${
        t.mode_paiement
      };${t.description || ""}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${activeTable}_${year}.csv`;
    link.click();

    toast.success("Export CSV réussi");
  };

  // Info sur le chargement
  const weeksLoaded = Object.keys(yearData?.weeks || {}).length;
  const totalWeeks = SemaineModel.genererSemainesAnnee(year).length;
  const allWeeksLoaded = weeksLoaded === totalWeeks;

  // Vue mobile: 2 tableaux séparés
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Info chargement */}
        {!allWeeksLoaded && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ Chargement partiel
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {weeksLoaded}/{totalWeeks} semaines chargées
                </p>
              </div>
              <button
                onClick={handleLoadAllWeeks}
                disabled={isLoadingAll}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm rounded-lg transition-colors">
                {isLoadingAll ? "Chargement..." : "Tout charger"}
              </button>
            </div>
          </div>
        )}

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
      {/* Info chargement */}
      {!allWeeksLoaded && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                ⚠️ Chargement partiel ({weeksLoaded}/{totalWeeks} semaines)
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Certaines transactions peuvent être manquantes
              </p>
            </div>
            <button
              onClick={handleLoadAllWeeks}
              disabled={isLoadingAll}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm rounded-lg transition-colors font-medium">
              {isLoadingAll ? "Chargement..." : "Charger toutes les semaines"}
            </button>
          </div>
        </div>
      )}

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

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium">
            <Download className="w-5 h-5" />
            Export CSV
          </button>

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
      </div>

      <TransactionTable
        transactions={currentTransactions}
        loading={loading}
        showActions={true}
      />
    </motion.div>
  );
};

export default YearTransactionsTables;
