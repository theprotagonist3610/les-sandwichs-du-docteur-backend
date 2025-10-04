// toolkits/comptabiliteToolkit.jsx - Version restructurée OHADA
import { z } from "zod";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { useState, useEffect, useCallback, useMemo } from "react";
import comptes from "./liste";

// ===========================================
// CONSTANTES
// ===========================================
const COMPTA_KEY_PREFIX = "lsd_compta_";
const COLLECTION = "compta";
const TRANSACTION_LIMIT = 500; // Limite transactions par document
const FIRESTORE_SIZE_LIMIT = 950000; // 950KB sur 1MB
const CLOTURE_DELAY_DAYS = 30; // Clôture automatique après 30 jours
const MAX_HISTORY_YEARS = 2; // Limiter l'historique à 2 ans
const WEEK_BATCH_SIZE = 4; // Chargement par paquets de 4 semaines

// ===========================================
// SCHEMAS ZOD
// ===========================================

// Schema pour la trésorerie
const tresorerieSchema = z.object({
  caisse: z.number().default(0),
  mobile_money: z.number().default(0),
  banque: z.number().default(0),
  total: z.number().default(0),
});

// Schema pour la répartition des paiements
const repartitionPaiementsSchema = z.object({
  especes_pct: z.number().default(0),
  mobile_money_pct: z.number().default(0),
  banque_pct: z.number().default(0),
});

// Schema pour une transaction comptable
const transactionComptableSchema = z.object({
  id: z.string(),
  date: z.string(), // Format ISO YYYY-MM-DD
  type: z.enum(["entree", "sortie"]),
  compte_lsd: z.string(),
  compte_denomination: z.string(),
  compte_type: z.string(),
  compte_ohada: z.string(),
  montant: z.number().positive(),
  mode_paiement: z.enum(["caisse", "mobile_money", "banque"]),
  description: z.string().optional(),
  reference: z.string().optional(),
  created_at: z.string(),
  created_by: z.string().optional(),
});

// Schema pour le résumé hebdomadaire (OHADA Caisse)
const resumeHebdomadaireSchema = z.object({
  // Trésorerie
  tresorerie_debut: tresorerieSchema,
  tresorerie_fin: tresorerieSchema,

  // Mouvements
  total_encaissements: tresorerieSchema,
  total_decaissements: tresorerieSchema,

  // Décomposition OHADA
  chiffre_affaires: z.number().default(0),
  produits_par_compte: z.record(z.number()).default({}),
  charges_par_compte: z.record(z.number()).default({}),
  charges_fixes: z.number().default(0),
  charges_variables: z.number().default(0),

  // Indicateurs
  balance_nette: z.number().default(0),
  excedent_insuffisance: z.number().default(0),
  capacite_autofinancement: z.number().default(0),

  // Répartition paiements
  repartition_paiements: repartitionPaiementsSchema,

  // Autres
  nombre_transactions: z.number().default(0),
  tresorerie_moyenne_journaliere: z.number().default(0),
  delai_moyen_caisse: z.number().default(0),
});

// Schema pour résumé mensuel (calculé dynamiquement)
const resumeMensuelSchema = z.object({
  mois: z.number().min(1).max(12),
  annee: z.number(),
  nom_mois: z.string(),
  resume: resumeHebdomadaireSchema,
});

// Schema pour le résumé annuel
const resumeAnnuelSchema = z.object({
  tresorerie_debut: tresorerieSchema,
  tresorerie_fin: tresorerieSchema,
  total_encaissements: tresorerieSchema,
  total_decaissements: tresorerieSchema,
  chiffre_affaires: z.number().default(0),
  produits_par_compte: z.record(z.number()).default({}),
  charges_par_compte: z.record(z.number()).default({}),
  charges_fixes: z.number().default(0),
  charges_variables: z.number().default(0),
  balance_nette: z.number().default(0),
  excedent_insuffisance: z.number().default(0),
  capacite_autofinancement: z.number().default(0),
  repartition_paiements: repartitionPaiementsSchema,
  nombre_transactions_total: z.number().default(0),
  tresorerie_moyenne_journaliere: z.number().default(0),
  tresorerie_mensuelle: z.record(resumeMensuelSchema).default({}),
});

