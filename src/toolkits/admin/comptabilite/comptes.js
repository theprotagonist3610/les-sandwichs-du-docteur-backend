/**
 * comptes.js
 * Gestion des comptes comptables et de trésorerie
 */

import { nanoid } from "nanoid";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, push } from "firebase/database";
import { db, rtdb, auth } from "../../../firebase.js";
import {
  compteSchema,
  compteTresorerieSchema,
  comptesListeSchema,
  comptesTresorerieListeSchema,
} from "./schemas";
import {
  COMPTES_DOC,
  TRESORERIE_DOC,
  RTDB_COMPTA_TRIGGER_PATH,
  COMPTES_OHADA_DEFAULT,
  COMPTES_TRESORERIE_DEFAULT,
  CACHE_KEY_COMPTES,
  CACHE_KEY_TRESORERIE,
} from "./constants";
import { saveToCache, getFromCache, clearCache } from "./utils";

// ============================================================================
// FONCTIONS DE GESTION DES COMPTES COMPTABLES
// ============================================================================

/**
 * Initialise les comptes OHADA par défaut s'ils n'existent pas
 */
export async function initialiserComptesDefault() {
  try {
    const comptesRef = doc(db, COMPTES_DOC);
    const comptesSnap = await getDoc(comptesRef);

    if (!comptesSnap.exists()) {
      console.log("📊 Initialisation des comptes OHADA par défaut...");

      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : "system";
      const now = Date.now();

      const comptes = COMPTES_OHADA_DEFAULT.map((compte) => ({
        id: `cmpte_${nanoid(10)}`,
        code_ohada: compte.code_ohada,
        denomination: compte.denomination,
        description: compte.description,
        categorie: compte.categorie,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }));

      const validated = comptesListeSchema.parse({
        comptes,
        lastUpdated: now,
      });

      await setDoc(comptesRef, validated);
      console.log(`✅ ${comptes.length} comptes OHADA créés`);
      return validated;
    }

    return comptesSnap.data();
  } catch (error) {
    console.error("❌ Erreur initialisation comptes:", error);
    throw error;
  }
}

/**
 * Initialise les comptes de trésorerie par défaut s'ils n'existent pas
 */
export async function initialiserTresorerieDefault() {
  try {
    const tresoRef = doc(db, TRESORERIE_DOC);
    const tresoSnap = await getDoc(tresoRef);

    if (!tresoSnap.exists()) {
      console.log("💰 Initialisation des comptes de trésorerie par défaut...");

      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : "system";
      const now = Date.now();

      const comptes = COMPTES_TRESORERIE_DEFAULT.map((compte) => ({
        id: `tresor_${nanoid(10)}`,
        code_ohada: compte.code_ohada,
        denomination: compte.denomination,
        description: compte.description,
        numero: compte.numero,
        categorie: "entree/sortie",
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }));

      const validated = comptesTresorerieListeSchema.parse({
        comptes,
        lastUpdated: now,
      });

      await setDoc(tresoRef, validated);
      console.log(`✅ ${comptes.length} comptes de trésorerie créés`);
      return validated;
    }

    return tresoSnap.data();
  } catch (error) {
    console.error("❌ Erreur initialisation trésorerie:", error);
    throw error;
  }
}

/**
 * Récupère tous les comptes comptables
 * Utilise le cache en priorité pour optimiser les performances
 */
export async function getAllComptes() {
  try {
    // Essayer le cache d'abord
    const cached = getFromCache(CACHE_KEY_COMPTES);
    if (cached) {
      console.log(`📦 Cache: ${cached.comptes.length} comptes comptables`);
      return cached;
    }

    // Si pas de cache, récupérer depuis Firestore
    const comptesRef = doc(db, COMPTES_DOC);
    const comptesSnap = await getDoc(comptesRef);

    if (!comptesSnap.exists()) {
      // Initialiser si n'existe pas
      const initialized = await initialiserComptesDefault();
      saveToCache(CACHE_KEY_COMPTES, initialized);
      return initialized;
    }

    const validated = comptesListeSchema.parse(comptesSnap.data());
    console.log(`✅ ${validated.comptes.length} comptes comptables récupérés`);

    // Sauvegarder dans le cache
    saveToCache(CACHE_KEY_COMPTES, validated);

    return validated;
  } catch (error) {
    console.error("❌ Erreur récupération comptes:", error);
    throw error;
  }
}

/**
 * Récupère tous les comptes de trésorerie
 * Utilise le cache en priorité pour optimiser les performances
 */
