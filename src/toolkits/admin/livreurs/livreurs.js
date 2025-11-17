/**
 * livreurs.js
 * Fonctions CRUD pour la gestion des livreurs
 */

import { db, rtdb } from "@/firebase";
import { doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { nanoid } from "nanoid";
import {
  livreurSchema,
  livreursListeSchema,
  createLivreurInputSchema,
  updateLivreurInputSchema,
} from "./schemas";
import {
  LIVREURS_DOC,
  RTDB_LIVREURS_TRIGGER_PATH,
  CACHE_KEY_LIVREURS,
  CACHE_LIFETIME,
} from "./constants";

// ============================================================================
// HELPERS - CACHE
// ============================================================================

/**
 * Sauvegarde dans le cache
 */
function saveToCache(key, data) {
  try {
    const cacheData = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cacheData));
    console.log(`✅ Cache livreurs sauvegardé`);
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache livreurs:", error);
  }
}

/**
 * Récupère du cache
 */
function getFromCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (age > CACHE_LIFETIME) {
      console.log("⏰ Cache livreurs expiré");
      localStorage.removeItem(key);
      return null;
    }

    console.log("✅ Cache livreurs récupéré");
    return cacheData.data;
  } catch (error) {
    console.error("❌ Erreur lecture cache livreurs:", error);
    return null;
  }
}

/**
 * Invalide le cache
 */
function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY_LIVREURS);
    console.log("🗑️ Cache livreurs supprimé");
  } catch (error) {
    console.error("❌ Erreur suppression cache:", error);
  }
}

/**
 * Déclenche un trigger RTDB pour invalider le cache
 */
async function triggerCacheInvalidation() {
  try {
    const triggerRef = ref(rtdb, RTDB_LIVREURS_TRIGGER_PATH);
    await set(triggerRef, {
      action: "livreurs_updated",
      timestamp: Date.now(),
    });
    console.log("🔄 Trigger RTDB envoyé");
  } catch (error) {
    console.error("❌ Erreur trigger RTDB:", error);
  }
}

// ============================================================================
// READ - LIVREURS
// ============================================================================

/**
 * Récupère tous les livreurs
 * @param {Object} options - Options
 * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
 * @returns {Promise<Array>} Liste des livreurs
 */
export async function getAllLivreurs(options = { useCache: true }) {
  try {
    // Vérifier le cache
    if (options.useCache) {
      const cached = getFromCache(CACHE_KEY_LIVREURS);
      if (cached) {
        return cached;
      }
    }

    // Charger depuis Firestore
    const docRef = doc(db, LIVREURS_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("ℹ️ Aucun livreur trouvé");
      return [];
    }

    const data = docSnap.data();
    const validated = livreursListeSchema.parse(data);

    // Sauvegarder dans le cache
    if (options.useCache) {
      saveToCache(CACHE_KEY_LIVREURS, validated.livreurs);
    }

    return validated.livreurs;
  } catch (error) {
    console.error("❌ Erreur getAllLivreurs:", error);
    throw new Error(`Impossible de charger les livreurs: ${error.message}`);
  }
}

/**
 * Récupère un livreur par son ID
 * @param {string} livreurId - ID du livreur
 * @returns {Promise<Object|null>} Livreur ou null si non trouvé
 */
export async function getLivreurById(livreurId) {
  try {
    const livreurs = await getAllLivreurs();
    const livreur = livreurs.find((l) => l.id === livreurId);
    return livreur || null;
  } catch (error) {
    console.error("❌ Erreur getLivreurById:", error);
    throw new Error(`Impossible de charger le livreur: ${error.message}`);
  }
}

/**
 * Récupère uniquement les livreurs actifs
 * @returns {Promise<Array>} Liste des livreurs actifs
 */
export async function getLivreursActifs() {
  try {
    const livreurs = await getAllLivreurs();
    return livreurs.filter((l) => l.actif);
  } catch (error) {
    console.error("❌ Erreur getLivreursActifs:", error);
    throw new Error(
      `Impossible de charger les livreurs actifs: ${error.message}`
    );
  }
}

// ============================================================================
// CREATE - LIVREUR
// ============================================================================

/**
 * Crée un nouveau livreur
 * @param {Object} input - Données du livreur
 * @param {string} userId - ID de l'utilisateur créateur
 * @returns {Promise<Object>} Livreur créé
 */
