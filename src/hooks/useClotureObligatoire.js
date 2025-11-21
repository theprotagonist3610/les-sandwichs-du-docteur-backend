/**
 * useClotureObligatoire.js
 * Hook pour gérer la clôture quotidienne obligatoire
 */

import { useState, useEffect, useCallback } from "react";
import {
  verifierClotureRequise,
  getDonneesJourneePourCloture,
  isClotureEnCours,
  lancerClotureAvecQueue,
  marquerNotification23hEnvoyee,
} from "@/toolkits/admin/comptabilite/cloture";
import { formatDayKey } from "@/toolkits/admin/comptabilite/utils";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/firebase";

// LocalStorage key
const LS_KEY = "lsd_cloture_status";
const RTDB_CLOTURE_QUEUE = "/cloture/queue_status";

/**
 * Hook de gestion de la clôture obligatoire
 * @param {boolean} enabled - Activer le hook (true pour admins, false pour autres)
 * @returns {Object} État et fonctions de clôture
 */
export function useClotureObligatoire(enabled = true) {
  const [clotureRequise, setClotureRequise] = useState(false);
  const [notification23h, setNotification23h] = useState(false);
  const [donneesJournee, setDonneesJournee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clotureEnCours, setClotureEnCours] = useState(false);
  const [dateACloturer, setDateACloturer] = useState(null);

  // Fonction de vérification complète
  const verifierCloture = useCallback(async () => {
    if (!enabled) return;

    try {
      // 1. Vérifier localStorage d'abord (rapide)
      const lsData = localStorage.getItem(LS_KEY);
      const aujourdHui = formatDayKey(new Date());
      const veille = formatDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

      let needsFirestoreCheck = true;

      if (lsData) {
        try {
          const parsed = JSON.parse(lsData);
          // Si la dernière clôture est la veille, pas besoin de check Firestore
          if (parsed.derniereClotureDate === veille) {
            needsFirestoreCheck = false;
            setClotureRequise(false);
          }
        } catch (e) {
          console.warn("Erreur parse localStorage:", e);
        }
      }

      // 2. Vérifier dans Firestore si nécessaire
      if (needsFirestoreCheck) {
        const result = await verifierClotureRequise(veille);

        if (result.requise) {
          setClotureRequise(true);
          setDateACloturer(result.dateACloturer);

          // Charger les données de la journée
          const donnees = await getDonneesJourneePourCloture(result.dateACloturer);
          setDonneesJournee(donnees);

          console.log("⚠️ Clôture requise pour:", result.dateACloturer);
        } else {
          setClotureRequise(false);
          // Mettre à jour localStorage
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({
              derniereClotureDate: veille,
              derniereVerificationTimestamp: Date.now(),
            })
          );
        }
      }
    } catch (error) {
      console.error("Erreur vérification clôture:", error);
    }
  }, [enabled]);

  // Vérification initiale au mount
  useEffect(() => {
    verifierCloture();
  }, [verifierCloture]);

  // Interval check (toutes les 5 minutes)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(
      () => {
        const now = new Date();
        const heure = now.getHours();
        const minute = now.getMinutes();

        // Vérifier notification 23h
        if (heure === 23 && minute >= 0 && minute < 5) {
          const lsData = localStorage.getItem(LS_KEY);
          let notifCachee = false;

          if (lsData) {
            try {
              const parsed = JSON.parse(lsData);
              notifCachee = parsed.notificationCacher23h === true;
            } catch (e) {}
          }

          if (!notifCachee && !clotureRequise) {
            setNotification23h(true);
          }
        }

        // Vérifier passage minuit (00:00-00:05)
        if (heure === 0 && minute >= 0 && minute < 5) {
          verifierCloture();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [enabled, clotureRequise, verifierCloture]);

  // Listener RTDB pour la queue
  useEffect(() => {
    if (!enabled) return;

    const queueRef = ref(rtdb, RTDB_CLOTURE_QUEUE);

    const unsubscribe = onValue(queueRef, (snapshot) => {
      if (snapshot.exists()) {
        const queueData = snapshot.val();
        setClotureEnCours(queueData.en_cours || false);

        // Si la clôture vient de se terminer
        if (!queueData.en_cours && clotureRequise) {
          // Revérifier l'état
          verifierCloture();
        }
      } else {
        setClotureEnCours(false);
      }
    });

    return () => unsubscribe();
  }, [enabled, clotureRequise, verifierCloture]);

  // Fonction pour lancer la clôture
  const lancerCloture = useCallback(
    async (userId, userName) => {
      if (!dateACloturer) {
        console.error("Aucune date à clôturer");
        return { success: false, error: "Aucune date à clôturer" };
      }

      setLoading(true);

      try {
        const result = await lancerClotureAvecQueue(userId, userName, dateACloturer);

        if (result.success) {
          // Mettre à jour localStorage
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({
              derniereClotureDate: dateACloturer,
              derniereVerificationTimestamp: Date.now(),
              notificationCacher23h: false,
            })
          );

          // Fermer le dialog
          setClotureRequise(false);
          setDonneesJournee(null);
          setDateACloturer(null);
        }

        return result;
      } catch (error) {
        console.error("Erreur lancement clôture:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [dateACloturer]
  );

  // Fonction pour cacher la notification 23h
  const cacherNotification23h = useCallback(() => {
    setNotification23h(false);

    // Marquer dans localStorage pour ne pas réafficher
    const lsData = localStorage.getItem(LS_KEY);
    let parsed = {};

    if (lsData) {
      try {
        parsed = JSON.parse(lsData);
      } catch (e) {}
    }

    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        ...parsed,
        notificationCacher23h: true,
      })
    );

    // Optionnel : marquer dans Firestore
    marquerNotification23hEnvoyee().catch((e) =>
      console.error("Erreur marquage notification:", e)
    );
  }, []);

  // Fonction pour ouvrir la clôture manuellement (depuis notification 23h)
  const ouvrirClotureManuelle = useCallback(async () => {
    setNotification23h(false);

    // Charger les données et ouvrir le dialog
    const veille = formatDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    try {
      const donnees = await getDonneesJourneePourCloture(veille);
      setDonneesJournee(donnees);
      setDateACloturer(veille);
      setClotureRequise(true);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  }, []);

  return {
    clotureRequise,
    notification23h,
    donneesJournee,
    loading,
    clotureEnCours,
    lancerCloture,
    cacherNotification23h,
    ouvrirClotureManuelle,
  };
}
