// ==========================================
// 📄 toolkits/comptabilite/utils/formatters.js
// ==========================================

export const formatters = {
  montant(valeur) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(valeur);
  },

  pourcentage(valeur, decimales = 2) {
    return `${valeur.toFixed(decimales)}%`;
  },

  nombre(valeur) {
    return new Intl.NumberFormat("fr-FR").format(valeur);
  },

  nombreTransactions(nombre) {
    return `${nombre} transaction${nombre > 1 ? "s" : ""}`;
  },
};
