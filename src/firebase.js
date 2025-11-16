import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // 👈 Import RTDB
import {
  initializeAppCheck,
  ReCaptchaV3Provider, // ou ReCaptchaEnterpriseProvider
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_RTDB_URL,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// 🔧 Dev local : activer un token de debug AVANT initializeAppCheck
if (import.meta.env.DEV) {
  // true = token auto-généré dans la console du navigateur
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
  // provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
