/**
 * useComptesData.js
 * Hook personnalisé pour la gestion des données des comptes comptables
 * avec listener RTDB pour mises à jour en temps réel
 */

import { useEffect, useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";

// Store Zustand
import useComptesStore from "../stores/admin/useComptesStore";

// Fonctions Firestore
import { getAllComptes } from "../toolkits/admin/comptabilite/comptes";
import { getOperationsToday } from "../toolkits/admin/comptabilite/operations";

// Utilitaires de calcul
import {
  calculerSoldesAujourdhui,
  calculerVariationComptes,
  calculerSoldeTotal,
} from "../utils/comptabilite/calculerSoldesComptes";

// Utilitaires de formatage et graphiques
import {
  calculerDataRepartition,
  calculerDataEntreesSorties,
  calculerDataFluxParCategorie,
  calculerTop5Comptes,
} from "../utils/comptabilite/comptesCharts";

import { filtrerComptesParCategorie } from "../utils/comptabilite/comptesFormatters";

/**
 * Hook personnalisé pour gérer les données des comptes comptables
 * Inclut le listener RTDB pour les mises à jour automatiques
 */
export const useComptesData = () => {
  // ============================================================================
  // ZUSTAND STORE - Subscription optimisée avec useShallow
  // ============================================================================

  const {
    comptesComptables,
    soldeTotal,
    variationPourcentage,
    compteSelectionne,
    isLoading,
    error,
    setComptesComptables,
    setSoldeTotal,
    setVariationPourcentage,
    setCompteSelectionne,
    setIsLoading,
    setError,
  } = useComptesStore(
    useShallow((state) => ({
      comptesComptables: state.comptesComptables,
      soldeTotal: state.soldeTotal,
      variationPourcentage: state.variationPourcentage,
      compteSelectionne: state.compteSelectionne,
      isLoading: state.isLoading,
      error: state.error,
      setComptesComptables: state.setComptesComptables,
      setSoldeTotal: state.setSoldeTotal,
      setVariationPourcentage: state.setVariationPourcentage,
      setCompteSelectionne: state.setCompteSelectionne,
      setIsLoading: state.setIsLoading,
      setError: state.setError,
    }))
  );

  // ============================================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================================

  /**
   * Charge les comptes et calcule les soldes dynamiques
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer tous les comptes comptables
      const { comptes } = await getAllComptes();

      // Calculer les soldes d'aujourd'hui
      const comptesAvecSoldes = await calculerSoldesAujourdhui(comptes);

      // Mettre à jour le store
      setComptesComptables(comptesAvecSoldes);

      // Calculer le solde total
      const total = calculerSoldeTotal(comptesAvecSoldes);
      setSoldeTotal(total);

      // Calculer la variation vs hier
      const variation = await calculerVariationComptes(comptes);
      setVariationPourcentage(variation);

      console.log("✅ Comptes comptables chargés avec succès");
    } catch (err) {
      console.error("❌ Erreur chargement comptes:", err);
      setError(err.message || "Erreur lors du chargement des comptes");
    } finally {
      setIsLoading(false);
    }
  }, [
    setComptesComptables,
    setSoldeTotal,
    setVariationPourcentage,
    setIsLoading,
    setError,
  ]);

  // ============================================================================
  // LISTENER RTDB - Mise à jour automatique
  // ============================================================================

  useEffect(() => {
    // Référence au trigger RTDB
    const triggerRef = ref(rtdb, "comptabilite_trigger");

    // Écouter les changements
    const unsubscribe = onValue(triggerRef, (snapshot) => {
      if (snapshot.exists()) {
        const lastTrigger = snapshot.val();

        // Récupérer le dernier événement
        const keys = Object.keys(lastTrigger);
        const latestKey = keys[keys.length - 1];
        const trigger = lastTrigger[latestKey];

        // Vérifier si c'est une action liée aux opérations ou comptes
        if (
          trigger.action &&
          (trigger.action.includes("operation") || trigger.action.includes("compte"))
        ) {
          console.log("♻️ Mise à jour détectée, rechargement des comptes...");
          loadData();
        }
      }
    });

    // Cleanup - se désabonner quand le composant est démonté
    return () => unsubscribe();
  }, [loadData]);

  // ============================================================================
  // CHARGEMENT INITIAL
  // ============================================================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================================
  // DONNÉES DÉRIVÉES - Mémoïsées pour optimisation
  // ============================================================================

  // Comptes d'entrée et de sortie
  const comptesEntree = useMemo(
    () => filtrerComptesParCategorie(comptesComptables, "entree"),
    [comptesComptables]
  );

  const comptesSortie = useMemo(
    () => filtrerComptesParCategorie(comptesComptables, "sortie"),
    [comptesComptables]
  );

  // Données pour le graphique de répartition
  const dataRepartition = useMemo(
    () => calculerDataRepartition(comptesComptables, soldeTotal),
    [comptesComptables, soldeTotal]
  );

  // Données Entrées vs Sorties
  const dataEntreesSorties = useMemo(
    () => calculerDataEntreesSorties(comptesEntree, comptesSortie),
    [comptesEntree, comptesSortie]
  );

  // Données flux par catégorie
  const dataFluxCategorie = useMemo(
    () => calculerDataFluxParCategorie(comptesComptables),
    [comptesComptables]
  );

  // Top 5 comptes d'entrée
  const top5Entrees = useMemo(
    () => calculerTop5Comptes(comptesEntree),
    [comptesEntree]
  );

  // Top 5 comptes de sortie
  const top5Sorties = useMemo(
    () => calculerTop5Comptes(comptesSortie),
    [comptesSortie]
  );

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Sélectionne un compte pour affichage détaillé
   */
  const selectionnerCompte = useCallback(
    (compte) => {
      setCompteSelectionne(compte);
    },
    [setCompteSelectionne]
  );

  /**
   * Désélectionne le compte actuel
   */
  const deselectionnerCompte = useCallback(() => {
    setCompteSelectionne(null);
  }, [setCompteSelectionne]);

  /**
   * Rafraîchit manuellement les données
   */
  const rafraichir = useCallback(() => {
    loadData();
  }, [loadData]);

  // ============================================================================
  // RETOUR DU HOOK
  // ============================================================================

  return {
    // Données
    comptesComptables,
    comptesEntree,
    comptesSortie,
    soldeTotal,
    variationPourcentage,
    compteSelectionne,

    // États UI
    isLoading,
    error,

    // Données pour graphiques
    dataRepartition,
    dataEntreesSorties,
    dataFluxCategorie,
    top5Entrees,
    top5Sorties,

    // Actions
    selectionnerCompte,
    deselectionnerCompte,
    rafraichir,
  };
};

export default useComptesData;
