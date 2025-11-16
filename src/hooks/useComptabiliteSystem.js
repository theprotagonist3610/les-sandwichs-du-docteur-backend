/**
 * useComptabiliteSystem.js
 * Hook principal pour initialiser le système comptable
 * - Vérifie et nettoie "today" au démarrage
 * - Active les notifications de clôture
 * - Enregistre le Service Worker
 */

import { useEffect } from "react";
import { verifierEtNettoyerToday } from "@/toolkits/admin/comptabilite/archivage";
import { useClotureNotification } from "./useClotureNotification";
import { registerServiceWorker, registerPeriodicSync } from "@/utils/registerServiceWorker";

/**
 * Hook principal du système comptable
 * À utiliser dans App.jsx ou dans le layout principal
 */
export function useComptabiliteSystem() {
  // Activer les notifications de clôture
  const clotureNotification = useClotureNotification();

  // Vérification et nettoyage au démarrage
  useEffect(() => {
    const startup = async () => {
      try {
        console.log("🚀 Initialisation du système comptable...");

        // 1. Enregistrer le Service Worker
        const registration = await registerServiceWorker();

        if (registration) {
          // 2. Enregistrer Periodic Background Sync (si supporté)
          await registerPeriodicSync();
        }

        // 3. Vérifier et nettoyer "today" des opérations mal datées
        console.log("🧹 Vérification et nettoyage de 'today'...");
        await verifierEtNettoyerToday();
        console.log("✅ Nettoyage 'today' terminé");

        console.log("✅ Système comptable initialisé");
      } catch (error) {
        console.error("❌ Erreur initialisation système comptable:", error);
      }
    };

    startup();
  }, []);

  return {
    ...clotureNotification,
  };
}

export default useComptabiliteSystem;
