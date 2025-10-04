// ==========================================
// 📄 toolkits/comptabilite/index.js
// POINT D'ENTRÉE PRINCIPAL - SYSTÈME COMPTABILITÉ OHADA
// ==========================================

/**
 * 🏢 SYSTÈME DE COMPTABILITÉ DE CAISSE OHADA
 *
 * Architecture modulaire pour une gestion comptable conforme OHADA
 * avec support de la comptabilité de caisse, grand livre, balance,
 * et états financiers.
 *
 * @version 2.0.0
 * @author LSD Compta Team
 * @license MIT
 */

// ==========================================
// 📦 CONSTANTES & CONFIGURATION
// ==========================================

export {
  COMPTA_CONFIG,
  MODES_PAIEMENT,
  TYPES_TRANSACTION,
  CHARGES_FIXES_CODES,
  NOMS_MOIS,
} from "./constants";

// ==========================================
// 🔷 SCHÉMAS DE VALIDATION (ZOD)
// ==========================================

export {
  tresorerieSchema,
  repartitionPaiementsSchema,
  transactionComptableSchema,
  resumeHebdomadaireSchema,
  resumeMensuelSchema,
  resumeAnnuelSchema,
  semaineSchema,
  annexeSchema,
  documentAnnuelSchema,
} from "./schemas";

// ==========================================
// 🛠️ UTILITAIRES
// ==========================================

// Utilitaires de dates
export { dateUtils } from "./utils/dates";

// Formatage (montants, pourcentages, etc.)
export { formatters } from "./utils/formatters";

// Validation des comptes et données
export { validators } from "./utils/validators";

// Calculs techniques
export { calculs } from "./utils/calculs";

// ==========================================
// 💾 SERVICES
// ==========================================

// Gestion du cache local
export { LocalStorageService } from "./services/localStorage";

// Opérations Firestore
export { FirestoreService } from "./services/firestore";

// Gestion de la synchronisation
export { SyncService } from "./services/sync";

// CRUD Transactions
export { TransactionService } from "./services/transactions";

// Gestion des clôtures
export { ClotureService } from "./services/cloture";

// ==========================================
// 📊 MODÈLES MÉTIER
// ==========================================

// Gestion des semaines comptables
export { SemaineModel } from "./models/semaine";

// Gestion des années fiscales
export { AnneeModel } from "./models/annee";

// Calculs des résumés OHADA
export { ResumeModel } from "./models/resume";

// ==========================================
// 📈 RAPPORTS COMPTABLES
// ==========================================

// Grand Livre général
export { GrandLivreService } from "./reports/grandLivre";

// Balance des comptes
export { BalanceService } from "./reports/balance";

// Statistiques et analyses
export { StatistiquesService } from "./reports/statistiques";

// ==========================================
// ⚛️ HOOKS REACT
// ==========================================

// --- Hooks de Gestion des Données ---

/**
 * Gère les transactions d'une semaine
 * @example
 * const { transactions, ajouter, modifier, supprimer } = useTransactions('S01');
 */
export { useTransactions } from "./hooks/useTransactions";

/**
 * Récupère une transaction spécifique
 * @example
 * const { transaction, loading } = useTransaction('TXN_123');
 */
export { useTransaction } from "./hooks/useTransaction";

/**
 * Gère les données d'une semaine comptable
 * @example
 * const { week, loading, recharger } = useWeek('S01');
 */
export { useWeek } from "./hooks/useWeek";

/**
 * Gère les données d'un mois
 * @example
 * const { monthData, loading } = useMonth(2025, 1);
 */
export { useMonth } from "./hooks/useMonth";

/**
 * Gère les données d'une année avec lazy loading
 * @example
 * const { yearData, loadAllWeeks, loadWeeksBatch } = useYear(2025);
 */
export { useYear } from "./hooks/useYear";

// --- Hook de Navigation ---

