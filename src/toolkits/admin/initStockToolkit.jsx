/**
 * admin/initStockToolkit.jsx
 * Initialisation du système de stock
 *
 * Ce toolkit gère l'initialisation du système de stock en créant:
 * 1. Un emplacement "BASE" (entrepôt central) où tous les éléments de stock sont d'abord enregistrés
 * 2. Les éléments de stock initiaux dans cette base
 *
 * Structure d'initialisation:
 * - Créer l'emplacement BASE (type: entrepot)
 * - Ajouter les éléments de stock à la liste globale
 * - Enregistrer les quantités initiales dans la BASE via des transactions d'entrée
 *
 * IMPORTANT: L'initialisation ne peut être faite qu'une seule fois.
 * Une fois la BASE créée, elle devient l'emplacement central pour toutes les distributions.
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "@/firebase.js";
import { nanoid } from "nanoid";
import { auth } from "@/firebase.js";

// Import des fonctions nécessaires depuis les autres toolkits
import {
  createEmplacement,
  getEmplacements,
  EMPLACEMENT_TYPES,
} from "./emplacementToolkit.jsx";

import {
  createElement,
  getStockElements,
  makeTransaction,
  TRANSACTION_TYPES,
  STOCK_TYPES,
} from "./stockToolkit.jsx";

// ============================================================================
// CONSTANTES
// ============================================================================

const STOCK_INIT_PATH = "stock/initialization";

export const BASE_EMPLACEMENT_ID = "BASE_CENTRALE";
export const BASE_DENOMINATION = "Base Centrale";

// ============================================================================
// PREPROCESSING HELPERS
// ============================================================================

const cleanString = (val) => {
  if (val === null || val === undefined) return "";
  return String(val);
};

const cleanNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schema pour un élément de stock initial
 * Permet quantite_initiale = 0 pour créer des placeholders (éléments à acheter plus tard)
 */
const elementInitialSchema = z.object({
  denomination: z.preprocess(cleanString, z.string().min(1)),
  type: z.enum(Object.values(STOCK_TYPES)),
  unite: z.preprocess(cleanString, z.string().min(1)),
  quantite_initiale: z.preprocess(cleanNumber, z.number().nonnegative()), // >= 0 pour permettre les placeholders
  prix_unitaire: z.preprocess(cleanNumber, z.number().nonnegative()),
  seuil_alerte: z.preprocess(cleanNumber, z.number().nonnegative()).optional(),
  description: z.preprocess(cleanString, z.string()).optional(),
});

/**
 * Schema pour la configuration de la BASE
 * Tous les champs obligatoires d'un emplacement doivent être fournis
 */
