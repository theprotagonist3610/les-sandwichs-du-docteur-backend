/**
 * archivage.js
 * Gestion de l'archivage automatique des opérations comptables
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, push } from "firebase/database";
import { db, rtdb } from "../../../firebase.js";
import { TODAY_DOC, HISTORIQUE_DAYS_COLLECTION, RTDB_COMPTA_TRIGGER_PATH } from "./constants";
import { formatDayKey, getPreviousDay, isNewDay } from "./utils";
import { getOperationsToday } from "./operations";

// ============================================================================
// FONCTIONS D'ARCHIVAGE
// ============================================================================

/**
 * Archive les opérations de la veille
 * Cette fonction est appelée automatiquement lors de la détection d'un changement de jour
 */
export async function archiverOperationsVeille() {
  try {
    console.log("📦 Début de l'archivage des opérations de la veille...");

    const today = formatDayKey();
    const yesterday = getPreviousDay(today);

    // Récupérer les opérations actuelles de today
    const { operations: operationsToArchive } = await getOperationsToday();

    if (operationsToArchive.length === 0) {
      console.log("ℹ️ Aucune opération à archiver");
      return { archived: 0, dayKey: yesterday };
    }

    // Filtrer les opérations qui appartiennent réellement à hier
    // (au cas où il y aurait des opérations avec des dates différentes)
    const operationsHier = operationsToArchive.filter((op) => {
      const opDayKey = formatDayKey(new Date(op.date));
      return opDayKey === yesterday;
    });

    // Opérations qui appartiennent à aujourd'hui (à garder dans today)
    const operationsAujourdhui = operationsToArchive.filter((op) => {
      const opDayKey = formatDayKey(new Date(op.date));
      return opDayKey === today;
    });

    // Sauvegarder les opérations d'hier dans l'historique
    if (operationsHier.length > 0) {
      const historyRef = doc(db, `${HISTORIQUE_DAYS_COLLECTION}/${yesterday}`);
      await setDoc(historyRef, {
        operations: operationsHier,
        lastUpdated: Date.now(),
      });

      console.log(`✅ ${operationsHier.length} opérations archivées pour ${yesterday}`);
    }

    // Mettre à jour today avec uniquement les opérations d'aujourd'hui
    const todayRef = doc(db, TODAY_DOC);
    await setDoc(todayRef, {
      operations: operationsAujourdhui,
      lastUpdated: Date.now(),
    });

    // Trigger RTDB
    await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
      action: "archivage_complete",
      dayKey: yesterday,
      archivedCount: operationsHier.length,
      keptCount: operationsAujourdhui.length,
      timestamp: Date.now(),
    });

    console.log(`📦 Archivage terminé: ${operationsHier.length} archivées, ${operationsAujourdhui.length} conservées`);

    return {
      archived: operationsHier.length,
      kept: operationsAujourdhui.length,
      dayKey: yesterday,
    };
  } catch (error) {
    console.error("❌ Erreur archivage opérations:", error);
    throw error;
  }
}

/**
 * Détecte automatiquement le changement de jour et archive si nécessaire
 * @param {string} lastKnownDayKey - Dernier jour connu (stocké en state ou localStorage)
 * @returns {Promise<{changed: boolean, archived?: number, dayKey?: string}>}
 */
export async function detecterEtArchiverSiNouveauJour(lastKnownDayKey) {
  try {
    if (!lastKnownDayKey) {
      // Premier lancement, pas d'archivage
      return {
        changed: false,
        currentDay: formatDayKey(),
      };
    }

    const currentDay = formatDayKey();

    if (isNewDay(lastKnownDayKey)) {
      console.log(`📅 Nouveau jour détecté: ${lastKnownDayKey} → ${currentDay}`);

      // Archiver les opérations de la veille
      const result = await archiverOperationsVeille();

      return {
        changed: true,
        archived: result.archived,
        previousDay: result.dayKey,
        currentDay,
      };
    }

    return {
      changed: false,
      currentDay,
    };
  } catch (error) {
    console.error("❌ Erreur détection changement de jour:", error);
    throw error;
  }
}

