/**
 * notificationHelpers.js
 * Helper centralisé pour la gestion des notifications RTDB
 *
 * Fonctionnalités :
 * - Création de notifications standardisées avec ciblage par rôles
 * - Helpers spécialisés par action (create, update, delete)
 * - Nettoyage automatique toutes les 48H
 * - Structure cohérente pour tous les toolkits
 *
 * MIGRATION: Ce fichier centralise toutes les notifications RTDB.
 * Les toolkits doivent utiliser ces helpers au lieu de créer leurs propres fonctions.
 */

import {
  ref,
  push,
  query,
  orderByChild,
  endAt,
  get,
  remove,
} from "firebase/database";
import { useEffect } from "react";
import { rtdb, auth } from "@/firebase";

// ============================================================================
// CONSTANTES - CHEMINS DES NOTIFICATIONS
// ============================================================================

/**
 * Chemins des notifications par toolkit/module
 * Structure: notifications/{module}
 */
export const NOTIFICATION_PATHS = {
  // Modules principaux
  STOCK: "notifications/stock",
  MENU: "notifications/menu",
  MENU_COMPOSE: "notifications/menu_compose",
  BOISSON: "notifications/boisson",
  PRODUCTION: "notifications/production",
  EMPLACEMENT: "notifications/emplacement",
  COMMANDE: "notifications/commande",
  COMPTABILITE: "notifications/comptabilite",
  ADRESSE: "notifications/adresse",
  TODO: "notifications/todo",
  USER: "notifications/user",
  // Système
  SYSTEM: "notifications/system",
};

/**
 * Chemins legacy (pour rétrocompatibilité pendant la migration)
 * À supprimer après migration complète
 */
export const LEGACY_PATHS = {
  NOTIFICATION: "notification", // Ancien chemin unique
  NOTIFICATIONS: "notifications", // Ancien chemin alternatif
  COMMANDES_QUEUE: "notifications/commandes",
  COMPTABILITE_QUEUE: "notifications/comptabilite_queue",
  ADRESSES: "notifications/adresses",
};

/**
 * Chemins des queues anti-collision
 */
export const QUEUE_PATHS = {
  STOCK: "queues/stock",
  COMMANDES: "queues/commandes",
  COMPTABILITE: "queues/comptabilite",
  PRODUCTION: "queues/production",
};

/**
 * Types de notifications
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

/**
 * Actions standards pour les métadonnées
 */
export const NOTIFICATION_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  SYNC: "sync",
  ARCHIVE: "archive",
  RESTORE: "restore",
  CLEANUP: "cleanup",
};

// ============================================================================
// SCHEMA DE NOTIFICATION STANDARDISÉ
// ============================================================================

/**
 * Crée un objet notification standardisé
 * @param {Object} options - Options de notification
 * @returns {Object} Notification formatée
 */
