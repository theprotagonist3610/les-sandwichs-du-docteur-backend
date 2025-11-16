/**
 * livraisons.js
 * Fonctions CRUD pour la gestion des livraisons (Option C - Hybride)
 */

import { db, rtdb } from "@/lib/firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { ref, set, update, remove } from "firebase/database";
import { nanoid } from "nanoid";
import {
  livraisonSchema,
  livraisonsListeSchema,
  createLivraisonInputSchema,
  assignerLivreurInputSchema,
  updateLivraisonInputSchema,
  livraisonIndexSchema,
} from "./schemas";
import {
  LIVRAISONS_DOC,
  RTDB_LIVRAISONS_INDEX_PATH,
  RTDB_LIVRAISONS_TRIGGER_PATH,
  CACHE_KEY_LIVRAISONS,
  CACHE_LIFETIME,
  STATUTS_LIVRAISON,
} from "./constants";

// ============================================================================
// HELPERS - CACHE
// ============================================================================

function saveToCache(key, data) {
  try {
    const cacheData = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cacheData));
    console.log(`✅ Cache livraisons sauvegardé`);
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache livraisons:", error);
  }
}

function getFromCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (age > CACHE_LIFETIME) {
      console.log("⏰ Cache livraisons expiré");
      localStorage.removeItem(key);
      return null;
    }

    console.log("✅ Cache livraisons récupéré");
    return cacheData.data;
  } catch (error) {
    console.error("❌ Erreur lecture cache livraisons:", error);
    return null;
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY_LIVRAISONS);
    console.log("🗑️ Cache livraisons supprimé");
  } catch (error) {
    console.error("❌ Erreur suppression cache:", error);
  }
}

async function triggerCacheInvalidation() {
  try {
    const triggerRef = ref(rtdb, RTDB_LIVRAISONS_TRIGGER_PATH);
    await set(triggerRef, {
      action: "livraisons_updated",
      timestamp: Date.now(),
    });
    console.log("🔄 Trigger RTDB livraisons envoyé");
  } catch (error) {
    console.error("❌ Erreur trigger RTDB:", error);
  }
}

// ============================================================================
// HELPERS - RTDB INDEX
// ============================================================================

/**
 * Met à jour l'index RTDB pour une livraison
 */
async function updateRTDBIndex(commandeCode, livraison) {
  try {
    const indexRef = ref(rtdb, `${RTDB_LIVRAISONS_INDEX_PATH}/${commandeCode}`);

    if (livraison === null) {
      // Supprimer de l'index si livraison supprimée
      await remove(indexRef);
    } else {
      // Créer/mettre à jour l'index
      const indexData = {
        livraison_id: livraison.id,
        statut: livraison.statut,
        livreur_id: livraison.livreur?.id || null,
        colis_recupere: livraison.colis_recupere,
        updatedAt: livraison.updatedAt,
      };

      const validated = livraisonIndexSchema.parse(indexData);
      await set(indexRef, validated);
    }

    console.log(`✅ Index RTDB mis à jour pour ${commandeCode}`);
  } catch (error) {
    console.error("❌ Erreur updateRTDBIndex:", error);
  }
}

// ============================================================================
// READ - LIVRAISONS
// ============================================================================

/**
 * Récupère toutes les livraisons
 * @param {Object} options - Options
 * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
 * @returns {Promise<Array>} Liste des livraisons
 */
export async function getAllLivraisons(options = { useCache: true }) {
  try {
    // Vérifier le cache
    if (options.useCache) {
      const cached = getFromCache(CACHE_KEY_LIVRAISONS);
      if (cached) {
        return cached;
      }
    }

    // Charger depuis Firestore
    const docRef = doc(db, LIVRAISONS_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("ℹ️ Aucune livraison trouvée");
      return [];
    }

    const data = docSnap.data();
    const validated = livraisonsListeSchema.parse(data);

    // Sauvegarder dans le cache
    if (options.useCache) {
      saveToCache(CACHE_KEY_LIVRAISONS, validated.livraisons);
    }

    return validated.livraisons;
  } catch (error) {
    console.error("❌ Erreur getAllLivraisons:", error);
    throw new Error(`Impossible de charger les livraisons: ${error.message}`);
  }
}

/**
 * Récupère une livraison par son ID
 */
