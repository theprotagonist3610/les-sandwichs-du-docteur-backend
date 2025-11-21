/**
 * cloture.js
 * Fonctions de gestion de la clôture quotidienne obligatoire
 */

import { db, rtdb } from "@/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { ref, get, set, remove } from "firebase/database";
import { formatDayKey, getDaysInMonth } from "./utils";
import { getOperationsByDay } from "./operations";
import { getAllComptesTresorerie } from "./comptes";
import { archiverOperationsVeille } from "./archivage";

// Paths Firestore et RTDB
const CLOTURE_STATUS_DOC = "/comptabilite/cloture_status";
const RTDB_CLOTURE_QUEUE = "/cloture/queue_status";

/**
 * Vérifier si une clôture est requise pour une date donnée
 * @param {string} dayKey - Format DDMMYYYY (optionnel, par défaut hier)
 * @returns {Promise<Object>} { requise: boolean, dateACloturer: string, ... }
 */
export async function verifierClotureRequise(dayKey = null) {
  try {
    // Si pas de dayKey, utiliser la veille
    const targetDayKey = dayKey || formatDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

    console.log(`🔍 Vérification clôture pour ${targetDayKey}...`);

    // Récupérer le statut dans Firestore
    const clotureRef = doc(db, CLOTURE_STATUS_DOC);
    const clotureSnap = await getDoc(clotureRef);

    if (!clotureSnap.exists()) {
      // Première fois, aucune clôture n'a jamais été faite
      return {
        requise: true,
        dateACloturer: targetDayKey,
        raison: "Aucune clôture n'a jamais été effectuée",
      };
    }

    const clotureStatus = clotureSnap.data();
    const derniereCloture = clotureStatus.derniere_cloture_key;

    // Comparer les dates
    if (derniereCloture === targetDayKey) {
      console.log(`✅ Clôture déjà effectuée pour ${targetDayKey}`);
      return {
        requise: false,
        dateACloturer: null,
        derniereCloture: derniereCloture,
      };
    }

    // La clôture est requise
    console.log(`⚠️ Clôture requise pour ${targetDayKey}`);
    return {
      requise: true,
      dateACloturer: targetDayKey,
      derniereCloture: derniereCloture || "Jamais",
    };
  } catch (error) {
    console.error("❌ Erreur vérification clôture:", error);
    throw error;
  }
}

/**
 * Récupérer les données de la journée pour affichage dans le dialog
 * @param {string} dayKey - Format DDMMYYYY
 * @returns {Promise<Object>} Données complètes de la journée
 */
export async function getDonneesJourneePourCloture(dayKey) {
  try {
    console.log(`📊 Récupération données journée ${dayKey}...`);

    // Récupérer les opérations du jour
    const { operations } = await getOperationsByDay(dayKey);

    // Calculer les totaux
    const operationsEntrees = operations.filter((op) => op.type === "entree");
    const operationsSorties = operations.filter((op) => op.type === "sortie");

    const totalEntrees = operationsEntrees.reduce((sum, op) => sum + op.montant, 0);
    const totalSorties = operationsSorties.reduce((sum, op) => sum + op.montant, 0);

    // Récupérer l'état de la trésorerie
    const comptesTresorerie = await getAllComptesTresorerie();

    // Formater la date lisible
    const dd = dayKey.substring(0, 2);
    const mm = dayKey.substring(2, 4);
    const yyyy = dayKey.substring(4, 8);
    const moisNoms = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    const dateReadable = `${dd} ${moisNoms[parseInt(mm) - 1]} ${yyyy}`;

    const donnees = {
      dayKey,
      dateReadable,
      operations: {
        total: operations.length,
        entrees: operationsEntrees.length,
        sorties: operationsSorties.length,
      },
      montants: {
        totalEntrees,
        totalSorties,
        soldeJour: totalEntrees - totalSorties,
      },
      tresorerie: comptesTresorerie.comptes.map((compte) => ({
        id: compte.id,
        denomination: compte.denomination,
        code_ohada: compte.code_ohada,
        solde: compte.solde,
      })),
    };

    console.log(`✅ Données récupérées: ${operations.length} opérations`);
    return donnees;
  } catch (error) {
    console.error("❌ Erreur récupération données journée:", error);
    throw error;
  }
}

/**
 * Vérifier si une clôture est déjà en cours (via RTDB)
 * @returns {Promise<Object>} { enCours: boolean, demarreePar: string, ... }
 */
