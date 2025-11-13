/**
 * constants.js
 * Constantes et comptes OHADA par défaut pour la comptabilité
 */

// ============================================================================
// PATHS FIRESTORE
// ============================================================================

export const COMPTES_DOC = "comptabilite/comptes";
export const TRESORERIE_DOC = "comptabilite/tresorerie";
export const TODAY_DOC = "comptabilite/today";
export const HISTORIQUE_DAYS_COLLECTION = "comptabilite/historique/days";
export const STATISTIQUES_WEEKS_COLLECTION = "comptabilite/statistiques/weeks";
export const BILAN_WEEKS_COLLECTION = "comptabilite/bilan/weeks";
export const BUDGETS_COLLECTION = "comptabilite_budgets";

// ============================================================================
// PATHS RTDB
// ============================================================================

export const RTDB_NOTIFICATIONS_PATH = "notification";
export const RTDB_COMPTA_TRIGGER_PATH = "comptabilite_trigger";

// ============================================================================
// CACHE KEYS
// ============================================================================

export const CACHE_KEY_COMPTES = "local_comptes";
export const CACHE_KEY_TRESORERIE = "local_tresorerie";
export const CACHE_KEY_TODAY = "local_compta_today";
export const CACHE_KEY_HISTORIQUE_PREFIX = "local_compta_day_";
export const CACHE_KEY_STATISTIQUES_PREFIX = "local_compta_week_stat_";
export const CACHE_KEY_BILAN_PREFIX = "local_compta_week_bilan_";
export const CACHE_KEY_BUDGETS = "local_compta_budgets";
export const CACHE_KEY_BUDGET_PREFIX = "local_compta_budget_";
export const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// COMPTES OHADA PAR DÉFAUT
// ============================================================================