export async function getLivraisonById(livraisonId) {
  try {
    const livraisons = await getAllLivraisons();
    const livraison = livraisons.find((l) => l.id === livraisonId);
    return livraison || null;
  } catch (error) {
    console.error("❌ Erreur getLivraisonById:", error);
    throw new Error(`Impossible de charger la livraison: ${error.message}`);
  }
}

/**
 * Récupère une livraison par code commande
 */
export async function getLivraisonByCommandeCode(commandeCode) {
  try {
    const livraisons = await getAllLivraisons();
    const livraison = livraisons.find((l) => l.commande_code === commandeCode);
    return livraison || null;
  } catch (error) {
    console.error("❌ Erreur getLivraisonByCommandeCode:", error);
    throw new Error(`Impossible de charger la livraison: ${error.message}`);
  }
}

/**
 * Récupère uniquement les livraisons non livrées
 */
export async function getLivraisonsEnCours() {
  try {
    const livraisons = await getAllLivraisons();
    return livraisons.filter(
      (l) => l.statut !== STATUTS_LIVRAISON.LIVREE && l.statut !== STATUTS_LIVRAISON.ANNULEE
    );
  } catch (error) {
    console.error("❌ Erreur getLivraisonsEnCours:", error);
    throw new Error(`Impossible de charger les livraisons en cours: ${error.message}`);
  }
}

/**
 * Récupère les livraisons par statut
 */
export async function getLivraisonsByStatut(statut) {
  try {
    const livraisons = await getAllLivraisons();
    return livraisons.filter((l) => l.statut === statut);
  } catch (error) {
    console.error("❌ Erreur getLivraisonsByStatut:", error);
    throw new Error(`Impossible de charger les livraisons par statut: ${error.message}`);
  }
}

/**
 * Récupère les livraisons d'un livreur
 */
export async function getLivraisonsByLivreur(livreurId) {
  try {
    const livraisons = await getAllLivraisons();
    return livraisons.filter((l) => l.livreur?.id === livreurId);
  } catch (error) {
    console.error("❌ Erreur getLivraisonsByLivreur:", error);
    throw new Error(`Impossible de charger les livraisons du livreur: ${error.message}`);
  }
}

// ============================================================================
// CREATE - LIVRAISON
// ============================================================================

/**
 * Crée une nouvelle livraison
 * @param {Object} input - Données de la livraison
 * @param {string} userId - ID de l'utilisateur créateur
 * @returns {Promise<Object>} Livraison créée
 */
export async function createLivraison(input, userId) {
  try {
    // Valider l'input
    const validatedInput = createLivraisonInputSchema.parse(input);

    const now = Date.now();
    const livraisonId = `LIV_${nanoid(10)}`;

    const newLivraison = {
      id: livraisonId,
      commande_code: validatedInput.commande_code,
      statut: STATUTS_LIVRAISON.EN_ATTENTE,
      client: validatedInput.client,
      livreur: null,
      colis_recupere: false,
      priorite: validatedInput.priorite || "normale",
      dates: {
        creation: now,
        assignation: null,
        recuperation: null,
        livraison: null,
      },
      notes: validatedInput.notes || "",
      createdBy: userId,
      updatedAt: now,
    };

    // Valider la livraison complète
    const validated = livraisonSchema.parse(newLivraison);

    // Transaction atomique
    const docRef = doc(db, LIVRAISONS_DOC);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      let livraisons = [];
      if (docSnap.exists()) {
        const data = docSnap.data();
        livraisons = data.livraisons || [];
      }

      // Vérifier si le code commande existe déjà
      const existant = livraisons.find((l) => l.commande_code === validated.commande_code);
      if (existant) {
        throw new Error(`Une livraison pour la commande ${validated.commande_code} existe déjà`);
      }

      // Ajouter la nouvelle livraison
      livraisons.push(validated);

      transaction.set(docRef, {
        livraisons,
        updatedAt: now,
      });
    });

    // Mettre à jour l'index RTDB
    await updateRTDBIndex(validated.commande_code, validated);

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livraison créée: ${validated.id}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur createLivraison:", error);
    throw new Error(`Impossible de créer la livraison: ${error.message}`);
  }
}

// ============================================================================
// UPDATE - LIVRAISON
// ============================================================================

/**
 * Assigne un livreur à une livraison
 */