/**
 * Navigation entre semaines
 * @example
 * const { currentWeek, previousWeek, nextWeek, allWeeks } = useWeekNavigation();
 */
export { useWeekNavigation } from "./hooks/useWeekNavigation";

// --- Hook de Clôture ---

/**
 * Gestion des clôtures périodiques
 * @example
 * const { cloturerSemaine, getStatutCloture } = useCloture();
 */
export { useCloture } from "./hooks/useCloture";

// --- Hooks de Rapports ---

/**
 * Génère le grand livre
 * @example
 * const { grandLivre, loading, exporterCSV } = useGrandLivre('2025-01-01', '2025-01-31');
 */
export { useGrandLivre } from "./hooks/useGrandLivre";

/**
 * Calcule la balance des comptes
 * @example
 * const { balance, loading, exporterCSV } = useBalance('2025-01-01', '2025-01-31');
 */
export { useBalance } from "./hooks/useBalance";

/**
 * Hub de statistiques multi-types
 * @example
 * const { statistiques } = useStatistiques('top_produits', { dateDebut, dateFin, limit: 10 });
 */
export { useStatistiques } from "./hooks/useStatistiques";

/**
 * Statistiques rapides pour dashboard
 * @example
 * const { stats, loading } = useQuickStats(7); // 7 derniers jours
 */
export { useQuickStats } from "./hooks/useQuickStats";

// --- Hook Système ---

/**
 * État de la synchronisation
 * @example
 * const { hasPendingSync, processSyncQueue } = useSyncStatus();
 */
export { useSyncStatus } from "./hooks/useSyncStatus";

// ==========================================
// 📚 GUIDE D'UTILISATION RAPIDE
// ==========================================