function buildNotificationObject(options) {
  const currentUser = auth.currentUser;

  const {
    title,
    message,
    type = NOTIFICATION_TYPES.INFO,
    targetRoles = null,
    targetUsers = null,
    metadata = {},
  } = options;

  return {
    // Identité de l'émetteur
    userId: currentUser?.uid || "system",
    userName: currentUser?.displayName || currentUser?.email || "Système",

    // Contenu
    title,
    message,
    type,

    // Timestamps
    timestamp: Date.now(),
    createdAt: Date.now(),

    // État
    read: false,

    // Ciblage (null = tous les utilisateurs)
    targetRoles, // Ex: ["admin", "manager"]
    targetUsers, // Ex: ["user123", "user456"]

    // Métadonnées extensibles
    metadata: {
      ...metadata,
      // Ajouter automatiquement le toolkit source si fourni
      ...(metadata.toolkit ? {} : {}),
    },
  };
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Crée une notification RTDB standardisée
 * @param {string} path - Chemin RTDB (utiliser NOTIFICATION_PATHS)
 * @param {Object} options - Options de notification
 * @param {string} options.title - Titre de la notification
 * @param {string} options.message - Message descriptif
 * @param {string} [options.type="info"] - Type: "success", "error", "warning", "info"
 * @param {string[]|null} [options.targetRoles=null] - Rôles ciblés (null = tous)
 * @param {string[]|null} [options.targetUsers=null] - Utilisateurs ciblés (null = tous)
 * @param {Object} [options.metadata={}] - Métadonnées optionnelles
 * @returns {Promise<string|null>} ID de la notification créée ou null si erreur
 */
export async function createNotification(path, options) {
  try {
    const notification = buildNotificationObject(options);
    const notificationRef = ref(rtdb, path);
    const newRef = await push(notificationRef, notification);

    console.log(`✅ Notification créée: ${path}/${newRef.key}`);
    return newRef.key;
  } catch (error) {
    console.error("❌ Erreur création notification:", error);
    // Ne pas bloquer l'opération si la notification échoue
    return null;
  }
}

// ============================================================================
// HELPERS SPÉCIALISÉS PAR ACTION
// ============================================================================

/**
 * Notification de création d'élément
 * @param {string} path - Chemin RTDB
 * @param {string} itemType - Type d'élément (ex: "menu", "boisson")
 * @param {string} itemName - Nom de l'élément créé
 * @param {Object} [extraMetadata={}] - Métadonnées supplémentaires
 */
export async function notifyCreate(path, itemType, itemName, extraMetadata = {}) {
  return createNotification(path, {
    title: `${capitalize(itemType)} créé`,
    message: `${itemName} a été créé avec succès`,
    type: NOTIFICATION_TYPES.SUCCESS,
    metadata: {
      action: NOTIFICATION_ACTIONS.CREATE,
      itemType,
      itemName,
      ...extraMetadata,
    },
  });
}

/**
 * Notification de modification d'élément
 * @param {string} path - Chemin RTDB
 * @param {string} itemType - Type d'élément
 * @param {string} itemName - Nom de l'élément modifié
 * @param {Object} [extraMetadata={}] - Métadonnées supplémentaires
 */
export async function notifyUpdate(path, itemType, itemName, extraMetadata = {}) {
  return createNotification(path, {
    title: `${capitalize(itemType)} modifié`,
    message: `${itemName} a été mis à jour`,
    type: NOTIFICATION_TYPES.INFO,
    metadata: {
      action: NOTIFICATION_ACTIONS.UPDATE,
      itemType,
      itemName,
      ...extraMetadata,
    },
  });
}

/**
 * Notification de suppression d'élément
 * @param {string} path - Chemin RTDB
 * @param {string} itemType - Type d'élément
 * @param {string} itemName - Nom de l'élément supprimé
 * @param {Object} [extraMetadata={}] - Métadonnées supplémentaires
 */
export async function notifyDelete(path, itemType, itemName, extraMetadata = {}) {
  return createNotification(path, {
    title: `${capitalize(itemType)} supprimé`,
    message: `${itemName} a été supprimé`,
    type: NOTIFICATION_TYPES.WARNING,
    metadata: {
      action: NOTIFICATION_ACTIONS.DELETE,
      itemType,
      itemName,
      ...extraMetadata,
    },
  });
}

/**
 * Notification d'erreur
 * @param {string} path - Chemin RTDB
 * @param {string} operation - Opération qui a échoué
 * @param {string} errorMessage - Message d'erreur
 * @param {Object} [extraMetadata={}] - Métadonnées supplémentaires
 */
export async function notifyError(path, operation, errorMessage, extraMetadata = {}) {
  return createNotification(path, {
    title: `Erreur: ${operation}`,
    message: errorMessage,
    type: NOTIFICATION_TYPES.ERROR,
    targetRoles: ["admin"], // Les erreurs sont visibles uniquement par les admins
    metadata: {
      action: "error",
      operation,
      ...extraMetadata,
    },
  });
}

/**
 * Notification de synchronisation
 * @param {string} path - Chemin RTDB
 * @param {string} module - Module synchronisé
 * @param {number} count - Nombre d'éléments synchronisés
 * @param {Object} [extraMetadata={}] - Métadonnées supplémentaires
 */
export async function notifySync(path, module, count, extraMetadata = {}) {
  return createNotification(path, {
    title: `Synchronisation ${module}`,
    message: `${count} élément(s) synchronisé(s)`,
    type: NOTIFICATION_TYPES.INFO,
    metadata: {
      action: NOTIFICATION_ACTIONS.SYNC,
      module,
      count,
      ...extraMetadata,
    },
  });
}

// ============================================================================
// HELPERS PAR TOOLKIT (RACCOURCIS)
// ============================================================================

/**
 * Helpers Stock
 */
export const stockNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.STOCK, "élément de stock", itemName, { toolkit: "stock", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.STOCK, "élément de stock", itemName, { toolkit: "stock", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.STOCK, "élément de stock", itemName, { toolkit: "stock", ...meta }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.STOCK, operation, message, { toolkit: "stock", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.STOCK, { title, message, type, metadata: { toolkit: "stock", ...meta } }),
};

/**
 * Helpers Menu
 */
export const menuNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.MENU, "menu", itemName, { toolkit: "menu", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.MENU, "menu", itemName, { toolkit: "menu", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.MENU, "menu", itemName, { toolkit: "menu", ...meta }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.MENU, operation, message, { toolkit: "menu", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.MENU, { title, message, type, metadata: { toolkit: "menu", ...meta } }),
};

/**
 * Helpers Menu Composé
 */
export const menuComposeNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.MENU_COMPOSE, "menu composé", itemName, { toolkit: "menuCompose", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.MENU_COMPOSE, "menu composé", itemName, { toolkit: "menuCompose", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.MENU_COMPOSE, "menu composé", itemName, { toolkit: "menuCompose", ...meta }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.MENU_COMPOSE, operation, message, { toolkit: "menuCompose", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.MENU_COMPOSE, { title, message, type, metadata: { toolkit: "menuCompose", ...meta } }),
};

/**
 * Helpers Boisson
 */
export const boissonNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.BOISSON, "boisson", itemName, { toolkit: "boisson", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.BOISSON, "boisson", itemName, { toolkit: "boisson", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.BOISSON, "boisson", itemName, { toolkit: "boisson", ...meta }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.BOISSON, operation, message, { toolkit: "boisson", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.BOISSON, { title, message, type, metadata: { toolkit: "boisson", ...meta } }),
};

/**
 * Helpers Production
 */
export const productionNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.PRODUCTION, "production", itemName, { toolkit: "production", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.PRODUCTION, "production", itemName, { toolkit: "production", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.PRODUCTION, "production", itemName, { toolkit: "production", ...meta }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.PRODUCTION, operation, message, { toolkit: "production", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.PRODUCTION, { title, message, type, metadata: { toolkit: "production", ...meta } }),
};

/**
 * Helpers Emplacement
 */
export const emplacementNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.EMPLACEMENT, "emplacement", itemName, { toolkit: "emplacement", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.EMPLACEMENT, "emplacement", itemName, { toolkit: "emplacement", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.EMPLACEMENT, "emplacement", itemName, { toolkit: "emplacement", ...meta }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.EMPLACEMENT, operation, message, { toolkit: "emplacement", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.EMPLACEMENT, { title, message, type, metadata: { toolkit: "emplacement", ...meta } }),
};

/**
 * Helpers Commande
 */
export const commandeNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.COMMANDE, "commande", itemName, { toolkit: "commande", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.COMMANDE, "commande", itemName, { toolkit: "commande", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.COMMANDE, "commande", itemName, { toolkit: "commande", ...meta }),
  archive: (count, meta = {}) =>
    createNotification(NOTIFICATION_PATHS.COMMANDE, {
      title: "Archivage commandes",
      message: `${count} commande(s) archivée(s)`,
      type: NOTIFICATION_TYPES.INFO,
      metadata: { toolkit: "commande", action: NOTIFICATION_ACTIONS.ARCHIVE, count, ...meta },
    }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.COMMANDE, operation, message, { toolkit: "commande", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.COMMANDE, { title, message, type, metadata: { toolkit: "commande", ...meta } }),
};

/**
 * Helpers Comptabilité
 */
export const comptabiliteNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.COMPTABILITE, "opération comptable", itemName, { toolkit: "comptabilite", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.COMPTABILITE, "opération comptable", itemName, { toolkit: "comptabilite", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.COMPTABILITE, "opération comptable", itemName, { toolkit: "comptabilite", ...meta }),
  cloture: (date, meta = {}) =>
    createNotification(NOTIFICATION_PATHS.COMPTABILITE, {
      title: "Clôture comptable",
      message: `Clôture du ${date} effectuée`,
      type: NOTIFICATION_TYPES.SUCCESS,
      metadata: { toolkit: "comptabilite", action: "cloture", date, ...meta },
    }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.COMPTABILITE, operation, message, { toolkit: "comptabilite", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.COMPTABILITE, { title, message, type, metadata: { toolkit: "comptabilite", ...meta } }),
};

/**
 * Helpers Adresse
 */
export const adresseNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.ADRESSE, "adresse", itemName, { toolkit: "adresse", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.ADRESSE, "adresse", itemName, { toolkit: "adresse", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.ADRESSE, "adresse", itemName, { toolkit: "adresse", ...meta }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.ADRESSE, operation, message, { toolkit: "adresse", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.ADRESSE, { title, message, type, metadata: { toolkit: "adresse", ...meta } }),
};

/**
 * Helpers Todo
 */
export const todoNotifications = {
  create: (itemName, meta = {}) =>
    notifyCreate(NOTIFICATION_PATHS.TODO, "tâche", itemName, { toolkit: "todo", ...meta }),
  update: (itemName, meta = {}) =>
    notifyUpdate(NOTIFICATION_PATHS.TODO, "tâche", itemName, { toolkit: "todo", ...meta }),
  delete: (itemName, meta = {}) =>
    notifyDelete(NOTIFICATION_PATHS.TODO, "tâche", itemName, { toolkit: "todo", ...meta }),
  complete: (itemName, meta = {}) =>
    createNotification(NOTIFICATION_PATHS.TODO, {
      title: "Tâche terminée",
      message: `${itemName} a été complétée`,
      type: NOTIFICATION_TYPES.SUCCESS,
      metadata: { toolkit: "todo", action: "complete", ...meta },
    }),
  error: (operation, message, meta = {}) =>
    notifyError(NOTIFICATION_PATHS.TODO, operation, message, { toolkit: "todo", ...meta }),
  custom: (title, message, type = "info", meta = {}) =>
    createNotification(NOTIFICATION_PATHS.TODO, { title, message, type, metadata: { toolkit: "todo", ...meta } }),
};

/**
 * Helpers Système
 */
export const systemNotifications = {
  info: (title, message, meta = {}) =>
    createNotification(NOTIFICATION_PATHS.SYSTEM, {
      title,
      message,
      type: NOTIFICATION_TYPES.INFO,
      metadata: { toolkit: "system", ...meta },
    }),
  warning: (title, message, meta = {}) =>
    createNotification(NOTIFICATION_PATHS.SYSTEM, {
      title,
      message,
      type: NOTIFICATION_TYPES.WARNING,
      targetRoles: ["admin"],
      metadata: { toolkit: "system", ...meta },
    }),
  error: (title, message, meta = {}) =>
    createNotification(NOTIFICATION_PATHS.SYSTEM, {
      title,
      message,
      type: NOTIFICATION_TYPES.ERROR,
      targetRoles: ["admin"],
      metadata: { toolkit: "system", ...meta },
    }),
  cleanup: (count, meta = {}) =>
    createNotification(NOTIFICATION_PATHS.SYSTEM, {
      title: "Nettoyage automatique",
      message: `${count} notification(s) ancienne(s) supprimée(s)`,
      type: NOTIFICATION_TYPES.INFO,
      targetRoles: ["admin"],
      metadata: { toolkit: "system", action: NOTIFICATION_ACTIONS.CLEANUP, count, ...meta },
    }),
};

// ============================================================================
// FONCTIONS DE NETTOYAGE
// ============================================================================

/**
 * Nettoie les notifications de plus de 48H (lues ou non)
 * @param {string} path - Chemin RTDB à nettoyer
 * @param {boolean} [onlyRead=false] - Si true, ne supprime que les notifications lues
 * @returns {Promise<number>} Nombre de notifications supprimées
 */
export async function cleanOldNotifications(path, onlyRead = false) {
  try {
    const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
    const notificationsRef = ref(rtdb, path);

    // Query pour les notifications anciennes
    const oldNotificationsQuery = query(
      notificationsRef,
      orderByChild("timestamp"),
      endAt(twoDaysAgo)
    );

    const snapshot = await get(oldNotificationsQuery);
    if (!snapshot.exists()) {
      return 0;
    }

    let count = 0;
    const deletePromises = [];

    snapshot.forEach((child) => {
      const notification = child.val();
      // Supprimer si onlyRead=false OU si la notification est lue
      if (!onlyRead || notification.read === true) {
        deletePromises.push(remove(ref(rtdb, `${path}/${child.key}`)));
        count++;
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`🧹 ${count} notification(s) nettoyée(s) dans ${path}`);
    }

    return count;
  } catch (error) {
    console.error(`❌ Erreur nettoyage ${path}:`, error);
    return 0;
  }
}

/**
 * Nettoie toutes les routes de notifications
 * @param {boolean} [onlyRead=false] - Si true, ne supprime que les notifications lues
 * @returns {Promise<number>} Total de notifications supprimées
 */
export async function cleanAllNotifications(onlyRead = false) {
  try {
    console.log("🧹 Démarrage nettoyage global des notifications...");

    let totalCleaned = 0;

    // Nettoyer les nouveaux paths
    for (const path of Object.values(NOTIFICATION_PATHS)) {
      totalCleaned += await cleanOldNotifications(path, onlyRead);
    }

    // Nettoyer les paths legacy (pendant la migration)
    for (const path of Object.values(LEGACY_PATHS)) {
      totalCleaned += await cleanOldNotifications(path, onlyRead);
    }

    if (totalCleaned > 0) {
      console.log(`✅ Nettoyage global terminé: ${totalCleaned} notification(s) supprimée(s)`);
    }

    return totalCleaned;
  } catch (error) {
    console.error("❌ Erreur nettoyage global:", error);
    return 0;
  }
}

// ============================================================================
// HOOK POUR NETTOYAGE AUTOMATIQUE
// ============================================================================

/**
 * Hook pour nettoyage automatique toutes les 48H
 * À utiliser dans le MainLayout de votre application
 */
export function useAutoCleanup() {
  useEffect(() => {
    const CLEANUP_INTERVAL = 48 * 60 * 60 * 1000; // 48H en millisecondes
    const LAST_CLEANUP_KEY = "lsd_notifications_cleanup";

    const checkAndClean = async () => {
      const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
      const now = Date.now();

      // Vérifier si 48H se sont écoulées depuis le dernier nettoyage
      if (!lastCleanup || now - parseInt(lastCleanup, 10) > CLEANUP_INTERVAL) {
        console.log("🧹 useAutoCleanup: Lancement du nettoyage automatique...");

        const totalCleaned = await cleanAllNotifications(false);

        if (totalCleaned > 0) {
          // Notification système pour les admins
          await systemNotifications.cleanup(totalCleaned);
        }

        localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
        console.log("✅ useAutoCleanup: Nettoyage terminé");
      }
    };

    // Exécuter au démarrage (avec délai pour ne pas bloquer le rendu)
    const initialTimeout = setTimeout(checkAndClean, 5000);

    // Vérifier toutes les heures (mais ne nettoyer que toutes les 48H)
    const interval = setInterval(checkAndClean, 60 * 60 * 1000); // 1H

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Capitalise la première lettre d'une chaîne
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Récupère tous les chemins de notification (nouveaux + legacy)
 * Utile pour les listeners qui doivent écouter tous les chemins
 */
export function getAllNotificationPaths() {
  return [
    ...Object.values(NOTIFICATION_PATHS),
    ...Object.values(LEGACY_PATHS),
  ];
}

/**
 * Récupère uniquement les nouveaux chemins de notification
 */
export function getNotificationPaths() {
  return Object.values(NOTIFICATION_PATHS);
}

// ============================================================================
// SYSTÈME DE CACHE AVEC TTL
// ============================================================================

/**
 * Configuration TTL par défaut
 * 5 minutes pour la plupart des caches (balance entre fraîcheur et performance)
 */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * TTL personnalisés par type de données
 */
export const CACHE_TTL = {
  // Données très dynamiques (changent fréquemment)
  COMMANDES: 2 * 60 * 1000,      // 2 minutes
  PRODUCTION_EN_ATTENTE: 3 * 60 * 1000, // 3 minutes
  STOCK_OPERATIONS: 3 * 60 * 1000,      // 3 minutes

  // Données modérément dynamiques (changent régulièrement)
  STOCK_ELEMENTS: 5 * 60 * 1000,        // 5 minutes (défaut)
  MENUS: 5 * 60 * 1000,                 // 5 minutes
  BOISSONS: 5 * 60 * 1000,              // 5 minutes
  PRODUCTION_DEFINITIONS: 5 * 60 * 1000, // 5 minutes

  // Données relativement stables (changent rarement)
  EMPLACEMENTS: 10 * 60 * 1000,         // 10 minutes
  INGREDIENTS: 10 * 60 * 1000,          // 10 minutes
  COMPTES_COMPTABLES: 10 * 60 * 1000,   // 10 minutes

  // Données quasi-statiques (changent très rarement)
  USERS: 15 * 60 * 1000,                // 15 minutes
  ADRESSES: 15 * 60 * 1000,             // 15 minutes
  SETTINGS: 30 * 60 * 1000,             // 30 minutes
};

/**
 * Structure d'un élément de cache avec métadonnées
 */
function createCacheEntry(data, ttl = DEFAULT_CACHE_TTL) {
  return {
    data,
    timestamp: Date.now(),
    ttl,
    expiresAt: Date.now() + ttl,
  };
}

/**
 * Sauvegarde des données dans le cache avec TTL
 * @param {string} key - Clé du cache (ex: "local_lsd_boissons")
 * @param {any} data - Données à mettre en cache
 * @param {number} [ttl=DEFAULT_CACHE_TTL] - Durée de vie en millisecondes
 */
export function setCacheWithTTL(key, data, ttl = DEFAULT_CACHE_TTL) {
  try {
    const entry = createCacheEntry(data, ttl);
    localStorage.setItem(key, JSON.stringify(entry));
    console.log(`💾 Cache sauvegardé: ${key} (TTL: ${ttl / 1000}s, expire dans ${ttl / 60000}min)`);
  } catch (error) {
    console.error(`❌ Erreur sauvegarde cache ${key}:`, error);
    // En cas d'erreur (quota dépassé), essayer de nettoyer les vieux caches
    cleanExpiredCaches();
  }
}

/**
 * Récupère des données du cache si elles sont encore valides
 * @param {string} key - Clé du cache
 * @returns {any|null} Données si valides, null si expirées ou inexistantes
 */
export function getCacheWithTTL(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      console.log(`📭 Cache vide: ${key}`);
      return null;
    }

    const entry = JSON.parse(cached);
    const now = Date.now();

    // Vérifier si le cache est expiré
    if (now > entry.expiresAt) {
      console.log(`⏰ Cache expiré: ${key} (expiré depuis ${Math.round((now - entry.expiresAt) / 1000)}s)`);
      localStorage.removeItem(key);
      return null;
    }

    const remainingTime = Math.round((entry.expiresAt - now) / 1000);
    console.log(`✅ Cache valide: ${key} (expire dans ${remainingTime}s)`);
    return entry.data;
  } catch (error) {
    console.error(`❌ Erreur lecture cache ${key}:`, error);
    // Si le cache est corrompu, le supprimer
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Vérifie si le cache existe et est valide
 * @param {string} key - Clé du cache
 * @returns {boolean} true si le cache est valide, false sinon
 */
export function isCacheValid(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return false;

    const entry = JSON.parse(cached);
    return Date.now() <= entry.expiresAt;
  } catch (error) {
    return false;
  }
}

/**
 * Invalide immédiatement un cache (force le rechargement)
 * @param {string} key - Clé du cache à invalider
 */
export function invalidateCache(key) {
  localStorage.removeItem(key);
  console.log(`🗑️ Cache invalidé: ${key}`);
}

/**
 * Invalide plusieurs caches en une seule opération
 * @param {string[]} keys - Clés des caches à invalider
 */
export function invalidateCaches(keys) {
  keys.forEach(invalidateCache);
  console.log(`🗑️ ${keys.length} cache(s) invalidé(s)`);
}

/**
 * Nettoie tous les caches expirés du localStorage
 * @returns {number} Nombre de caches nettoyés
 */
export function cleanExpiredCaches() {
  try {
    let cleaned = 0;
    const now = Date.now();
    const keysToRemove = [];

    // Parcourir tous les items du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Ne traiter que les caches LSD (préfixe "local_")
      if (key && key.startsWith("local_")) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry = JSON.parse(cached);
            // Vérifier si c'est un cache avec TTL et s'il est expiré
            if (entry.expiresAt && now > entry.expiresAt) {
              keysToRemove.push(key);
              cleaned++;
            }
          }
        } catch (error) {
          // Si le cache est corrompu, le marquer pour suppression
          keysToRemove.push(key);
          cleaned++;
        }
      }
    }

    // Supprimer les caches expirés
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} cache(s) expiré(s) nettoyé(s)`);
    }

    return cleaned;
  } catch (error) {
    console.error("❌ Erreur nettoyage caches expirés:", error);
    return 0;
  }
}

/**
 * Hook React pour nettoyage automatique des caches expirés
 * À utiliser dans le MainLayout (déjà intégré avec useAutoCleanup)
 */
export function useAutoCleanupCaches() {
  useEffect(() => {
    // Nettoyage initial après 5 secondes
    const initialTimeout = setTimeout(() => {
      console.log("🧹 useAutoCleanupCaches: Nettoyage initial");
      cleanExpiredCaches();
    }, 5000);

    // Nettoyage toutes les 10 minutes
    const interval = setInterval(() => {
      console.log("🧹 useAutoCleanupCaches: Nettoyage périodique");
      cleanExpiredCaches();
    }, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);
}

/**
 * Récupère les statistiques du cache
 * @returns {Object} Statistiques détaillées du cache
 */
export function getCacheStats() {
  const stats = {
    total: 0,
    valid: 0,
    expired: 0,
    corrupted: 0,
    totalSize: 0,
    caches: [],
  };

  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith("local_")) {
      stats.total++;
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          stats.totalSize += cached.length;
          const entry = JSON.parse(cached);

          const isValid = entry.expiresAt && now <= entry.expiresAt;
          if (isValid) {
            stats.valid++;
          } else {
            stats.expired++;
          }

          stats.caches.push({
            key,
            size: cached.length,
            isValid,
            expiresAt: entry.expiresAt,
            remainingTime: isValid ? Math.round((entry.expiresAt - now) / 1000) : 0,
            ttl: entry.ttl,
          });
        }
      } catch (error) {
        stats.corrupted++;
        stats.caches.push({
          key,
          size: 0,
          isValid: false,
          corrupted: true,
        });
      }
    }
  }

  return stats;
}

/**
 * Affiche les statistiques du cache dans la console (debug)
 */
export function logCacheStats() {
  const stats = getCacheStats();
  console.group("📊 Statistiques Cache");
  console.log(`Total: ${stats.total} cache(s)`);
  console.log(`Valides: ${stats.valid} | Expirés: ${stats.expired} | Corrompus: ${stats.corrupted}`);
  console.log(`Taille totale: ${(stats.totalSize / 1024).toFixed(2)} KB`);
  console.table(stats.caches);
  console.groupEnd();
}