export async function assignerLivreur(livraisonId, livreurData, userId) {
  try {
    // Valider l'input
    const validatedLivreur = assignerLivreurInputSchema.parse(livreurData);

    const now = Date.now();
    const docRef = doc(db, LIVRAISONS_DOC);

    let updatedLivraison;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucune livraison trouvée");
      }

      const data = docSnap.data();
      const livraisons = data.livraisons || [];

      const index = livraisons.findIndex((l) => l.id === livraisonId);
      if (index === -1) {
        throw new Error(`Livraison ${livraisonId} introuvable`);
      }

      // Mettre à jour la livraison
      updatedLivraison = {
        ...livraisons[index],
        livreur: {
          id: validatedLivreur.livreur_id,
          nom: validatedLivreur.livreur_nom,
        },
        statut: STATUTS_LIVRAISON.ASSIGNEE,
        dates: {
          ...livraisons[index].dates,
          assignation: now,
        },
        updatedBy: userId,
        updatedAt: now,
      };

      // Valider la livraison mise à jour
      updatedLivraison = livraisonSchema.parse(updatedLivraison);

      livraisons[index] = updatedLivraison;

      transaction.set(docRef, {
        livraisons,
        updatedAt: now,
      });
    });

    // Mettre à jour l'index RTDB
    await updateRTDBIndex(updatedLivraison.commande_code, updatedLivraison);

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livreur assigné à la livraison: ${livraisonId}`);
    return updatedLivraison;
  } catch (error) {
    console.error("❌ Erreur assignerLivreur:", error);
    throw new Error(`Impossible d'assigner le livreur: ${error.message}`);
  }
}

/**
 * Marque un colis comme récupéré
 */
export async function marquerColisRecupere(livraisonId, userId) {
  try {
    const now = Date.now();
    const docRef = doc(db, LIVRAISONS_DOC);

    let updatedLivraison;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucune livraison trouvée");
      }

      const data = docSnap.data();
      const livraisons = data.livraisons || [];

      const index = livraisons.findIndex((l) => l.id === livraisonId);
      if (index === -1) {
        throw new Error(`Livraison ${livraisonId} introuvable`);
      }

      // Vérifier qu'un livreur est assigné
      if (!livraisons[index].livreur) {
        throw new Error("Aucun livreur assigné à cette livraison");
      }

      // Mettre à jour la livraison
      updatedLivraison = {
        ...livraisons[index],
        colis_recupere: true,
        statut: STATUTS_LIVRAISON.RECUPEREE,
        dates: {
          ...livraisons[index].dates,
          recuperation: now,
        },
        updatedBy: userId,
        updatedAt: now,
      };

      // Valider la livraison mise à jour
      updatedLivraison = livraisonSchema.parse(updatedLivraison);

      livraisons[index] = updatedLivraison;

      transaction.set(docRef, {
        livraisons,
        updatedAt: now,
      });
    });

    // Mettre à jour l'index RTDB
    await updateRTDBIndex(updatedLivraison.commande_code, updatedLivraison);

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Colis marqué comme récupéré: ${livraisonId}`);
    return updatedLivraison;
  } catch (error) {
    console.error("❌ Erreur marquerColisRecupere:", error);
    throw new Error(`Impossible de marquer le colis comme récupéré: ${error.message}`);
  }
}

/**
 * Marque une livraison comme en cours
 */
export async function demarrerLivraison(livraisonId, userId) {
  try {
    return await updateStatutLivraison(livraisonId, STATUTS_LIVRAISON.EN_COURS, userId);
  } catch (error) {
    console.error("❌ Erreur demarrerLivraison:", error);
    throw new Error(`Impossible de démarrer la livraison: ${error.message}`);
  }
}

/**
 * Marque une livraison comme livrée
 */
export async function terminerLivraison(livraisonId, userId) {
  try {
    const now = Date.now();
    const docRef = doc(db, LIVRAISONS_DOC);

    let updatedLivraison;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucune livraison trouvée");
      }

      const data = docSnap.data();
      const livraisons = data.livraisons || [];

      const index = livraisons.findIndex((l) => l.id === livraisonId);
      if (index === -1) {
        throw new Error(`Livraison ${livraisonId} introuvable`);
      }

      // Mettre à jour la livraison
      updatedLivraison = {
        ...livraisons[index],
        statut: STATUTS_LIVRAISON.LIVREE,
        dates: {
          ...livraisons[index].dates,
          livraison: now,
        },
        updatedBy: userId,
        updatedAt: now,
      };

      // Valider la livraison mise à jour
      updatedLivraison = livraisonSchema.parse(updatedLivraison);

      livraisons[index] = updatedLivraison;

      transaction.set(docRef, {
        livraisons,
        updatedAt: now,
      });
    });

    // Mettre à jour l'index RTDB
    await updateRTDBIndex(updatedLivraison.commande_code, updatedLivraison);

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livraison terminée: ${livraisonId}`);
    return updatedLivraison;
  } catch (error) {
    console.error("❌ Erreur terminerLivraison:", error);
    throw new Error(`Impossible de terminer la livraison: ${error.message}`);
  }
}

