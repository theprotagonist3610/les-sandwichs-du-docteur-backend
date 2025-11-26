/**
 * adresseToolkit.jsx
 * Gestion des adresses (départements, communes, arrondissements, quartiers)
 *
 * Structure Firestore:
 * adresses/{departementId} - un document par département contenant un array d'adresses
 * adresses/inconnu - pour les adresses dont le departement est inconnu
 *
 * Les 12 départements du Bénin:
 * - alibori, atacora, atlantique, borgou, collines, couffo
 * - donga, littoral, mono, oueme, plateau, zou
 *
 * Chaque document de département: {
 *   adresses: Array<{
 *     id: string,
 *     nom: string,                // Nom optionnel pour identifier l'adresse (ex: "Maison principale", "Bureau Cotonou")
 *     departement: string,
 *     commune: string,
 *     arrondissement: string,
 *     quartier: string,
 *     localisation: { longitude: number, latitude: number },
 *     statut: boolean            // true = actif, false = désactivé (par défaut: true)
 *   }>,
 *   updatedAt: number,
 *   updatedBy: string
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, runTransaction, getDocs, collection } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, rtdb, auth } from "../../firebase.js";
import { nanoid } from "nanoid";
import {
  adresseNotifications,
  NOTIFICATION_PATHS,
  LEGACY_PATHS,
} from "@/utils/notificationHelpers";

// ============================================================================
// CONSTANTES
// ============================================================================

const ADRESSES_COLLECTION = "adresses";
// Paths RTDB à écouter pour synchronisation (legacy + nouveau)
const RTDB_SYNC_PATHS = [LEGACY_PATHS.ADRESSES, NOTIFICATION_PATHS.ADRESSE];
const CACHE_KEY = "adresses_cache";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Les 12 départements du Bénin (normalisés en minuscules)
export const DEPARTEMENTS_BENIN = [
  "alibori",
  "atacora",
  "atlantique",
  "borgou",
  "collines",
  "couffo",
  "donga",
  "littoral",
  "mono",
  "oueme",
  "plateau",
  "zou",
  "inconnu" // Pour les adresses non classifiées
];

/**
 * Normaliser le nom d'un département
 */
function normalizeDepartement(departement) {
  if (!departement) return "inconnu";
  const normalized = departement.toLowerCase().trim();
  return DEPARTEMENTS_BENIN.includes(normalized) ? normalized : "inconnu";
}

/**
 * Normaliser une chaîne pour la comparaison (supprime espaces, accents, ponctuation)
 */
function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^\w\s]/g, "") // Supprimer la ponctuation
    .replace(/\s+/g, " "); // Normaliser les espaces multiples
}

/**
 * Vérifier si deux adresses sont identiques ou très similaires
 * @param {Object} addr1 - Première adresse
 * @param {Object} addr2 - Deuxième adresse
 * @param {Object} options - Options de comparaison
 * @returns {boolean} true si les adresses sont considérées comme doublons
 */
function isDuplicateAdresse(addr1, addr2, options = {}) {
  const {
    checkNom = true,
    checkCommune = true,
    checkArrondissement = true,
    checkQuartier = true,
    checkLocalisation = false,
    distanceThreshold = 0.001, // ~100m en degrés
  } = options;

  // Si les noms sont définis et identiques, c'est probablement un doublon
  if (checkNom && addr1.nom && addr2.nom) {
    if (normalizeString(addr1.nom) === normalizeString(addr2.nom)) {
      return true;
    }
  }

  // Vérifier les champs géographiques
  const communeMatch = !checkCommune ||
    normalizeString(addr1.commune) === normalizeString(addr2.commune);

  const arrondMatch = !checkArrondissement ||
    normalizeString(addr1.arrondissement) === normalizeString(addr2.arrondissement);

  const quartierMatch = !checkQuartier ||
    normalizeString(addr1.quartier) === normalizeString(addr2.quartier);

  // Si tous les champs géographiques correspondent
  if (communeMatch && arrondMatch && quartierMatch) {
    // Si la vérification de localisation est activée
    if (checkLocalisation && addr1.localisation && addr2.localisation) {
      const dist = Math.sqrt(
        Math.pow(addr1.localisation.longitude - addr2.localisation.longitude, 2) +
        Math.pow(addr1.localisation.latitude - addr2.localisation.latitude, 2)
      );
      return dist < distanceThreshold;
    }
    return true;
  }

  return false;
}

/**
 * Trouver des doublons potentiels pour une adresse
 * @param {Object} newAdresse - L'adresse à vérifier
 * @param {Array} existingAdresses - Liste des adresses existantes
 * @param {Object} options - Options de comparaison
 * @returns {Array} Liste des doublons potentiels
 */
function findDuplicates(newAdresse, existingAdresses, options = {}) {
  return existingAdresses.filter((addr) =>
    isDuplicateAdresse(newAdresse, addr, options)
  );
}

// ============================================================================
// UTILITAIRES - CACHE
// ============================================================================

/**
 * Sauvegarder les adresses dans le cache localStorage
 */
function saveToCache(adresses) {
  try {
    const cached = {
      data: adresses,
      version: Date.now(),
      etag: String(Date.now()),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error("Erreur sauvegarde cache adresses:", error);
  }
}

/**
 * Récupérer les adresses depuis le cache
 */
function getFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (error) {
    console.error("Erreur lecture cache adresses:", error);
    return null;
  }
}

/**
 * Vérifier si le cache est périmé (> 5 minutes)
 */
function isCacheStale(cachedData, maxAgeMs = 5 * 60 * 1000) {
  if (!cachedData || !cachedData.version) return true;
  return Date.now() - cachedData.version > maxAgeMs;
}

// ============================================================================
// UTILITAIRES - NOTIFICATIONS RTDB (utilise les helpers centralisés)
// ============================================================================

/**
 * Émettre une notification RTDB pour les adresses
 */
async function emitNotification(message, data = {}) {
  // Utiliser le helper centralisé
  await adresseNotifications.custom("Adresse modifiée", message, "info", data);
}

// ============================================================================
// UTILITAIRES - TRANSACTIONS ATOMIQUES
// ============================================================================