export async function createLivreur(input, userId) {
  try {
    // Valider l'input
    const validatedInput = createLivreurInputSchema.parse(input);

    const now = Date.now();
    const livreurId = `livreur_${nanoid(10)}`;

    const newLivreur = {
      id: livreurId,
      denomination: validatedInput.denomination,
      contact: validatedInput.contact,
      actif: validatedInput.actif ?? true,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    // Valider le livreur complet
    const validated = livreurSchema.parse(newLivreur);

    // Transaction atomique
    const docRef = doc(db, LIVREURS_DOC);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      let livreurs = [];
      if (docSnap.exists()) {
        const data = docSnap.data();
        livreurs = data.livreurs || [];
      }

      // Vérifier si le nom existe déjà
      const existant = livreurs.find(
        (l) =>
          l.denomination.toLowerCase() === validated.denomination.toLowerCase()
      );
      if (existant) {
        throw new Error(
          `Un livreur avec le nom "${validated.denomination}" existe déjà`
        );
      }

      // Ajouter le nouveau livreur
      livreurs.push(validated);

      transaction.set(docRef, {
        livreurs,
        updatedAt: now,
      });
    });

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livreur créé: ${validated.id}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur createLivreur:", error);
    throw new Error(`Impossible de créer le livreur: ${error.message}`);
  }
}

// ============================================================================
// UPDATE - LIVREUR
// ============================================================================

/**
 * Met à jour un livreur
 * @param {string} livreurId - ID du livreur
 * @param {Object} updates - Modifications
 * @param {string} userId - ID de l'utilisateur modificateur
 * @returns {Promise<Object>} Livreur mis à jour
 */
export async function updateLivreur(livreurId, updates, userId) {
  try {
    // Valider l'input
    const validatedUpdates = updateLivreurInputSchema.parse(updates);

    const now = Date.now();
    const docRef = doc(db, LIVREURS_DOC);

    let updatedLivreur;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucun livreur trouvé");
      }

      const data = docSnap.data();
      const livreurs = data.livreurs || [];

      const index = livreurs.findIndex((l) => l.id === livreurId);
      if (index === -1) {
        throw new Error(`Livreur ${livreurId} introuvable`);
      }

      // Vérifier si le nouveau nom existe déjà
      if (validatedUpdates.denomination) {
        const existant = livreurs.find(
          (l) =>
            l.id !== livreurId &&
            l.denomination.toLowerCase() ===
              validatedUpdates.denomination.toLowerCase()
        );
        if (existant) {
          throw new Error(
            `Un livreur avec le nom "${validatedUpdates.denomination}" existe déjà`
          );
        }
      }

      // Mettre à jour le livreur
      updatedLivreur = {
        ...livreurs[index],
        ...validatedUpdates,
        updatedBy: userId,
        updatedAt: now,
      };

      // Valider le livreur mis à jour
      updatedLivreur = livreurSchema.parse(updatedLivreur);

      livreurs[index] = updatedLivreur;

      transaction.set(docRef, {
        livreurs,
        updatedAt: now,
      });
    });

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livreur mis à jour: ${livreurId}`);
    return updatedLivreur;
  } catch (error) {
    console.error("❌ Erreur updateLivreur:", error);
    throw new Error(`Impossible de mettre à jour le livreur: ${error.message}`);
  }
}

// ============================================================================
// DELETE - LIVREUR
// ============================================================================

/**
 * Supprime un livreur (soft delete - marque comme inactif)
 * @param {string} livreurId - ID du livreur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<void>}
 */
export async function deleteLivreur(livreurId, userId) {
  try {
    // Soft delete - marquer comme inactif
    await updateLivreur(livreurId, { actif: false }, userId);
    console.log(`✅ Livreur désactivé: ${livreurId}`);
  } catch (error) {
    console.error("❌ Erreur deleteLivreur:", error);
    throw new Error(`Impossible de supprimer le livreur: ${error.message}`);
  }
}

/**
 * Supprime définitivement un livreur
 * @param {string} livreurId - ID du livreur
 * @returns {Promise<void>}
 */
export async function hardDeleteLivreur(livreurId) {
  try {
    const now = Date.now();
    const docRef = doc(db, LIVREURS_DOC);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucun livreur trouvé");
      }

      const data = docSnap.data();
      let livreurs = data.livreurs || [];

      const index = livreurs.findIndex((l) => l.id === livreurId);
      if (index === -1) {
        throw new Error(`Livreur ${livreurId} introuvable`);
      }

      // Supprimer le livreur
      livreurs.splice(index, 1);

      transaction.set(docRef, {
        livreurs,
        updatedAt: now,
      });
    });

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livreur supprimé définitivement: ${livreurId}`);
  } catch (error) {
    console.error("❌ Erreur hardDeleteLivreur:", error);
    throw new Error(
      `Impossible de supprimer définitivement le livreur: ${error.message}`
    );
  }
}