export async function getAllComptesTresorerie() {
  try {
    // Essayer le cache d'abord
    const cached = getFromCache(CACHE_KEY_TRESORERIE);
    if (cached) {
      console.log(`📦 Cache: ${cached.comptes.length} comptes trésorerie`);
      return cached;
    }

    // Si pas de cache, récupérer depuis Firestore
    const tresoRef = doc(db, TRESORERIE_DOC);
    const tresoSnap = await getDoc(tresoRef);

    if (!tresoSnap.exists()) {
      // Initialiser si n'existe pas
      const initialized = await initialiserTresorerieDefault();
      saveToCache(CACHE_KEY_TRESORERIE, initialized);
      return initialized;
    }

    const validated = comptesTresorerieListeSchema.parse(tresoSnap.data());
    console.log(`✅ ${validated.comptes.length} comptes trésorerie récupérés`);

    // Sauvegarder dans le cache
    saveToCache(CACHE_KEY_TRESORERIE, validated);

    return validated;
  } catch (error) {
    console.error("❌ Erreur récupération trésorerie:", error);
    throw error;
  }
}

/**
 * Crée un nouveau compte comptable simple
 * @param {Object} compteData - {code_ohada, denomination, description, categorie}
 * @param {string} userId - ID de l'utilisateur
 */
export async function creerCompte(compteData, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    const now = Date.now();
    const nouveauCompte = {
      id: `cmpte_${nanoid(10)}`,
      ...compteData,
      createdBy: actualUserId,
      createdAt: now,
      updatedAt: now,
    };

    // Valider avec Zod
    const validated = compteSchema.parse(nouveauCompte);

    // Récupérer la liste actuelle
    const { comptes, lastUpdated } = await getAllComptes();

    // Vérifier qu'un compte avec le même code OHADA n'existe pas déjà
    const existant = comptes.find((c) => c.code_ohada === validated.code_ohada);
    if (existant) {
      throw new Error(`Un compte avec le code OHADA ${validated.code_ohada} existe déjà`);
    }

    // Ajouter le nouveau compte
    comptes.push(validated);

    // Sauvegarder
    const comptesRef = doc(db, COMPTES_DOC);
    await setDoc(comptesRef, {
      comptes,
      lastUpdated: now,
    });

    // Invalider le cache
    clearCache(CACHE_KEY_COMPTES);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "create_compte",
      compteId: validated.id,
      timestamp: now,
    });

    console.log(`✅ Compte créé: ${validated.denomination}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur création compte:", error);
    throw error;
  }
}

/**
 * Crée un nouveau compte de trésorerie
 * @param {Object} compteData - {code_ohada, denomination, description, numero}
 * @param {string} userId - ID de l'utilisateur
 */
export async function creerCompteTresorerie(compteData, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    const now = Date.now();
    const nouveauCompte = {
      id: `tresor_${nanoid(10)}`,
      ...compteData,
      categorie: "entree/sortie",
      createdBy: actualUserId,
      createdAt: now,
      updatedAt: now,
    };

    // Valider avec Zod
    const validated = compteTresorerieSchema.parse(nouveauCompte);

    // Récupérer la liste actuelle
    const { comptes } = await getAllComptesTresorerie();

    // Vérifier qu'un compte avec le même code OHADA n'existe pas déjà
    const existant = comptes.find((c) => c.code_ohada === validated.code_ohada);
    if (existant) {
      throw new Error(`Un compte de trésorerie avec le code OHADA ${validated.code_ohada} existe déjà`);
    }

    // Ajouter le nouveau compte
    comptes.push(validated);

    // Sauvegarder
    const tresoRef = doc(db, TRESORERIE_DOC);
    await setDoc(tresoRef, {
      comptes,
      lastUpdated: now,
    });

    // Invalider le cache
    clearCache(CACHE_KEY_TRESORERIE);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "create_compte_tresorerie",
      compteId: validated.id,
      timestamp: now,
    });

    console.log(`✅ Compte trésorerie créé: ${validated.denomination}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur création compte trésorerie:", error);
    throw error;
  }
}

/**
 * Met à jour un compte comptable simple
 * @param {string} compteId
 * @param {Object} updates
 * @param {string} userId
 */
