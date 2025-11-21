/**
 * index.js
 * Point d'entrée principal du module comptabilité
 * Exporte tous les schemas, constants, utilities, functions et hooks
 */

// ============================================================================
// SCHEMAS
// ============================================================================
export {
  compteSchema,
  compteTresorerieSchema,
  comptesListeSchema,
  comptesTresorerieListeSchema,
  operationSchema,
  operationsListeSchema,
  compteStatistiqueSchema,
  dayStatisticSchema,
  weekStatisticSchema,
  dayBilanSchema,
  weekBilanSchema,
  ligneBudgetSchema,
  budgetSchema,
  ligneBudgetAvecRealisationSchema,
  budgetAvecRealisationSchema,
  budgetsListeSchema,
  previsionCompteSchema,
  previsionMoisSchema,
  previsionsGlobalesSchema,
  anomalieSchema,
} from "./schemas";

// ============================================================================
// CONSTANTS
// ============================================================================
export {
  // Firestore paths
  COMPTES_DOC,
  TRESORERIE_DOC,
  TODAY_DOC,
  HISTORIQUE_DAYS_COLLECTION,
  STATISTIQUES_WEEKS_COLLECTION,
  BILAN_WEEKS_COLLECTION,
  BUDGETS_COLLECTION,
  // RTDB paths
  RTDB_NOTIFICATIONS_PATH,
  RTDB_COMPTA_TRIGGER_PATH,
  // Cache keys
  CACHE_KEY_COMPTES,
  CACHE_KEY_TRESORERIE,
  CACHE_KEY_TODAY,
  CACHE_KEY_HISTORIQUE_PREFIX,
  CACHE_KEY_STATISTIQUES_PREFIX,
  CACHE_KEY_BILAN_PREFIX,
  CACHE_KEY_BUDGETS,
  CACHE_KEY_BUDGET_PREFIX,
  CACHE_LIFETIME,
  // Default accounts
  COMPTES_OHADA_DEFAULT,
  COMPTES_TRESORERIE_DEFAULT,
} from "./constants";

// ============================================================================
// UTILITIES
// ============================================================================
export {
  // Date formatting
  formatDayKey,
  formatWeekKey,
  formatMonthKey,
  // Readable date formatting
  formatDayKeyReadable,
  formatMonthKeyReadable,
  formatWeekKeyReadable,
  // Week/Month helpers
  getDaysInWeek,
  getDaysInMonth,
  getPreviousDay,
  getPreviousWeek,
  parseWeekKey,
  // Day change detection
  isNewDay,
  isNewWeek,
  // Cache management
  saveToCache,
  getFromCache,
  clearCache,
  clearAllComptaCache,
} from "./utils";

// ============================================================================
// COMPTES FUNCTIONS
// ============================================================================
export {
  // Initialize
  initialiserComptesDefault,
  initialiserTresorerieDefault,
  // Get all
  getAllComptes,
  getAllComptesTresorerie,
  // Find
  findCompteById,
  findCompteByCodeOhada,
  findCompteTresorerieById,
  findCompteTresorerieByCodeOhada,
  // Create
  creerCompte,
  creerCompteTresorerie,
  // Update
  updateCompte,
  updateCompteTresorerie,
} from "./comptes";

// ============================================================================
// OPERATIONS FUNCTIONS
// ============================================================================
export {
  // Get operations
  getOperationsToday,
  getOperationsByDay,
  getOperationsForPeriod,
  // Create
  creerOperation,
  creerOperations,
  // Update
  updateOperation,
  // Delete
  deleteOperation,
} from "./operations";

// ============================================================================
// ARCHIVAGE FUNCTIONS
// ============================================================================
export {
  archiverOperationsVeille,
  detecterEtArchiverSiNouveauJour,
} from "./archivage";

// ============================================================================
// STATISTIQUES FUNCTIONS
// ============================================================================
export {
  calculerStatistiquesJour,
  calculerStatistiquesSemaine,
  updateStatistiquesEnTempsReel,
  getStatistiquesJour,
  getStatistiquesSemaine,
  getStatistiquesByMonth,
} from "./statistiques";

