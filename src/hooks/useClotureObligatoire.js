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
import { createTodo, getAllTodos } from "@/toolkits/admin/todoToolkit";

// LocalStorage key
const LS_KEY = "lsd_cloture_status";
const RTDB_CLOTURE_QUEUE = "/cloture/queue_status";

/**
 * Formate une date en français (ex: "12 nov. 2025")
 */
const formatDateFr = (date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

/**
 * Crée un todo de clôture s'il n'existe pas déjà pour aujourd'hui
 */
const creerTodoCloture = async () => {
  try {
    const aujourdHui = new Date();
    const dateStr = formatDateFr(aujourdHui);
    const dayKey = formatDayKey(aujourdHui);

    // Vérifier si un todo de clôture existe déjà pour aujourd'hui
    const allTodos = await getAllTodos();
    const todoClotureExiste = allTodos.some(
      (todo) =>
        todo.title === "Clôture" &&
        todo.description.includes(dateStr) &&
        !todo.status // Non terminé
    );

    if (todoClotureExiste) {
      console.log("ℹ️ Todo de clôture déjà existant pour", dateStr);
      return null;
    }

    // Calculer la deadline (aujourd'hui 23:59:59)
    const deadline = new Date(aujourdHui);
    deadline.setHours(23, 59, 59, 999);

    // Créer le todo
    const newTodo = await createTodo({
      title: "Clôture",
      description: `Clôturer la comptabilité du ${dateStr}`,
      concern: [], // Visible par tous (les admins voient tout)
      concernBy: [],
      deadline: deadline.getTime(),
      createdBy: "système",
    });

    console.log("✅ Todo de clôture créé pour", dateStr);
    return newTodo;
  } catch (error) {
    console.error("❌ Erreur création todo clôture:", error);
    return null;
  }
};

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
          let todoClotureCree = false;

          if (lsData) {
            try {
              const parsed = JSON.parse(lsData);
              notifCachee = parsed.notificationCacher23h === true;
              // Vérifier si le todo a déjà été créé aujourd'hui
              const aujourdHui = formatDayKey(new Date());
              todoClotureCree = parsed.todoClotureCree === aujourdHui;
            } catch (e) {}
          }

          // Créer le todo de clôture s'il n'a pas déjà été créé aujourd'hui
          if (!todoClotureCree) {
            creerTodoCloture().then(() => {
              // Marquer dans localStorage que le todo a été créé
              const currentLsData = localStorage.getItem(LS_KEY);
              let parsed = {};
              if (currentLsData) {
                try {
                  parsed = JSON.parse(currentLsData);
                } catch (e) {}
              }
              localStorage.setItem(
                LS_KEY,
                JSON.stringify({
                  ...parsed,
                  todoClotureCree: formatDayKey(new Date()),
                })
              );
            });
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
