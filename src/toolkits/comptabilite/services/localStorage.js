// ==========================================
// 📄 toolkits/comptabilite/services/localStorage.js
// ==========================================

import { COMPTA_CONFIG } from "../constants";

export class LocalStorageService {
  static getKey(year) {
    return `${COMPTA_CONFIG.KEY_PREFIX}${year}`;
  }

  static save(yearData) {
    try {
      const key = this.getKey(yearData.year);
      localStorage.setItem(key, JSON.stringify(yearData));
      return true;
    } catch (error) {
      console.error("Erreur sauvegarde localStorage:", error);
      return false;
    }
  }

  static load(year) {
    try {
      const key = this.getKey(year);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erreur lecture localStorage:", error);
      return null;
    }
  }

  static remove(year) {
    try {
      const key = this.getKey(year);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Erreur suppression localStorage:", error);
      return false;
    }
  }

  static cleanOldYears() {
    try {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - COMPTA_CONFIG.MAX_HISTORY_YEARS;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(COMPTA_CONFIG.KEY_PREFIX)) {
          const year = parseInt(key.replace(COMPTA_CONFIG.KEY_PREFIX, ""));
          if (year < minYear) {
            localStorage.removeItem(key);
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Erreur nettoyage localStorage:", error);
      return false;
    }
  }
}
