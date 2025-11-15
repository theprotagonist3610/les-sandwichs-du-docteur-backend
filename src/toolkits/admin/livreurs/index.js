/**
 * index.js
 * Point d'entrée principal du module livreurs
 */

// ============================================================================
// SCHEMAS
// ============================================================================
export {
  livreurSchema,
  livreursListeSchema,
  createLivreurInputSchema,
  updateLivreurInputSchema,
} from "./schemas";

// ============================================================================
// CONSTANTS
// ============================================================================
export {
  LIVREURS_COLLECTION,
  LIVREURS_DOC,
  RTDB_LIVREURS_TRIGGER_PATH,
  CACHE_KEY_LIVREURS,
  CACHE_LIFETIME,
} from "./constants";

// ============================================================================
// FUNCTIONS
// ============================================================================
export {
  getAllLivreurs,
  getLivreurById,
  getLivreursActifs,
  createLivreur,
  updateLivreur,
  deleteLivreur,
  hardDeleteLivreur,
} from "./livreurs";
