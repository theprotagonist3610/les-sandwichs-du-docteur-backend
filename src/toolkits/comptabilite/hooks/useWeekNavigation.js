// ==========================================
// 📄 toolkits/comptabilite/hooks/useWeekNavigation.js
// ==========================================

import { useMemo } from "react";
import { SemaineModel } from "../models/semaine";
import { dateUtils } from "../utils/dates";

export const useWeekNavigation = () => {
  const currentDate = dateUtils.getCurrentDate();
  const currentYear = dateUtils.getCurrentYear();

  const semaines = useMemo(
    () => SemaineModel.genererSemainesAnnee(currentYear),
    [currentYear]
  );

  const currentWeekInfo = useMemo(
    () => SemaineModel.getWeekFromDate(currentDate, currentYear),
    [currentDate, currentYear]
  );

  const getCurrentWeekIndex = () => {
    return semaines.findIndex((s) => s.weekId === currentWeekInfo?.weekId);
  };

  const getPreviousWeek = () => {
    return SemaineModel.getPreviousWeek(currentYear, currentWeekInfo?.weekId);
  };

  const getNextWeek = () => {
    return SemaineModel.getNextWeek(currentYear, currentWeekInfo?.weekId);
  };

  const getWeekByIndex = (index) => {
    if (index >= 0 && index < semaines.length) {
      return semaines[index];
    }
    return null;
  };

  return {
    currentWeek: currentWeekInfo,
    allWeeks: semaines,
    previousWeek: getPreviousWeek(),
    nextWeek: getNextWeek(),
    getCurrentWeekIndex,
    getWeekByIndex,
  };
};