// Schema pour une semaine
const semaineSchema = z.object({
  weekId: z.string(),
  label: z.string(),
  dateDebut: z.string(),
  dateFin: z.string(),
  annee: z.number(),
  numeroSemaine: z.number(),
  nombreJours: z.number(),
  transactions: z.array(transactionComptableSchema),
  resume: resumeHebdomadaireSchema,
  cloture: z.boolean().default(false),
  hasAnnexe: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

// Schema pour document annexe
const annexeSchema = z.object({
  parentWeekId: z.string(),
  transactions: z.array(transactionComptableSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

// Schema pour le document annuel
const documentAnnuelSchema = z.object({
  year: z.number(),
  resume: resumeAnnuelSchema,
  cloture: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

// ===========================================
// UTILITAIRES DE BASE
// ===========================================

/**
 * Obtient la date du jour au format YYYY-MM-DD
 */
const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

/**
 * Obtient l'année courante
 */
const getCurrentYear = () => {
  return new Date().getFullYear();
};

/**
 * Génère un ID unique pour une transaction
 */
const generateTransactionId = () => {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Trouve un compte par son code LSD
 */
const findCompteByCode = (code_lsd) => {
  for (const groupe of comptes) {
    const compte = groupe.liste.find((c) => c.code_lsd === code_lsd);
    if (compte) {
      return { ...compte, groupe: groupe.groupe };
    }
  }
  return null;
};

/**
 * Formate une date pour l'affichage DD/MM/YYYY
 */
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formate une date en ISO YYYY-MM-DD
 */
const formatISO = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

/**
 * Vérifie si une date est future
 */
const isFutureDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d > now;
};

/**
 * Calcule la taille estimée d'un document Firestore
 */
const calculateDocSize = (doc) => {
  const jsonStr = JSON.stringify(doc);
  return new Blob([jsonStr]).size;
};

/**
 * Détermine si un compte est une charge fixe ou variable
 */
const isChargeFixe = (compte) => {
  const chargesFixesCodes = ["TIE002", "TIE003", "TIE004"]; // Internet, Eau, Électricité
  return chargesFixesCodes.includes(compte.code_lsd);
};

// ===========================================
// GÉNÉRATION DES SEMAINES
// ===========================================

/**
 * Génère toutes les semaines d'une année
 * Les semaines commencent le lundi
 */
const genererSemainesAnnee = (annee) => {
  const semaines = [];
  let currentDate = new Date(annee, 0, 1); // 1er janvier

  // Si le 1er janvier n'est pas un lundi, avancer jusqu'au premier lundi
  const premierJour = currentDate.getDay();
  if (premierJour !== 1) {
    // Si c'est dimanche (0), avancer de 1 jour, sinon avancer jusqu'au lundi
    const joursAAvancer = premierJour === 0 ? 1 : 8 - premierJour;
    currentDate.setDate(currentDate.getDate() + joursAAvancer);
  }

  let weekNumber = 1;

  // Si le premier lundi n'est pas le 1er janvier, créer une semaine partielle
  if (currentDate.getDate() > 1) {
    const dateDebut = new Date(annee, 0, 1);
    const dateFin = new Date(currentDate);
    dateFin.setDate(dateFin.getDate() - 1);

    const nombreJours =
      Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24)) + 1;

    semaines.push({
      weekId: `S${weekNumber.toString().padStart(2, "0")}`,
      label: `S${weekNumber} [${formatDate(dateDebut)} - ${formatDate(
        dateFin
      )}]`,
      dateDebut: formatISO(dateDebut),
      dateFin: formatISO(dateFin),
      annee,
      numeroSemaine: weekNumber,
      nombreJours,
    });

    weekNumber++;
  }

  // Générer les semaines complètes
  while (currentDate.getFullYear() === annee) {
    const dateDebut = new Date(currentDate);
    const dateFin = new Date(currentDate);
    dateFin.setDate(dateFin.getDate() + 6);

    // Si dateFin dépasse l'année, ajuster au 31 décembre
    if (dateFin.getFullYear() > annee) {
      dateFin.setFullYear(annee, 11, 31);
    }

    const nombreJours =
      Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24)) + 1;

    semaines.push({
      weekId: `S${weekNumber.toString().padStart(2, "0")}`,
      label: `S${weekNumber} [${formatDate(dateDebut)} - ${formatDate(
        dateFin
      )}]`,
      dateDebut: formatISO(dateDebut),
      dateFin: formatISO(dateFin),
      annee,
      numeroSemaine: weekNumber,
      nombreJours,
    });

    currentDate.setDate(currentDate.getDate() + 7);
    weekNumber++;

    // Sécurité : ne pas dépasser l'année
    if (currentDate.getFullYear() > annee) break;
  }

  return semaines;
};

/**
 * Trouve la semaine correspondant à une date
 */
const getWeekFromDate = (date, annee) => {
  const semaines = genererSemainesAnnee(annee);
  const targetDate = new Date(date);

  return semaines.find((semaine) => {
    const debut = new Date(semaine.dateDebut);
    const fin = new Date(semaine.dateFin);
    return targetDate >= debut && targetDate <= fin;
  });
};

/**
 * Obtient les semaines d'un mois
 */
const getWeeksInMonth = (annee, mois) => {
  const semaines = genererSemainesAnnee(annee);
  return semaines.filter((semaine) => {
    const debut = new Date(semaine.dateDebut);
    const fin = new Date(semaine.dateFin);
    return debut.getMonth() + 1 === mois || fin.getMonth() + 1 === mois;
  });
};

// ===========================================
// CALCULS DE RÉSUMÉS
// ===========================================

/**
 * Initialise un résumé vide
 */
const initResumeVide = () => ({
  tresorerie_debut: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
  tresorerie_fin: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
  total_encaissements: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
  total_decaissements: { caisse: 0, mobile_money: 0, banque: 0, total: 0 },
  chiffre_affaires: 0,
  produits_par_compte: {},
  charges_par_compte: {},
  charges_fixes: 0,
  charges_variables: 0,
  balance_nette: 0,
  excedent_insuffisance: 0,
  capacite_autofinancement: 0,
  repartition_paiements: { especes_pct: 0, mobile_money_pct: 0, banque_pct: 0 },
  nombre_transactions: 0,
  tresorerie_moyenne_journaliere: 0,
  delai_moyen_caisse: 0,
});

/**
 * Calcule le résumé hebdomadaire à partir des transactions
 */
const calculerResumeHebdomadaire = (
  transactions,
  tresorerieDebut,
  nombreJours
) => {
  const resume = initResumeVide();
  resume.tresorerie_debut = { ...tresorerieDebut };
  resume.tresorerie_fin = { ...tresorerieDebut };
  resume.nombre_transactions = transactions.length;

  let totalEncaissements = 0;
  let totalDecaissements = 0;

  transactions.forEach((transaction) => {
    const compte = findCompteByCode(transaction.compte_lsd);
    if (!compte) return;

    const montant = transaction.montant;
    const modePaiement = transaction.mode_paiement;

    if (transaction.type === "entree") {
      // Encaissements
      resume.total_encaissements[modePaiement] += montant;
      resume.total_encaissements.total += montant;
      resume.tresorerie_fin[modePaiement] += montant;
      totalEncaissements += montant;

      // Si c'est un produit
      if (compte.type === "produit") {
        resume.chiffre_affaires += montant;
        resume.produits_par_compte[transaction.compte_lsd] =
          (resume.produits_par_compte[transaction.compte_lsd] || 0) + montant;
      }
    } else if (transaction.type === "sortie") {
      // Décaissements
      resume.total_decaissements[modePaiement] += montant;
      resume.total_decaissements.total += montant;
      resume.tresorerie_fin[modePaiement] -= montant;
      totalDecaissements += montant;

      // Si c'est une charge
      if (compte.type === "charge" || compte.code_ohada.startsWith("6")) {
        resume.charges_par_compte[transaction.compte_lsd] =
          (resume.charges_par_compte[transaction.compte_lsd] || 0) + montant;

        // Distinguer charges fixes et variables
        if (isChargeFixe(compte)) {
          resume.charges_fixes += montant;
        } else {
          resume.charges_variables += montant;
        }
      }
    }
  });

  // Calcul trésorerie finale totale
  resume.tresorerie_fin.total =
    resume.tresorerie_fin.caisse +
    resume.tresorerie_fin.mobile_money +
    resume.tresorerie_fin.banque;

  // Indicateurs
  resume.balance_nette = totalEncaissements - totalDecaissements;
  resume.excedent_insuffisance =
    resume.tresorerie_fin.total - resume.tresorerie_debut.total;

  const totalCharges = resume.charges_fixes + resume.charges_variables;
  resume.capacite_autofinancement = resume.chiffre_affaires - totalCharges;

  // Répartition paiements (en %)
  if (totalEncaissements > 0) {
    resume.repartition_paiements.especes_pct =
      (resume.total_encaissements.caisse / totalEncaissements) * 100;
    resume.repartition_paiements.mobile_money_pct =
      (resume.total_encaissements.mobile_money / totalEncaissements) * 100;
    resume.repartition_paiements.banque_pct =
      (resume.total_encaissements.banque / totalEncaissements) * 100;
  }

  // Trésorerie moyenne journalière
  resume.tresorerie_moyenne_journaliere =
    nombreJours > 0
      ? (resume.tresorerie_debut.total + resume.tresorerie_fin.total) /
        (2 * nombreJours)
      : 0;

  // Délai moyen de caisse (en jours)
  const decaissementsParJour =
    nombreJours > 0 ? totalDecaissements / nombreJours : 0;
  resume.delai_moyen_caisse =
    decaissementsParJour > 0
      ? resume.tresorerie_moyenne_journaliere / decaissementsParJour
      : 0;

  return resume;
};

/**
 * Calcule le résumé annuel à partir des semaines
 */
const calculerResumeAnnuel = (semaines) => {
  const resume = initResumeVide();

  if (semaines.length === 0) return resume;

  // Trésorerie début = trésorerie début de la première semaine
  resume.tresorerie_debut = { ...semaines[0].resume.tresorerie_debut };

  // Trésorerie fin = trésorerie fin de la dernière semaine
  const derniereSemaine = semaines[semaines.length - 1];
  resume.tresorerie_fin = { ...derniereSemaine.resume.tresorerie_fin };

  // Agrégation des semaines
  semaines.forEach((semaine) => {
    const r = semaine.resume;

    // Encaissements et décaissements
    resume.total_encaissements.caisse += r.total_encaissements.caisse;
    resume.total_encaissements.mobile_money +=
      r.total_encaissements.mobile_money;
    resume.total_encaissements.banque += r.total_encaissements.banque;
    resume.total_encaissements.total += r.total_encaissements.total;

    resume.total_decaissements.caisse += r.total_decaissements.caisse;
    resume.total_decaissements.mobile_money +=
      r.total_decaissements.mobile_money;
    resume.total_decaissements.banque += r.total_decaissements.banque;
    resume.total_decaissements.total += r.total_decaissements.total;

    // Chiffre d'affaires et charges
    resume.chiffre_affaires += r.chiffre_affaires;
    resume.charges_fixes += r.charges_fixes;
    resume.charges_variables += r.charges_variables;

    // Produits et charges par compte
    Object.entries(r.produits_par_compte).forEach(([compte, montant]) => {
      resume.produits_par_compte[compte] =
        (resume.produits_par_compte[compte] || 0) + montant;
    });

    Object.entries(r.charges_par_compte).forEach(([compte, montant]) => {
      resume.charges_par_compte[compte] =
        (resume.charges_par_compte[compte] || 0) + montant;
    });

    resume.nombre_transactions_total += r.nombre_transactions;
  });

  // Indicateurs annuels
  resume.balance_nette =
    resume.total_encaissements.total - resume.total_decaissements.total;
  resume.excedent_insuffisance =
    resume.tresorerie_fin.total - resume.tresorerie_debut.total;

  const totalCharges = resume.charges_fixes + resume.charges_variables;
  resume.capacite_autofinancement = resume.chiffre_affaires - totalCharges;

  // Répartition paiements
  if (resume.total_encaissements.total > 0) {
    resume.repartition_paiements.especes_pct =
      (resume.total_encaissements.caisse / resume.total_encaissements.total) *
      100;
    resume.repartition_paiements.mobile_money_pct =
      (resume.total_encaissements.mobile_money /
        resume.total_encaissements.total) *
      100;
    resume.repartition_paiements.banque_pct =
      (resume.total_encaissements.banque / resume.total_encaissements.total) *
      100;
  }

  // Trésorerie moyenne (moyenne de toutes les semaines)
  const sommeTreeMoyennes = semaines.reduce(
    (sum, s) => sum + s.resume.tresorerie_moyenne_journaliere,
    0
  );
  resume.tresorerie_moyenne_journaliere =
    semaines.length > 0 ? sommeTreeMoyennes / semaines.length : 0;

  return resume;
};

/**
 * Calcule le résumé mensuel à partir des semaines du mois
 */
const calculerResumeMensuel = (semaines, annee, mois) => {
  const nomsMois = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const resumeAgrege = calculerResumeAnnuel(semaines);

  return {
    mois,
    annee,
    nom_mois: nomsMois[mois - 1],
    resume: resumeAgrege,
  };
};

// ===========================================
// GESTION LOCALSTORAGE
// ===========================================

/**
 * Clé localStorage pour une année
 */
const getLocalStorageKey = (year) => `${COMPTA_KEY_PREFIX}${year}`;

/**
 * Sauvegarde les données d'une année en localStorage
 */
const saveYearToLocalStorage = (yearData) => {
  try {
    const key = getLocalStorageKey(yearData.year);
    localStorage.setItem(key, JSON.stringify(yearData));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde en localStorage:", error);
  }
};

/**
 * Récupère les données d'une année du localStorage
 */
const getYearFromLocalStorage = (year) => {
  try {
    const key = getLocalStorageKey(year);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erreur lors de la lecture du localStorage:", error);
    return null;
  }
};

/**
 * Supprime les données d'une année du localStorage
 */
const clearYearFromLocalStorage = (year) => {
  try {
    const key = getLocalStorageKey(year);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Erreur lors de la suppression du localStorage:", error);
  }
};

/**
 * Nettoie les années anciennes (> MAX_HISTORY_YEARS)
 */
const cleanOldYearsFromLocalStorage = () => {
  try {
    const currentYear = getCurrentYear();
    const minYear = currentYear - MAX_HISTORY_YEARS;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(COMPTA_KEY_PREFIX)) {
        const year = parseInt(key.replace(COMPTA_KEY_PREFIX, ""));
        if (year < minYear) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors du nettoyage du localStorage:", error);
  }
};

// ===========================================
// FILE D'ATTENTE DE SYNCHRONISATION
// ===========================================

const SYNC_QUEUE_KEY = "lsd_compta_sync_queue";

/**
 * Ajoute une opération à la file d'attente
 */
const addToSyncQueue = (operation) => {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
    queue.push({
      operation,
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout à la file de synchronisation:",
      error
    );
  }
};

/**
 * Récupère la file d'attente
 */
const getSyncQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
  } catch (error) {
    console.error(
      "Erreur lors de la lecture de la file de synchronisation:",
      error
    );
    return [];
  }
};

/**
 * Vide la file d'attente
 */
const clearSyncQueue = () => {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error(
      "Erreur lors du vidage de la file de synchronisation:",
      error
    );
  }
};