const baseConfigSchema = z.object({
  denomination: z
    .preprocess(cleanString, z.string().min(1))
    .default(BASE_DENOMINATION),

  // Position obligatoire
  position: z.object({
    departement: z.preprocess(cleanString, z.string().min(1)),
    commune: z.preprocess(cleanString, z.string().min(1)),
    arrondissement: z
      .preprocess(cleanString, z.string())
      .optional()
      .default(""),
    quartier: z.preprocess(cleanString, z.string()).optional().default(""),
    longitude: z.preprocess(cleanNumber, z.number()).default(0),
    latitude: z.preprocess(cleanNumber, z.number()).default(0),
  }),

  // Thème central (optionnel avec défaut)
  theme_central: z
    .object({
      theme: z.preprocess(cleanString, z.string()).default("Stock général"),
      description: z.preprocess(cleanString, z.string()).optional().default(""),
    })
    .optional()
    .default({ theme: "Stock général", description: "" }),

  // Sous-type optionnel
  sous_type: z
    .preprocess(cleanString, z.string())
    .optional()
    .default("entrepot_principal"),

  // Responsable optionnel
  // responsable: z.object({
  //   id: z.string().min(1),
  //   nom: z.string().min(1),
  //   prenoms: z.array(z.string()).optional().default([]),
  // }).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifie si le système de stock a déjà été initialisé
 * @returns {Promise<boolean>} True si déjà initialisé
 */
export async function isStockInitialized() {
  try {
    const initRef = doc(db, STOCK_INIT_PATH);
    const initDoc = await getDoc(initRef);

    if (!initDoc.exists()) return false;

    const data = initDoc.data();
    return data.initialized === true;
  } catch (error) {
    console.error("❌ Erreur vérification initialisation:", error);
    throw new Error(
      `Impossible de vérifier l'état d'initialisation: ${error.message}`
    );
  }
}

/**
 * Vérifie si la BASE centrale existe
 * Recherche par ID (BASE_CENTRALE) ou par dénomination (Base Centrale)
 * @returns {Promise<boolean>} True si la BASE existe
 */
export async function baseExists() {
  try {
    const emplacements = await getEmplacements();

    // Vérifier par ID (cas idéal)
    const existsById = emplacements.some((emp) => emp.id === BASE_EMPLACEMENT_ID);
    if (existsById) {
      console.log("✅ BASE trouvée par ID:", BASE_EMPLACEMENT_ID);
      return true;
    }

    // Vérifier par dénomination (fallback)
    const existsByName = emplacements.some(
      (emp) =>
        emp.denomination?.toLowerCase().trim() === BASE_DENOMINATION.toLowerCase().trim() ||
        emp.denomination?.toLowerCase().trim() === "base centrale"
    );

    if (existsByName) {
      console.log("✅ BASE trouvée par dénomination:", BASE_DENOMINATION);
      return true;
    }

    console.log("❌ BASE non trouvée. Emplacements disponibles:",
      emplacements.map(e => ({ id: e.id, denomination: e.denomination }))
    );
    return false;
  } catch (error) {
    console.error("❌ Erreur vérification BASE:", error);
    return false;
  }
}

/**
 * Récupère les informations d'initialisation
 * @returns {Promise<Object|null>} Infos d'initialisation ou null
 */
export async function getInitializationInfo() {
  try {
    const initRef = doc(db, STOCK_INIT_PATH);
    const initDoc = await getDoc(initRef);

    if (!initDoc.exists()) return null;

    return initDoc.data();
  } catch (error) {
    console.error("❌ Erreur récupération infos init:", error);
    return null;
  }
}

// ============================================================================
// CRÉATION DE LA BASE CENTRALE
// ============================================================================

/**
 * Crée l'emplacement BASE centrale
 *
 * @param {Object} config - Configuration de la BASE (TOUS les champs obligatoires requis)
 * @param {string} config.denomination - Nom de la base (défaut: "Base Centrale")
 * @param {Object} config.position - Position géographique OBLIGATOIRE
 * @param {string} config.position.departement - Département (ex: "Atlantique")
 * @param {string} config.position.commune - Commune (ex: "Abomey-Calavi")
 * @param {string} [config.position.arrondissement] - Arrondissement
 * @param {string} [config.position.quartier] - Quartier
 * @param {number} [config.position.longitude] - Longitude GPS
 * @param {number} [config.position.latitude] - Latitude GPS
 * @param {Object} [config.theme_central] - Thème de l'emplacement
 * @param {string} [config.sous_type] - Sous-type d'entrepôt
 * @param {Object} [config.responsable] - Responsable de la base
 * @param {string} config.responsable.id - ID du responsable
 * @param {string} config.responsable.nom - Nom du responsable
 * @param {Array<string>} [config.responsable.prenoms] - Prénoms
 * @returns {Promise<Object>} L'emplacement BASE créé
 *
 * @example
 * const base = await createBaseEmplacement({
 *   denomination: "Entrepôt Principal",
 *   position: {
 *     departement: "Atlantique",
 *     commune: "Abomey-Calavi",
 *     arrondissement: "Godomey",
 *     quartier: "Vossa",
 *     longitude: 2.3522,
 *     latitude: 6.4489
 *   },
 *   theme_central: {
 *     theme: "Stock Central",
 *     description: "Entrepôt principal pour tous les produits"
 *   },
 *   responsable: {
 *     id: "user_123",
 *     nom: "DOE",
 *     prenoms: ["John"]
 *   }
 * });
 */
export async function createBaseEmplacement(config = {}) {
  try {
    // Vérifier si déjà initialisé
    const initialized = await isStockInitialized();
    if (initialized) {
      throw new Error("Le système de stock est déjà initialisé");
    }

    // Vérifier si BASE existe déjà
    const exists = await baseExists();
    if (exists) {
      throw new Error("La BASE centrale existe déjà");
    }

    // Valider la configuration
    const validatedConfig = baseConfigSchema.parse(config);

    // Construire la position complète selon le schéma emplacementToolkit
    const positionComplete = {
      actuelle: {
        departement: validatedConfig.position.departement,
        commune: validatedConfig.position.commune,
        arrondissement: validatedConfig.position.arrondissement || "",
        quartier: validatedConfig.position.quartier || "",
        localisation: {
          longitude: validatedConfig.position.longitude || 0,
          latitude: validatedConfig.position.latitude || 0,
        },
      },
      historique: [], // Pas d'historique à la création
    };

    // Construire les horaires par défaut (ouvert 24/7)
    const horairesDefaut = {
      lun: { ouvert: true, ouverture: "00:00", fermeture: "23:59" },
      mar: { ouvert: true, ouverture: "00:00", fermeture: "23:59" },
      mer: { ouvert: true, ouverture: "00:00", fermeture: "23:59" },
      jeu: { ouvert: true, ouverture: "00:00", fermeture: "23:59" },
      ven: { ouvert: true, ouverture: "00:00", fermeture: "23:59" },
      sam: { ouvert: true, ouverture: "00:00", fermeture: "23:59" },
      dim: { ouvert: true, ouverture: "00:00", fermeture: "23:59" },
    };

    // Créer l'emplacement BASE avec TOUS les champs obligatoires
    const baseData = {
      id: BASE_EMPLACEMENT_ID,
      type: {
        famille: EMPLACEMENT_TYPES.ENTREPOT,
        sous_type: validatedConfig.sous_type || "entrepot_principal",
      },
      denomination: validatedConfig.denomination,
      theme_central: validatedConfig.theme_central || {
        theme: "Stock général",
        description: "",
      },
      position: positionComplete,
      horaires: horairesDefaut,
      stock_actuel: {},
      status: true,
    };

    // Ajouter le responsable si fourni
    if (validatedConfig.responsable) {
      baseData.vendeur_actuel = {
        id: validatedConfig.responsable.id,
        nom: validatedConfig.responsable.nom,
        prenoms: validatedConfig.responsable.prenoms || [],
      };
    }

    const createdBase = await createEmplacement(baseData);

    console.log("✅ BASE centrale créée:", createdBase);
    return createdBase;
  } catch (error) {
    console.error("❌ Erreur création BASE:", error);
    throw new Error(`Impossible de créer la BASE centrale: ${error.message}`);
  }
}

// ============================================================================
// INITIALISATION DU STOCK
// ============================================================================

/**
 * Initialise le stock avec des éléments dans la BASE centrale
 *
 * Cette fonction:
 * 1. Crée la BASE centrale si elle n'existe pas
 * 2. Crée chaque élément de stock
 * 3. Enregistre une transaction d'entrée dans la BASE pour chaque élément
 * 4. Marque le système comme initialisé
 *
 * @param {Array<Object>} elements - Liste des éléments de stock à initialiser
 * @param {Object} baseConfig - Configuration de la BASE (optionnel)
 * @returns {Promise<Object>} Résultat de l'initialisation
 *
 * @example
 * const result = await initializeStock([
 *   {
 *     denomination: "Farine",
 *     type: "ingredient",
 *     unite: "kg",
 *     quantite_initiale: 100,
 *     prix_unitaire: 1.5,
 *     seuil_alerte: 10
 *   },
 *   {
 *     denomination: "Tomates",
 *     type: "perissable",
 *     unite: "kg",
 *     quantite_initiale: 50,
 *     prix_unitaire: 2.5,
 *     seuil_alerte: 5
 *   }
 * ], {
 *   denomination: "Entrepôt Principal",
 *   adresse: "123 rue du Commerce"
 * });
 */
export async function initializeStock(elements, baseConfig = {}) {
  try {
    // 1. Vérifier si déjà initialisé
    const initialized = await isStockInitialized();
    if (initialized) {
      throw new Error("Le système de stock est déjà initialisé");
    }

    // 2. Valider les éléments
    if (!Array.isArray(elements) || elements.length === 0) {
      throw new Error("La liste d'éléments ne peut pas être vide");
    }

    const validatedElements = elements.map((el, index) => {
      try {
        return elementInitialSchema.parse(el);
      } catch (error) {
        throw new Error(`Élément ${index + 1} invalide: ${error.message}`);
      }
    });

    // 3. Créer ou vérifier la BASE
    let baseEmplacement;
    const exists = await baseExists();

    if (!exists) {
      console.log("📦 Création de la BASE centrale...");
      baseEmplacement = await createBaseEmplacement(baseConfig);
    } else {
      console.log("📦 BASE centrale existante trouvée");
      const emplacements = await getEmplacements();
      baseEmplacement = emplacements.find(
        (emp) => emp.id === BASE_EMPLACEMENT_ID
      );
    }

    // 4. Créer les éléments et enregistrer les transactions
    const results = {
      baseEmplacement: baseEmplacement,
      elementsCreated: [],
      transactionsCreated: [],
      errors: [],
    };

    const currentUser = auth.currentUser;
    const userId = currentUser?.uid || "system";

    for (let i = 0; i < validatedElements.length; i++) {
      const element = validatedElements[i];

      try {
        // Créer l'élément de stock
        // L'unité doit être un objet {nom, symbol}
        const uniteObj =
          typeof element.unite === "string"
            ? { nom: element.unite, symbol: element.unite }
            : element.unite;

        const stockElement = await createElement({
          denomination: element.denomination,
          type: element.type,
          unite: uniteObj,
          prix_unitaire: element.prix_unitaire,
          seuil_alerte: element.seuil_alerte || 0,
          description: element.description || "",
        });

        results.elementsCreated.push(stockElement);
        console.log(`✅ Élément créé: ${stockElement.denomination}`);

        // Créer la transaction d'entrée dans la BASE seulement si quantité > 0
        // Si quantité = 0, c'est un placeholder (élément à acheter plus tard)
        if (element.quantite_initiale > 0) {
          const transaction = await makeTransaction(TRANSACTION_TYPES.ENTREE, {
            element_id: stockElement.id,
            emplacement_id: BASE_EMPLACEMENT_ID,
            quantite: element.quantite_initiale,
            prix_unitaire: element.prix_unitaire,
            motif: `Initialisation du stock - ${stockElement.denomination}`,
            user_id: userId,
          });

          results.transactionsCreated.push(transaction);
          console.log(
            `✅ Transaction créée: ${element.quantite_initiale} ${element.unite}`
          );
        } else {
          console.log(`ℹ️ Placeholder créé (quantité: 0) - pas de transaction`);
        }
      } catch (error) {
        console.error(`❌ Erreur avec ${element.denomination}:`, error);
        results.errors.push({
          element: element.denomination,
          error: error.message,
        });
      }
    }

    // 5. Marquer comme initialisé
    try {
      await runTransaction(db, async (transaction) => {
        const initRef = doc(db, STOCK_INIT_PATH);

        const initData = {
          initialized: true,
          date: Date.now(),
          user_id: userId,
          base_emplacement_id: BASE_EMPLACEMENT_ID,
          elements_count: results.elementsCreated.length,
          total_errors: results.errors.length,
        };

        transaction.set(initRef, initData);
      });

      console.log("✅ Système de stock marqué comme initialisé");
    } catch (error) {
      console.error("❌ Erreur lors du marquage d'initialisation:", error);
      // On continue quand même car les éléments ont été créés
    }

    // 6. Retourner les résultats
    const summary = {
      success: results.errors.length === 0,
      baseEmplacement: results.baseEmplacement,
      totalElements: validatedElements.length,
      elementsCreated: results.elementsCreated.length,
      transactionsCreated: results.transactionsCreated.length,
      errors: results.errors,
      details: results,
    };

    console.log("📊 Résumé de l'initialisation:", summary);
    return summary;
  } catch (error) {
    console.error("❌ Erreur initialisation stock:", error);
    throw new Error(`Impossible d'initialiser le stock: ${error.message}`);
  }
}

// ============================================================================
// RÉINITIALISATION (DANGER - À UTILISER AVEC PRÉCAUTION)
// ============================================================================

/**
 * Réinitialise le flag d'initialisation
 * ⚠️ ATTENTION: Cette fonction ne supprime pas les données existantes,
 * elle permet juste de relancer une initialisation
 *
 * @param {boolean} confirm - Doit être true pour confirmer
 * @returns {Promise<void>}
 */
export async function resetInitializationFlag(confirm = false) {
  if (!confirm) {
    throw new Error(
      "Confirmation requise pour réinitialiser le flag d'initialisation"
    );
  }

  try {
    const initRef = doc(db, STOCK_INIT_PATH);
    await runTransaction(db, async (transaction) => {
      transaction.set(initRef, {
        initialized: false,
        reset_at: Date.now(),
        reset_by: auth.currentUser?.uid || "unknown",
      });
    });

    console.log("⚠️ Flag d'initialisation réinitialisé");
  } catch (error) {
    console.error("❌ Erreur réinitialisation flag:", error);
    throw new Error(`Impossible de réinitialiser: ${error.message}`);
  }
}

// ============================================================================
// HOOK REACT
// ============================================================================

/**
 * Hook React pour surveiller l'état d'initialisation du stock
 *
 * @returns {Object} État d'initialisation
 *
 * @example
 * function InitStockPage() {
 *   const { initialized, loading, info, checkInit } = useStockInitialization();
 *
 *   if (loading) return <div>Chargement...</div>;
 *
 *   if (initialized) {
 *     return <div>Stock déjà initialisé le {new Date(info.date).toLocaleDateString()}</div>;
 *   }
 *
 *   return <InitStockForm />;
 * }
 */
export function useStockInitialization() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const checkInit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const isInit = await isStockInitialized();
      setInitialized(isInit);

      if (isInit) {
        const initInfo = await getInitializationInfo();
        setInfo(initInfo);
      }
    } catch (err) {
      console.error("❌ Erreur vérification init:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkInit();
  }, [checkInit]);

  return {
    initialized,
    loading,
    info,
    error,
    checkInit,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Vérifications
  isStockInitialized,
  baseExists,
  getInitializationInfo,

  // Initialisation
  createBaseEmplacement,
  initializeStock,
  resetInitializationFlag,

  // Hook
  useStockInitialization,

  // Constantes
  BASE_EMPLACEMENT_ID,
  BASE_DENOMINATION,
};
