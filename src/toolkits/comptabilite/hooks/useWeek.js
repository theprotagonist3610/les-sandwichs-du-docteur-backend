// ==========================================
// 📄 toolkits/comptabilite/hooks/useWeek.js
// ==========================================

import { useState, useEffect, useCallback } from "react";
import { FirestoreService } from "../services/firestore";
import { LocalStorageService } from "../services/localStorage";
import { SemaineModel } from "../models/semaine";
import { AnneeModel } from "../models/annee";
import { dateUtils } from "../utils/dates";

export const useWeek = (weekId = null) => {
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = dateUtils.getCurrentYear();
  const currentDate = dateUtils.getCurrentDate();
  const currentWeekInfo = SemaineModel.getWeekFromDate(
    currentDate,
    currentYear
  );
  const targetWeekId = weekId || currentWeekInfo?.weekId;

  const charger = useCallback(async () => {
    if (!targetWeekId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Essayer localStorage d'abord
      const localData = LocalStorageService.load(currentYear);
      if (localData?.weeks?.[targetWeekId]) {
        setWeek(localData.weeks[targetWeekId]);
        setError(null);
        setLoading(false);
        return;
      }

      // Sinon charger depuis Firestore
      const weekData = await AnneeModel.getOrCreateWeek(
        currentYear,
        targetWeekId
      );
      if (weekData) {
        weekData.transactions = await AnneeModel.getWeekTransactions(
          currentYear,
          targetWeekId
        );
        setWeek(weekData);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur chargement semaine:", err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, targetWeekId]);

  useEffect(() => {
    charger();
  }, [charger]);

  return {
    week,
    loading,
    error,
    recharger: charger,
  };
};
