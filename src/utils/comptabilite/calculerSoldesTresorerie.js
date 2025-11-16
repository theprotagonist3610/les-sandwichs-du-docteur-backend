/**
 * calculerSoldesTresorerie.js
 * Fonctions pour calculer dynamiquement les soldes des comptes de trésorerie
 * à partir des opérations comptables
 */

import { getOperationsToday, getOperationsByDay } from "@/toolkits/admin/comptabilite/operations";

/**
 * Calcule le solde d'un compte de trésorerie basé sur ses opérations
 * @param {string} compteTresorerieId - ID du compte de trésorerie
 * @param {Array} operations - Liste des opérations
 * @returns {number} Solde calculé
 */
export const calculerSoldeCompte = (compteTresorerieId, operations) => {
  if (!operations || operations.length === 0) {
    return 0;
  }

  // Filtrer les opérations concernant ce compte de trésorerie
  const operationsCompte = operations.filter(
    (op) => op.compte_id === compteTresorerieId
  );

  // Calculer le solde
  const solde = operationsCompte.reduce((acc, operation) => {
    if (operation.type_operation === "entree") {
      return acc + operation.montant;
    } else if (operation.type_operation === "sortie") {
      return acc - operation.montant;
    }
    return acc;
  }, 0);

  return solde;
};

/**
 * Calcule les soldes de tous les comptes de trésorerie pour un jour donné
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @param {Array} operations - Liste des opérations du jour
 * @returns {Array} Comptes avec leurs soldes calculés
 */
export const calculerSoldesComptes = (comptesTresorerie, operations) => {
  if (!comptesTresorerie || comptesTresorerie.length === 0) {
    return [];
  }

  return comptesTresorerie.map((compte) => ({
    ...compte,
    solde: calculerSoldeCompte(compte.id, operations),
  }));
};

/**
 * Récupère les opérations d'aujourd'hui et calcule les soldes
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @returns {Promise<Array>} Comptes avec leurs soldes calculés
 */
export const calculerSoldesAujourdhui = async (comptesTresorerie) => {
  try {
    const { operations } = await getOperationsToday();
    return calculerSoldesComptes(comptesTresorerie, operations);
  } catch (error) {
    console.error("❌ Erreur calcul soldes aujourd'hui:", error);
    // En cas d'erreur, retourner les comptes avec solde 0
    return comptesTresorerie.map((compte) => ({
      ...compte,
      solde: 0,
    }));
  }
};

/**
 * Calcule le solde total de la trésorerie (somme de tous les comptes)
 * @param {Array} comptesAvecSoldes - Comptes de trésorerie avec leurs soldes
 * @returns {number} Solde total
 */
export const calculerSoldeTotal = (comptesAvecSoldes) => {
  if (!comptesAvecSoldes || comptesAvecSoldes.length === 0) {
    return 0;
  }

  return comptesAvecSoldes.reduce(
    (acc, compte) => acc + (compte.solde || 0),
    0
  );
};

/**
 * Récupère les opérations d'un jour spécifique et calcule les soldes
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @param {string} dayKey - Clé du jour au format DDMMYYYY
 * @returns {Promise<Array>} Comptes avec leurs soldes calculés
 */
export const calculerSoldesParJour = async (comptesTresorerie, dayKey) => {
  try {
    const { operations } = await getOperationsByDay(dayKey);
    return calculerSoldesComptes(comptesTresorerie, operations);
  } catch (error) {
    console.error(`❌ Erreur calcul soldes pour ${dayKey}:`, error);
    return comptesTresorerie.map((compte) => ({
      ...compte,
      solde: 0,
    }));
  }
};

/**
 * Calcule la variation de trésorerie entre aujourd'hui et hier
 * @param {Array} comptesTresorerie - Liste des comptes de trésorerie
 * @returns {Promise<number>} Variation en pourcentage
 */
export const calculerVariationTresorerie = async (comptesTresorerie) => {
  try {
    // Calculer le solde d'aujourd'hui
    const comptesAujourdhui = await calculerSoldesAujourdhui(comptesTresorerie);
    const soldeAujourdhui = calculerSoldeTotal(comptesAujourdhui);

    // Calculer la clé pour hier
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const dayKeyHier = formatDayKey(hier);

    // Calculer le solde d'hier
    const comptesHier = await calculerSoldesParJour(comptesTresorerie, dayKeyHier);
    const soldeHier = calculerSoldeTotal(comptesHier);

    // Si le solde d'hier est 0, on ne peut pas calculer de variation
    if (soldeHier === 0) {
      // Si aujourd'hui il y a un solde, c'est une croissance infinie
      // On retourne 100% pour indiquer une forte croissance
      return soldeAujourdhui > 0 ? 100 : 0;
    }

    // Calculer la variation en pourcentage
    const variation = ((soldeAujourdhui - soldeHier) / soldeHier) * 100;

    return variation;
  } catch (error) {
    console.error("❌ Erreur calcul variation trésorerie:", error);
    return 0;
  }
};

/**
 * Formate une date en clé de jour DDMMYYYY
 * @param {Date} date - Date à formater
 * @returns {string} Clé formatée
 */
const formatDayKey = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}${month}${year}`;
};

/**
 * Récupère les opérations filtrées par date
 * @param {Array} operations - Liste des opérations
 * @param {Date} dateDebut - Date de début (optionnelle)
 * @param {Date} dateFin - Date de fin (optionnelle)
 * @returns {Array} Opérations filtrées
 */
export const filtrerOperationsParDate = (operations, dateDebut, dateFin) => {
  if (!operations || operations.length === 0) {
    return [];
  }

  let operationsFiltrees = [...operations];

  if (dateDebut) {
    const timestampDebut = dateDebut.getTime();
    operationsFiltrees = operationsFiltrees.filter(
      (op) => op.date >= timestampDebut
    );
  }

  if (dateFin) {
    const timestampFin = dateFin.getTime();
    operationsFiltrees = operationsFiltrees.filter(
      (op) => op.date <= timestampFin
    );
  }

  return operationsFiltrees;
};

/**
 * Récupère les opérations filtrées par type
 * @param {Array} operations - Liste des opérations
 * @param {string} typeOperation - "entree" ou "sortie"
 * @returns {Array} Opérations filtrées
 */
export const filtrerOperationsParType = (operations, typeOperation) => {
  if (!operations || operations.length === 0) {
    return [];
  }

  return operations.filter((op) => op.type_operation === typeOperation);
};

/**
 * Récupère les opérations filtrées par compte
 * @param {Array} operations - Liste des opérations
 * @param {string} compteId - ID du compte
 * @returns {Array} Opérations filtrées
 */
export const filtrerOperationsParCompte = (operations, compteId) => {
  if (!operations || operations.length === 0) {
    return [];
  }

  return operations.filter((op) => op.compte_id === compteId);
};
