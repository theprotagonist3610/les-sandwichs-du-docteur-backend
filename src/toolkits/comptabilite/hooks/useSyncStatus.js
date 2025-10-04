// ==========================================
// 📄 toolkits/comptabilite/hooks/useSyncStatus.js
// ==========================================

import { useState, useEffect } from "react";
import { SyncService } from "../services/sync";

export const useSyncStatus = () => {
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const queue = SyncService.getQueue();
    setSyncQueue(queue);
  }, []);

  const processSyncQueue = async () => {
    const queue = SyncService.getQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);

    for (let i = 0; i < queue.length; i++) {
      try {
        console.log("Traitement de l'opération en attente:", queue[i]);
        // Ici vous devriez ré-exécuter l'opération
        // Pour l'instant on la retire simplement
      } catch (error) {
        console.error("Erreur lors de la synchronisation:", error);
      }
    }

    SyncService.clearQueue();
    setSyncQueue([]);
    setIsSyncing(false);
  };

  return {
    syncQueue,
    hasPendingSync: syncQueue.length > 0,
    isSyncing,
    processSyncQueue,
  };
};
