/**
 * hooks.js
 * React hooks pour le système comptable
 * Gestion du cache, temps réel RTDB, et détection automatique du changement de jour
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "../../../firebase.js";
import {
  COMPTES_DOC,
  TRESORERIE_DOC,
  TODAY_DOC,
  HISTORIQUE_DAYS_COLLECTION,
  STATISTIQUES_WEEKS_COLLECTION,
  BILAN_WEEKS_COLLECTION,
  RTDB_NOTIFICATIONS_PATH,
  RTDB_COMPTA_TRIGGER_PATH,
  CACHE_KEY_COMPTES,
  CACHE_KEY_TRESORERIE,
  CACHE_KEY_TODAY,
} from "./constants";
import {
  formatDayKey,
  formatWeekKey,
  formatMonthKey,
  getDaysInWeek,
  getDaysInMonth,
  isNewDay,
  saveToCache,
  getFromCache,
  clearCache,
} from "./utils";
import { getAllComptes, getAllComptesTresorerie } from "./comptes";
import { getOperationsToday, getOperationsByDay } from "./operations";
import { archiverOperationsVeille } from "./archivage";
import { getStatistiquesJour, getStatistiquesSemaine } from "./statistiques";
import { getBilanJour, getBilanSemaine } from "./bilans";
import {
  comptesListeSchema,
  comptesTresorerieListeSchema,
  operationsListeSchema,
  dayStatisticSchema,
  weekStatisticSchema,
  dayBilanSchema,
  weekBilanSchema,
} from "./schemas";

// ============================================================================
// HOOKS POUR LES COMPTES
// ============================================================================

/**
 * Hook pour récupérer la liste de tous les comptes simples
 * @returns {Object} { comptes, loading, error, refetch }
 */
export function useComptesListe() {
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComptes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache
      const cached = getFromCache(CACHE_KEY_COMPTES);
      if (cached) {
        setComptes(cached);
        setLoading(false);
        return;
      }

      // Récupérer depuis Firestore
      const { comptes: comptesData } = await getAllComptes();
      setComptes(comptesData);
      saveToCache(CACHE_KEY_COMPTES, comptesData);
    } catch (err) {
      console.error("❌ Erreur récupération comptes:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComptes();

    // Écouter les mises à jour en temps réel
    const unsubscribe = onSnapshot(
      doc(db, COMPTES_DOC),
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const validated = comptesListeSchema.parse(snapshot.data());
            setComptes(validated.comptes);
            saveToCache(CACHE_KEY_COMPTES, validated.comptes);
          } catch (err) {
            console.error("❌ Erreur validation comptes:", err);
          }
        }
      },
      (err) => {
        console.error("❌ Erreur snapshot comptes:", err);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [fetchComptes]);

  return { comptes, loading, error, refetch: fetchComptes };
}

/**
 * Hook pour récupérer la liste de tous les comptes de trésorerie
 * @returns {Object} { comptes, loading, error, refetch }
 */
export function useComptesTresorerieListe() {
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComptes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache
      const cached = getFromCache(CACHE_KEY_TRESORERIE);
      if (cached) {
        setComptes(cached);
        setLoading(false);
        return;
      }

      // Récupérer depuis Firestore
      const { comptes: comptesData } = await getAllComptesTresorerie();
      setComptes(comptesData);
      saveToCache(CACHE_KEY_TRESORERIE, comptesData);
    } catch (err) {
      console.error("❌ Erreur récupération trésorerie:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComptes();

    // Écouter les mises à jour en temps réel
    const unsubscribe = onSnapshot(
      doc(db, TRESORERIE_DOC),
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const validated = comptesTresorerieListeSchema.parse(snapshot.data());
            setComptes(validated.comptes);
            saveToCache(CACHE_KEY_TRESORERIE, validated.comptes);
          } catch (err) {
            console.error("❌ Erreur validation trésorerie:", err);
          }
        }
      },
      (err) => {
        console.error("❌ Erreur snapshot trésorerie:", err);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [fetchComptes]);

  return { comptes, loading, error, refetch: fetchComptes };
}

