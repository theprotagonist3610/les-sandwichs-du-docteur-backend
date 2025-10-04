// ==========================================
// 📄 toolkits/comptabilite/hooks/useCloture.js
// ==========================================

import { useState } from "react";
import { ClotureService } from "../services/cloture";

export const useCloture = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cloturerSemaine = async (year, weekId) => {
    try {
      setLoading(true);
      await ClotureService.cloturerSemaine(year, weekId);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const decloturerSemaine = async (year, weekId) => {
    try {
      setLoading(true);
      await ClotureService.decloturerSemaine(year, weekId);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cloturerAnnee = async (year) => {
    try {
      setLoading(true);
      await ClotureService.cloturerAnnee(year);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStatutCloture = async (year, weekId) => {
    try {
      return await ClotureService.getStatutCloture(year, weekId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    loading,
    error,
    cloturerSemaine,
    decloturerSemaine,
    cloturerAnnee,
    getStatutCloture,
  };
};