// ===========================================
// FONCTIONS FIRESTORE
// ===========================================

/**
 * Crée ou récupère le document annuel
 */
const getOrCreateYearDocument = async (year) => {
  const docRef = doc(db, COLLECTION, year.toString());
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    const newDoc = {
      year,
      resume: initResumeVide(),
      cloture: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setDoc(docRef, newDoc);
    return newDoc;
  }
};

/**
 * Récupère un document semaine
 */
const getWeekDocument = async (year, weekId) => {
  const weekRef = doc(db, COLLECTION, year.toString(), "weeks", weekId);
  const weekSnap = await getDoc(weekRef);

  if (weekSnap.exists()) {
    return { id: weekSnap.id, ...weekSnap.data() };
  }
  return null;
};

/**
 * Récupère les transactions d'une semaine (incluant annexes)
 */
const getWeekTransactions = async (year, weekId) => {
  const mainWeek = await getWeekDocument(year, weekId);
  if (!mainWeek) return [];

  let transactions = [...mainWeek.transactions];

  // Vérifier s'il y a une annexe
  if (mainWeek.hasAnnexe) {
    const annexeRef = doc(
      db,
      COLLECTION,
      year.toString(),
      "weeks",
      `${weekId}-annexe`
    );
    const annexeSnap = await getDoc(annexeRef);

    if (annexeSnap.exists()) {
      transactions.push(...annexeSnap.data().transactions);
    }
  }

  return transactions;
};

/**
 * Crée ou récupère un document semaine
 */