/**
 * EXEMPLES D'UTILISATION
 * ======================
 *
 * 1️⃣ AJOUTER UNE TRANSACTION
 * ---------------------------
 * ```javascript
 * import { useTransactions } from '@/toolkits/comptabilite';
 *
 * function AddTransaction() {
 *   const { ajouter, loading } = useTransactions();
 *
 *   const handleSubmit = async (data) => {
 *     await ajouter({
 *       date: '2025-01-15',
 *       type: 'entree',
 *       compte_lsd: 'PRO001',
 *       montant: 50000,
 *       mode_paiement: 'mobile_money',
 *       description: 'Vente produit X'
 *     });
 *   };
 * }
 * ```
 *
 * 2️⃣ AFFICHER LE DASHBOARD
 * -------------------------
 * ```javascript
 * import { useQuickStats } from '@/toolkits/comptabilite';
 *
 * function Dashboard() {
 *   const { stats, loading } = useQuickStats(7);
 *
 *   return (
 *     <div>
 *       <h2>CA: {stats?.chiffre_affaires} FCFA</h2>
 *       <p>Balance: {stats?.balance} FCFA</p>
 *       <p>Trésorerie: {stats?.tresorerie_actuelle.total} FCFA</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * 3️⃣ GÉNÉRER LE GRAND LIVRE
 * --------------------------
 * ```javascript
 * import { useGrandLivre } from '@/toolkits/comptabilite';
 *
 * function GrandLivre() {
 *   const { grandLivre, exporterCSV } = useGrandLivre(
 *     '2025-01-01',
 *     '2025-01-31'
 *   );
 *
 *   const handleExport = async () => {
 *     const csv = await exporterCSV();
 *     // Télécharger le CSV
 *   };
 * }
 * ```
 *
 * 4️⃣ CLÔTURER UNE PÉRIODE
 * ------------------------
 * ```javascript
 * import { useCloture } from '@/toolkits/comptabilite';
 *
 * function ClotureButton({ year, weekId }) {
 *   const { cloturerSemaine, loading } = useCloture();
 *
 *   return (
 *     <button
 *       onClick={() => cloturerSemaine(year, weekId)}
 *       disabled={loading}
 *     >
 *       Clôturer la semaine
 *     </button>
 *   );
 * }
 * ```
 *
 * 5️⃣ ANALYSER LES STATISTIQUES
 * -----------------------------
 * ```javascript
 * import { useStatistiques } from '@/toolkits/comptabilite';
 *
 * function TopProduits() {
 *   const { statistiques } = useStatistiques('top_produits', {
 *     dateDebut: '2025-01-01',
 *     dateFin: '2025-01-31',
 *     limit: 10
 *   });
 *
 *   return (
 *     <ul>
 *       {statistiques?.produits.map(p => (
 *         <li key={p.code_lsd}>
 *           {p.denomination}: {p.montant_total} FCFA
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * 6️⃣ NAVIGATION ENTRE SEMAINES
 * -----------------------------
 * ```javascript
 * import { useWeekNavigation, useWeek } from '@/toolkits/comptabilite';
 *
 * function WeekNavigator() {
 *   const { currentWeek, previousWeek, nextWeek } = useWeekNavigation();
 *   const [selectedWeek, setSelectedWeek] = useState(currentWeek);
 *   const { week } = useWeek(selectedWeek?.weekId);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setSelectedWeek(previousWeek)}>
 *         ← Semaine précédente
 *       </button>
 *       <span>{week?.label}</span>
 *       <button onClick={() => setSelectedWeek(nextWeek)}>
 *         Semaine suivante →
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

// ==========================================
// 🔧 CONFIGURATION RECOMMANDÉE
// ==========================================

/**
 * FIREBASE CONFIGURATION
 * ----------------------
 * Assurez-vous que votre configuration Firebase est correcte :
 *
 * ```javascript
 * // firebase.js
 * import { initializeApp } from 'firebase/app';
 * import { getFirestore } from 'firebase/firestore';
 *
 * const firebaseConfig = {
 *   apiKey: "...",
 *   authDomain: "...",
 *   projectId: "...",
 *   // ...
 * };
 *
 * const app = initializeApp(firebaseConfig);
 * export const db = getFirestore(app);
 * ```
 *
 * STRUCTURE FIRESTORE
 * -------------------
 * compta/
 *   └── {year}/
 *       ├── resume: {...}
 *       ├── cloture: boolean
 *       └── weeks/
 *           ├── S01/
 *           │   ├── transactions: [...]
 *           │   ├── resume: {...}
 *           │   └── cloture: boolean
 *           ├── S01-annexe/ (si nécessaire)
 *           └── S02/
 *
 * RÈGLES DE SÉCURITÉ FIRESTORE
 * -----------------------------
 * ```
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /compta/{year} {
 *       allow read: if request.auth != null;
 *       allow write: if request.auth != null &&
 *                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
 *
 *       match /weeks/{weekId} {
 *         allow read: if request.auth != null;
 *         allow write: if request.auth != null &&
 *                        !resource.data.cloture;
 *       }
 *     }
 *   }
 * }
 * ```
 */

// ==========================================
// 📖 DOCUMENTATION DES CONVENTIONS OHADA
// ==========================================

/**
 * PLAN COMPTABLE OHADA
 * =====================
 *
 * Classe 1 : Comptes de ressources durables
 * Classe 2 : Comptes d'actif immobilisé
 * Classe 3 : Comptes de stocks
 * Classe 4 : Comptes de tiers
 * Classe 5 : Comptes de trésorerie
 * Classe 6 : Comptes de charges
 * Classe 7 : Comptes de produits
 * Classe 8 : Comptes des autres charges et produits
 *
 * COMPTABILITÉ DE CAISSE
 * ======================
 *
 * La comptabilité de caisse enregistre :
 * - Les encaissements effectifs (entrées)
 * - Les décaissements effectifs (sorties)
 *
 * Contrairement à la comptabilité d'engagement, elle ne
 * reconnaît pas les créances et dettes.
 *
 * INDICATEURS CLÉS
 * ================
 *
 * - Chiffre d'affaires : Somme des produits (classe 7)
 * - Charges : Somme des charges (classe 6)
 * - Capacité d'autofinancement : CA - Charges
 * - Balance nette : Encaissements - Décaissements
 * - Excédent/Insuffisance : Trésorerie fin - Trésorerie début
 * - Délai moyen de caisse : Trésorerie moyenne / Décaissements journaliers
 */

