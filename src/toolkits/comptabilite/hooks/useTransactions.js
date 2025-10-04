// ==========================================
// 📄 toolkits/comptabilite/hooks/useTransactions.js
// ==========================================

import { useState, useEffect, useCallback } from "react";
import { TransactionService } from "../services/transactions";
import { SemaineModel } from "../models/semaine";
import { dateUtils } from "../utils/dates";

export const useTransactions = (weekId = null) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = dateUtils.getCurrentYear();
  const currentDate = dateUtils.getCurrentDate();
  const currentWeekInfo = weekId
    ? SemaineModel.genererSemainesAnnee(currentYear).find(
        (s) => s.weekId === weekId
      )
    : SemaineModel.getWeekFromDate(currentDate, currentYear);

  const targetWeekId = weekId || currentWeekInfo?.weekId;

  const chargerTransactions = useCallback(async () => {
    if (!targetWeekId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await TransactionService.getWeekTransactions(
        currentYear,
        targetWeekId
      );
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur chargement transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, targetWeekId]);

  useEffect(() => {
    chargerTransactions();
  }, [chargerTransactions]);

  const ajouter = async (transactionData) => {
    try {
      const newTransaction = await TransactionService.ajouter(transactionData);
      await chargerTransactions();
      return newTransaction;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const modifier = async (id, data) => {
    try {
      await TransactionService.modifier(id, data);
      await chargerTransactions();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const supprimer = async (id) => {
    try {
      await TransactionService.supprimer(id);
      await chargerTransactions();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    ajouter,
    modifier,
    supprimer,
    recharger: chargerTransactions,
  };
};

// ==========================================
// 📄 toolkits/comptabilite/hooks/useTransaction.js
// ==========================================

export const useTransaction = (transactionId) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const charger = async () => {
      if (!transactionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await TransactionService.getTransaction(transactionId);
        setTransaction(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Erreur chargement transaction:", err);
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [transactionId]);

  return { transaction, loading, error };
};
