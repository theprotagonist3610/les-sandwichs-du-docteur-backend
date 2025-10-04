// ==========================================
// 📄 toolkits/comptabilite/hooks/useYear.js
// ==========================================

import { useState, useEffect, useCallback } from "react";
import { FirestoreService } from "../services/firestore";
import { LocalStorageService } from "../services/localStorage";
import { AnneeModel } from "../models/annee";
import { dateUtils } from "../utils/dates";
import { COMPTA_CONFIG } from "../constants";

export const useYear = (annee = null) => {
  const [yearData, setYearData] = useState(null);
  const [weeksLoaded, setWeeksLoaded] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [error, setError] = useState(null);

  const targetYear = annee || dateUtils.getCurrentYear();

  // Charger le résumé initial
  useEffect(() => {
    const chargerResume = async () => {
      try {
        setLoading(true);

        // Essayer localStorage
        const localData = LocalStorageService.load(targetYear);
        if (localData) {
          setYearData(localData);
          setWeeksLoaded(localData.weeks || {});
          setLoading(false);
          return;
        }

        // Sinon charger le résumé depuis Firestore
        const yearDoc = await FirestoreService.getOrCreateYearDocument(
          targetYear
        );
        setYearData({ ...yearDoc, weeks: {} });
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Erreur chargement année:", err);
      } finally {
        setLoading(false);
      }
    };

    chargerResume();
  }, [targetYear]);

  // Fonction pour charger un batch de semaines
  const loadWeeksBatch = useCallback(
    async (startIndex) => {
      try {
        setLoadingWeeks(true);
        const weeks = await AnneeModel.loadWeeksBatch(
          targetYear,
          startIndex,
          COMPTA_CONFIG.WEEK_BATCH_SIZE
        );

        setWeeksLoaded((prev) => ({ ...prev, ...weeks }));
        setYearData((prev) => ({
          ...prev,
          weeks: { ...prev.weeks, ...weeks },
        }));

        return weeks;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoadingWeeks(false);
      }
    },
    [targetYear]
  );

  // Fonction pour charger toutes les semaines
  const loadAllWeeks = useCallback(async () => {
    try {
      setLoadingWeeks(true);
      const completeData = await AnneeModel.loadComplete(targetYear);
      setYearData(completeData);
      setWeeksLoaded(completeData.weeks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingWeeks(false);
    }
  }, [targetYear]);

  return {
    yearData,
    weeksLoaded,
    loading,
    loadingWeeks,
    error,
    loadWeeksBatch,
    loadAllWeeks,
  };
};
