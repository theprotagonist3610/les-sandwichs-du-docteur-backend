/**
 * constants.js
 * Constantes pour le module livraisons
 */

// ============================================================================
// FIRESTORE PATHS
// ============================================================================

/**
 * Document unique contenant la liste des livraisons
 */
export const LIVRAISONS_DOC = "livraisons/liste";

// ============================================================================
// RTDB PATHS
// ============================================================================

/**
 * Path RTDB pour l'index des livraisons (sync temps réel)
 */
export const RTDB_LIVRAISONS_INDEX_PATH = "livraisons/index";

/**
 * Path RTDB pour les livreurs actifs
 */
export const RTDB_LIVREURS_ACTIFS_PATH = "livraisons/livreurs";

/**
 * Path RTDB pour le trigger de mise à jour des livraisons
 */
export const RTDB_LIVRAISONS_TRIGGER_PATH = "triggers/livraisons_updated";

// ============================================================================
// CACHE KEYS
// ============================================================================

/**
 * Clé de cache localStorage pour la liste des livraisons
 */
export const CACHE_KEY_LIVRAISONS = "local_livraisons_liste";

/**
 * Durée de vie du cache en millisecondes (5 minutes)
 */
export const CACHE_LIFETIME = 5 * 60 * 1000;

// ============================================================================
// STATUTS
// ============================================================================

/**
 * Statuts de livraison
 */
export const STATUTS_LIVRAISON = {
  EN_ATTENTE: "en_attente",
  ASSIGNEE: "assignee",
  RECUPEREE: "recuperee",
  EN_COURS: "en_cours",
  LIVREE: "livree",
  ANNULEE: "annulee",
};

/**
 * Priorités de livraison
 */
export const PRIORITES_LIVRAISON = {
  NORMALE: "normale",
  URGENTE: "urgente",
};

/**
 * Labels des statuts pour l'affichage
 */
export const STATUT_LABELS = {
  en_attente: "En attente",
  assignee: "Assignée",
  recuperee: "Récupérée",
  en_cours: "En cours",
  livree: "Livrée",
  annulee: "Annulée",
};

/**
 * Couleurs des statuts pour les badges
 */
export const STATUT_COLORS = {
  en_attente: "bg-gray-100 text-gray-700",
  assignee: "bg-blue-100 text-blue-700",
  recuperee: "bg-purple-100 text-purple-700",
  en_cours: "bg-yellow-100 text-yellow-700",
  livree: "bg-green-100 text-green-700",
  annulee: "bg-red-100 text-red-700",
};
