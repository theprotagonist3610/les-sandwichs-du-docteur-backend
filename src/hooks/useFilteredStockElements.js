/**
 * useFilteredStockElements.js
 * Hook personnalisé qui combine useStockFilterStore et useStockElements
 * Évite les boucles infinies en utilisant des valeurs primitives comme dépendances
 */

import { useState, useEffect, useCallback } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/firebase.js";
import { listElements } from "@/toolkits/admin/stockToolkit.jsx";
import useStockFilterStore, {
  selectSearchQuery,
  selectTypeFilter,
  selectStatusFilter,
} from "@/stores/admin/useStockFilterStore.js";

const RTDB_NOTIFICATIONS_PATH = "notification";

/**
 * Hook pour récupérer les éléments de stock filtrés
 * Utilise le store Zustand pour les filtres
 * @returns {Object} { elements, loading, error, refetch }
 */
export function useFilteredStockElements() {
  // Récupérer les filtres depuis le store (valeurs primitives)
  const searchQuery = useStockFilterStore(selectSearchQuery);
  const typeFilter = useStockFilterStore(selectTypeFilter);
  const statusFilter = useStockFilterStore(selectStatusFilter);

  // État local
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction de chargement avec dépendances primitives
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construire le filtre
      const filter = {};
      if (typeFilter !== "all") filter.type = typeFilter;
      if (statusFilter === "active") filter.status = true;
      if (statusFilter === "inactive") filter.status = false;
      if (searchQuery) filter.search = searchQuery;

      const data = await listElements(filter);
      setElements(data);
    } catch (err) {
      console.error("❌ Erreur useFilteredStockElements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, statusFilter]); // Dépendances primitives

  // Charger les données quand les filtres changent
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les notifications temps réel
  useEffect(() => {
    const notificationsRef = ref(rtdb, RTDB_NOTIFICATIONS_PATH);

    const handleNotification = (snapshot) => {
      const notification = snapshot.val();
      if (
        notification &&
        (notification.title?.includes("stock") ||
          notification.title?.includes("Stock") ||
          notification.title?.includes("Élément"))
      ) {
        console.log("🔔 Notification stock reçue, rechargement...");
        fetchData();
      }
    };

    onValue(notificationsRef, handleNotification);

    return () => {
      off(notificationsRef, "value", handleNotification);
    };
  }, [fetchData]);

  return { elements, loading, error, refetch: fetchData };
}

export default useFilteredStockElements;