// ============================================================================
// HOOK POUR LES OPÉRATIONS DU JOUR (avec détection changement de jour)
// ============================================================================

/**
 * Hook pour récupérer les opérations du jour en cours
 * Détecte automatiquement le changement de jour et déclenche l'archivage
 * @returns {Object} { operations, loading, error, refetch, dayKey }
 */
export function useTodayCompta() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dayKey, setDayKey] = useState(formatDayKey());
  const lastDayKeyRef = useRef(formatDayKey());

  const fetchOperations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentDayKey = formatDayKey();

      // Vérifier si on a changé de jour
      if (isNewDay(lastDayKeyRef.current)) {
        console.log(
          `📅 Changement de jour détecté: ${lastDayKeyRef.current} → ${currentDayKey}`
        );

        // Archiver les opérations de la veille
        try {
          await archiverOperationsVeille();
          console.log("✅ Archivage automatique effectué");
        } catch (archiveError) {
          console.error("❌ Erreur archivage automatique:", archiveError);
        }

        // Mettre à jour la référence
        lastDayKeyRef.current = currentDayKey;
        setDayKey(currentDayKey);

        // Vider le cache
        clearCache(CACHE_KEY_TODAY);
      }

      // Vérifier le cache
      const cached = getFromCache(CACHE_KEY_TODAY);
      if (cached) {
        setOperations(cached);
        setLoading(false);
        return;
      }

      // Récupérer depuis Firestore
      const { operations: operationsData } = await getOperationsToday();
      setOperations(operationsData);
      saveToCache(CACHE_KEY_TODAY, operationsData);
    } catch (err) {
      console.error("❌ Erreur récupération opérations today:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();

    // Vérifier le changement de jour toutes les minutes
    const dayCheckInterval = setInterval(() => {
      const currentDayKey = formatDayKey();
      if (isNewDay(lastDayKeyRef.current)) {
        console.log("⏰ Changement de jour détecté par interval");
        fetchOperations();
      }
    }, 60 * 1000); // 1 minute

    // Écouter les mises à jour en temps réel
    const unsubscribe = onSnapshot(
      doc(db, TODAY_DOC),
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const validated = operationsListeSchema.parse(snapshot.data());
            setOperations(validated.operations);
            saveToCache(CACHE_KEY_TODAY, validated.operations);
          } catch (err) {
            console.error("❌ Erreur validation opérations today:", err);
          }
        } else {
          setOperations([]);
          saveToCache(CACHE_KEY_TODAY, []);
        }
      },
      (err) => {
        console.error("❌ Erreur snapshot today:", err);
        setError(err);
      }
    );

    return () => {
      unsubscribe();
      clearInterval(dayCheckInterval);
    };
  }, [fetchOperations]);

  return { operations, loading, error, refetch: fetchOperations, dayKey };
}

// ============================================================================
// HOOKS POUR L'HISTORIQUE
// ============================================================================

/**
 * Hook pour récupérer les opérations d'un jour spécifique
 * @param {string} dayKey - Format DDMMYYYY
 * @returns {Object} { operations, loading, error, refetch }
 */
