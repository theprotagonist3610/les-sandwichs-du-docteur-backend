import { format, parse, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { SemaineModel } from "@/toolkits/comptabilite";

/**
 * 📅 Obtient les périodes courantes (jour, semaine, mois, année)
 */
export const getCurrentPeriods = () => {
  const now = new Date();
  const year = now.getFullYear();

  // Obtenir le weekId via SemaineModel
  const weekInfo = SemaineModel.getWeekFromDate(
    format(now, "yyyy-MM-dd"),
    year
  );

  return {
    day: format(now, "dd-MM-yyyy"),
    week: weekInfo?.weekId || "S01",
    month: format(now, "MM-yyyy"),
    year: format(now, "yyyy"),
  };
};

/**
 * 🔄 Parse une date URL selon le type de vue
 */
export const parseUrlDate = (dateStr, type) => {
  if (!dateStr) return null;

  try {
    switch (type) {
      case "day": {
        // DD-MM-YYYY -> Date
        const parsed = parse(dateStr, "dd-MM-yyyy", new Date());
        return isValid(parsed) ? parsed : null;
      }

      case "week": {
        // S01 -> { weekId: 'S01', weekInfo: {...} }
        const year = new Date().getFullYear();
        const semaines = SemaineModel.genererSemainesAnnee(year);
        const weekInfo = semaines.find((s) => s.weekId === dateStr);
        return weekInfo || null;
      }

      case "month": {
        // MM-YYYY -> Date (premier jour du mois)
        const parsed = parse(dateStr, "MM-yyyy", new Date());
        return isValid(parsed) ? parsed : null;
      }

      case "year": {
        // YYYY -> Date (1er janvier)
        const parsed = parse(dateStr, "yyyy", new Date());
        return isValid(parsed) ? parsed : null;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("Erreur parsing date URL:", error);
    return null;
  }
};

/**
 * 🔄 Formate une date pour l'URL selon le type
 */
export const formatDateForUrl = (date, type) => {
  if (!date) return null;

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    if (!isValid(dateObj)) return null;

    switch (type) {
      case "day":
        return format(dateObj, "dd-MM-yyyy");

      case "week": {
        const year = dateObj.getFullYear();
        const weekInfo = SemaineModel.getWeekFromDate(
          format(dateObj, "yyyy-MM-dd"),
          year
        );
        return weekInfo?.weekId || null;
      }

      case "month":
        return format(dateObj, "MM-yyyy");

      case "year":
        return format(dateObj, "yyyy");

      default:
        return null;
    }
  } catch (error) {
    console.error("Erreur formatage date URL:", error);
    return null;
  }
};

/**
 * 📊 Formate un montant en FCFA
 */
export const formatMontant = (montant) => {
  if (typeof montant !== "number") return "0 FCFA";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

/**
 * 📊 Formate un nombre
 */
export const formatNombre = (nombre) => {
  return new Intl.NumberFormat("fr-FR").format(nombre);
};

/**
 * 📊 Formate un pourcentage
 */
export const formatPourcentage = (valeur, decimales = 2) => {
  return `${valeur.toFixed(decimales)}%`;
};

/**
 * 📅 Formate une date pour l'affichage
 */
export const formatDateDisplay = (date, formatStr = "dd/MM/yyyy") => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatStr, { locale: fr }) : "";
  } catch (error) {
    console.error("Erreur formatage date:", error);
    return "";
  }
};

/**
 * 📅 Formate une date pour l'affichage avec texte (Ex: "Aujourd'hui", "Hier")
 */
export const formatDateRelative = (date) => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const targetDate = format(dateObj, "yyyy-MM-dd");

    if (today === targetDate) return "Aujourd'hui";

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");

    if (yesterdayStr === targetDate) return "Hier";

    return format(dateObj, "dd MMMM yyyy", { locale: fr });
  } catch (error) {
    console.error("Erreur formatage date relative:", error);
    return "";
  }
};

/**
 * 🎨 Obtient la couleur selon le type de transaction
 */
export const getTransactionColor = (type) => {
  return type === "entree"
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
};

/**
 * 🎨 Obtient l'icône selon le mode de paiement
 */
export const getPaymentModeIcon = (mode) => {
  const icons = {
    caisse: "💵",
    mobile_money: "📱",
    banque: "🏦",
  };
  return icons[mode] || "💰";
};

/**
 * 🎨 Obtient le label du mode de paiement
 */
export const getPaymentModeLabel = (mode) => {
  const labels = {
    caisse: "Caisse",
    mobile_money: "Mobile Money",
    banque: "Banque",
  };
  return labels[mode] || mode;
};

/**
 * 📊 Calcule la tendance (hausse/baisse)
 */
export const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return { value: 0, direction: "neutral" };

  const diff = current - previous;
  const percentage = (diff / previous) * 100;

  return {
    value: Math.abs(percentage),
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
  };
};

/**
 * 🔍 Filtre les transactions selon les critères
 */
export const filterTransactions = (transactions, filters) => {
  return transactions.filter((transaction) => {
    // Filtre par type
    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }

    // Filtre par mode de paiement
    if (
      filters.paymentMode !== "all" &&
      transaction.mode_paiement !== filters.paymentMode
    ) {
      return false;
    }

    // Filtre par compte
    if (
      filters.account !== "all" &&
      transaction.compte_lsd !== filters.account
    ) {
      return false;
    }

    // Filtre par montant min
    if (
      filters.amountRange.min !== null &&
      transaction.montant < filters.amountRange.min
    ) {
      return false;
    }

    // Filtre par montant max
    if (
      filters.amountRange.max !== null &&
      transaction.montant > filters.amountRange.max
    ) {
      return false;
    }

    // Filtre par plage de dates
    if (filters.dateRange.start || filters.dateRange.end) {
      const transactionDate = parseISO(transaction.date);

      if (filters.dateRange.start) {
        const startDate = parseISO(filters.dateRange.start);
        if (transactionDate < startDate) return false;
      }

      if (filters.dateRange.end) {
        const endDate = parseISO(filters.dateRange.end);
        if (transactionDate > endDate) return false;
      }
    }

    return true;
  });
};

/**
 * 📊 Tri les transactions
 */
export const sortTransactions = (transactions, sortBy, sortOrder = "desc") => {
  return [...transactions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "date":
        comparison = new Date(a.date) - new Date(b.date);
        break;

      case "montant":
        comparison = a.montant - b.montant;
        break;

      case "compte":
        comparison = a.compte_denomination.localeCompare(b.compte_denomination);
        break;

      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
};

/**
 * 📄 Pagination des données
 */
export const paginateData = (data, page, pageSize = 100) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: data.slice(startIndex, endIndex),
    totalPages: Math.ceil(data.length / pageSize),
    currentPage: page,
    totalItems: data.length,
    hasNext: endIndex < data.length,
    hasPrev: page > 1,
  };
};

/**
 * 🎯 Calcule la moyenne sur N jours
 */
export const calculateAverageDays = (data, days = 30) => {
  if (!data || data.length === 0) return 0;

  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / Math.min(data.length, days);
};