export async function updateCompte(compteId, updates, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Récupérer la liste actuelle
    const { comptes } = await getAllComptes();

    // Trouver le compte
    const index = comptes.findIndex((c) => c.id === compteId);
    if (index === -1) {
      throw new Error(`Compte ${compteId} introuvable`);
    }

    // Mettre à jour
    const now = Date.now();
    const updatedCompte = {
      ...comptes[index],
      ...updates,
      id: compteId, // Garder l'ID
      updatedBy: actualUserId,
      updatedAt: now,
    };

    // Valider
    const validated = compteSchema.parse(updatedCompte);
    comptes[index] = validated;

    // Sauvegarder
    const comptesRef = doc(db, COMPTES_DOC);
    await setDoc(comptesRef, {
      comptes,
      lastUpdated: now,
    });

    // Invalider le cache
    clearCache(CACHE_KEY_COMPTES);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "update_compte",
      compteId: validated.id,
      timestamp: now,
    });

    console.log(`✅ Compte mis à jour: ${validated.denomination}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur mise à jour compte:", error);
    throw error;
  }
}

/**
 * Met à jour un compte de trésorerie
 * @param {string} compteId
 * @param {Object} updates
 * @param {string} userId
 */
export async function updateCompteTresorerie(compteId, updates, userId = "system") {
  try {
    const currentUser = auth.currentUser;
    const actualUserId = userId === "system" && currentUser ? currentUser.uid : userId;

    // Récupérer la liste actuelle
    const { comptes } = await getAllComptesTresorerie();

    // Trouver le compte
    const index = comptes.findIndex((c) => c.id === compteId);
    if (index === -1) {
      throw new Error(`Compte trésorerie ${compteId} introuvable`);
    }

    // Mettre à jour
    const now = Date.now();
    const updatedCompte = {
      ...comptes[index],
      ...updates,
      id: compteId, // Garder l'ID
      categorie: "entree/sortie", // Toujours entree/sortie
      updatedBy: actualUserId,
      updatedAt: now,
    };

    // Valider
    const validated = compteTresorerieSchema.parse(updatedCompte);
    comptes[index] = validated;

    // Sauvegarder
    const tresoRef = doc(db, TRESORERIE_DOC);
    await setDoc(tresoRef, {
      comptes,
      lastUpdated: now,
    });

    // Invalider le cache
    clearCache(CACHE_KEY_TRESORERIE);

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "update_compte_tresorerie",
      compteId: validated.id,
      timestamp: now,
    });

    console.log(`✅ Compte trésorerie mis à jour: ${validated.denomination}`);
    return validated;
  } catch (error) {
    console.error("❌ Erreur mise à jour compte trésorerie:", error);
    throw error;
  }
}

// ============================================================================
// FONCTIONS DE RECHERCHE
// ============================================================================

/**
 * Trouve un compte comptable par son ID
 * @param {string} compteId - ID du compte
 * @returns {Promise<Object|null>} Le compte trouvé ou null
 */
export async function findCompteById(compteId) {
  try {
    const { comptes } = await getAllComptes();
    return comptes.find((c) => c.id === compteId) || null;
  } catch (error) {
    console.error("❌ Erreur recherche compte:", error);
    throw error;
  }
}

/**
 * Trouve un compte comptable par son code OHADA
 * @param {string} codeOhada - Code OHADA du compte
 * @returns {Promise<Object|null>} Le compte trouvé ou null
 */
export async function findCompteByCodeOhada(codeOhada) {
  try {
    const { comptes } = await getAllComptes();
    return comptes.find((c) => c.code_ohada === codeOhada) || null;
  } catch (error) {
    console.error("❌ Erreur recherche compte par code OHADA:", error);
    throw error;
  }
}

/**
 * Trouve un compte de trésorerie par son ID
 * @param {string} compteId - ID du compte
 * @returns {Promise<Object|null>} Le compte trouvé ou null
 */
export async function findCompteTresorerieById(compteId) {
  try {
    const { comptes } = await getAllComptesTresorerie();
    return comptes.find((c) => c.id === compteId) || null;
  } catch (error) {
    console.error("❌ Erreur recherche compte trésorerie:", error);
    throw error;
  }
}

/**
 * Trouve un compte de trésorerie par son code OHADA
 * @param {string} codeOhada - Code OHADA du compte
 * @returns {Promise<Object|null>} Le compte trouvé ou null
 */
export async function findCompteTresorerieByCodeOhada(codeOhada) {
  try {
    const { comptes } = await getAllComptesTresorerie();
    return comptes.find((c) => c.code_ohada === codeOhada) || null;
  } catch (error) {
    console.error("❌ Erreur recherche compte trésorerie par code OHADA:", error);
    throw error;
  }
}
