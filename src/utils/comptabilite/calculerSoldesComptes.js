/**
 * calculerSoldesComptes.js
 * Calculs dynamiques des soldes pour les comptes comptables
 */

import {
  getOperationsToday,
  getOperationsByDay,
} from "@/toolkits/admin/comptabilite/operations";
import { formatDayKey } from "@/toolkits/admin/comptabilite/utils";

// ============================================================================
// CALCUL DES SOLDES
// ============================================================================

/**
 * Calcule le solde d'un compte comptable à partir des opérations
 * Pour un compte d'entrée : solde = somme des entrées
 * Pour un compte de sortie : solde = somme des sorties
 *
 * @param {string} compteId - ID du compte
 * @param {Array} operations - Liste des opérations
 * @returns {number} Solde du compte
 */
export function calculerSoldeCompte(compteId, operations) {
  const operationsCompte = operations.filter((op) => op.compte_id === compteId);

  const solde = operationsCompte.reduce((acc, operation) => {
    // On additionne le montant quelle que soit la nature de l'opération
    // Car pour un compte de charges, on veut savoir combien on a dépensé
    // Et pour un compte de produits, combien on a encaissé
    return acc + operation.montant;
  }, 0);

  return solde;
}

/**
 * Calcule les soldes de tous les comptes pour aujourd'hui
 * @param {Array} comptes - Liste des comptes comptables
 * @returns {Promise<Array>} Comptes avec leur solde calculé
 */
export async function calculerSoldesAujourdhui(comptes) {
  try {
    const { operations } = await getOperationsToday();

    const comptesAvecSoldes = comptes.map((compte) => {
      const solde = calculerSoldeCompte(compte.id, operations);
      return {
        ...compte,
        solde,
      };
    });

    return comptesAvecSoldes;
  } catch (error) {
    console.error("❌ Erreur calcul soldes aujourd'hui:", error);
    // Retourner les comptes avec solde à 0 en cas d'erreur
    return comptes.map((c) => ({ ...c, solde: 0 }));
  }
}

/**
 * Calcule les soldes des comptes pour un jour spécifique
 * @param {Array} comptes - Liste des comptes comptables
 * @param {string} dayKey - Clé du jour (format YYYY-MM-DD)
 * @returns {Promise<Array>} Comptes avec leur solde calculé
 */
export async function calculerSoldesParJour(comptes, dayKey) {
  try {
    const { operations } = await getOperationsByDay(dayKey);

    const comptesAvecSoldes = comptes.map((compte) => {
      const solde = calculerSoldeCompte(compte.id, operations);
      return {
        ...compte,
        solde,
      };
    });

    return comptesAvecSoldes;
  } catch (error) {
    console.error(`❌ Erreur calcul soldes pour ${dayKey}:`, error);
    return comptes.map((c) => ({ ...c, solde: 0 }));
  }
}

/**
 * Calcule le total d'une liste de comptes
 * @param {Array} comptes - Comptes avec soldes
 * @returns {number} Total des soldes
 */
export function calculerSoldeTotal(comptes) {
  return comptes.reduce((total, compte) => total + (compte.solde || 0), 0);
}

/**
 * Calcule la variation entre aujourd'hui et hier
 * @param {Array} comptes - Liste des comptes
 * @returns {Promise<number>} Variation en pourcentage
 */
export async function calculerVariationComptes(comptes) {
  try {
    // Soldes aujourd'hui
    const comptesAujourdhui = await calculerSoldesAujourdhui(comptes);
    const soldeAujourdhui = calculerSoldeTotal(comptesAujourdhui);

    // Soldes hier
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const dayKeyHier = formatDayKey(hier);

    const comptesHier = await calculerSoldesParJour(comptes, dayKeyHier);
    const soldeHier = calculerSoldeTotal(comptesHier);

    // Calculer la variation
    if (soldeHier === 0) {
      return soldeAujourdhui > 0 ? 100 : 0;
    }

    const variation = ((soldeAujourdhui - soldeHier) / soldeHier) * 100;
    return variation;
  } catch (error) {
    console.error("❌ Erreur calcul variation:", error);
    return 0;
  }
}

/**
 * Calcule la variation pour un compte spécifique
 * @param {string} compteId - ID du compte
 * @param {Array} comptes - Liste des comptes
 * @returns {Promise<number>} Variation en pourcentage
 */