/**
 * Vérifie si today contient des opérations et si elles sont du jour actuel
 * Nettoie et archive si nécessaire
 * @returns {Promise<void>}
 */
export async function verifierEtNettoyerToday() {
  try {
    const currentDay = formatDayKey();
    const { operations } = await getOperationsToday();

    if (operations.length === 0) {
      console.log("✅ Today est vide, rien à nettoyer");
      return;
    }

    // Vérifier si toutes les opérations sont du jour actuel
    const operationsAutreJour = operations.filter((op) => {
      const opDayKey = formatDayKey(new Date(op.date));
      return opDayKey !== currentDay;
    });

    if (operationsAutreJour.length > 0) {
      console.log(`⚠️ ${operationsAutreJour.length} opérations d'un autre jour détectées dans today`);

      // Archiver ces opérations
      const groupedByDay = {};
      operationsAutreJour.forEach((op) => {
        const dayKey = formatDayKey(new Date(op.date));
        if (!groupedByDay[dayKey]) {
          groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(op);
      });

      // Archiver chaque jour
      for (const [dayKey, ops] of Object.entries(groupedByDay)) {
        const historyRef = doc(db, `${HISTORIQUE_DAYS_COLLECTION}/${dayKey}`);
        const existing = await getDoc(historyRef);

        let allOps = ops;
        if (existing.exists()) {
          allOps = [...existing.data().operations, ...ops];
        }

        await setDoc(historyRef, {
          operations: allOps,
          lastUpdated: Date.now(),
        });

        console.log(`✅ ${ops.length} opérations archivées dans ${dayKey}`);
      }

      // Garder uniquement les opérations d'aujourd'hui dans today
      const operationsAujourdhui = operations.filter((op) => {
        const opDayKey = formatDayKey(new Date(op.date));
        return opDayKey === currentDay;
      });

      const todayRef = doc(db, TODAY_DOC);
      await setDoc(todayRef, {
        operations: operationsAujourdhui,
        lastUpdated: Date.now(),
      });

      console.log(`🧹 Nettoyage terminé: ${operationsAujourdhui.length} opérations conservées dans today`);
    }
  } catch (error) {
    console.error("❌ Erreur nettoyage today:", error);
    throw error;
  }
}

/**
 * Force l'archivage d'un jour spécifique (utilitaire admin)
 * @param {string} dayKey - Format DDMMYYYY
 */
export async function forceArchiverJour(dayKey) {
  try {
    console.log(`🔧 Archivage forcé pour ${dayKey}...`);

    const { operations: todayOps } = await getOperationsToday();

    // Filtrer les opérations de ce jour
    const operationsToArchive = todayOps.filter((op) => {
      const opDayKey = formatDayKey(new Date(op.date));
      return opDayKey === dayKey;
    });

    if (operationsToArchive.length === 0) {
      console.log(`ℹ️ Aucune opération trouvée pour ${dayKey}`);
      return { archived: 0 };
    }

    // Archiver
    const historyRef = doc(db, `${HISTORIQUE_DAYS_COLLECTION}/${dayKey}`);
    const existing = await getDoc(historyRef);

    let allOps = operationsToArchive;
    if (existing.exists()) {
      allOps = [...existing.data().operations, ...operationsToArchive];
    }

    await setDoc(historyRef, {
      operations: allOps,
      lastUpdated: Date.now(),
    });

    // Retirer de today
    const remainingOps = todayOps.filter((op) => {
      const opDayKey = formatDayKey(new Date(op.date));
      return opDayKey !== dayKey;
    });

    const todayRef = doc(db, TODAY_DOC);
    await setDoc(todayRef, {
      operations: remainingOps,
      lastUpdated: Date.now(),
    });

    console.log(`✅ ${operationsToArchive.length} opérations archivées pour ${dayKey}`);

    return {
      archived: operationsToArchive.length,
      dayKey,
    };
  } catch (error) {
    console.error("❌ Erreur archivage forcé:", error);
    throw error;
  }
}