/**
 * Met à jour le statut d'une livraison
 */
export async function updateStatutLivraison(livraisonId, nouveauStatut, userId) {
  try {
    const now = Date.now();
    const docRef = doc(db, LIVRAISONS_DOC);

    let updatedLivraison;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucune livraison trouvée");
      }

      const data = docSnap.data();
      const livraisons = data.livraisons || [];

      const index = livraisons.findIndex((l) => l.id === livraisonId);
      if (index === -1) {
        throw new Error(`Livraison ${livraisonId} introuvable`);
      }

      // Mettre à jour la livraison
      updatedLivraison = {
        ...livraisons[index],
        statut: nouveauStatut,
        updatedBy: userId,
        updatedAt: now,
      };

      // Valider la livraison mise à jour
      updatedLivraison = livraisonSchema.parse(updatedLivraison);

      livraisons[index] = updatedLivraison;

      transaction.set(docRef, {
        livraisons,
        updatedAt: now,
      });
    });

    // Mettre à jour l'index RTDB
    await updateRTDBIndex(updatedLivraison.commande_code, updatedLivraison);

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Statut de livraison mis à jour: ${livraisonId}`);
    return updatedLivraison;
  } catch (error) {
    console.error("❌ Erreur updateStatutLivraison:", error);
    throw new Error(`Impossible de mettre à jour le statut: ${error.message}`);
  }
}

/**
 * Met à jour une livraison (générique)
 */
export async function updateLivraison(livraisonId, updates, userId) {
  try {
    // Valider l'input
    const validatedUpdates = updateLivraisonInputSchema.parse(updates);

    const now = Date.now();
    const docRef = doc(db, LIVRAISONS_DOC);

    let updatedLivraison;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucune livraison trouvée");
      }

      const data = docSnap.data();
      const livraisons = data.livraisons || [];

      const index = livraisons.findIndex((l) => l.id === livraisonId);
      if (index === -1) {
        throw new Error(`Livraison ${livraisonId} introuvable`);
      }

      // Mettre à jour la livraison
      updatedLivraison = {
        ...livraisons[index],
        ...validatedUpdates,
        updatedBy: userId,
        updatedAt: now,
      };

      // Valider la livraison mise à jour
      updatedLivraison = livraisonSchema.parse(updatedLivraison);

      livraisons[index] = updatedLivraison;

      transaction.set(docRef, {
        livraisons,
        updatedAt: now,
      });
    });

    // Mettre à jour l'index RTDB
    await updateRTDBIndex(updatedLivraison.commande_code, updatedLivraison);

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livraison mise à jour: ${livraisonId}`);
    return updatedLivraison;
  } catch (error) {
    console.error("❌ Erreur updateLivraison:", error);
    throw new Error(`Impossible de mettre à jour la livraison: ${error.message}`);
  }
}

// ============================================================================
// DELETE - LIVRAISON
// ============================================================================

/**
 * Supprime une livraison
 */
export async function deleteLivraison(livraisonId) {
  try {
    const now = Date.now();
    const docRef = doc(db, LIVRAISONS_DOC);

    let commandeCode;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error("Aucune livraison trouvée");
      }

      const data = docSnap.data();
      let livraisons = data.livraisons || [];

      const index = livraisons.findIndex((l) => l.id === livraisonId);
      if (index === -1) {
        throw new Error(`Livraison ${livraisonId} introuvable`);
      }

      commandeCode = livraisons[index].commande_code;

      // Supprimer la livraison
      livraisons.splice(index, 1);

      transaction.set(docRef, {
        livraisons,
        updatedAt: now,
      });
    });

    // Supprimer de l'index RTDB
    await updateRTDBIndex(commandeCode, null);

    // Invalider le cache
    clearCache();
    await triggerCacheInvalidation();

    console.log(`✅ Livraison supprimée: ${livraisonId}`);
  } catch (error) {
    console.error("❌ Erreur deleteLivraison:", error);
    throw new Error(`Impossible de supprimer la livraison: ${error.message}`);
  }
}