export async function calculerVariationCompte(compteId, comptes) {
  try {
    // Opérations aujourd'hui
    const { operations: opsToday } = await getOperationsToday();
    const soldeToday = calculerSoldeCompte(compteId, opsToday);

    // Opérations hier
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const dayKeyHier = formatDayKey(hier);

    const { operations: opsHier } = await getOperationsByDay(dayKeyHier);
    const soldeHier = calculerSoldeCompte(compteId, opsHier);

    // Calculer la variation
    if (soldeHier === 0) {
      return soldeToday > 0 ? 100 : 0;
    }

    const variation = ((soldeToday - soldeHier) / soldeHier) * 100;
    return variation;
  } catch (error) {
    console.error("❌ Erreur calcul variation compte:", error);
    return 0;
  }
}

// ============================================================================
// FILTRAGE DES OPÉRATIONS
// ============================================================================

/**
 * Filtre les opérations par plage de dates
 * @param {Array} operations - Liste des opérations
 * @param {Date} dateDebut - Date de début
 * @param {Date} dateFin - Date de fin
 * @returns {Array} Opérations filtrées
 */
export function filtrerOperationsParDate(operations, dateDebut, dateFin) {
  const timestampDebut = dateDebut.getTime();
  const timestampFin = dateFin.getTime();

  return operations.filter((op) => {
    const opDate = op.date;
    return opDate >= timestampDebut && opDate <= timestampFin;
  });
}

/**
 * Filtre les opérations par type
 * @param {Array} operations - Liste des opérations
 * @param {string} typeOperation - "entree" ou "sortie"
 * @returns {Array} Opérations filtrées
 */
export function filtrerOperationsParType(operations, typeOperation) {
  if (!typeOperation) return operations;
  return operations.filter((op) => op.type_operation === typeOperation);
}

/**
 * Filtre les opérations par compte
 * @param {Array} operations - Liste des opérations
 * @param {string} compteId - ID du compte
 * @returns {Array} Opérations filtrées
 */
export function filtrerOperationsParCompte(operations, compteId) {
  if (!compteId) return operations;
  return operations.filter((op) => op.compte_id === compteId);
}

/**
 * Récupère les opérations pour un compte spécifique (aujourd'hui)
 * @param {string} compteId - ID du compte
 * @returns {Promise<Array>} Opérations du compte
 */
export async function getOperationsCompteToday(compteId) {
  try {
    const { operations } = await getOperationsToday();
    return filtrerOperationsParCompte(operations, compteId);
  } catch (error) {
    console.error("❌ Erreur récupération opérations compte:", error);
    return [];
  }
}

/**
 * Récupère les opérations pour un compte spécifique sur une période
 * @param {string} compteId - ID du compte
 * @param {Date} dateDebut - Date de début
 * @param {Date} dateFin - Date de fin
 * @returns {Promise<Array>} Opérations du compte
 */
export async function getOperationsComptePeriode(compteId, dateDebut, dateFin) {
  try {
    // Pour simplifier, on ne récupère que les opérations d'aujourd'hui
    // Dans une version complète, on devrait itérer sur chaque jour de la période
    const { operations } = await getOperationsToday();
    const operationsCompte = filtrerOperationsParCompte(operations, compteId);
    return filtrerOperationsParDate(operationsCompte, dateDebut, dateFin);
  } catch (error) {
    console.error("❌ Erreur récupération opérations période:", error);
    return [];
  }
}

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Calcule les statistiques pour un compte
 * @param {string} compteId - ID du compte
 * @param {Array} operations - Liste des opérations
 * @returns {Object} Statistiques (total, nombre, moyenne)
 */
export function calculerStatistiquesCompte(compteId, operations) {
  const operationsCompte = filtrerOperationsParCompte(operations, compteId);

  const total = operationsCompte.reduce((sum, op) => sum + op.montant, 0);
  const nombre = operationsCompte.length;
  const moyenne = nombre > 0 ? total / nombre : 0;

  return {
    total,
    nombre,
    moyenne,
  };
}

/**
 * Calcule la répartition des opérations par type pour un compte
 * @param {string} compteId - ID du compte
 * @param {Array} operations - Liste des opérations
 * @returns {Object} Répartition {entrees: number, sorties: number}
 */
export function calculerRepartitionOperations(compteId, operations) {
  const operationsCompte = filtrerOperationsParCompte(operations, compteId);

  const entrees = operationsCompte
    .filter((op) => op.type_operation === "entree")
    .reduce((sum, op) => sum + op.montant, 0);

  const sorties = operationsCompte
    .filter((op) => op.type_operation === "sortie")
    .reduce((sum, op) => sum + op.montant, 0);

  return { entrees, sorties };
}