export function useHistoriqueByDay(dayKey) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOperations = useCallback(async () => {
    if (!dayKey) return;

    try {
      setLoading(true);
      setError(null);

      const { operations: operationsData } = await getOperationsByDay(dayKey);
      setOperations(operationsData);
    } catch (err) {
      console.error(`❌ Erreur récupération historique ${dayKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  useEffect(() => {
    fetchOperations();

    if (!dayKey) return;

    // Écouter les mises à jour en temps réel
    const unsubscribe = onSnapshot(
      doc(db, `${HISTORIQUE_DAYS_COLLECTION}/${dayKey}`),
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const validated = operationsListeSchema.parse(snapshot.data());
            setOperations(validated.operations);
          } catch (err) {
            console.error("❌ Erreur validation historique:", err);
          }
        } else {
          setOperations([]);
        }
      },
      (err) => {
        console.error("❌ Erreur snapshot historique:", err);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [fetchOperations, dayKey]);

  return { operations, loading, error, refetch: fetchOperations };
}

/**
 * Hook pour récupérer les opérations d'une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY
 * @returns {Object} { operations, loading, error, refetch }
 */
export function useHistoriqueByWeek(weekKey) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOperations = useCallback(async () => {
    if (!weekKey) return;

    try {
      setLoading(true);
      setError(null);

      const jours = getDaysInWeek(weekKey);
      const allOperations = [];

      for (const dayKey of jours) {
        try {
          const { operations: dayOps } = await getOperationsByDay(dayKey);
          allOperations.push(...dayOps);
        } catch (err) {
          console.warn(`⚠️ Erreur récupération ${dayKey}:`, err);
        }
      }

      // Trier par date
      allOperations.sort((a, b) => b.date - a.date);
      setOperations(allOperations);
    } catch (err) {
      console.error(`❌ Erreur récupération historique semaine ${weekKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  return { operations, loading, error, refetch: fetchOperations };
}

/**
 * Hook pour récupérer les opérations d'un mois
 * @param {string} monthKey - Format MMYYYY
 * @returns {Object} { operations, loading, error, refetch }
 */
export function useHistoriqueByMonth(monthKey) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOperations = useCallback(async () => {
    if (!monthKey) return;

    try {
      setLoading(true);
      setError(null);

      const jours = getDaysInMonth(monthKey);
      const allOperations = [];

      for (const dayKey of jours) {
        try {
          const { operations: dayOps } = await getOperationsByDay(dayKey);
          allOperations.push(...dayOps);
        } catch (err) {
          console.warn(`⚠️ Erreur récupération ${dayKey}:`, err);
        }
      }

      // Trier par date
      allOperations.sort((a, b) => b.date - a.date);
      setOperations(allOperations);
    } catch (err) {
      console.error(`❌ Erreur récupération historique mois ${monthKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  return { operations, loading, error, refetch: fetchOperations };
}

// ============================================================================
// HOOKS POUR LES STATISTIQUES
// ============================================================================

/**
 * Hook pour récupérer les statistiques d'un jour
 * @param {string} dayKey - Format DDMMYYYY (par défaut aujourd'hui)
 * @returns {Object} { statistiques, loading, error, refetch }
 */
export function useStatistiquesByDay(dayKey = formatDayKey()) {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistiques = useCallback(async () => {
    if (!dayKey) return;

    try {
      setLoading(true);
      setError(null);

      const stats = await getStatistiquesJour(dayKey);
      setStatistiques(stats);
    } catch (err) {
      console.error(`❌ Erreur récupération statistiques ${dayKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  useEffect(() => {
    fetchStatistiques();
  }, [fetchStatistiques]);

  return { statistiques, loading, error, refetch: fetchStatistiques };
}

/**
 * Hook pour récupérer les statistiques d'une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY (par défaut semaine actuelle)
 * @returns {Object} { statistiques, loading, error, refetch }
 */
export function useStatistiquesByWeek(weekKey = formatWeekKey()) {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistiques = useCallback(async () => {
    if (!weekKey) return;

    try {
      setLoading(true);
      setError(null);

      const stats = await getStatistiquesSemaine(weekKey);
      setStatistiques(stats);
    } catch (err) {
      console.error(`❌ Erreur récupération statistiques semaine ${weekKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useEffect(() => {
    fetchStatistiques();

    if (!weekKey) return;

    // Écouter les mises à jour en temps réel
    const unsubscribe = onSnapshot(
      doc(db, `${STATISTIQUES_WEEKS_COLLECTION}/${weekKey}`),
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const validated = weekStatisticSchema.parse(snapshot.data());
            setStatistiques(validated);
          } catch (err) {
            console.error("❌ Erreur validation statistiques semaine:", err);
          }
        }
      },
      (err) => {
        console.error("❌ Erreur snapshot statistiques semaine:", err);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [fetchStatistiques, weekKey]);

  return { statistiques, loading, error, refetch: fetchStatistiques };
}

/**
 * Hook pour récupérer les statistiques d'un mois (agrégation de plusieurs semaines)
 * @param {string} monthKey - Format MMYYYY
 * @returns {Object} { statistiques, loading, error, refetch }
 */
export function useStatistiquesByMonth(monthKey) {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistiques = useCallback(async () => {
    if (!monthKey) return;

    try {
      setLoading(true);
      setError(null);

      // Calculer les statistiques du mois en agrégeant les jours
      const jours = getDaysInMonth(monthKey);
      const jourStats = [];

      for (const dayKey of jours) {
        try {
          const stats = await getStatistiquesJour(dayKey);
          jourStats.push(stats);
        } catch (err) {
          console.warn(`⚠️ Erreur stats ${dayKey}:`, err);
        }
      }

      // Agréger les données
      let total_entrees = 0;
      let total_sorties = 0;
      let nombre_operations = 0;

      jourStats.forEach((stat) => {
        total_entrees += stat.total_entrees;
        total_sorties += stat.total_sorties;
        nombre_operations += stat.nombre_operations;
      });

      const solde_mensuel = total_entrees - total_sorties;

      const statsMonth = {
        id: monthKey,
        jours: jourStats,
        total_entrees,
        total_sorties,
        solde_mensuel,
        nombre_operations,
      };

      setStatistiques(statsMonth);
    } catch (err) {
      console.error(`❌ Erreur récupération statistiques mois ${monthKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchStatistiques();
  }, [fetchStatistiques]);

  return { statistiques, loading, error, refetch: fetchStatistiques };
}

// ============================================================================
// HOOKS POUR LES BILANS
// ============================================================================

/**
 * Hook pour récupérer le bilan d'un jour
 * @param {string} dayKey - Format DDMMYYYY (par défaut aujourd'hui)
 * @returns {Object} { bilan, loading, error, refetch }
 */
export function useBilanByDay(dayKey = formatDayKey()) {
  const [bilan, setBilan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBilan = useCallback(async () => {
    if (!dayKey) return;

    try {
      setLoading(true);
      setError(null);

      const bilanData = await getBilanJour(dayKey);
      setBilan(bilanData);
    } catch (err) {
      console.error(`❌ Erreur récupération bilan ${dayKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  useEffect(() => {
    fetchBilan();
  }, [fetchBilan]);

  return { bilan, loading, error, refetch: fetchBilan };
}

/**
 * Hook pour récupérer le bilan d'une semaine
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY (par défaut semaine actuelle)
 * @returns {Object} { bilan, loading, error, refetch }
 */
export function useBilanByWeek(weekKey = formatWeekKey()) {
  const [bilan, setBilan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBilan = useCallback(async () => {
    if (!weekKey) return;

    try {
      setLoading(true);
      setError(null);

      const bilanData = await getBilanSemaine(weekKey);
      setBilan(bilanData);
    } catch (err) {
      console.error(`❌ Erreur récupération bilan semaine ${weekKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useEffect(() => {
    fetchBilan();

    if (!weekKey) return;

    // Écouter les mises à jour en temps réel
    const unsubscribe = onSnapshot(
      doc(db, `${BILAN_WEEKS_COLLECTION}/${weekKey}`),
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const validated = weekBilanSchema.parse(snapshot.data());
            setBilan(validated);
          } catch (err) {
            console.error("❌ Erreur validation bilan semaine:", err);
          }
        }
      },
      (err) => {
        console.error("❌ Erreur snapshot bilan semaine:", err);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [fetchBilan, weekKey]);

  return { bilan, loading, error, refetch: fetchBilan };
}

/**
 * Hook pour récupérer le bilan d'un mois (agrégation de plusieurs semaines)
 * @param {string} monthKey - Format MMYYYY
 * @returns {Object} { bilan, loading, error, refetch }
 */
export function useBilanByMonth(monthKey) {
  const [bilan, setBilan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBilan = useCallback(async () => {
    if (!monthKey) return;

    try {
      setLoading(true);
      setError(null);

      // Calculer le bilan du mois en agrégeant les jours
      const jours = getDaysInMonth(monthKey);
      const jourBilans = [];

      for (const dayKey of jours) {
        try {
          const bilanJour = await getBilanJour(dayKey);
          jourBilans.push(bilanJour);
        } catch (err) {
          console.warn(`⚠️ Erreur bilan ${dayKey}:`, err);
        }
      }

      // Agréger les données
      let total_entrees = 0;
      let total_sorties = 0;
      let tresorerie_entrees = 0;
      let tresorerie_sorties = 0;
      let nombre_operations = 0;

      jourBilans.forEach((b) => {
        total_entrees += b.total_entrees;
        total_sorties += b.total_sorties;
        tresorerie_entrees += b.tresorerie_entrees;
        tresorerie_sorties += b.tresorerie_sorties;
        nombre_operations += b.nombre_operations;
      });

      const resultat = total_entrees - total_sorties;
      const solde_tresorerie = tresorerie_entrees - tresorerie_sorties;

      let statut = "equilibre";
      if (resultat > 0) {
        statut = "positif";
      } else if (resultat < 0) {
        statut = "negatif";
      }

      const bilanMonth = {
        id: monthKey,
        jours: jourBilans,
        total_entrees,
        total_sorties,
        resultat,
        statut,
        tresorerie_entrees,
        tresorerie_sorties,
        solde_tresorerie,
        nombre_operations,
      };

      setBilan(bilanMonth);
    } catch (err) {
      console.error(`❌ Erreur récupération bilan mois ${monthKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchBilan();
  }, [fetchBilan]);

  return { bilan, loading, error, refetch: fetchBilan };
}

// ============================================================================
// HOOKS UTILITAIRES
// ============================================================================

/**
 * Hook pour récupérer les opérations d'un jour (simplifié)
 * @param {string} dayKey - Format DDMMYYYY (par défaut aujourd'hui)
 * @returns {Object} { operations, loading, error, refetch }
 */
export function useOperationsByDay(dayKey = formatDayKey()) {
  const isToday = dayKey === formatDayKey();

  // Utiliser useTodayCompta si c'est aujourd'hui
  const todayResult = useTodayCompta();
  const historyResult = useHistoriqueByDay(dayKey);

  if (isToday) {
    return todayResult;
  }

  return historyResult;
}

/**
 * Hook pour récupérer les opérations d'une semaine (simplifié)
 * @param {string} weekKey - Format DDMMYYYY-DDMMYYYY (par défaut semaine actuelle)
 * @returns {Object} { operations, loading, error, refetch }
 */
export function useOperationsByWeek(weekKey = formatWeekKey()) {
  return useHistoriqueByWeek(weekKey);
}

/**
 * Hook pour récupérer les opérations d'un mois (simplifié)
 * @param {string} monthKey - Format MMYYYY
 * @returns {Object} { operations, loading, error, refetch }
 */
export function useOperationsByMonth(monthKey) {
  return useHistoriqueByMonth(monthKey);
}

/**
 * Hook pour récupérer les soldes de trésorerie en temps réel
 * @returns {Object} { soldes, total, loading, error, refetch }
 */
export function useTresorerie() {
  const [soldes, setSoldes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { comptes } = useComptesTresorerieListe();
  const { statistiques } = useStatistiquesByDay();

  const calculateSoldes = useCallback(() => {
    if (!comptes || !statistiques) return;

    try {
      const soldesArray = comptes.map((compte) => {
        // Trouver les stats pour ce compte
        const stat = statistiques.tresorerie.find(
          (t) => t.compte_id === compte.id
        );

        const montant_total = stat ? stat.montant_total : 0;

        return {
          compte_id: compte.id,
          code_ohada: compte.code_ohada,
          denomination: compte.denomination,
          numero: compte.numero,
          solde: montant_total,
        };
      });

      setSoldes(soldesArray);

      // Calculer le total
      const totalSolde = soldesArray.reduce((sum, s) => sum + s.solde, 0);
      setTotal(totalSolde);

      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur calcul soldes trésorerie:", err);
      setError(err);
      setLoading(false);
    }
  }, [comptes, statistiques]);

  useEffect(() => {
    calculateSoldes();
  }, [calculateSoldes]);

  return {
    soldes,
    total,
    loading,
    error,
    refetch: calculateSoldes,
  };
}

// ============================================================================
// HOOKS BUDGETS
// ============================================================================

/**
 * Hook pour récupérer la liste de tous les budgets
 */
export function useBudgetsList() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const { getAllBudgets } = await import("./budgets");
      const data = await getAllBudgets();
      setBudgets(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur récupération budgets:", err);
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Écouter les changements RTDB
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (
          latestTrigger &&
          ["budget_created", "budget_updated", "budget_deleted"].includes(
            latestTrigger.action
          )
        ) {
          console.log("🔄 Trigger budget détecté, rechargement...");
          fetchBudgets();
        }
      }
    });

    return () => unsubscribe();
  }, [fetchBudgets]);

  return { budgets, loading, error, refetch: fetchBudgets };
}

/**
 * Hook pour récupérer le budget actif d'un mois
 * @param {string} moisKey - Format MMYYYY
 */
export function useBudgetByMois(moisKey) {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudget = useCallback(async () => {
    if (!moisKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { getBudgetActif } = await import("./budgets");
      const data = await getBudgetActif(moisKey);
      setBudget(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur récupération budget mois:", err);
      setError(err);
      setLoading(false);
    }
  }, [moisKey]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  // Écouter les changements RTDB
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (
          latestTrigger &&
          ["budget_created", "budget_updated", "budget_deleted"].includes(
            latestTrigger.action
          )
        ) {
          console.log("🔄 Trigger budget détecté, rechargement...");
          fetchBudget();
        }
      }
    });

    return () => unsubscribe();
  }, [fetchBudget]);

  return { budget, loading, error, refetch: fetchBudget };
}

/**
 * Hook pour récupérer un budget par son ID
 * @param {string} budgetId - ID du budget
 */
export function useBudgetById(budgetId) {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudget = useCallback(async () => {
    if (!budgetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { getBudgetById } = await import("./budgets");
      const data = await getBudgetById(budgetId);
      setBudget(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur récupération budget:", err);
      setError(err);
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  // Écouter les changements RTDB
  useEffect(() => {
    if (!budgetId) return;

    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (
          latestTrigger &&
          latestTrigger.action === "budget_updated" &&
          latestTrigger.budgetId === budgetId
        ) {
          console.log("🔄 Trigger budget détecté, rechargement...");
          fetchBudget();
        }
      }
    });

    return () => unsubscribe();
  }, [budgetId, fetchBudget]);

  return { budget, loading, error, refetch: fetchBudget };
}

/**
 * Hook pour récupérer un budget avec réalisation
 * @param {string} budgetId - ID du budget
 */
export function useBudgetAvecRealisation(budgetId) {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudgetRealisation = useCallback(async () => {
    if (!budgetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { calculerRealisationBudget } = await import("./budgets");
      const data = await calculerRealisationBudget(budgetId);
      setBudget(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur calcul réalisation budget:", err);
      setError(err);
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchBudgetRealisation();
  }, [fetchBudgetRealisation]);

  // Écouter les changements RTDB (stats ou budget)
  useEffect(() => {
    if (!budgetId) return;

    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (
          latestTrigger &&
          (latestTrigger.action === "stats_updated" ||
            (latestTrigger.action === "budget_updated" &&
              latestTrigger.budgetId === budgetId))
        ) {
          console.log("🔄 Trigger détecté, recalcul réalisation...");
          fetchBudgetRealisation();
        }
      }
    });

    return () => unsubscribe();
  }, [budgetId, fetchBudgetRealisation]);

  return { budget, loading, error, refetch: fetchBudgetRealisation };
}

/**
 * Hook pour récupérer les alertes d'un budget
 * @param {string} budgetId - ID du budget
 */
export function useBudgetAlertes(budgetId) {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlertes = useCallback(async () => {
    if (!budgetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { verifierAlertesBudget } = await import("./budgets");
      const data = await verifierAlertesBudget(budgetId);
      setAlertes(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur récupération alertes budget:", err);
      setError(err);
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchAlertes();
  }, [fetchAlertes]);

  // Écouter les changements RTDB
  useEffect(() => {
    if (!budgetId) return;

    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (
          latestTrigger &&
          (latestTrigger.action === "stats_updated" ||
            (latestTrigger.action === "budget_updated" &&
              latestTrigger.budgetId === budgetId))
        ) {
          console.log("🔄 Trigger détecté, recalcul alertes...");
          fetchAlertes();
        }
      }
    });

    return () => unsubscribe();
  }, [budgetId, fetchAlertes]);

  return { alertes, loading, error, refetch: fetchAlertes };
}

// ============================================================================
// HOOKS PREVISIONS
// ============================================================================

/**
 * Hook pour générer et récupérer des prévisions globales
 * @param {number} nbMois - Nombre de mois à prévoir (1, 3, ou 6)
 * @param {number} nbMoisHistorique - Nombre de mois d'historique à analyser
 * @returns {Object} { previsions, loading, error, refetch }
 */
export function usePrevisions(nbMois = 3, nbMoisHistorique = 6) {
  const [previsions, setPrevisions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Importer la fonction dynamiquement pour éviter les cycles
      const { genererPrevisionsGlobales } = await import("./previsions");
      const data = await genererPrevisionsGlobales(nbMois, nbMoisHistorique);

      setPrevisions(data);
    } catch (err) {
      console.error("Erreur lors de la génération des prévisions:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [nbMois, nbMoisHistorique]);

  useEffect(() => {
    fetchPrevisions();
  }, [fetchPrevisions]);

  // Écouter les changements RTDB pour régénérer les prévisions
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (latestTrigger && latestTrigger.action === "stats_updated") {
          console.log("🔄 Stats mises à jour, régénération des prévisions...");
          fetchPrevisions();
        }
      }
    });

    return () => unsubscribe();
  }, [fetchPrevisions]);

  return { previsions, loading, error, refetch: fetchPrevisions };
}

/**
 * Hook pour détecter les anomalies entre prévisions et réalisations
 * @param {string} moisKey - Mois à analyser (format MMYYYY)
 * @param {Object} previsions - Prévisions pour ce mois
 * @returns {Object} { anomalies, loading, error }
 */
export function useAnomaliesPrevisions(moisKey, previsions) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnomalies = useCallback(async () => {
    if (!moisKey || !previsions) {
      setAnomalies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Charger les statistiques réelles du mois
      const { getStatistiquesByMonth } = await import("./statistiques");
      const realisations = await getStatistiquesByMonth(moisKey);

      if (!realisations) {
        setAnomalies([]);
        setLoading(false);
        return;
      }

      // Trouver les prévisions correspondantes au mois
      const prevMois = previsions.previsions_par_mois?.find(p => p.mois === moisKey);

      if (!prevMois) {
        setAnomalies([]);
        setLoading(false);
        return;
      }

      // Détecter les anomalies
      const { detecterAnomalies } = await import("./previsions");
      const anomaliesDetectees = detecterAnomalies(prevMois, realisations);

      setAnomalies(anomaliesDetectees);
    } catch (err) {
      console.error("Erreur lors de la détection des anomalies:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [moisKey, previsions]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  return { anomalies, loading, error, refetch: fetchAnomalies };
}

/**
 * Hook pour comparer les prévisions multi-périodes
 * @returns {Object} { comparaison, loading, error, refetch }
 */
export function useComparaisonPrevisions() {
  const [comparaison, setComparaison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComparaison = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Générer 3 jeux de prévisions : 1 mois, 3 mois, 6 mois
      const { genererPrevisionsGlobales } = await import("./previsions");

      const [prev1Mois, prev3Mois, prev6Mois] = await Promise.all([
        genererPrevisionsGlobales(1, 6),
        genererPrevisionsGlobales(3, 6),
        genererPrevisionsGlobales(6, 12),
      ]);

      setComparaison({
        un_mois: prev1Mois,
        trois_mois: prev3Mois,
        six_mois: prev6Mois,
      });
    } catch (err) {
      console.error("Erreur lors de la comparaison des prévisions:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComparaison();
  }, [fetchComparaison]);

  return { comparaison, loading, error, refetch: fetchComparaison };
}

// ============================================================================
// HOOKS COMPARAISONS
// ============================================================================

/**
 * Hook pour comparer deux mois
 * @param {string} mois1Key - Premier mois
 * @param {string} mois2Key - Deuxième mois
 * @returns {Object} { comparaison, loading, error, refetch }
 */
export function useComparaisonMois(mois1Key, mois2Key) {
  const [comparaison, setComparaison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComparaison = useCallback(async () => {
    if (!mois1Key || !mois2Key) {
      setComparaison(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { comparerDeuxMois } = await import("./comparaisons");
      const data = await comparerDeuxMois(mois1Key, mois2Key);

      setComparaison(data);
    } catch (err) {
      console.error("Erreur comparaison mois:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [mois1Key, mois2Key]);

  useEffect(() => {
    fetchComparaison();
  }, [fetchComparaison]);

  return { comparaison, loading, error, refetch: fetchComparaison };
}

/**
 * Hook pour comparer deux années
 * @param {number} annee1 - Première année
 * @param {number} annee2 - Deuxième année
 * @returns {Object} { comparaison, loading, error, refetch }
 */
export function useComparaisonAnnees(annee1, annee2) {
  const [comparaison, setComparaison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComparaison = useCallback(async () => {
    if (!annee1 || !annee2) {
      setComparaison(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { comparerDeuxAnnees } = await import("./comparaisons");
      const data = await comparerDeuxAnnees(annee1, annee2);

      setComparaison(data);
    } catch (err) {
      console.error("Erreur comparaison années:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [annee1, annee2]);

  useEffect(() => {
    fetchComparaison();
  }, [fetchComparaison]);

  return { comparaison, loading, error, refetch: fetchComparaison };
}

/**
 * Hook pour comparer le mois en cours avec le mois précédent
 * @returns {Object} { comparaison, loading, error, refetch }
 */
export function useComparaisonMoisActuel() {
  const [comparaison, setComparaison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComparaison = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { comparerMoisVsMoisPrecedent } = await import("./comparaisons");
      const data = await comparerMoisVsMoisPrecedent();

      setComparaison(data);
    } catch (err) {
      console.error("Erreur comparaison mois actuel:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComparaison();
  }, [fetchComparaison]);

  // Écouter les changements RTDB
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (latestTrigger && latestTrigger.action === "stats_updated") {
          console.log("🔄 Stats mises à jour, rafraîchissement comparaison...");
          fetchComparaison();
        }
      }
    });

    return () => unsubscribe();
  }, [fetchComparaison]);

  return { comparaison, loading, error, refetch: fetchComparaison };
}

// ============================================================================
// HOOKS INSIGHTS
// ============================================================================

/**
 * Hook pour générer des insights pour un mois
 * @param {string} moisKey - Mois à analyser
 * @param {Object} options - Options
 * @returns {Object} { insights, loading, error, refetch }
 */
export function useInsightsMois(moisKey, options = {}) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!moisKey) {
      setInsights(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { genererInsightsMois } = await import("./insights");
      const data = await genererInsightsMois(moisKey, options);

      setInsights(data);
    } catch (err) {
      console.error("Erreur génération insights:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [moisKey, options]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Écouter les changements RTDB
  useEffect(() => {
    if (!moisKey) return;

    const triggerRef = ref(rtdb, RTDB_COMPTA_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTrigger = Object.values(data).pop();
        if (latestTrigger && latestTrigger.action === "stats_updated") {
          console.log("🔄 Stats mises à jour, régénération insights...");
          fetchInsights();
        }
      }
    });

    return () => unsubscribe();
  }, [moisKey, fetchInsights]);

  return { insights, loading, error, refetch: fetchInsights };
}

/**
 * Hook pour calculer le score de santé financière
 * @param {Object} stats - Statistiques du mois
 * @returns {Object} Score de santé
 */
export function useScoreSante(stats) {
  return useMemo(() => {
    if (!stats) return null;

    const { calculerScoreSante } = require("./insights");
    return calculerScoreSante(stats);
  }, [stats]);
}
