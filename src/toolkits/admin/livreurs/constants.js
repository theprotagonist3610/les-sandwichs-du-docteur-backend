/**
 * constants.js
 * Constantes pour le module livreurs
 */

// ============================================================================
// FIRESTORE PATHS
// ============================================================================

/**
 * Collection Firestore des livreurs
 */
export const LIVREURS_COLLECTION = "livreurs";

/**
 * Document unique contenant la liste des livreurs
 */
export const LIVREURS_DOC = "livreurs/liste";

// ============================================================================
// RTDB PATHS
// ============================================================================

/**
 * Path RTDB pour le trigger de mise à jour des livreurs
 */
export const RTDB_LIVREURS_TRIGGER_PATH = "triggers/livreurs_updated";

// ============================================================================
// CACHE KEYS
// ============================================================================

/**
 * Clé de cache localStorage pour la liste des livreurs
 */
export const CACHE_KEY_LIVREURS = "local_livreurs_liste";

/**
 * Durée de vie du cache en millisecondes (5 minutes)
 */
export const CACHE_LIFETIME = 5 * 60 * 1000;
