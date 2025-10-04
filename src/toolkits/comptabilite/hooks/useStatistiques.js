// ==========================================
// 📄 toolkits/comptabilite/hooks/useStatistiques.js
// ==========================================

import { useState, useEffect, useCallback } from "react";
import { StatistiquesService } from "../reports/statistiques";

export const useStatistiques = (type, params) => {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculer = useCallback(async () => {
    try {
      setLoading(true);
      let data;

      switch (type) {
        case "comparatives":
          data = await StatistiquesService.calculerComparatives(
            params.periodes
          );
          break;

        case "evolution_tresorerie":
          data = await StatistiquesService.calculerEvolutionTresorerie(
            params.dateDebut,
            params.dateFin
          );
          break;

        case "top_produits":
          data = await StatistiquesService.calculerTopProduits(
            params.dateDebut,
            params.dateFin,
            params.limit
          );
          break;

        case "top_charges":
          data = await StatistiquesService.calculerTopCharges(
            params.dateDebut,
            params.dateFin,
            params.limit
          );
          break;

        case "quick_stats":
          data = await StatistiquesService.calculerQuickStats(params.periode);
          break;

        case "modes_paiement":
          data = await StatistiquesService.analyserModesPaiement(
            params.dateDebut,
            params.dateFin
          );
          break;

        default:
          throw new Error(`Type de statistique inconnu: ${type}`);
      }

      setStatistiques(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur calcul statistiques:", err);
    } finally {
      setLoading(false);
    }
  }, [type, JSON.stringify(params)]);

  useEffect(() => {
    calculer();
  }, [calculer]);

  return {
    statistiques,
    loading,
    error,
    recalculer: calculer,
  };
};