// ==========================================
// 🚀 OPTIMISATIONS & BONNES PRATIQUES
// ==========================================

/**
 * PERFORMANCES
 * ============
 *
 * 1. Utilisez le lazy loading pour les années :
 *    - loadWeeksBatch() pour charger progressivement
 *    - localStorage comme cache prioritaire
 *
 * 2. Limitez les appels Firestore :
 *    - Les hooks rechargent automatiquement
 *    - Utilisez le cache localStorage
 *
 * 3. Clôturez régulièrement :
 *    - Les semaines terminées après 30 jours
 *    - Empêche les modifications accidentelles
 *
 * SÉCURITÉ
 * ========
 *
 * 1. Vérifications intégrées :
 *    - Pas de dates futures
 *    - Pas de modifications après clôture
 *    - Validation Zod sur toutes les données
 *
 * 2. Retry automatique :
 *    - File de synchronisation en cas d'échec
 *    - Sauvegarde locale en attendant
 *
 * MAINTENANCE
 * ===========
 *
 * 1. Nettoyage automatique :
 *    - LocalStorage limité à 2 ans d'historique
 *    - Annexes créées automatiquement si limite atteinte
 *
 * 2. Monitoring :
 *    - useSyncStatus() pour surveiller la file
 *    - Logs d'erreurs dans la console
 */

// ==========================================
// 🎯 CHECKLIST DE DÉPLOIEMENT
// ==========================================

/**
 * ✅ AVANT DE DÉPLOYER
 *
 * [ ] Firebase configuré et initialisé
 * [ ] Règles de sécurité Firestore configurées
 * [ ] Liste des comptes (liste.js) importée
 * [ ] Tests des hooks principaux
 * [ ] Vérification des clôtures automatiques
 * [ ] Export CSV fonctionnel
 * [ ] Gestion des erreurs testée
 * [ ] LocalStorage activé dans le navigateur
 * [ ] Backup de la base de données
 * [ ] Documentation utilisateur préparée
 *
 * 🔄 APRÈS DÉPLOIEMENT
 *
 * [ ] Surveiller la file de synchronisation
 * [ ] Vérifier les performances de chargement
 * [ ] Tester la génération des rapports
 * [ ] Valider les calculs OHADA
 * [ ] Former les utilisateurs
 * [ ] Planifier les clôtures mensuelles/annuelles
 */

// ==========================================
// 📞 SUPPORT & CONTRIBUTION
// ==========================================

/**
 * Pour toute question ou contribution :
 *
 * 📧 Email: support@lsdcompta.com
 * 🐛 Issues: github.com/lsdcompta/issues
 * 📖 Docs: docs.lsdcompta.com
 *
 * Contributeurs principaux :
 * - Équipe LSD Compta
 * - Experts OHADA
 */

// Export par défaut pour compatibilité
// export default {
//   // Services
//   TransactionService,
//   ClotureService,
//   GrandLivreService,
//   BalanceService,
//   StatistiquesService,

//   // Modèles
//   SemaineModel,
//   AnneeModel,
//   ResumeModel,

//   // Utilitaires
//   dateUtils,
//   formatters,
//   validators,
//   calculs,

//   // Configuration
//   COMPTA_CONFIG,
// };

/**
 * 🎉 ARCHITECTURE COMPLÈTE - PRÊTE À L'EMPLOI !
 *
 * Votre système de comptabilité OHADA est maintenant structuré
 * de manière modulaire, performante et maintenable.
 *
 * Bonne comptabilité ! 📊✨
 */
