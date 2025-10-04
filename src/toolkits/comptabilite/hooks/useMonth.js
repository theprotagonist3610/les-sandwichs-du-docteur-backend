// ==========================================
// 📄 toolkits/comptabilite/hooks/useMonth.js
// ==========================================

import { useState, useEffect } from "react";
import { FirestoreService } from "../services/firestore";
import { SemaineModel } from "../models/semaine";
import { AnneeModel } from "../models/annee";
import { ResumeModel } from "../models/resume";
import { dateUtils } from "../utils/dates";

export const useMonth = (annee = null, mois = null) => {
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = dateUtils.getCurrentYear();
  const currentMonth = new Date().getMonth() + 1;

  const targetYear = annee || currentYear;
  const targetMonth = mois || currentMonth;

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);

        // Récupérer les semaines du mois
        const weeksInMonth = SemaineModel.getWeeksInMonth(
          targetYear,
          targetMonth
        );
        const weeksData = [];

        for (const weekInfo of weeksInMonth) {
          const weekData = await FirestoreService.getWeekDocument(
            targetYear,
            weekInfo.weekId
          );
          if (weekData) {
            weekData.transactions = await AnneeModel.getWeekTransactions(
              targetYear,
              weekInfo.weekId
            );
            weeksData.push(weekData);
          }
        }

        const resume = ResumeModel.calculerMensuel(
          weeksData,
          targetYear,
          targetMonth
        );

        setMonthData({
          ...resume,
          weeks: weeksData,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Erreur chargement mois:", err);
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [targetYear, targetMonth]);

  return { monthData, loading, error };
};
