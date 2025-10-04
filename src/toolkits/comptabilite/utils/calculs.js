// ==========================================
// 📄 toolkits/comptabilite/utils/calculs.js
// ==========================================

export const calculs = {
  calculateDocSize(doc) {
    const jsonStr = JSON.stringify(doc);
    return new Blob([jsonStr]).size;
  },

  generateTransactionId() {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  calculerTresorerieTotal(tresorerie) {
    return tresorerie.caisse + tresorerie.mobile_money + tresorerie.banque;
  },
};
