/**
 * index.js
 * Point d'entrée principal du module livraisons
 */

// ============================================================================
// SCHEMAS
// ============================================================================
export {
  statutLivraisonEnum,
  prioriteLivraisonEnum,
  clientLivraisonSchema,
  livreurLivraisonSchema,
  datesLivraisonSchema,
  livraisonSchema,
  livraisonsListeSchema,
  livraisonIndexSchema,
  createLivraisonInputSchema,
  assignerLivreurInputSchema,
  updateLivraisonInputSchema,
} from "./schemas";

// ============================================================================
// CONSTANTS
// ============================================================================
export {
  LIVRAISONS_DOC,
  RTDB_LIVRAISONS_INDEX_PATH,
  RTDB_LIVREURS_ACTIFS_PATH,
  RTDB_LIVRAISONS_TRIGGER_PATH,
  CACHE_KEY_LIVRAISONS,
  CACHE_LIFETIME,
  STATUTS_LIVRAISON,
  PRIORITES_LIVRAISON,
  STATUT_LABELS,
  STATUT_COLORS,
} from "./constants";

// ============================================================================
// FUNCTIONS
// ============================================================================
export {
  getAllLivraisons,
  getLivraisonById,
  getLivraisonByCommandeCode,
  getLivraisonsEnCours,
  getLivraisonsByStatut,
  getLivraisonsByLivreur,
  createLivraison,
  assignerLivreur,
  marquerColisRecupere,
  demarrerLivraison,
  terminerLivraison,
  updateStatutLivraison,
  updateLivraison,
  deleteLivraison,
} from "./livraisons";

// ============================================================================
// HOOKS
// ============================================================================
export {
  useLivraisons,
  useLivraisonsEnCours,
  useLivraisonsByStatut,
  useLivraisonsByLivreur,
  useStatistiquesLivraisons,
} from "./hooks";
