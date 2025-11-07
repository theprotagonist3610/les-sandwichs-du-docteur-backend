import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import useTresorerieStore from "@/stores/admin/useTresorerieStore";
import { getAllComptesTresorerie } from "@/toolkits/admin/comptabiliteToolkit";
import {
  calculerDataRepartition,
  calculerDataEvolution,
} from "@/utils/comptabilite/tresorerieCharts";
import {
  calculerSoldesAujourdhui,
  calculerVariationTresorerie,
} from "@/utils/comptabilite/calculerSoldesTresorerie";

/**
 * Hook personnalisé pour gérer les données de trésorerie
 * Encapsule le chargement, le calcul des données pour les graphiques
 * et la gestion d'état via Zustand
 *
 * @returns {Object} État et données de trésorerie
 */
export const useTresorerieData = () => {
  // Sélection optimisée du store avec useShallow pour éviter les re-renders inutiles
  const {
    comptesTresorerie,
    soldeTotal,
    variationPourcentage,
    isLoading,
    error,
    setComptesTresorerie,
    setIsLoading,
    setError,
    setVariationPourcentage,
    ouvrirCreationCompte,
    reset,
  } = useTresorerieStore(
    useShallow((state) => ({
      comptesTresorerie: state.comptesTresorerie,
      soldeTotal: state.soldeTotal,
      variationPourcentage: state.variationPourcentage,
      isLoading: state.isLoading,
      error: state.error,
      setComptesTresorerie: state.setComptesTresorerie,
      setIsLoading: state.setIsLoading,
      setError: state.setError,
      setVariationPourcentage: state.setVariationPourcentage,
      ouvrirCreationCompte: state.ouvrirCreationCompte,
      reset: state.reset,
    }))
  );

  // Charger les comptes de trésorerie au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer les comptes de trésorerie
        const { comptes } = await getAllComptesTresorerie();

        // Calculer les soldes réels basés sur les opérations du jour
        const comptesAvecSoldes = await calculerSoldesAujourdhui(comptes);

        setComptesTresorerie(comptesAvecSoldes);

        // Calculer la vraie variation (aujourd'hui vs hier)
        const variation = await calculerVariationTresorerie(comptes);
        setVariationPourcentage(variation);

        console.log(`✅ ${comptes.length} comptes de trésorerie chargés avec soldes dynamiques`);
      } catch (err) {
        console.error("❌ Erreur chargement trésorerie:", err);
        setError(err.message);
        toast.error("Erreur lors du chargement de la trésorerie");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Cleanup: réinitialiser le store au démontage
    return () => {
      reset();
    };
  }, [setIsLoading, setError, setComptesTresorerie, setVariationPourcentage, reset]);

  // Calculer les données de répartition (BarChart) de manière mémoïsée
  const dataRepartition = useMemo(() => {
    return calculerDataRepartition(comptesTresorerie, soldeTotal);
  }, [comptesTresorerie, soldeTotal]);

  // Calculer les données d'évolution (LineChart) de manière mémoïsée
  const dataEvolution = useMemo(() => {
    return calculerDataEvolution(comptesTresorerie, 7);
  }, [comptesTresorerie]);

  return {
    // État
    comptesTresorerie,
    soldeTotal,
    variationPourcentage,
    isLoading,
    error,
    // Données calculées
    dataRepartition,
    dataEvolution,
    // Actions
    ouvrirCreationCompte,
  };
};

export default useTresorerieData;
