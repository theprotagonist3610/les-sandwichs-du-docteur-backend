// ==========================================
// 📄 toolkits/comptabilite/constants.js
// ==========================================

export const COMPTA_CONFIG = {
  KEY_PREFIX: "lsd_compta_",
  COLLECTION: "compta",
  TRANSACTION_LIMIT: 500,
  FIRESTORE_SIZE_LIMIT: 950000,
  CLOTURE_DELAY_DAYS: 30,
  MAX_HISTORY_YEARS: 2,
  WEEK_BATCH_SIZE: 4,
  SYNC_QUEUE_KEY: "lsd_compta_sync_queue",
};

export const MODES_PAIEMENT = {
  CAISSE: "caisse",
  MOBILE_MONEY: "mobile_money",
  BANQUE: "banque",
};

export const TYPES_TRANSACTION = {
  ENTREE: "entree",
  SORTIE: "sortie",
};

export const CHARGES_FIXES_CODES = ["TIE002", "TIE003", "TIE004"];

export const NOMS_MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
