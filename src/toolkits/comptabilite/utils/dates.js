// ==========================================
// 📄 toolkits/comptabilite/utils/dates.js
// ==========================================

export const dateUtils = {
  getCurrentDate() {
    return new Date().toISOString().split("T")[0];
  },

  getCurrentYear() {
    return new Date().getFullYear();
  },

  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  formatISO(date) {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  },

  isFutureDate(date) {
    const d = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d > now;
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  getDaysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  },
};
