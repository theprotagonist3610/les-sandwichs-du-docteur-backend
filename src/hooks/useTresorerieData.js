import { useEffect, useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { ref, onValue } from "firebase/database";
import { toast } from "sonner";
import useTresorerieStore from "@/stores/admin/useTresorerieStore";
import { getAllComptesTresorerie } from "@/toolkits/admin/comptabiliteToolkit";
import { rtdb } from "@/firebase";
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

  // Fonction de chargement des données (mémorisée pour éviter les re-créations)
  const loadData = useCallback(async () => {
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
  }, [setIsLoading, setError, setComptesTresorerie, setVariationPourcentage]);

  // Charger les comptes de trésorerie au montage du composant
  useEffect(() => {
    loadData();

    // Cleanup: réinitialiser le store au démontage
    return () => {
      reset();
    };
  }, [loadData, reset]);

  // 🔥 Écouter les changements RTDB pour les mises à jour en temps réel
  useEffect(() => {
    const triggerRef = ref(rtdb, "comptabilite_trigger");

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      if (snapshot.exists()) {
        const lastTrigger = snapshot.val();

        // Récupérer la dernière clé (dernière notification)
        const keys = Object.keys(lastTrigger);
        if (keys.length > 0) {
          const latestKey = keys[keys.length - 1];
          const trigger = lastTrigger[latestKey];

          console.log("🔔 Trigger RTDB détecté:", trigger);

          // Recharger les données automatiquement après une opération
          if (trigger.action && trigger.action.includes("operation")) {
            console.log("♻️ Rechargement automatique de la trésorerie...");
            loadData();
          }
        }
      }
    });

    // Cleanup: se désabonner lors du démontage
    return () => unsubscribe();
  }, [loadData]);

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