const getOrCreateWeekDocument = async (year, weekId) => {
  const weekRef = doc(db, COLLECTION, year.toString(), "weeks", weekId);
  const weekSnap = await getDoc(weekRef);

  if (weekSnap.exists()) {
    return { id: weekSnap.id, ...weekSnap.data() };
  } else {
    // Générer les infos de la semaine
    const semaines = genererSemainesAnnee(year);
    const semaineInfo = semaines.find((s) => s.weekId === weekId);

    if (!semaineInfo) {
      throw new Error(`Semaine ${weekId} non trouvée pour l'année ${year}`);
    }

    // Calculer la trésorerie de début (somme des semaines précédentes)
    const tresorerieDebut = await calculerTresorerieDebut(year, weekId);

    const newWeek = {
      ...semaineInfo,
      transactions: [],
      resume: calculerResumeHebdomadaire(
        [],
        tresorerieDebut,
        semaineInfo.nombreJours
      ),
      cloture: false,
      hasAnnexe: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setDoc(weekRef, newWeek);
    return newWeek;
  }
};

/**
 * Calcule la trésorerie de début d'une semaine
 */
const calculerTresorerieDebut = async (year, weekId) => {
  const tresorerie = { caisse: 0, mobile_money: 0, banque: 0, total: 0 };

  // Récupérer toutes les semaines précédentes
  const semaines = genererSemainesAnnee(year);
  const index = semaines.findIndex((s) => s.weekId === weekId);

  if (index === 0) {
    // Première semaine de l'année, vérifier l'année précédente
    const yearPrec = year - 1;
    try {
      const yearPrecDoc = await getOrCreateYearDocument(yearPrec);
      return { ...yearPrecDoc.resume.tresorerie_fin };
    } catch (error) {
      console.log("Pas d'année précédente, trésorerie initiale à 0");
      return tresorerie;
    }
  }

  // Sommer les résumés de toutes les semaines précédentes
  for (let i = 0; i < index; i++) {
    const weekData = await getWeekDocument(year, semaines[i].weekId);
    if (weekData && weekData.resume) {
      // On prend la trésorerie de fin de la dernière semaine
      if (i === index - 1) {
        return { ...weekData.resume.tresorerie_fin };
      }
    }
  }

  return tresorerie;
};

/**
 * Sauvegarde avec retry
 */
const saveWithRetry = async (operation, maxRetries = 1) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await operation();
      return true;
    } catch (error) {
      lastError = error;
      console.error(`Tentative ${attempt + 1} échouée:`, error);

      if (attempt < maxRetries) {
        // Attendre 1 seconde avant de réessayer
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Échec après tous les retries
  addToSyncQueue(operation.toString());
  throw lastError;
};

/**
 * Met à jour le résumé d'une semaine
 */
const updateWeekResume = async (year, weekId) => {
  const transactions = await getWeekTransactions(year, weekId);
  const weekData = await getWeekDocument(year, weekId);

  if (!weekData) {
    throw new Error(`Semaine ${weekId} non trouvée`);
  }

  const tresorerieDebut = weekData.resume.tresorerie_debut;
  const resume = calculerResumeHebdomadaire(
    transactions,
    tresorerieDebut,
    weekData.nombreJours
  );

  const weekRef = doc(db, COLLECTION, year.toString(), "weeks", weekId);
  await updateDoc(weekRef, {
    resume,
    updated_at: new Date().toISOString(),
  });

  return resume;
};

/**
 * Met à jour le résumé annuel
 */
const updateYearResume = async (year) => {
  const semaines = genererSemainesAnnee(year);
  const weeksData = [];

  // Charger toutes les semaines
  for (const semaine of semaines) {
    const weekData = await getWeekDocument(year, semaine.weekId);
    if (weekData) {
      weeksData.push(weekData);
    }
  }

  const resume = calculerResumeAnnuel(weeksData);

  // Calculer la trésorerie mensuelle
  const tresorerieMensuelle = {};
  for (let mois = 1; mois <= 12; mois++) {
    const weeksInMonth = getWeeksInMonth(year, mois);
    const monthWeeksData = weeksData.filter((w) =>
      weeksInMonth.some((wim) => wim.weekId === w.weekId)
    );

    if (monthWeeksData.length > 0) {
      tresorerieMensuelle[mois] = calculerResumeMensuel(
        monthWeeksData,
        year,
        mois
      );
    }
  }

  resume.tresorerie_mensuelle = tresorerieMensuelle;

  const yearRef = doc(db, COLLECTION, year.toString());
  await updateDoc(yearRef, {
    resume,
    updated_at: new Date().toISOString(),
  });

  return resume;
};

/**
 * Vérifie si une semaine doit être clôturée automatiquement
 */
const checkAutoClotureWeek = async (year, weekId) => {
  const weekData = await getWeekDocument(year, weekId);
  if (!weekData || weekData.cloture) return;

  const dateFin = new Date(weekData.dateFin);
  const now = new Date();
  const diffJours = (now - dateFin) / (1000 * 60 * 60 * 24);

  if (diffJours >= CLOTURE_DELAY_DAYS) {
    await cloturerSemaine(year, weekId);
  }
};

// ===========================================
// FONCTIONS CRUD TRANSACTIONS
// ===========================================

/**
 * Ajoute une transaction
 */
const ajouterTransaction = async (transactionData) => {
  // Validation de la date
  if (isFutureDate(transactionData.date)) {
    throw new Error(
      "Impossible d'ajouter une transaction avec une date future"
    );
  }

  // Trouver la semaine correspondante
  const year = new Date(transactionData.date).getFullYear();
  const weekInfo = getWeekFromDate(transactionData.date, year);

  if (!weekInfo) {
    throw new Error(
      `Aucune semaine trouvée pour la date ${transactionData.date}`
    );
  }

  // Vérifier que la semaine n'est pas clôturée
  const weekData = await getOrCreateWeekDocument(year, weekInfo.weekId);
  if (weekData.cloture) {
    throw new Error(
      "Impossible d'ajouter une transaction dans une semaine clôturée"
    );
  }

  // Enrichir la transaction avec les infos du compte
  const compte = findCompteByCode(transactionData.compte_lsd);
  if (!compte) {
    throw new Error(`Compte ${transactionData.compte_lsd} non trouvé`);
  }

  const transaction = {
    ...transactionData,
    id: generateTransactionId(),
    compte_denomination: compte.denomination,
    compte_type: compte.type,
    compte_ohada: compte.code_ohada,
    created_at: new Date().toISOString(),
  };

  // Valider avec Zod
  const validatedTransaction = transactionComptableSchema.parse(transaction);

  // Définir l'opération de sauvegarde
  const saveOperation = async () => {
    const weekRef = doc(
      db,
      COLLECTION,
      year.toString(),
      "weeks",
      weekInfo.weekId
    );
    const currentWeek = await getWeekDocument(year, weekInfo.weekId);

    // Vérifier la taille et le nombre de transactions
    const estimatedSize = calculateDocSize(currentWeek);
    const needsAnnexe =
      currentWeek.transactions.length >= TRANSACTION_LIMIT ||
      estimatedSize > FIRESTORE_SIZE_LIMIT;

    if (needsAnnexe) {
      // Utiliser ou créer une annexe
      const annexeRef = doc(
        db,
        COLLECTION,
        year.toString(),
        "weeks",
        `${weekInfo.weekId}-annexe`
      );
      const annexeSnap = await getDoc(annexeRef);

      if (annexeSnap.exists()) {
        const annexeData = annexeSnap.data();
        await updateDoc(annexeRef, {
          transactions: [...annexeData.transactions, validatedTransaction],
          updated_at: new Date().toISOString(),
        });
      } else {
        await setDoc(annexeRef, {
          parentWeekId: weekInfo.weekId,
          transactions: [validatedTransaction],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Marquer que la semaine a une annexe
      await updateDoc(weekRef, { hasAnnexe: true });
    } else {
      // Ajouter à la semaine principale
      await updateDoc(weekRef, {
        transactions: [...currentWeek.transactions, validatedTransaction],
        updated_at: new Date().toISOString(),
      });
    }

    // Mettre à jour les résumés
    await updateWeekResume(year, weekInfo.weekId);
    await updateYearResume(year);

    // Sauvegarder en localStorage
    const yearData = await loadYearComplete(year);
    saveYearToLocalStorage(yearData);
  };

  // Exécuter avec retry
  await saveWithRetry(saveOperation);

  return validatedTransaction;
};

/**
 * Modifie une transaction
 */
const modifierTransaction = async (transactionId, updatedData) => {
  // Trouver la transaction
  const { year, weekId, transaction, isInAnnexe } = await findTransaction(
    transactionId
  );

  // Vérifier que la semaine n'est pas clôturée
  const weekData = await getWeekDocument(year, weekId);
  if (weekData.cloture) {
    throw new Error(
      "Impossible de modifier une transaction dans une semaine clôturée"
    );
  }

  // Valider la nouvelle date si modifiée
  if (updatedData.date && isFutureDate(updatedData.date)) {
    throw new Error("Impossible de définir une date future");
  }

  const saveOperation = async () => {
    const docPath = isInAnnexe ? `${weekId}-annexe` : weekId;

    const weekRef = doc(db, COLLECTION, year.toString(), "weeks", docPath);
    const weekDoc = await getDoc(weekRef);
    const data = weekDoc.data();

    const updatedTransactions = data.transactions.map((t) =>
      t.id === transactionId ? { ...t, ...updatedData } : t
    );

    await updateDoc(weekRef, {
      transactions: updatedTransactions,
      updated_at: new Date().toISOString(),
    });

    // Mettre à jour les résumés
    await updateWeekResume(year, weekId);
    await updateYearResume(year);

    // Sauvegarder en localStorage
    const yearData = await loadYearComplete(year);
    saveYearToLocalStorage(yearData);
  };

  await saveWithRetry(saveOperation);
  return true;
};

/**
 * Supprime une transaction
 */
const supprimerTransaction = async (transactionId) => {
  const { year, weekId, isInAnnexe } = await findTransaction(transactionId);

  // Vérifier que la semaine n'est pas clôturée
  const weekData = await getWeekDocument(year, weekId);
  if (weekData.cloture) {
    throw new Error(
      "Impossible de supprimer une transaction dans une semaine clôturée"
    );
  }

  const saveOperation = async () => {
    const docPath = isInAnnexe ? `${weekId}-annexe` : weekId;
    const weekRef = doc(db, COLLECTION, year.toString(), "weeks", docPath);
    const weekDoc = await getDoc(weekRef);
    const data = weekDoc.data();

    const updatedTransactions = data.transactions.filter(
      (t) => t.id !== transactionId
    );

    await updateDoc(weekRef, {
      transactions: updatedTransactions,
      updated_at: new Date().toISOString(),
    });

    // Mettre à jour les résumés
    await updateWeekResume(year, weekId);
    await updateYearResume(year);

    // Sauvegarder en localStorage
    const yearData = await loadYearComplete(year);
    saveYearToLocalStorage(yearData);
  };

  await saveWithRetry(saveOperation);
  return true;
};

/**
 * Trouve une transaction par son ID
 */
const findTransaction = async (transactionId) => {
  const currentYear = getCurrentYear();

  // Chercher dans l'année courante et les 2 années précédentes
  for (let y = currentYear; y >= currentYear - MAX_HISTORY_YEARS; y--) {
    const semaines = genererSemainesAnnee(y);

    for (const semaine of semaines) {
      // Chercher dans la semaine principale
      const weekData = await getWeekDocument(y, semaine.weekId);
      if (weekData) {
        const transaction = weekData.transactions.find(
          (t) => t.id === transactionId
        );
        if (transaction) {
          return {
            year: y,
            weekId: semaine.weekId,
            transaction,
            isInAnnexe: false,
          };
        }

        // Chercher dans l'annexe si elle existe
        if (weekData.hasAnnexe) {
          const annexeRef = doc(
            db,
            COLLECTION,
            y.toString(),
            "weeks",
            `${semaine.weekId}-annexe`
          );
          const annexeSnap = await getDoc(annexeRef);

          if (annexeSnap.exists()) {
            const annexeData = annexeSnap.data();
            const transaction = annexeData.transactions.find(
              (t) => t.id === transactionId
            );
            if (transaction) {
              return {
                year: y,
                weekId: semaine.weekId,
                transaction,
                isInAnnexe: true,
              };
            }
          }
        }
      }
    }
  }

  throw new Error(`Transaction ${transactionId} non trouvée`);
};

// ===========================================
// GESTION DES CLÔTURES
// ===========================================

/**
 * Clôture manuelle d'une semaine
 */
const cloturerSemaine = async (year, weekId) => {
  const weekRef = doc(db, COLLECTION, year.toString(), "weeks", weekId);
  await updateDoc(weekRef, {
    cloture: true,
    updated_at: new Date().toISOString(),
  });

  // Mettre à jour localStorage
  const yearData = await loadYearComplete(year);
  saveYearToLocalStorage(yearData);

  return true;
};

/**
 * Déclôture une semaine (fonction admin)
 */
const decloturerSemaine = async (year, weekId) => {
  const weekRef = doc(db, COLLECTION, year.toString(), "weeks", weekId);
  await updateDoc(weekRef, {
    cloture: false,
    updated_at: new Date().toISOString(),
  });

  // Mettre à jour localStorage
  const yearData = await loadYearComplete(year);
  saveYearToLocalStorage(yearData);

  return true;
};

/**
 * Clôture une année complète
 */
const cloturerAnnee = async (year) => {
  const yearRef = doc(db, COLLECTION, year.toString());
  await updateDoc(yearRef, {
    cloture: true,
    updated_at: new Date().toISOString(),
  });

  // Clôturer toutes les semaines
  const semaines = genererSemainesAnnee(year);
  const batch = writeBatch(db);

  for (const semaine of semaines) {
    const weekRef = doc(
      db,
      COLLECTION,
      year.toString(),
      "weeks",
      semaine.weekId
    );
    batch.update(weekRef, { cloture: true });
  }

  await batch.commit();

  // Mettre à jour localStorage
  const yearData = await loadYearComplete(year);
  saveYearToLocalStorage(yearData);

  return true;
};

// ===========================================
// CHARGEMENT DES DONNÉES
// ===========================================

/**
 * Charge une année complète (résumé + toutes les semaines)
 */
const loadYearComplete = async (year) => {
  // Essayer localStorage d'abord
  const localData = getYearFromLocalStorage(year);
  if (localData && localData.weeks) {
    return localData;
  }

  // Sinon, charger depuis Firestore
  const yearDoc = await getOrCreateYearDocument(year);
  const semaines = genererSemainesAnnee(year);
  const weeks = {};

  for (const semaineInfo of semaines) {
    const weekData = await getWeekDocument(year, semaineInfo.weekId);
    if (weekData) {
      // Charger les transactions avec annexes
      weekData.transactions = await getWeekTransactions(
        year,
        semaineInfo.weekId
      );
      weeks[semaineInfo.weekId] = weekData;
    }
  }

  const completeData = {
    ...yearDoc,
    weeks,
    lastSync: new Date().toISOString(),
  };

  saveYearToLocalStorage(completeData);
  return completeData;
};

/**
 * Charge les semaines par paquets
 */
const loadWeeksBatch = async (
  year,
  startWeekIndex,
  batchSize = WEEK_BATCH_SIZE
) => {
  const semaines = genererSemainesAnnee(year);
  const batch = semaines.slice(startWeekIndex, startWeekIndex + batchSize);
  const weeks = {};

  for (const semaineInfo of batch) {
    const weekData = await getWeekDocument(year, semaineInfo.weekId);
    if (weekData) {
      weekData.transactions = await getWeekTransactions(
        year,
        semaineInfo.weekId
      );
      weeks[semaineInfo.weekId] = weekData;
    }
  }

  return weeks;
};

// ===========================================
// GRAND LIVRE
// ===========================================

/**
 * Génère le grand livre sur une période
 */
const genererGrandLivre = async (dateDebut, dateFin) => {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const yearDebut = debut.getFullYear();
  const yearFin = fin.getFullYear();

  const transactions = [];

  // Charger les transactions de toutes les années concernées
  for (let y = yearDebut; y <= yearFin; y++) {
    const semaines = genererSemainesAnnee(y);

    for (const semaine of semaines) {
      const dateDebutSemaine = new Date(semaine.dateDebut);
      const dateFinSemaine = new Date(semaine.dateFin);

      // Vérifier si la semaine est dans la période
      if (dateFinSemaine >= debut && dateDebutSemaine <= fin) {
        const weekTransactions = await getWeekTransactions(y, semaine.weekId);
        transactions.push(...weekTransactions);
      }
    }
  }

  // Filtrer les transactions dans la période exacte
  const transactionsFiltrees = transactions.filter((t) => {
    const dateTransaction = new Date(t.date);
    return dateTransaction >= debut && dateTransaction <= fin;
  });

  // Grouper par compte
  const parCompte = {};

  transactionsFiltrees.forEach((transaction) => {
    const code = transaction.compte_lsd;

    if (!parCompte[code]) {
      parCompte[code] = {
        code_lsd: code,
        denomination: transaction.compte_denomination,
        code_ohada: transaction.compte_ohada,
        transactions: [],
        solde_debiteur: 0,
        solde_crediteur: 0,
      };
    }

    parCompte[code].transactions.push(transaction);

    // Calculer les soldes (débit/crédit)
    if (transaction.type === "entree") {
      parCompte[code].solde_crediteur += transaction.montant;
    } else {
      parCompte[code].solde_debiteur += transaction.montant;
    }
  });

  // Trier les transactions de chaque compte par date
  Object.values(parCompte).forEach((compte) => {
    compte.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  // Trier les comptes par code OHADA
  const grandLivre = Object.values(parCompte).sort((a, b) =>
    a.code_ohada.localeCompare(b.code_ohada)
  );

  return {
    dateDebut,
    dateFin,
    comptes: grandLivre,
    nombreComptes: grandLivre.length,
    nombreTransactions: transactionsFiltrees.length,
  };
};

// ===========================================
// HOOKS REACT
// ===========================================

/**
 * Hook pour gérer les transactions
 */
export const useTransactions = (weekId = null) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = getCurrentYear();
  const currentDate = getCurrentDate();
  const currentWeekInfo = weekId
    ? genererSemainesAnnee(currentYear).find((s) => s.weekId === weekId)
    : getWeekFromDate(currentDate, currentYear);

  const targetWeekId = weekId || currentWeekInfo?.weekId;

  const chargerTransactions = useCallback(async () => {
    if (!targetWeekId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getWeekTransactions(currentYear, targetWeekId);
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur chargement transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, targetWeekId]);

  useEffect(() => {
    chargerTransactions();
  }, [chargerTransactions]);

  const ajouter = async (transactionData) => {
    try {
      const newTransaction = await ajouterTransaction(transactionData);
      await chargerTransactions();
      return newTransaction;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const modifier = async (id, data) => {
    try {
      await modifierTransaction(id, data);
      await chargerTransactions();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const supprimer = async (id) => {
    try {
      await supprimerTransaction(id);
      await chargerTransactions();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    ajouter,
    modifier,
    supprimer,
    recharger: chargerTransactions,
  };
};

/**
 * Hook pour une transaction spécifique
 */
export const useTransaction = (transactionId) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const result = await findTransaction(transactionId);
        setTransaction(result.transaction);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      charger();
    }
  }, [transactionId]);

  return { transaction, loading, error };
};

/**
 * Hook pour une semaine (charge automatiquement la semaine courante)
 */
export const useWeek = (weekId = null) => {
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = getCurrentYear();
  const currentDate = getCurrentDate();
  const currentWeekInfo = getWeekFromDate(currentDate, currentYear);
  const targetWeekId = weekId || currentWeekInfo?.weekId;

  const charger = useCallback(async () => {
    if (!targetWeekId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Essayer localStorage d'abord
      const localData = getYearFromLocalStorage(currentYear);
      if (localData?.weeks?.[targetWeekId]) {
        setWeek(localData.weeks[targetWeekId]);
        setError(null);
        setLoading(false);
        return;
      }

      // Sinon charger depuis Firestore
      const weekData = await getWeekDocument(currentYear, targetWeekId);
      if (weekData) {
        weekData.transactions = await getWeekTransactions(
          currentYear,
          targetWeekId
        );
        setWeek(weekData);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentYear, targetWeekId]);

  useEffect(() => {
    charger();
  }, [charger]);

  return {
    week,
    loading,
    error,
    recharger: charger,
  };
};

/**
 * Hook pour un mois (agrège les semaines)
 */
export const useMonth = (annee = null, mois = null) => {
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = getCurrentYear();
  const currentMonth = new Date().getMonth() + 1;

  const targetYear = annee || currentYear;
  const targetMonth = mois || currentMonth;

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);

        // Récupérer les semaines du mois
        const weeksInMonth = getWeeksInMonth(targetYear, targetMonth);
        const weeksData = [];

        for (const weekInfo of weeksInMonth) {
          const weekData = await getWeekDocument(targetYear, weekInfo.weekId);
          if (weekData) {
            weekData.transactions = await getWeekTransactions(
              targetYear,
              weekInfo.weekId
            );
            weeksData.push(weekData);
          }
        }

        const resume = calculerResumeMensuel(
          weeksData,
          targetYear,
          targetMonth
        );

        setMonthData({
          ...resume,
          weeks: weeksData,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [targetYear, targetMonth]);

  return { monthData, loading, error };
};

/**
 * Hook pour une année avec lazy loading
 */
export const useYear = (annee = null) => {
  const [yearData, setYearData] = useState(null);
  const [weeksLoaded, setWeeksLoaded] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [error, setError] = useState(null);

  const targetYear = annee || getCurrentYear();

  // Charger le résumé initial
  useEffect(() => {
    const chargerResume = async () => {
      try {
        setLoading(true);

        // Essayer localStorage
        const localData = getYearFromLocalStorage(targetYear);
        if (localData) {
          setYearData(localData);
          setWeeksLoaded(localData.weeks || {});
          setLoading(false);
          return;
        }

        // Sinon charger le résumé depuis Firestore
        const yearDoc = await getOrCreateYearDocument(targetYear);
        setYearData({ ...yearDoc, weeks: {} });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerResume();
  }, [targetYear]);

  // Fonction pour charger un batch de semaines
  const loadWeeksBatchFn = useCallback(
    async (startIndex) => {
      try {
        setLoadingWeeks(true);
        const weeks = await loadWeeksBatch(targetYear, startIndex);

        setWeeksLoaded((prev) => ({ ...prev, ...weeks }));
        setYearData((prev) => ({
          ...prev,
          weeks: { ...prev.weeks, ...weeks },
        }));

        return weeks;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoadingWeeks(false);
      }
    },
    [targetYear]
  );

  // Fonction pour charger toutes les semaines
  const loadAllWeeks = useCallback(async () => {
    try {
      setLoadingWeeks(true);
      const completeData = await loadYearComplete(targetYear);
      setYearData(completeData);
      setWeeksLoaded(completeData.weeks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingWeeks(false);
    }
  }, [targetYear]);

  return {
    yearData,
    weeksLoaded,
    loading,
    loadingWeeks,
    error,
    loadWeeksBatch: loadWeeksBatchFn,
    loadAllWeeks,
  };
};

/**
 * Hook pour la navigation entre semaines
 */
export const useWeekNavigation = () => {
  const currentDate = getCurrentDate();
  const currentYear = getCurrentYear();
  const semaines = useMemo(
    () => genererSemainesAnnee(currentYear),
    [currentYear]
  );
  const currentWeekInfo = useMemo(
    () => getWeekFromDate(currentDate, currentYear),
    [currentDate, currentYear]
  );

  const getCurrentWeekIndex = () => {
    return semaines.findIndex((s) => s.weekId === currentWeekInfo?.weekId);
  };

  const getPreviousWeek = () => {
    const index = getCurrentWeekIndex();
    if (index > 0) {
      return semaines[index - 1];
    }
    // Retourner la dernière semaine de l'année précédente
    const prevYearWeeks = genererSemainesAnnee(currentYear - 1);
    return prevYearWeeks[prevYearWeeks.length - 1];
  };

  const getNextWeek = () => {
    const index = getCurrentWeekIndex();
    if (index < semaines.length - 1) {
      return semaines[index + 1];
    }
    // Retourner la première semaine de l'année suivante
    const nextYearWeeks = genererSemainesAnnee(currentYear + 1);
    return nextYearWeeks[0];
  };

  const getWeekByIndex = (index) => {
    if (index >= 0 && index < semaines.length) {
      return semaines[index];
    }
    return null;
  };

  return {
    currentWeek: currentWeekInfo,
    allWeeks: semaines,
    previousWeek: getPreviousWeek(),
    nextWeek: getNextWeek(),
    getCurrentWeekIndex,
    getWeekByIndex,
  };
};

/**
 * Hook pour le statut de synchronisation
 */
export const useSyncStatus = () => {
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const queue = getSyncQueue();
    setSyncQueue(queue);
  }, []);

  const processSyncQueue = async () => {
    const queue = getSyncQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);

    for (let i = 0; i < queue.length; i++) {
      try {
        // Ici vous devriez ré-exécuter l'opération
        // Pour l'instant on la retire simplement
        console.log("Traitement de l'opération en attente:", queue[i]);
      } catch (error) {
        console.error("Erreur lors de la synchronisation:", error);
      }
    }

    clearSyncQueue();
    setSyncQueue([]);
    setIsSyncing(false);
  };

  return {
    syncQueue,
    hasPendingSync: syncQueue.length > 0,
    isSyncing,
    processSyncQueue,
  };
};

/**
 * Hook pour le grand livre
 */
export const useGrandLivre = (dateDebut, dateFin) => {
  const [grandLivre, setGrandLivre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generer = useCallback(async () => {
    if (!dateDebut || !dateFin) return;

    try {
      setLoading(true);
      const data = await genererGrandLivre(dateDebut, dateFin);
      setGrandLivre(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => {
    generer();
  }, [generer]);

  return {
    grandLivre,
    loading,
    error,
    regenerer: generer,
  };
};

/**
 * Hook pour la balance des comptes
 */
export const useBalanceComptes = (dateDebut, dateFin) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculer = useCallback(async () => {
    if (!dateDebut || !dateFin) return;

    try {
      setLoading(true);
      const grandLivre = await genererGrandLivre(dateDebut, dateFin);

      // Calculer la balance à partir du grand livre
      const balanceData = {
        dateDebut,
        dateFin,
        comptes: grandLivre.comptes.map((compte) => ({
          code_lsd: compte.code_lsd,
          denomination: compte.denomination,
          code_ohada: compte.code_ohada,
          debit: compte.solde_debiteur,
          credit: compte.solde_crediteur,
          solde: compte.solde_crediteur - compte.solde_debiteur,
        })),
        total_debit: grandLivre.comptes.reduce(
          (sum, c) => sum + c.solde_debiteur,
          0
        ),
        total_credit: grandLivre.comptes.reduce(
          (sum, c) => sum + c.solde_crediteur,
          0
        ),
      };

      balanceData.equilibre =
        Math.abs(balanceData.total_debit - balanceData.total_credit) < 0.01;

      setBalance(balanceData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => {
    calculer();
  }, [calculer]);

  return {
    balance,
    loading,
    error,
    recalculer: calculer,
  };
};

/**
 * Hook pour l'évolution de la trésorerie
 */
export const useEvolutionTresorerie = (dateDebut, dateFin) => {
  const [evolution, setEvolution] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const charger = useCallback(async () => {
    if (!dateDebut || !dateFin) return;

    try {
      setLoading(true);

      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      const yearDebut = debut.getFullYear();
      const yearFin = fin.getFullYear();

      const evolutionData = [];

      for (let y = yearDebut; y <= yearFin; y++) {
        const semaines = genererSemainesAnnee(y);

        for (const semaine of semaines) {
          const dateDebutSemaine = new Date(semaine.dateDebut);
          const dateFinSemaine = new Date(semaine.dateFin);

          if (dateFinSemaine >= debut && dateDebutSemaine <= fin) {
            const weekData = await getWeekDocument(y, semaine.weekId);
            if (weekData) {
              evolutionData.push({
                date: semaine.dateDebut,
                label: semaine.label,
                tresorerie_debut: weekData.resume.tresorerie_debut,
                tresorerie_fin: weekData.resume.tresorerie_fin,
                encaissements: weekData.resume.total_encaissements.total,
                decaissements: weekData.resume.total_decaissements.total,
                balance: weekData.resume.balance_nette,
              });
            }
          }
        }
      }

      setEvolution(evolutionData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => {
    charger();
  }, [charger]);

  return {
    evolution,
    loading,
    error,
    recharger: charger,
  };
};

/**
 * Hook pour les statistiques comparatives
 */
export const useStatistiquesComparatives = (periodes) => {
  const [statistiques, setStatistiques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculer = useCallback(async () => {
    if (!periodes || periodes.length === 0) return;

    try {
      setLoading(true);
      const stats = [];

      for (const periode of periodes) {
        const { dateDebut, dateFin, label } = periode;

        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        const yearDebut = debut.getFullYear();
        const yearFin = fin.getFullYear();

        let ca_total = 0;
        let encaissements_total = 0;
        let decaissements_total = 0;
        let nb_transactions = 0;

        for (let y = yearDebut; y <= yearFin; y++) {
          const semaines = genererSemainesAnnee(y);

          for (const semaine of semaines) {
            const dateDebutSemaine = new Date(semaine.dateDebut);
            const dateFinSemaine = new Date(semaine.dateFin);

            if (dateFinSemaine >= debut && dateDebutSemaine <= fin) {
              const weekData = await getWeekDocument(y, semaine.weekId);
              if (weekData) {
                ca_total += weekData.resume.chiffre_affaires;
                encaissements_total +=
                  weekData.resume.total_encaissements.total;
                decaissements_total +=
                  weekData.resume.total_decaissements.total;
                nb_transactions += weekData.resume.nombre_transactions;
              }
            }
          }
        }

        stats.push({
          label,
          dateDebut,
          dateFin,
          chiffre_affaires: ca_total,
          encaissements: encaissements_total,
          decaissements: decaissements_total,
          balance: encaissements_total - decaissements_total,
          nombre_transactions: nb_transactions,
        });
      }

      setStatistiques(stats);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(periodes)]);

  useEffect(() => {
    calculer();
  }, [calculer]);

  return {
    statistiques,
    loading,
    error,
    recalculer: calculer,
  };
};

/**
 * Hook pour les produits les plus vendus
 */
export const useTopProduits = (dateDebut, dateFin, limit = 10) => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const charger = useCallback(async () => {
    if (!dateDebut || !dateFin) return;

    try {
      setLoading(true);

      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      const yearDebut = debut.getFullYear();
      const yearFin = fin.getFullYear();

      const produitsAgreg = {};

      for (let y = yearDebut; y <= yearFin; y++) {
        const semaines = genererSemainesAnnee(y);

        for (const semaine of semaines) {
          const dateDebutSemaine = new Date(semaine.dateDebut);
          const dateFinSemaine = new Date(semaine.dateFin);

          if (dateFinSemaine >= debut && dateDebutSemaine <= fin) {
            const transactions = await getWeekTransactions(y, semaine.weekId);

            transactions.forEach((t) => {
              if (t.type === "entree") {
                const compte = findCompteByCode(t.compte_lsd);
                if (compte && compte.type === "produit") {
                  if (!produitsAgreg[t.compte_lsd]) {
                    produitsAgreg[t.compte_lsd] = {
                      code_lsd: t.compte_lsd,
                      denomination: t.compte_denomination,
                      nombre_ventes: 0,
                      montant_total: 0,
                    };
                  }
                  produitsAgreg[t.compte_lsd].nombre_ventes++;
                  produitsAgreg[t.compte_lsd].montant_total += t.montant;
                }
              }
            });
          }
        }
      }

      const topProduits = Object.values(produitsAgreg)
        .sort((a, b) => b.montant_total - a.montant_total)
        .slice(0, limit);

      setProduits(topProduits);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, limit]);

  useEffect(() => {
    charger();
  }, [charger]);

  return {
    produits,
    loading,
    error,
    recharger: charger,
  };
};

/**
 * Hook pour gérer la clôture
 */
export const useCloture = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cloturerSemaineManuelle = async (year, weekId) => {
    try {
      setLoading(true);
      await cloturerSemaine(year, weekId);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const decloturerSemaineManuelle = async (year, weekId) => {
    try {
      setLoading(true);
      await decloturerSemaine(year, weekId);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cloturerAnneeComplete = async (year) => {
    try {
      setLoading(true);
      await cloturerAnnee(year);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    cloturerSemaine: cloturerSemaineManuelle,
    decloturerSemaine: decloturerSemaineManuelle,
    cloturerAnnee: cloturerAnneeComplete,
  };
};

/**
 * Hook pour les statistiques rapides (dashboard)
 */
export const useQuickStats = (periode = 7) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const calculer = async () => {
      try {
        setLoading(true);

        const currentDate = getCurrentDate();
        const dateFin = currentDate;
        const dateDebut = new Date();
        dateDebut.setDate(dateDebut.getDate() - (periode - 1));
        const dateDebutStr = formatISO(dateDebut);

        const debut = new Date(dateDebutStr);
        const fin = new Date(dateFin);
        const year = getCurrentYear();

        const quickStats = {
          periode,
          chiffre_affaires: 0,
          encaissements: 0,
          decaissements: 0,
          balance: 0,
          nombre_transactions: 0,
          tresorerie_actuelle: {
            caisse: 0,
            mobile_money: 0,
            banque: 0,
            total: 0,
          },
        };

        const semaines = genererSemainesAnnee(year);

        for (const semaine of semaines) {
          const dateDebutSemaine = new Date(semaine.dateDebut);
          const dateFinSemaine = new Date(semaine.dateFin);

          if (dateFinSemaine >= debut && dateDebutSemaine <= fin) {
            const weekData = await getWeekDocument(year, semaine.weekId);
            if (weekData) {
              quickStats.chiffre_affaires += weekData.resume.chiffre_affaires;
              quickStats.encaissements +=
                weekData.resume.total_encaissements.total;
              quickStats.decaissements +=
                weekData.resume.total_decaissements.total;
              quickStats.nombre_transactions +=
                weekData.resume.nombre_transactions;

              // Trésorerie de la dernière semaine
              quickStats.tresorerie_actuelle = {
                ...weekData.resume.tresorerie_fin,
              };
            }
          }
        }

        quickStats.balance =
          quickStats.encaissements - quickStats.decaissements;

        setStats(quickStats);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    calculer();
  }, [periode]);

  return { stats, loading, error };
};

// ===========================================
// EXPORTS DES FONCTIONS UTILITAIRES
// ===========================================

export {
  // Schemas
  transactionComptableSchema,
  resumeHebdomadaireSchema,
  resumeAnnuelSchema,
  semaineSchema,

  // Fonctions CRUD
  ajouterTransaction,
  modifierTransaction,
  supprimerTransaction,
  findTransaction,

  // Gestion des semaines et années
  genererSemainesAnnee,
  getWeekFromDate,
  getWeeksInMonth,
  getOrCreateYearDocument,
  getOrCreateWeekDocument,
  getWeekDocument,
  getWeekTransactions,
  loadYearComplete,
  loadWeeksBatch,

  // Calculs
  calculerResumeHebdomadaire,
  calculerResumeAnnuel,
  calculerResumeMensuel,
  updateWeekResume,
  updateYearResume,

  // Clôtures
  cloturerSemaine,
  decloturerSemaine,
  cloturerAnnee,
  checkAutoClotureWeek,

  // Grand livre et analyses
  genererGrandLivre,

  // Utilitaires
  findCompteByCode,
  getCurrentDate,
  getCurrentYear,
  formatDate,
  formatISO,
  isFutureDate,

  // LocalStorage
  saveYearToLocalStorage,
  getYearFromLocalStorage,
  clearYearFromLocalStorage,
  cleanOldYearsFromLocalStorage,

  // Synchronisation
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  saveWithRetry,

  // Constantes
  COMPTA_KEY_PREFIX,
  COLLECTION,
  TRANSACTION_LIMIT,
  FIRESTORE_SIZE_LIMIT,
  CLOTURE_DELAY_DAYS,
  MAX_HISTORY_YEARS,
  WEEK_BATCH_SIZE,
};