export async function isClotureEnCours() {
  try {
    const queueRef = ref(rtdb, RTDB_CLOTURE_QUEUE);
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) {
      return { enCours: false };
    }

    const queueData = snapshot.val();
    return {
      enCours: queueData.en_cours || false,
      demarreePar: queueData.demarree_par || null,
      demarreeA: queueData.demarree_a || null,
      tentatives: queueData.tentatives || 0,
    };
  } catch (error) {
    console.error("❌ Erreur vérification queue clôture:", error);
    return { enCours: false, error: error.message };
  }
}

/**
 * Lancer la clôture avec gestion de queue anti-collision
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} dayKey - Date à clôturer (optionnel, par défaut veille)
 * @returns {Promise<Object>} Résultat de la clôture
 */
export async function lancerClotureAvecQueue(userId, userName, dayKey = null) {
  const targetDayKey = dayKey || formatDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const MAX_RETRIES = 3;
  let tentative = 0;

  try {
    console.log(`🔒 Lancement clôture pour ${targetDayKey} par ${userName}...`);

    // 1. Vérifier qu'une clôture n'est pas déjà en cours
    const queueStatus = await isClotureEnCours();
    if (queueStatus.enCours) {
      console.log(`⚠️ Clôture déjà en cours par ${queueStatus.demarreePar}`);
      return {
        success: false,
        error: `Une clôture est déjà en cours par ${queueStatus.demarreePar}`,
        enCours: true,
      };
    }

    // 2. Marquer la clôture comme en cours dans RTDB
    const queueRef = ref(rtdb, RTDB_CLOTURE_QUEUE);
    await set(queueRef, {
      en_cours: true,
      demarree_a: Date.now(),
      demarree_par: userId,
      nom_user: userName,
      tentatives: 0,
      derniere_erreur: null,
    });

    // 3. Tenter l'archivage avec retry
    while (tentative < MAX_RETRIES) {
      try {
        tentative++;
        console.log(`📦 Tentative ${tentative}/${MAX_RETRIES}...`);

        // Mettre à jour le nombre de tentatives
        await set(queueRef, {
          en_cours: true,
          demarree_a: Date.now(),
          demarree_par: userId,
          nom_user: userName,
          tentatives: tentative,
          derniere_erreur: null,
        });

        // Appeler la fonction d'archivage existante
        await archiverOperationsVeille(targetDayKey);

        // 4. Success ! Mettre à jour le statut de clôture dans Firestore
        const clotureRef = doc(db, CLOTURE_STATUS_DOC);
        await setDoc(
          clotureRef,
          {
            derniere_cloture: Timestamp.now(),
            derniere_cloture_key: targetDayKey,
            derniere_cloture_par: userId,
            derniere_cloture_nom: userName,
            prochaine_cloture_requise: formatDayKey(new Date()),
            notification_23h_envoyee: false,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );

        // 5. Nettoyer la queue RTDB
        await remove(queueRef);

        console.log(`✅ Clôture terminée avec succès pour ${targetDayKey}`);

        return {
          success: true,
          dayKey: targetDayKey,
          tentatives: tentative,
        };
      } catch (error) {
        console.error(`❌ Tentative ${tentative} échouée:`, error);

        if (tentative < MAX_RETRIES) {
          // Attendre 3 secondes avant retry
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          // Échec final, mettre à jour la queue avec l'erreur
          await set(queueRef, {
            en_cours: false,
            demarree_a: null,
            demarree_par: null,
            nom_user: null,
            tentatives: tentative,
            derniere_erreur: error.message,
            erreur_timestamp: Date.now(),
          });

          throw new Error(`Échec après ${MAX_RETRIES} tentatives: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur lancement clôture:", error);
    return {
      success: false,
      error: error.message,
      tentatives: tentative,
    };
  }
}

/**
 * Marquer la notification 23h comme envoyée
 * @returns {Promise<void>}
 */
export async function marquerNotification23hEnvoyee() {
  try {
    const clotureRef = doc(db, CLOTURE_STATUS_DOC);
    await setDoc(
      clotureRef,
      {
        notification_23h_envoyee: true,
        notification_23h_timestamp: Timestamp.now(),
      },
      { merge: true }
    );
    console.log("✅ Notification 23h marquée comme envoyée");
  } catch (error) {
    console.error("❌ Erreur marquage notification 23h:", error);
  }
}

/**
 * Réinitialiser le flag de notification 23h (pour nouveau jour)
 * @returns {Promise<void>}
 */
export async function resetNotification23h() {
  try {
    const clotureRef = doc(db, CLOTURE_STATUS_DOC);
    await setDoc(
      clotureRef,
      {
        notification_23h_envoyee: false,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("❌ Erreur reset notification 23h:", error);
  }
}