/**
 * Exécuter une transaction Firestore avec retry pour un département spécifique
 */
async function runTx(departementId, updateFn) {
  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_RETRIES) {
    try {
      const docRef = doc(db, ADRESSES_COLLECTION, departementId);

      const result = await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        let currDoc = docSnap.exists() ? docSnap.data() : { adresses: [] };

        const newDoc = updateFn(currDoc);
        newDoc.updatedAt = Date.now();
        newDoc.updatedBy = auth.currentUser?.uid || "system";

        transaction.set(docRef, newDoc);
        return newDoc;
      });

      console.log(`✅ Transaction adresse réussie pour ${departementId}`);
      return result;
    } catch (error) {
      attempt++;
      lastError = error;
      console.warn(
        `⚠️  Tentative ${attempt}/${MAX_RETRIES} échouée:`,
        error.message
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw new Error(
    `Transaction échouée après ${MAX_RETRIES} tentatives: ${lastError.message}`
  );
}

// ============================================================================
// CRUD - ADRESSES
// ============================================================================

/**
 * Créer une nouvelle adresse
 * @param {Object} data - Données de l'adresse
 * @returns {Promise<Object>} Adresse créée
 */
export async function createAdresse(data) {
  try {
    // Validation des champs obligatoires
    if (!data.departement || !data.commune) {
      throw new Error(
        "E_INVALID_ADRESSE: Département et commune sont obligatoires"
      );
    }

    // Normaliser le département
    const departementId = normalizeDepartement(data.departement);

    const newAdresse = {
      id: `addr_${nanoid(10)}`,
      nom: data.nom?.trim() || "", // Nom optionnel pour l'adresse
      departement: data.departement.trim(),
      commune: data.commune.trim(),
      arrondissement: data.arrondissement?.trim() || "",
      quartier: data.quartier?.trim() || "",
      localisation: {
        longitude: parseFloat(data.localisation?.longitude || 0),
        latitude: parseFloat(data.localisation?.latitude || 0),
      },
      statut: data.statut !== undefined ? data.statut : true, // Par défaut: actif
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: auth.currentUser?.uid || "system",
    };

    // Transaction atomique sur le document du département
    await runTx(departementId, (currDoc) => {
      const adresses = currDoc.adresses || [];

      // Vérifier les doublons dans le département avec la nouvelle fonction intelligente
      const duplicates = findDuplicates(newAdresse, adresses, {
        checkNom: true,
        checkCommune: true,
        checkArrondissement: true,
        checkQuartier: true,
        checkLocalisation: false,
      });

      if (duplicates.length > 0) {
        const dup = duplicates[0];
        const dupInfo = dup.nom
          ? `"${dup.nom}" (ID: ${dup.id})`
          : `${dup.commune}, ${dup.arrondissement}, ${dup.quartier} (ID: ${dup.id})`;

        throw new Error(
          `E_DUPLICATE_ADRESSE: Cette adresse existe déjà - ${dupInfo}`
        );
      }

      adresses.push(newAdresse);
      return { ...currDoc, adresses };
    });

    // Invalider le cache
    localStorage.removeItem(CACHE_KEY);

    // Émettre notification RTDB
    await emitNotification("Nouvelle adresse créée", {
      adresseId: newAdresse.id,
      departement: newAdresse.departement,
      departementId,
      commune: newAdresse.commune,
    });

    console.log(`✅ Adresse créée: ${newAdresse.id} dans ${departementId}`);
    return newAdresse;
  } catch (error) {
    console.error("❌ Erreur création adresse:", error);
    throw error;
  }
}

/**
 * Mettre à jour une adresse
 * @param {string} id - ID de l'adresse
 * @param {Object} patch - Données à mettre à jour
 * @returns {Promise<Object>} Adresse mise à jour
 */
export async function updateAdresse(id, patch) {
  try {
    if (!id) {
      throw new Error("E_INVALID_ID: ID de l'adresse requis");
    }

    // D'abord, trouver l'adresse pour connaître son département
    const existingAdresse = await getAdresse(id);
    if (!existingAdresse) {
      throw new Error(`E_ADRESSE_NOT_FOUND: Adresse ${id} introuvable`);
    }

    const oldDepartementId = normalizeDepartement(existingAdresse.departement);
    const newDepartementId = patch.departement
      ? normalizeDepartement(patch.departement)
      : oldDepartementId;

    let updatedAdresse;

    // Si le département change, il faut déplacer l'adresse
    if (oldDepartementId !== newDepartementId) {
      // Supprimer de l'ancien département
      await runTx(oldDepartementId, (currDoc) => {
        const adresses = currDoc.adresses || [];
        const filtered = adresses.filter((addr) => addr.id !== id);
        return { ...currDoc, adresses: filtered };
      });

      // Ajouter au nouveau département
      updatedAdresse = {
        ...existingAdresse,
        ...patch,
        id, // Garder l'ID original
        updatedAt: Date.now(),
        updatedBy: auth.currentUser?.uid || "system",
      };

      if (patch.localisation) {
        updatedAdresse.localisation = {
          longitude: parseFloat(patch.localisation.longitude || 0),
          latitude: parseFloat(patch.localisation.latitude || 0),
        };
      }

      await runTx(newDepartementId, (currDoc) => {
        const adresses = currDoc.adresses || [];
        adresses.push(updatedAdresse);
        return { ...currDoc, adresses };
      });
    } else {
      // Mise à jour dans le même département
      const result = await runTx(oldDepartementId, (currDoc) => {
        const adresses = currDoc.adresses || [];
        const index = adresses.findIndex((addr) => addr.id === id);

        if (index === -1) {
          throw new Error(`E_ADRESSE_NOT_FOUND: Adresse ${id} introuvable`);
        }

        const updated = {
          ...adresses[index],
          ...patch,
          id, // Garder l'ID original
          updatedAt: Date.now(),
          updatedBy: auth.currentUser?.uid || "system",
        };

        if (patch.localisation) {
          updated.localisation = {
            longitude: parseFloat(patch.localisation.longitude || 0),
            latitude: parseFloat(patch.localisation.latitude || 0),
          };
        }

        adresses[index] = updated;
        return { ...currDoc, adresses, updated };
      });

      updatedAdresse = result.updated;
    }

    // Invalider le cache
    localStorage.removeItem(CACHE_KEY);

    // Émettre notification RTDB
    await emitNotification("Adresse modifiée", {
      adresseId: id,
      departement: updatedAdresse.departement,
      departementId: newDepartementId,
      commune: updatedAdresse.commune,
    });

    console.log(`✅ Adresse mise à jour: ${id}`);
    return updatedAdresse;
  } catch (error) {
    console.error("❌ Erreur mise à jour adresse:", error);
    throw error;
  }
}

/**
 * Supprimer une adresse
 * @param {string} id - ID de l'adresse
 * @returns {Promise<void>}
 */
export async function deleteAdresse(id) {
  try {
    if (!id) {
      throw new Error("E_INVALID_ID: ID de l'adresse requis");
    }

    // D'abord, trouver l'adresse pour connaître son département
    const existingAdresse = await getAdresse(id);
    if (!existingAdresse) {
      throw new Error(`E_ADRESSE_NOT_FOUND: Adresse ${id} introuvable`);
    }

    const departementId = normalizeDepartement(existingAdresse.departement);

    await runTx(departementId, (currDoc) => {
      const adresses = currDoc.adresses || [];
      const index = adresses.findIndex((addr) => addr.id === id);

      if (index === -1) {
        throw new Error(`E_ADRESSE_NOT_FOUND: Adresse ${id} introuvable`);
      }

      adresses.splice(index, 1);
      return { ...currDoc, adresses };
    });

    // Invalider le cache
    localStorage.removeItem(CACHE_KEY);

    // Émettre notification RTDB
    await emitNotification("Adresse supprimée", {
      adresseId: id,
      departement: existingAdresse.departement,
      departementId,
      commune: existingAdresse.commune,
    });

    console.log(`✅ Adresse supprimée: ${id} de ${departementId}`);
  } catch (error) {
    console.error("❌ Erreur suppression adresse:", error);
    throw error;
  }
}

/**
 * Activer une adresse (statut = true)
 * @param {string} id - ID de l'adresse
 * @returns {Promise<Object>} Adresse activée
 */
export async function activerAdresse(id) {
  try {
    return await updateAdresse(id, { statut: true });
  } catch (error) {
    console.error("❌ Erreur activation adresse:", error);
    throw error;
  }
}

/**
 * Désactiver une adresse (statut = false)
 * @param {string} id - ID de l'adresse
 * @returns {Promise<Object>} Adresse désactivée
 */
export async function desactiverAdresse(id) {
  try {
    return await updateAdresse(id, { statut: false });
  } catch (error) {
    console.error("❌ Erreur désactivation adresse:", error);
    throw error;
  }
}

/**
 * Basculer le statut d'une adresse (actif ↔ inactif)
 * @param {string} id - ID de l'adresse
 * @returns {Promise<Object>} Adresse avec statut basculé
 */
export async function toggleStatutAdresse(id) {
  try {
    const adresse = await getAdresse(id);
    if (!adresse) {
      throw new Error(`E_ADRESSE_NOT_FOUND: Adresse ${id} introuvable`);
    }
    const newStatut = !adresse.statut;
    return await updateAdresse(id, { statut: newStatut });
  } catch (error) {
    console.error("❌ Erreur basculement statut adresse:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses de tous les départements
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération globale
 */
export async function toggleStatutTousDepartements(statut) {
  try {
    const results = {
      total: 0,
      updated: 0,
      errors: 0,
      departements: {},
    };

    // Mapping des IDs vers les noms de départements
    const departementsNoms = {
      alibori: "Alibori",
      atacora: "Atacora",
      atlantique: "Atlantique",
      borgou: "Borgou",
      collines: "Collines",
      couffo: "Couffo",
      donga: "Donga",
      littoral: "Littoral",
      mono: "Mono",
      oueme: "Ouémé",
      plateau: "Plateau",
      zou: "Zou",
      inconnu: "Inconnu",
    };

    for (const departementId of DEPARTEMENTS_BENIN) {
      try {
        const departementNom = departementsNoms[departementId] || departementId;
        const result = await toggleStatutDepartement(departementNom, statut);

        results.total += result.total;
        results.updated += result.updated;
        results.errors += result.errors;
        results.departements[departementId] = result;
      } catch (error) {
        console.error(`Erreur pour département ${departementId}:`, error);
        results.errors++;
      }
    }

    console.log(
      `✅ Tous les départements: ${results.updated}/${results.total} adresses ${
        statut ? "activées" : "désactivées"
      }, ${results.errors} erreurs`
    );

    return results;
  } catch (error) {
    console.error("❌ Erreur basculement statut tous départements:", error);
    throw error;
  }
}

/**
 * Mettre à jour plusieurs adresses d'un département en une seule transaction
 * Cette fonction optimisée met à jour toutes les adresses en UNE SEULE transaction Firestore
 * pour limiter les lectures/écritures et garantir l'atomicité
 *
 * @param {string} departement - Nom du département
 * @param {Function} updateFn - Fonction qui reçoit une adresse et retourne les champs à mettre à jour (ou null pour ne pas modifier)
 * @returns {Promise<Object>} Résumé de l'opération { total, updated }
 *
 * @example
 * // Désactiver toutes les adresses d'un département
 * await updateAdressesBatch("atlantique", (adresse) => ({ statut: false }))
 *
 * @example
 * // Désactiver toutes les adresses d'une commune spécifique
 * await updateAdressesBatch("atlantique", (adresse) =>
 *   adresse.commune === "Cotonou" ? { statut: false } : null
 * )
 */
export async function updateAdressesBatch(departement, updateFn) {
  const normalizedDepartement = normalizeDepartement(departement);
  const docRef = doc(db, ADRESSES_COLLECTION, normalizedDepartement);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error(`E_DEPT_NOT_FOUND: Département ${departement} introuvable`);
      }

      const data = docSnap.data();
      const adresses = data.adresses || [];
      let updated = 0;

      // Parcourir et mettre à jour les adresses
      const updatedAdresses = adresses.map((adresse) => {
        const updates = updateFn(adresse);

        // Si updateFn retourne null, on ne modifie pas cette adresse
        if (updates === null || updates === undefined) {
          return adresse;
        }

        updated++;
        return {
          ...adresse,
          ...updates,
          updatedAt: Date.now(),
        };
      });

      // Mettre à jour le document en une seule fois
      transaction.update(docRef, {
        adresses: updatedAdresses,
        updatedAt: Date.now(),
        updatedBy: auth.currentUser?.email || "anonymous",
      });

      return { total: adresses.length, updated };
    });

    // Notifier via RTDB
    await notifyChange();

    console.log(
      `✅ updateAdressesBatch: ${result.updated}/${result.total} adresses mises à jour dans ${departement}`
    );

    return result;
  } catch (error) {
    console.error("❌ Erreur updateAdressesBatch:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses d'un département (VERSION OPTIMISÉE)
 * Utilise une seule transaction Firestore au lieu de multiples appels
 * @param {string} departement - Nom du département
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération
 */
export async function toggleStatutDepartement(departement, statut) {
  try {
    const result = await updateAdressesBatch(departement, () => ({
      statut,
    }));

    console.log(
      `✅ Département ${departement}: ${result.updated} adresses ${
        statut ? "activées" : "désactivées"
      }`
    );

    return result;
  } catch (error) {
    console.error("❌ Erreur basculement statut département:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses d'une commune (VERSION OPTIMISÉE)
 * Utilise une seule transaction Firestore
 * @param {string} departement - Nom du département
 * @param {string} commune - Nom de la commune
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération
 */
export async function toggleStatutCommune(departement, commune, statut) {
  try {
    const normalizedCommune = normalizeString(commune);

    const result = await updateAdressesBatch(departement, (adresse) => {
      if (normalizeString(adresse.commune) === normalizedCommune) {
        return { statut };
      }
      return null; // Ne pas modifier les autres adresses
    });

    console.log(
      `✅ Commune ${commune}: ${result.updated} adresses ${
        statut ? "activées" : "désactivées"
      }`
    );

    return result;
  } catch (error) {
    console.error("❌ Erreur basculement statut commune:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses d'un arrondissement (VERSION OPTIMISÉE)
 * Utilise une seule transaction Firestore
 * @param {string} departement - Nom du département
 * @param {string} commune - Nom de la commune
 * @param {string} arrondissement - Nom de l'arrondissement
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération
 */
export async function toggleStatutArrondissement(
  departement,
  commune,
  arrondissement,
  statut
) {
  try {
    const normalizedCommune = normalizeString(commune);
    const normalizedArrondissement = normalizeString(arrondissement);

    const result = await updateAdressesBatch(departement, (adresse) => {
      if (
        normalizeString(adresse.commune) === normalizedCommune &&
        normalizeString(adresse.arrondissement) === normalizedArrondissement
      ) {
        return { statut };
      }
      return null;
    });

    console.log(
      `✅ Arrondissement ${arrondissement}: ${result.updated} adresses ${
        statut ? "activées" : "désactivées"
      }`
    );

    return result;
  } catch (error) {
    console.error("❌ Erreur basculement statut arrondissement:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses d'un quartier (VERSION OPTIMISÉE)
 * Utilise une seule transaction Firestore
 * @param {string} departement - Nom du département
 * @param {string} commune - Nom de la commune
 * @param {string} arrondissement - Nom de l'arrondissement
 * @param {string} quartier - Nom du quartier
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération
 */
export async function toggleStatutQuartier(
  departement,
  commune,
  arrondissement,
  quartier,
  statut
) {
  try {
    const normalizedCommune = normalizeString(commune);
    const normalizedArrondissement = normalizeString(arrondissement);
    const normalizedQuartier = normalizeString(quartier);

    const result = await updateAdressesBatch(departement, (adresse) => {
      if (
        normalizeString(adresse.commune) === normalizedCommune &&
        normalizeString(adresse.arrondissement) === normalizedArrondissement &&
        normalizeString(adresse.quartier) === normalizedQuartier
      ) {
        return { statut };
      }
      return null;
    });

    console.log(
      `✅ Quartier ${quartier}: ${result.updated} adresses ${
        statut ? "activées" : "désactivées"
      }`
    );

    return result;
  } catch (error) {
    console.error("❌ Erreur basculement statut quartier:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses d'une commune (sans spécifier le département)
 * Cherche automatiquement dans tous les départements
 * @param {string} commune - Nom de la commune
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération
 */
export async function toggleStatutCommuneAuto(commune, statut = true) {
  try {
    const normalizedCommune = normalizeString(commune);
    let totalUpdated = 0;

    // Parcourir tous les départements
    for (const dept of DEPARTEMENTS_BENIN) {
      try {
        const result = await updateAdressesBatch(dept, (adresse) => {
          if (normalizeString(adresse.commune) === normalizedCommune) {
            return { statut };
          }
          return null;
        });
        totalUpdated += result.updated;
      } catch (error) {
        // Le département peut ne pas exister, on ignore l'erreur
        if (!error.message.includes("E_DEPT_NOT_FOUND")) {
          console.error(`Erreur département ${dept}:`, error);
        }
      }
    }

    console.log(`✅ Commune ${commune}: ${totalUpdated} adresses mises à jour`);
    return { updated: totalUpdated };
  } catch (error) {
    console.error("❌ Erreur toggleStatutCommuneAuto:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses d'un arrondissement (sans spécifier le département)
 * Cherche automatiquement dans tous les départements
 * @param {string} arrondissement - Nom de l'arrondissement
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération
 */
export async function toggleStatutArrondissementAuto(arrondissement, statut = true) {
  try {
    const normalizedArrondissement = normalizeString(arrondissement);
    let totalUpdated = 0;

    for (const dept of DEPARTEMENTS_BENIN) {
      try {
        const result = await updateAdressesBatch(dept, (adresse) => {
          if (normalizeString(adresse.arrondissement) === normalizedArrondissement) {
            return { statut };
          }
          return null;
        });
        totalUpdated += result.updated;
      } catch (error) {
        if (!error.message.includes("E_DEPT_NOT_FOUND")) {
          console.error(`Erreur département ${dept}:`, error);
        }
      }
    }

    console.log(
      `✅ Arrondissement ${arrondissement}: ${totalUpdated} adresses mises à jour`
    );
    return { updated: totalUpdated };
  } catch (error) {
    console.error("❌ Erreur toggleStatutArrondissementAuto:", error);
    throw error;
  }
}

/**
 * Activer/Désactiver toutes les adresses d'un quartier (sans spécifier le département)
 * Cherche automatiquement dans tous les départements
 * @param {string} quartier - Nom du quartier
 * @param {boolean} statut - true pour activer, false pour désactiver
 * @returns {Promise<Object>} Résumé de l'opération
 */
export async function toggleStatutQuartierAuto(quartier, statut = true) {
  try {
    const normalizedQuartier = normalizeString(quartier);
    let totalUpdated = 0;

    for (const dept of DEPARTEMENTS_BENIN) {
      try {
        const result = await updateAdressesBatch(dept, (adresse) => {
          if (normalizeString(adresse.quartier) === normalizedQuartier) {
            return { statut };
          }
          return null;
        });
        totalUpdated += result.updated;
      } catch (error) {
        if (!error.message.includes("E_DEPT_NOT_FOUND")) {
          console.error(`Erreur département ${dept}:`, error);
        }
      }
    }

    console.log(`✅ Quartier ${quartier}: ${totalUpdated} adresses mises à jour`);
    return { updated: totalUpdated };
  } catch (error) {
    console.error("❌ Erreur toggleStatutQuartierAuto:", error);
    throw error;
  }
}

/**
 * Récupérer une adresse par son ID
 * @param {string} id - ID de l'adresse
 * @returns {Promise<Object|null>} Adresse ou null
 */
export async function getAdresse(id) {
  try {
    const allAdresses = await getAllAdresses();
    return allAdresses.find((addr) => addr.id === id) || null;
  } catch (error) {
    console.error("❌ Erreur récupération adresse:", error);
    throw error;
  }
}

/**
 * Récupérer toutes les adresses de tous les départements
 * @returns {Promise<Array>} Liste de toutes les adresses
 */
export async function getAllAdresses() {
  try {
    const allAdresses = [];

    // Parcourir tous les départements
    for (const departementId of DEPARTEMENTS_BENIN) {
      const docRef = doc(db, ADRESSES_COLLECTION, departementId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const adresses = data.adresses || [];
        allAdresses.push(...adresses);
      }
    }

    return allAdresses;
  } catch (error) {
    console.error("❌ Erreur récupération adresses:", error);
    throw error;
  }
}

/**
 * Récupérer les adresses d'un département spécifique
 * @param {string} departement - Nom du département
 * @param {boolean} activeOnly - Si true, retourne uniquement les adresses actives
 * @returns {Promise<Array>} Liste des adresses du département
 */
export async function getAdressesByDepartement(departement, activeOnly = false) {
  try {
    const departementId = normalizeDepartement(departement);
    const docRef = doc(db, ADRESSES_COLLECTION, departementId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return [];
    }

    const data = docSnap.data();
    const adresses = data.adresses || [];

    // Filtrer par statut si nécessaire
    if (activeOnly) {
      return adresses.filter((addr) => addr.statut !== false);
    }

    return adresses;
  } catch (error) {
    console.error("❌ Erreur récupération adresses par département:", error);
    throw error;
  }
}

/**
 * Récupérer uniquement les adresses actives
 * @returns {Promise<Array>} Liste des adresses actives
 */
export async function getAdressesActives() {
  try {
    const allAdresses = await getAllAdresses();
    return allAdresses.filter((addr) => addr.statut !== false);
  } catch (error) {
    console.error("❌ Erreur récupération adresses actives:", error);
    throw error;
  }
}

/**
 * Récupérer uniquement les adresses désactivées
 * @returns {Promise<Array>} Liste des adresses désactivées
 */
export async function getAdressesDesactivees() {
  try {
    const allAdresses = await getAllAdresses();
    return allAdresses.filter((addr) => addr.statut === false);
  } catch (error) {
    console.error("❌ Erreur récupération adresses désactivées:", error);
    throw error;
  }
}

/**
 * Récupérer tous les départements uniques (avec adresses)
 * @returns {Promise<Array>} Liste des départements qui contiennent des adresses
 */
export async function getAllDepartements() {
  try {
    const departementsAvecAdresses = [];

    // Parcourir tous les départements et vérifier s'ils ont des adresses
    for (const departementId of DEPARTEMENTS_BENIN) {
      const docRef = doc(db, ADRESSES_COLLECTION, departementId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const adresses = data.adresses || [];

        if (adresses.length > 0) {
          // Récupérer les noms uniques des départements dans les adresses
          const deptNames = [...new Set(adresses.map((addr) => addr.departement))];
          departementsAvecAdresses.push(...deptNames);
        }
      }
    }

    // Retourner les départements uniques triés
    return [...new Set(departementsAvecAdresses)].sort();
  } catch (error) {
    console.error("❌ Erreur récupération départements:", error);
    throw error;
  }
}

/**
 * Obtenir la liste complète des départements du Bénin
 * @returns {Array} Liste des 12 départements + inconnu
 */
export function getDepartementsBeninList() {
  return [...DEPARTEMENTS_BENIN];
}

// ============================================================================
// SUGGESTIONS ET AUTOCOMPLÉTION
// ============================================================================

/**
 * Obtenir toutes les valeurs uniques pour un champ donné
 * @param {Array<Object>} adresses - Liste des adresses
 * @param {string} field - Nom du champ (departement, commune, arrondissement, quartier)
 * @returns {Array<string>} Valeurs uniques triées
 */
function getUniqueValues(adresses, field) {
  const values = new Set();
  adresses.forEach((addr) => {
    if (addr[field] && addr[field].trim()) {
      values.add(addr[field].trim());
    }
  });
  return Array.from(values).sort();
}

/**
 * Obtenir les suggestions de départements basées sur la saisie
 * @param {string} query - Texte saisi par l'utilisateur
 * @returns {Promise<Array<{value: string, label: string, count: number}>>} Suggestions
 */
export async function getSuggestionsDepartements(query = "") {
  try {
    const normalizedQuery = normalizeString(query);
    const allAdresses = await getAllAdresses();

    // Compter le nombre d'adresses par département
    const countByDept = {};
    allAdresses.forEach((addr) => {
      const dept = addr.departement || "inconnu";
      countByDept[dept] = (countByDept[dept] || 0) + 1;
    });

    // Filtrer et trier les départements
    const suggestions = DEPARTEMENTS_BENIN
      .filter((dept) => {
        if (dept === "inconnu") return false;
        if (!normalizedQuery) return true;
        return normalizeString(dept).includes(normalizedQuery);
      })
      .map((dept) => ({
        value: dept,
        label: dept.charAt(0).toUpperCase() + dept.slice(1),
        count: countByDept[dept] || 0,
      }))
      .sort((a, b) => b.count - a.count); // Trier par popularité

    return suggestions;
  } catch (error) {
    console.error("❌ Erreur getSuggestionsDepartements:", error);
    return [];
  }
}

/**
 * Obtenir les suggestions de communes basées sur la saisie et le département
 * @param {string} query - Texte saisi par l'utilisateur
 * @param {string} departement - Département sélectionné (optionnel)
 * @returns {Promise<Array<{value: string, label: string, departement: string, count: number}>>} Suggestions
 */
export async function getSuggestionsCommunes(query = "", departement = "") {
  try {
    const normalizedQuery = normalizeString(query);
    const allAdresses = await getAllAdresses();

    // Filtrer par département si spécifié
    const filteredAdresses = departement
      ? allAdresses.filter((addr) => addr.departement === departement)
      : allAdresses;

    // Obtenir les communes uniques avec leurs départements
    const communesMap = new Map();
    filteredAdresses.forEach((addr) => {
      if (addr.commune && addr.commune.trim()) {
        const key = `${addr.commune}|${addr.departement}`;
        if (!communesMap.has(key)) {
          communesMap.set(key, {
            value: addr.commune,
            label: addr.commune,
            departement: addr.departement,
            count: 0,
          });
        }
        communesMap.get(key).count++;
      }
    });

    // Filtrer par query
    const suggestions = Array.from(communesMap.values())
      .filter((commune) => {
        if (!normalizedQuery) return true;
        return normalizeString(commune.value).includes(normalizedQuery);
      })
      .sort((a, b) => b.count - a.count); // Trier par popularité

    return suggestions;
  } catch (error) {
    console.error("❌ Erreur getSuggestionsCommunes:", error);
    return [];
  }
}

/**
 * Obtenir les suggestions d'arrondissements
 * @param {string} query - Texte saisi
 * @param {string} departement - Département sélectionné (optionnel)
 * @param {string} commune - Commune sélectionnée (optionnel)
 * @returns {Promise<Array<{value: string, label: string, departement: string, commune: string, count: number}>>}
 */
export async function getSuggestionsArrondissements(query = "", departement = "", commune = "") {
  try {
    const normalizedQuery = normalizeString(query);
    const allAdresses = await getAllAdresses();

    // Filtrer par département et commune si spécifiés
    let filteredAdresses = allAdresses;
    if (departement) {
      filteredAdresses = filteredAdresses.filter((addr) => addr.departement === departement);
    }
    if (commune) {
      filteredAdresses = filteredAdresses.filter((addr) => addr.commune === commune);
    }

    // Obtenir les arrondissements uniques
    const arrondissementsMap = new Map();
    filteredAdresses.forEach((addr) => {
      if (addr.arrondissement && addr.arrondissement.trim()) {
        const key = `${addr.arrondissement}|${addr.commune}|${addr.departement}`;
        if (!arrondissementsMap.has(key)) {
          arrondissementsMap.set(key, {
            value: addr.arrondissement,
            label: addr.arrondissement,
            departement: addr.departement,
            commune: addr.commune,
            count: 0,
          });
        }
        arrondissementsMap.get(key).count++;
      }
    });

    // Filtrer par query
    const suggestions = Array.from(arrondissementsMap.values())
      .filter((arr) => {
        if (!normalizedQuery) return true;
        return normalizeString(arr.value).includes(normalizedQuery);
      })
      .sort((a, b) => b.count - a.count);

    return suggestions;
  } catch (error) {
    console.error("❌ Erreur getSuggestionsArrondissements:", error);
    return [];
  }
}

/**
 * Obtenir les suggestions de quartiers
 * @param {string} query - Texte saisi
 * @param {string} departement - Département sélectionné (optionnel)
 * @param {string} commune - Commune sélectionnée (optionnel)
 * @param {string} arrondissement - Arrondissement sélectionné (optionnel)
 * @returns {Promise<Array<{value: string, label: string, departement: string, commune: string, arrondissement: string, count: number}>>}
 */
export async function getSuggestionsQuartiers(query = "", departement = "", commune = "", arrondissement = "") {
  try {
    const normalizedQuery = normalizeString(query);
    const allAdresses = await getAllAdresses();

    // Filtrer
    let filteredAdresses = allAdresses;
    if (departement) {
      filteredAdresses = filteredAdresses.filter((addr) => addr.departement === departement);
    }
    if (commune) {
      filteredAdresses = filteredAdresses.filter((addr) => addr.commune === commune);
    }
    if (arrondissement) {
      filteredAdresses = filteredAdresses.filter((addr) => addr.arrondissement === arrondissement);
    }

    // Obtenir les quartiers uniques
    const quartiersMap = new Map();
    filteredAdresses.forEach((addr) => {
      if (addr.quartier && addr.quartier.trim()) {
        const key = `${addr.quartier}|${addr.arrondissement}|${addr.commune}|${addr.departement}`;
        if (!quartiersMap.has(key)) {
          quartiersMap.set(key, {
            value: addr.quartier,
            label: addr.quartier,
            departement: addr.departement,
            commune: addr.commune,
            arrondissement: addr.arrondissement,
            count: 0,
          });
        }
        quartiersMap.get(key).count++;
      }
    });

    // Filtrer par query
    const suggestions = Array.from(quartiersMap.values())
      .filter((quartier) => {
        if (!normalizedQuery) return true;
        return normalizeString(quartier.value).includes(normalizedQuery);
      })
      .sort((a, b) => b.count - a.count);

    return suggestions;
  } catch (error) {
    console.error("❌ Erreur getSuggestionsQuartiers:", error);
    return [];
  }
}

/**
 * Récupérer toutes les communes d'un département
 * @param {string} departement - Nom du département
 * @param {boolean} activeOnly - Si true, retourne uniquement les communes avec adresses actives
 * @returns {Promise<Array>} Liste des communes
 */
export async function getCommunesByDepartement(departement, activeOnly = false) {
  try {
    const adresses = await getAdressesByDepartement(departement, activeOnly);
    const communes = [...new Set(adresses.map((addr) => addr.commune))];
    return communes.sort();
  } catch (error) {
    console.error("❌ Erreur récupération communes:", error);
    throw error;
  }
}

/**
 * Obtenir les statistiques de statut pour un département
 * @param {string} departement - Nom du département
 * @returns {Promise<Object>} { total, actives, desactivees }
 */
export async function getStatutsStatsByDepartement(departement) {
  try {
    const adresses = await getAdressesByDepartement(departement);
    const actives = adresses.filter((addr) => addr.statut !== false).length;
    const desactivees = adresses.filter((addr) => addr.statut === false).length;

    return {
      total: adresses.length,
      actives,
      desactivees,
    };
  } catch (error) {
    console.error("❌ Erreur statistiques statuts département:", error);
    throw error;
  }
}

/**
 * Obtenir les statistiques de statut globales
 * @returns {Promise<Object>} { total, actives, desactivees }
 */
export async function getStatutsStatsGlobal() {
  try {
    const adresses = await getAllAdresses();
    const actives = adresses.filter((addr) => addr.statut !== false).length;
    const desactivees = adresses.filter((addr) => addr.statut === false).length;

    return {
      total: adresses.length,
      actives,
      desactivees,
    };
  } catch (error) {
    console.error("❌ Erreur statistiques statuts globales:", error);
    throw error;
  }
}

/**
 * Rechercher des adresses par nom
 * @param {string} searchTerm - Terme de recherche (insensible à la casse)
 * @returns {Promise<Array>} Liste des adresses correspondantes
 */
export async function searchAdressesByNom(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return [];
    }

    const allAdresses = await getAllAdresses();
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return allAdresses.filter((addr) =>
      addr.nom && addr.nom.toLowerCase().includes(normalizedSearch)
    );
  } catch (error) {
    console.error("❌ Erreur recherche adresses par nom:", error);
    throw error;
  }
}

/**
 * Vérifier si une adresse a des doublons potentiels
 * @param {Object} adresse - L'adresse à vérifier
 * @param {Object} options - Options de comparaison
 * @returns {Promise<Array>} Liste des doublons potentiels
 */
export async function checkForDuplicates(adresse, options = {}) {
  try {
    if (!adresse.departement) {
      throw new Error("E_INVALID_ADRESSE: Département requis pour vérifier les doublons");
    }

    const departementId = normalizeDepartement(adresse.departement);
    const existingAdresses = await getAdressesByDepartement(departementId);

    // Filtrer l'adresse elle-même si elle a un ID
    const otherAdresses = adresse.id
      ? existingAdresses.filter((addr) => addr.id !== adresse.id)
      : existingAdresses;

    return findDuplicates(adresse, otherAdresses, {
      checkNom: true,
      checkCommune: true,
      checkArrondissement: true,
      checkQuartier: true,
      checkLocalisation: false,
      ...options,
    });
  } catch (error) {
    console.error("❌ Erreur vérification doublons:", error);
    throw error;
  }
}

/**
 * Trouver tous les doublons dans tous les départements
 * @returns {Promise<Array>} Liste des groupes de doublons
 */
export async function findAllDuplicates() {
  try {
    const allAdresses = await getAllAdresses();
    const duplicateGroups = [];
    const processedIds = new Set();

    for (const adresse of allAdresses) {
      if (processedIds.has(adresse.id)) continue;

      const duplicates = findDuplicates(
        adresse,
        allAdresses.filter((a) => a.id !== adresse.id),
        {
          checkNom: true,
          checkCommune: true,
          checkArrondissement: true,
          checkQuartier: true,
          checkLocalisation: false,
        }
      );

      if (duplicates.length > 0) {
        const group = [adresse, ...duplicates];
        duplicateGroups.push(group);

        // Marquer tous les IDs du groupe comme traités
        group.forEach((addr) => processedIds.add(addr.id));
      }
    }

    return duplicateGroups;
  } catch (error) {
    console.error("❌ Erreur recherche de tous les doublons:", error);
    throw error;
  }
}

/**
 * Rechercher des adresses (nom, département, commune, quartier)
 * @param {string} searchTerm - Terme de recherche (insensible à la casse)
 * @returns {Promise<Array>} Liste des adresses correspondantes
 */
export async function searchAdresses(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return [];
    }

    const allAdresses = await getAllAdresses();
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return allAdresses.filter((addr) => {
      const nomMatch = addr.nom && addr.nom.toLowerCase().includes(normalizedSearch);
      const deptMatch = addr.departement.toLowerCase().includes(normalizedSearch);
      const communeMatch = addr.commune.toLowerCase().includes(normalizedSearch);
      const arrondMatch = addr.arrondissement.toLowerCase().includes(normalizedSearch);
      const quartierMatch = addr.quartier.toLowerCase().includes(normalizedSearch);

      return nomMatch || deptMatch || communeMatch || arrondMatch || quartierMatch;
    });
  } catch (error) {
    console.error("❌ Erreur recherche adresses:", error);
    throw error;
  }
}

// ============================================================================
// UTILITAIRES - INITIALISATION
// ============================================================================

/**
 * Initialiser tous les documents de départements dans Firestore
 * Crée un document vide pour chaque département du Bénin s'il n'existe pas déjà
 * @returns {Promise<Object>} Résumé de l'initialisation
 */
export async function initializeDepartements() {
  try {
    const results = {
      created: [],
      existing: [],
      errors: []
    };

    for (const departementId of DEPARTEMENTS_BENIN) {
      try {
        const docRef = doc(db, ADRESSES_COLLECTION, departementId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // Créer le document avec un array vide
          await runTx(departementId, (currDoc) => ({
            ...currDoc,
            adresses: currDoc.adresses || []
          }));
          results.created.push(departementId);
          console.log(`✅ Document créé pour ${departementId}`);
        } else {
          results.existing.push(departementId);
          console.log(`ℹ️  Document existant pour ${departementId}`);
        }
      } catch (error) {
        results.errors.push({ departementId, error: error.message });
        console.error(`❌ Erreur initialisation ${departementId}:`, error);
      }
    }

    console.log("📊 Initialisation terminée:", results);
    return results;
  } catch (error) {
    console.error("❌ Erreur initialisation départements:", error);
    throw error;
  }
}

// ============================================================================
// HOOKS - ADRESSES
// ============================================================================

/**
 * Hook pour récupérer toutes les adresses avec cache et sync temps réel
 * @returns {Object} { adresses, loading, error, sync }
 */
export function useAdresses() {
  const [adresses, setAdresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAdresses();
      setAdresses(data);
      saveToCache(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cached = getFromCache();
    if (cached && !isCacheStale(cached)) {
      setAdresses(cached.data);
      setLoading(false);
    } else {
      sync();
    }
  }, [sync]);

  // Écouter les notifications RTDB (paths legacy + nouveau)
  useEffect(() => {
    const unsubscribers = [];

    RTDB_SYNC_PATHS.forEach((path) => {
      const notifRef = ref(rtdb, path);

      const handler = (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        if (
          data.title === "adresse modifie" ||
          data.title === "Adresse modifiée" ||
          data.metadata?.toolkit === "adresse"
        ) {
          console.log("🔔 Notification RTDB adresses reçue, re-sync");
          sync();
        }
      };

      onValue(notifRef, handler);
      unsubscribers.push(() => off(notifRef, "value", handler));
    });

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sync]);

  return {
    adresses,
    loading,
    error,
    sync,
  };
}

/**
 * Hook pour récupérer une adresse spécifique
 * @param {string} id - ID de l'adresse
 * @returns {Object} { adresse, loading, error, sync }
 */
export function useAdresse(id) {
  const [adresse, setAdresse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sync = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getAdresse(id);
      setAdresse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    sync();
  }, [sync]);

  // Écouter les notifications RTDB (paths legacy + nouveau)
  useEffect(() => {
    const unsubscribers = [];

    RTDB_SYNC_PATHS.forEach((path) => {
      const notifRef = ref(rtdb, path);

      const handler = (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        if (
          (data.title === "adresse modifie" ||
            data.title === "Adresse modifiée" ||
            data.metadata?.toolkit === "adresse") &&
          (data.adresseId === id || data.metadata?.adresseId === id)
        ) {
          console.log(`🔔 Notification RTDB pour adresse ${id}, re-sync`);
          sync();
        }
      };

      onValue(notifRef, handler);
      unsubscribers.push(() => off(notifRef, "value", handler));
    });

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [id, sync]);

  return {
    adresse,
    loading,
    error,
    sync,
  };
}

/**
 * Hook pour récupérer les adresses par département
 * @param {string} departement - Nom du département
 * @returns {Object} { adresses, loading, error, sync }
 */
export function useAdressesByDepartement(departement) {
  const [adresses, setAdresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sync = useCallback(async () => {
    if (!departement) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getAdressesByDepartement(departement);
      setAdresses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [departement]);

  useEffect(() => {
    sync();
  }, [sync]);

  // Écouter les notifications RTDB (paths legacy + nouveau)
  useEffect(() => {
    const unsubscribers = [];

    RTDB_SYNC_PATHS.forEach((path) => {
      const notifRef = ref(rtdb, path);

      const handler = (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        if (
          data.title === "adresse modifie" ||
          data.title === "Adresse modifiée" ||
          data.metadata?.toolkit === "adresse"
        ) {
          console.log("🔔 Notification RTDB adresses reçue, re-sync département");
          sync();
        }
      };

      onValue(notifRef, handler);
      unsubscribers.push(() => off(notifRef, "value", handler));
    });

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sync]);

  return {
    adresses,
    loading,
    error,
    sync,
  };
}

/**
 * Hook pour récupérer tous les départements
 * @returns {Object} { departements, loading, error, sync }
 */
export function useDepartements() {
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDepartements();
      setDepartements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  return {
    departements,
    loading,
    error,
    sync,
  };
}

/**
 * Hook pour rechercher des adresses
 * @param {string} searchTerm - Terme de recherche
 * @param {boolean} autoSearch - Lance automatiquement la recherche lors du changement de searchTerm
 * @returns {Object} { results, loading, error, search }
 */
export function useSearchAdresses(searchTerm = "", autoSearch = false) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (term) => {
    try {
      setLoading(true);
      setError(null);
      const data = await searchAdresses(term || searchTerm);
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (autoSearch && searchTerm && searchTerm.trim() !== "") {
      search(searchTerm);
    } else if (!searchTerm || searchTerm.trim() === "") {
      setResults([]);
    }
  }, [searchTerm, autoSearch, search]);

  return {
    results,
    loading,
    error,
    search,
  };
}

/**
 * Hook pour vérifier les doublons d'une adresse en temps réel
 * @param {Object} adresse - L'adresse à vérifier
 * @param {Object} options - Options de vérification
 * @returns {Object} { duplicates, loading, error, check, hasDuplicates }
 */
export function useCheckDuplicates(adresse, options = {}) {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const check = useCallback(async () => {
    if (!adresse || !adresse.departement || !adresse.commune) {
      setDuplicates([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const dups = await checkForDuplicates(adresse, options);
      setDuplicates(dups);
    } catch (err) {
      setError(err.message);
      setDuplicates([]);
    } finally {
      setLoading(false);
    }
  }, [adresse, options]);

  useEffect(() => {
    // Debounce pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      check();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [check]);

  return {
    duplicates,
    hasDuplicates: duplicates.length > 0,
    loading,
    error,
    check,
  };
}
