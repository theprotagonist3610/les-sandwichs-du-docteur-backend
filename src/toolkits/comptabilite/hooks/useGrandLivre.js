// ==========================================
// 📄 toolkits/comptabilite/hooks/useGrandLivre.js
// ==========================================

import { useState, useEffect, useCallback } from "react";
import { GrandLivreService } from "../reports/grandLivre";

export const useGrandLivre = (dateDebut, dateFin, options = {}) => {
  const [grandLivre, setGrandLivre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generer = useCallback(async () => {
    if (!dateDebut || !dateFin) return;

    try {
      setLoading(true);

      let data;
      if (options.compte) {
        data = await GrandLivreService.genererParCompte(
          options.compte,
          dateDebut,
          dateFin
        );
      } else if (options.classe) {
        data = await GrandLivreService.genererParClasse(
          options.classe,
          dateDebut,
          dateFin
        );
      } else {
        data = await GrandLivreService.generer(dateDebut, dateFin);
      }

      setGrandLivre(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur génération grand livre:", err);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, options.compte, options.classe]);

  useEffect(() => {
    generer();
  }, [generer]);

  const exporterCSV = async () => {
    try {
      return await GrandLivreService.exporterCSV(dateDebut, dateFin);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    grandLivre,
    loading,
    error,
    regenerer: generer,
    exporterCSV,
  };
};
