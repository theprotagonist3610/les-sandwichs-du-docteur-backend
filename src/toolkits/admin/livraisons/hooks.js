/**
 * hooks.js
 * Hooks React pour la gestion des livraisons
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { rtdb } from "@/firebase";
import { ref, onValue } from "firebase/database";
import {
  getAllLivraisons,
  getLivraisonsEnCours,
  getLivraisonsByStatut,
  getLivraisonsByLivreur,
} from "./livraisons";
import { RTDB_LIVRAISONS_TRIGGER_PATH } from "./constants";

/**
 * Hook pour récupérer toutes les livraisons avec sync temps réel
 */
export function useLivraisons() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLivraisons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllLivraisons();
      setLivraisons(data);
    } catch (err) {
      console.error("Erreur chargement livraisons:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLivraisons();
  }, [fetchLivraisons]);

  // Écouter les changements RTDB
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_LIVRAISONS_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.action === "livraisons_updated") {
        console.log("🔄 Livraisons mises à jour, rechargement...");
        fetchLivraisons();
      }
    });

    return () => unsubscribe();
  }, [fetchLivraisons]);

  return { livraisons, loading, error, refetch: fetchLivraisons };
}

/**
 * Hook pour récupérer uniquement les livraisons en cours (non livrées)
 */
export function useLivraisonsEnCours() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLivraisons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLivraisonsEnCours();
      setLivraisons(data);
    } catch (err) {
      console.error("Erreur chargement livraisons en cours:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLivraisons();
  }, [fetchLivraisons]);

  // Écouter les changements RTDB
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_LIVRAISONS_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.action === "livraisons_updated") {
        console.log("🔄 Livraisons en cours mises à jour, rechargement...");
        fetchLivraisons();
      }
    });

    return () => unsubscribe();
  }, [fetchLivraisons]);

  return { livraisons, loading, error, refetch: fetchLivraisons };
}

/**
 * Hook pour récupérer les livraisons par statut
 */
export function useLivraisonsByStatut(statut) {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLivraisons = useCallback(async () => {
    if (!statut) {
      setLivraisons([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getLivraisonsByStatut(statut);
      setLivraisons(data);
    } catch (err) {
      console.error("Erreur chargement livraisons par statut:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [statut]);

  useEffect(() => {
    fetchLivraisons();
  }, [fetchLivraisons]);

  // Écouter les changements RTDB
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_LIVRAISONS_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.action === "livraisons_updated") {
        console.log("🔄 Livraisons par statut mises à jour, rechargement...");
        fetchLivraisons();
      }
    });

    return () => unsubscribe();
  }, [fetchLivraisons]);

  return { livraisons, loading, error, refetch: fetchLivraisons };
}

/**
 * Hook pour récupérer les livraisons d'un livreur
 */
export function useLivraisonsByLivreur(livreurId) {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLivraisons = useCallback(async () => {
    if (!livreurId) {
      setLivraisons([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getLivraisonsByLivreur(livreurId);
      setLivraisons(data);
    } catch (err) {
      console.error("Erreur chargement livraisons par livreur:", err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [livreurId]);

  useEffect(() => {
    fetchLivraisons();
  }, [fetchLivraisons]);

  // Écouter les changements RTDB
  useEffect(() => {
    const triggerRef = ref(rtdb, RTDB_LIVRAISONS_TRIGGER_PATH);

    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.action === "livraisons_updated") {
        console.log("🔄 Livraisons du livreur mises à jour, rechargement...");
        fetchLivraisons();
      }
    });

    return () => unsubscribe();
  }, [fetchLivraisons]);

  return { livraisons, loading, error, refetch: fetchLivraisons };
}

/**
 * Hook pour calculer les statistiques des livraisons
 */
export function useStatistiquesLivraisons(livraisons) {
  const stats = useMemo(() => {
    if (!livraisons || livraisons.length === 0) {
      return {
        total: 0,
        en_attente: 0,
        assignee: 0,
        recuperee: 0,
        en_cours: 0,
        livree: 0,
        annulee: 0,
        urgentes: 0,
      };
    }

    return {
      total: livraisons.length,
      en_attente: livraisons.filter((l) => l.statut === "en_attente").length,
      assignee: livraisons.filter((l) => l.statut === "assignee").length,
      recuperee: livraisons.filter((l) => l.statut === "recuperee").length,
      en_cours: livraisons.filter((l) => l.statut === "en_cours").length,
      livree: livraisons.filter((l) => l.statut === "livree").length,
      annulee: livraisons.filter((l) => l.statut === "annulee").length,
      urgentes: livraisons.filter((l) => l.priorite === "urgente").length,
    };
  }, [livraisons]);

  return stats;
}