export const COMPTES_OHADA_DEFAULT = [
  {
    code_ohada: "101",
    denomination: "Capital social",
    description: "Apport initial du propriétaire ou des associés",
    categorie: "entree",
  },
  {
    code_ohada: "108",
    denomination: "Compte de l'exploitant",
    description: "Apports ou retraits personnels du propriétaire",
    categorie: "entree",
  },
  {
    code_ohada: "2183",
    denomination: "Matériel et outillage",
    description: "Grill, frigo, mixeur, plancha, matériel de préparation",
    categorie: "sortie",
  },
  {
    code_ohada: "2184",
    denomination: "Mobilier et matériel de bureau",
    description: "Tables, chaises, caisse, tablette, décorations",
    categorie: "sortie",
  },
  {
    code_ohada: "2186",
    denomination: "Matériel de transport",
    description: "Moto ou triporteur pour livraison",
    categorie: "sortie",
  },
  {
    code_ohada: "31",
    denomination: "Matières premières",
    description: "Pain, œufs, viande, lait, fruits, sucre, etc.",
    categorie: "sortie",
  },
  {
    code_ohada: "32",
    denomination: "Fournitures consommables",
    description: "Emballages, gobelets, pailles, serviettes",
    categorie: "sortie",
  },
  {
    code_ohada: "37",
    denomination: "Produits finis",
    description: "Sandwichs, yaourts prêts à vendre",
    categorie: "entree",
  },
  {
    code_ohada: "401",
    denomination: "Fournisseurs",
    description: "Achats à crédit auprès des fournisseurs",
    categorie: "sortie",
  },
  {
    code_ohada: "4091",
    denomination: "Fournisseurs – avances et acomptes",
    description: "Acomptes versés avant livraison",
    categorie: "sortie",
  },
  {
    code_ohada: "411",
    denomination: "Clients",
    description: "Ventes à crédit",
    categorie: "entree",
  },
  {
    code_ohada: "421",
    denomination: "Prestataires externes",
    description: "Paiements aux aides, livreurs, etc.",
    categorie: "sortie",
  },
  {
    code_ohada: "4456",
    denomination: "TVA déductible",
    description: "TVA sur les achats",
    categorie: "sortie",
  },
  {
    code_ohada: "4457",
    denomination: "TVA collectée",
    description: "TVA sur les ventes",
    categorie: "entree",
  },
  {
    code_ohada: "467",
    denomination: "Autres comptes divers",
    description: "Comptes de régularisation ou prêts temporaires",
    categorie: "entree",
  },
  {
    code_ohada: "601",
    denomination: "Achats de matières premières",
    description: "Achats de pain, lait, fruits, etc.",
    categorie: "sortie",
  },
  {
    code_ohada: "602",
    denomination: "Fournitures consommables",
    description: "Achats de gobelets, serviettes, emballages",
    categorie: "sortie",
  },
  {
    code_ohada: "604",
    denomination: "Petits équipements",
    description: "Petits matériels non immobilisés",
    categorie: "sortie",
  },
  {
    code_ohada: "611",
    denomination: "Transport",
    description: "Livraison, taxi, déplacement d'approvisionnement",
    categorie: "sortie",
  },
  {
    code_ohada: "613",
    denomination: "Loyers et charges locatives",
    description: "Loyer du local de la sandwicherie",
    categorie: "sortie",
  },
  {
    code_ohada: "615",
    denomination: "Entretien et réparations",
    description: "Nettoyage, réparations d'équipements",
    categorie: "sortie",
  },
  {
    code_ohada: "616",
    denomination: "Assurances",
    description: "Assurance du local ou du matériel",
    categorie: "sortie",
  },
  {
    code_ohada: "623",
    denomination: "Publicité et marketing",
    description: "Affiches, flyers, communication en ligne",
    categorie: "sortie",
  },
  {
    code_ohada: "625",
    denomination: "Déplacements et missions",
    description: "Dépenses diverses liées à l'activité",
    categorie: "sortie",
  },
  {
    code_ohada: "626",
    denomination: "Téléphone et Internet",
    description: "Frais de communication",
    categorie: "sortie",
  },
  {
    code_ohada: "627",
    denomination: "Honoraires",
    description: "Comptable, consultant, designer",
    categorie: "sortie",
  },
  {
    code_ohada: "628",
    denomination: "Autres charges externes",
    description: "Prestations diverses non classées",
    categorie: "sortie",
  },
  {
    code_ohada: "635",
    denomination: "Impôts et taxes",
    description: "Patente, taxes communales",
    categorie: "sortie",
  },
  {
    code_ohada: "641",
    denomination: "Rémunération des prestataires",
    description: "Paiements aux collaborateurs occasionnels",
    categorie: "sortie",
  },
  {
    code_ohada: "651",
    denomination: "Intérêts bancaires",
    description: "Frais financiers liés à un emprunt",
    categorie: "sortie",
  },
  {
    code_ohada: "658",
    denomination: "Charges diverses de gestion",
    description: "Pourboires, dépenses imprévues",
    categorie: "sortie",
  },
  {
    code_ohada: "701",
    denomination: "Vente de produits finis",
    description: "Vente de sandwichs et yaourts",
    categorie: "entree",
  },
  {
    code_ohada: "707",
    denomination: "Vente de marchandises",
    description: "Vente de boissons, biscuits ou autres produits",
    categorie: "entree",
  },
  {
    code_ohada: "758",
    denomination: "Autres produits divers",
    description: "Revenus accessoires ou exceptionnels",
    categorie: "entree",
  },
];

// ============================================================================
// COMPTES DE TRÉSORERIE PAR DÉFAUT
// ============================================================================

export const COMPTES_TRESORERIE_DEFAULT = [
  {
    code_ohada: "511",
    denomination: "Banque",
    description: "Compte bancaire professionnel",
    numero: "",
  },
  {
    code_ohada: "5121",
    denomination: "Mobile Money",
    description: "Encaissements ou paiements via MTN ou Moov",
    numero: "",
  },
  {
    code_ohada: "531",
    denomination: "Caisse",
    description: "Encaissements et paiements en espèces",
    numero: "",
  },
];
