// ==========================================
// 📄 toolkits/comptabilite/services/sync.js
// ==========================================

import { COMPTA_CONFIG } from "../constants";

export class SyncService {
  static addToQueue(operation) {
    try {
      const queue = JSON.parse(
        localStorage.getItem(COMPTA_CONFIG.SYNC_QUEUE_KEY) || "[]"
      );
      queue.push({
        operation,
        timestamp: new Date().toISOString(),
        retries: 0,
      });
      localStorage.setItem(COMPTA_CONFIG.SYNC_QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error("Erreur ajout file de synchronisation:", error);
      return false;
    }
  }

  static getQueue() {
    try {
      return JSON.parse(
        localStorage.getItem(COMPTA_CONFIG.SYNC_QUEUE_KEY) || "[]"
      );
    } catch (error) {
      console.error("Erreur lecture file de synchronisation:", error);
      return [];
    }
  }

  static clearQueue() {
    try {
      localStorage.removeItem(COMPTA_CONFIG.SYNC_QUEUE_KEY);
      return true;
    } catch (error) {
      console.error("Erreur vidage file de synchronisation:", error);
      return false;
    }
  }

  static async saveWithRetry(operation, maxRetries = 1) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return true;
      } catch (error) {
        lastError = error;
        console.error(`Tentative ${attempt + 1} échouée:`, error);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    this.addToQueue(operation.toString());
    throw lastError;
  }
}
