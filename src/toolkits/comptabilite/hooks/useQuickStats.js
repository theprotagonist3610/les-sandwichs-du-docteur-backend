// ==========================================
// 📄 toolkits/comptabilite/hooks/useQuickStats.js
// ==========================================

import { useState, useEffect } from "react";
import { StatistiquesService } from "../reports/statistiques";

export const useQuickStats = (periode = 7) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const calculer = async () => {
      try {
        setLoading(true);
        const data = await StatistiquesService.calculerQuickStats(periode);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Erreur calcul quick stats:", err);
      } finally {
        setLoading(false);
      }
    };

    calculer();
  }, [periode]);

  return { stats, loading, error };
};