// ============================================================================
// BILANS FUNCTIONS
// ============================================================================
export {
  creerBilanJour,
  creerBilanSemaine,
  getBilanJour,
  getBilanSemaine,
  updateBilanSemaineEnCours,
  getBilansPlusieuresSemaines,
  getBilansPlusieursJours,
} from "./bilans";

// ============================================================================
// BUDGETS FUNCTIONS
// ============================================================================
export {
  // CRUD
  creerBudget,
  getBudgetById,
  getAllBudgets,
  getBudgetsByMois,
  getBudgetActif,
  updateBudget,
  archiverBudget,
  deleteBudget,
  // Calculs
  calculerRealisationBudget,
  verifierAlertesBudget,
} from "./budgets";

// ============================================================================
// BUDGET SUGGESTIONS FUNCTIONS
// ============================================================================
export {
  calculerSuggestionBudget,
  calculerSuggestionsPourComptes,
  getDescriptionSuggestion,
  getCouleurConfiance,
} from "./budgetSuggestions";

// ============================================================================
// BUDGET ANALYSIS FUNCTIONS
// ============================================================================
export {
  analyserMotifsLigneBudget,
  analyserMotifsBudgetComplet,
} from "./budgetAnalysis";

// ============================================================================
// CLOTURE QUOTIDIENNE FUNCTIONS
// ============================================================================
export {
  verifierClotureRequise,
  getDonneesJourneePourCloture,
  isClotureEnCours,
  lancerClotureAvecQueue,
  marquerNotification23hEnvoyee,
  resetNotification23h,
} from "./cloture";

// ============================================================================
// PREVISIONS FUNCTIONS
// ============================================================================
export {
  // Calculs de tendances
  calculerTendance,
  calculerMoyenneMobile,
  detecterSaisonnalite,
  // Génération de prévisions
  genererPrevisionsCompte,
  genererPrevisionsGlobales,
  chargerHistoriqueCompte,
  // Détection d'anomalies
  detecterAnomalies,
} from "./previsions";

// ============================================================================
// COMPARAISONS FUNCTIONS
// ============================================================================
export {
  // Comparaisons de périodes
  comparerDeuxMois,
  comparerMoisVsMoisPrecedent,
  comparerDeuxAnnees,
  comparerBudgetVsReel,
  genererMatriceComparaison,
} from "./comparaisons";

// ============================================================================
// INSIGHTS FUNCTIONS
// ============================================================================
export {
  // Génération d'insights
  genererInsightsMois,
  calculerRatiosFinanciers,
  calculerScoreSante,
} from "./insights";

// ============================================================================
// HOOKS
// ============================================================================
export {
  // Comptes hooks
  useComptesListe,
  useComptesTresorerieListe,
  // Today hook (with day change detection)
  useTodayCompta,
  // Historique hooks
  useHistoriqueByDay,
  useHistoriqueByWeek,
  useHistoriqueByMonth,
  // Statistiques hooks
  useStatistiquesByDay,
  useStatistiquesByWeek,
  useStatistiquesByMonth,
  // Bilans hooks
  useBilanByDay,
  useBilanByWeek,
  useBilanByMonth,
  // Utility hooks
  useOperationsByDay,
  useOperationsByWeek,
  useOperationsByMonth,
  useTresorerie,
  // Budgets hooks
  useBudgetsList,
  useBudgetByMois,
  useBudgetById,
  useBudgetAvecRealisation,
  useBudgetAlertes,
  // Prévisions hooks
  usePrevisions,
  useAnomaliesPrevisions,
  useComparaisonPrevisions,
  // Comparaisons hooks
  useComparaisonMois,
  useComparaisonAnnees,
  useComparaisonMoisActuel,
  // Insights hooks
  useInsightsMois,
  useScoreSante,
} from "./hooks";
