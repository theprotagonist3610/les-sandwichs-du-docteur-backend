/**
 * testOperationsComptables.js (VERSION ADMIN SDK)
 * Script de génération d'opérations comptables de test
 * Utilise Admin SDK pour bypasser App Check
 */

import admin from "firebase-admin";
import { nanoid } from "nanoid";
import { readFileSync } from "fs";

// ============================================================================
// CONFIGURATION FIREBASE ADMIN SDK
// ============================================================================

// Chemin vers le service account key (à télécharger depuis Firebase Console)
// IMPORTANT : Ne jamais commiter ce fichier !
const serviceAccount = JSON.parse(
  readFileSync("./firebase-service-account-key.json", "utf8")
);

// Initialiser Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.VITE_DATABASE_URL,
});

const db = admin.firestore();
const rtdb = admin.database();

console.log("🔧 Configuration Firebase Admin SDK:");
console.log(`   - Project ID: ${serviceAccount.project_id}`);
console.log(`   - Database URL: ${process.env.VITE_DATABASE_URL}`);
console.log("   ✅ Admin SDK bypass App Check automatiquement");
console.log("");

// ============================================================================
// RESTE DU CODE IDENTIQUE
// ============================================================================

// ... (garder tout le reste du code existant)
