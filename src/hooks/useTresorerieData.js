import { useEffect, useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { ref, onValue } from "firebase/database";
import { toast } from "sonner";
import { rtdb } from "../firebase";
import useTresorerieStore from "@/stores/admin/useTresorerieStore";
import { getAllComptesTresorerie } from "@/toolkits/admin/comptabiliteToolkit";
import { getOperationsForPeriod } from "@/toolkits/admin/comptabilite/operations";
import {
  calculerDataRepartition,
  calculerDataEvolution,
} from "@/utils/comptabilite/tresorerieCharts";

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

  /**
   * Fonction de chargement des données avec calcul des soldes dynamiques
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer les comptes de trésorerie
      const { comptes } = await getAllComptesTresorerie();

      // Charger les opérations des 7 derniers jours
      const { operations } = await getOperationsForPeriod(7);

      // Calculer le solde de chaque compte de trésorerie
      const comptesAvecSolde = comptes.map((compte) => {
        const operationsCompte = operations.filter((op) => op.compte_id === compte.id);

        const solde = operationsCompte.reduce((acc, op) => {
          if (op.type_operation === "entree") {
            return acc + op.montant;
          } else if (op.type_operation === "sortie") {
            return acc - op.montant;
          }
          return acc;
        }, 0);

        return {
          ...compte,
          solde,
        };
      });

      setComptesTresorerie(comptesAvecSolde);

      // Calculer la variation (comparaison 7 derniers jours vs 7 jours précédents)
      const { operations: opsPrecedentes } = await getOperationsForPeriod(
        7,
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      );

      const soldeActuel = comptesAvecSolde.reduce((sum, c) => sum + c.solde, 0);
      const soldePrecedent = opsPrecedentes.reduce((sum, op) => {
        if (op.type_operation === "entree") return sum + op.montant;
        if (op.type_operation === "sortie") return sum - op.montant;
        return sum;
      }, 0);

      const variation = soldePrecedent === 0
        ? (soldeActuel > 0 ? 100 : 0)
        : ((soldeActuel - soldePrecedent) / soldePrecedent) * 100;

      setVariationPourcentage(variation);

      console.log(`✅ ${comptes.length} comptes de trésorerie chargés (7 derniers jours)`);
    } catch (err) {
      console.error("❌ Erreur chargement trésorerie:", err);
      setError(err.message);
      toast.error("Erreur lors du chargement de la trésorerie");
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, setComptesTresorerie, setVariationPourcentage]);

  // Listener RTDB pour mises à jour automatiques
  useEffect(() => {
    const triggerRef = ref(rtdb, "comptabilite_trigger");

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      if (snapshot.exists()) {
        const lastTrigger = snapshot.val();
        const keys = Object.keys(lastTrigger);
        const latestKey = keys[keys.length - 1];
        const trigger = lastTrigger[latestKey];

        if (trigger.action && trigger.action.includes("operation")) {
          console.log("♻️ Trésorerie - rechargement automatique...");
          loadData();
        }
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  // Chargement initial
  useEffect(() => {
    loadData();

    // Cleanup: réinitialiser le store au démontage
    return () => {
      reset();
    };
  }, [loadData, reset]);

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
