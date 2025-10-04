// ==========================================
// 📄 toolkits/comptabilite/hooks/useBalance.js
// ==========================================

import { useState, useEffect, useCallback } from "react";
import { BalanceService } from "../reports/balance";

export const useBalance = (dateDebut, dateFin, options = {}) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculer = useCallback(async () => {
    if (!dateDebut || !dateFin) return;

    try {
      setLoading(true);

      let data;
      if (options.parClasse) {
        data = await BalanceService.calculerParClasse(dateDebut, dateFin);
      } else if (options.balanceAgee && options.dateReference) {
        data = await BalanceService.calculerBalanceAgee(options.dateReference);
      } else {
        data = await BalanceService.calculer(dateDebut, dateFin);
      }

      setBalance(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur calcul balance:", err);
    } finally {
      setLoading(false);
    }
  }, [
    dateDebut,
    dateFin,
    options.parClasse,
    options.balanceAgee,
    options.dateReference,
  ]);

  useEffect(() => {
    calculer();
  }, [calculer]);

  const exporterCSV = async () => {
    try {
      return await BalanceService.exporterCSV(dateDebut, dateFin);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    balance,
    loading,
    error,
    recalculer: calculer,
    exporterCSV,
  };
};
