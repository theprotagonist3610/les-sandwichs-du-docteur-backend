/**
 * Configuration App Check pour le script Node.js
 * Option 2 : Utiliser un token de debug
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getDatabase, ref, push } from "firebase/database";
import { initializeAppCheck, CustomProvider } from "firebase/app-check";

// Configuration Firebase
const firebaseConfig = {
  // ... votre config
};

const app = initializeApp(firebaseConfig);

// ============================================================================
// CONFIGURATION APP CHECK POUR NODE.JS
// ============================================================================

// Vérifier si on a un token de debug
const APP_CHECK_DEBUG_TOKEN = process.env.APP_CHECK_DEBUG_TOKEN;

if (APP_CHECK_DEBUG_TOKEN) {
  console.log("🔐 App Check: Utilisation du token de debug");

  // Provider personnalisé avec le token de debug
  initializeAppCheck(app, {
    provider: new CustomProvider({
      getToken: () =>
        Promise.resolve({
          token: APP_CHECK_DEBUG_TOKEN,
          expireTimeMillis: Date.now() + 3600000, // 1 heure
        }),
    }),
    isTokenAutoRefreshEnabled: false,
  });
} else {
  console.warn("⚠️  App Check: Aucun token de debug configuré");
  console.warn("   Le script risque d'être bloqué si App Check est activé");
  console.warn("   Ajoutez APP_CHECK_DEBUG_TOKEN dans votre .env");
}

const db = getFirestore(app);
const rtdb = getDatabase(app);

// ... reste du code
