# 🔐 App Check et Script de Test - Guide Complet

## 🚨 Problème

Vous avez configuré **App Check** dans votre application web, mais le script de test `testOperationsComptables.js` **ne l'a pas**.

### Ce qui se passe :

```
Application Web (navigateur)
├── ✅ App Check configuré (ReCaptcha V3)
├── ✅ Tokens générés automatiquement
└── ✅ Requêtes Firestore fonctionnent

Script Node.js
├── ❌ Pas d'App Check
├── ❌ Pas de token App Check
└── ❌ Requêtes Firestore BLOQUÉES
```

### Erreur typique :

```
Error: 7 PERMISSION_DENIED: App Check token is invalid
```

## ✅ Solutions

### Option 1 : Admin SDK (RECOMMANDÉ) ⭐

Le **Firebase Admin SDK** bypass automatiquement App Check car il est conçu pour les environnements serveur de confiance.

#### Étape 1 : Télécharger la clé de service

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. Paramètres du projet ⚙️
3. Comptes de service
4. Cliquez sur "Générer une nouvelle clé privée"
5. Téléchargez le fichier JSON
6. Renommez-le `firebase-service-account-key.json`
7. Placez-le à la **racine du projet**

⚠️ **IMPORTANT** : Ajoutez-le au `.gitignore` !

```bash
# Dans .gitignore
firebase-service-account-key.json
```

#### Étape 2 : Installer Admin SDK

```bash
npm install firebase-admin
```

#### Étape 3 : Utiliser la version Admin du script

```bash
# Créer le script admin
cp scripts/testOperationsComptables.js scripts/testOperationsComptables-admin.js
```

Modifiez le début du fichier :

```javascript
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Charger le service account
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

// ✅ Admin SDK bypass App Check automatiquement
```

#### Étape 4 : Adapter les fonctions Firestore

```javascript
// ❌ Client SDK
import { doc, setDoc } from "firebase/firestore";
await setDoc(doc(db, path), data);

// ✅ Admin SDK
await db.doc(path).set(data);
```

#### Étape 5 : Exécuter

```bash
node scripts/testOperationsComptables-admin.js
```

**Avantages** :
- ✅ Bypass App Check automatiquement
- ✅ Pas besoin de tokens
- ✅ Plus sécurisé (clé de service)
- ✅ Recommandé par Firebase pour les scripts

---

### Option 2 : Token de Debug App Check

Utilisez un **token de debug** pour Node.js.

#### Étape 1 : Obtenir un token de debug

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. App Check
3. Applications
4. Sélectionnez votre projet
5. Onglet "Debug tokens"
6. Cliquez sur "Add debug token"
7. Entrez un nom (ex: "node-script")
8. Copiez le token généré

#### Étape 2 : Ajouter le token dans .env

```env
APP_CHECK_DEBUG_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### Étape 3 : Configurer App Check dans le script

```javascript
import { initializeAppCheck, CustomProvider } from "firebase/app-check";

// Configuration App Check avec token de debug
if (process.env.APP_CHECK_DEBUG_TOKEN) {
  initializeAppCheck(app, {
    provider: new CustomProvider({
      getToken: () =>
        Promise.resolve({
          token: process.env.APP_CHECK_DEBUG_TOKEN,
          expireTimeMillis: Date.now() + 3600000,
        }),
    }),
    isTokenAutoRefreshEnabled: false,
  });
}
```

**Avantages** :
- ✅ Facile à configurer
- ✅ Garde le même code (Client SDK)

**Inconvénients** :
- ⚠️ Token de debug ne doit PAS être commité
- ⚠️ Moins sécurisé que Admin SDK
- ⚠️ Nécessite de gérer les tokens

---

### Option 3 : Désactiver temporairement App Check

Mode **"unenforced"** pour permettre les requêtes non vérifiées tout en monitorant.

#### Étape 1 : Mettre App Check en mode monitoring

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. App Check
3. Applications
4. Sélectionnez votre application
5. Onglet "Metrics"
6. Passez en mode **"Unenforced"** (monitoring only)

#### Étape 2 : Exécuter le script normalement

```bash
npm run test:operations
```

Le script fonctionnera, mais les tentatives seront **monitorées** dans les logs Firebase.

**Avantages** :
- ✅ Aucune modification du code nécessaire
- ✅ Continue de monitorer les requêtes

**Inconvénients** :
- ⚠️ Moins sécurisé pendant les tests
- ⚠️ Nécessite de repasser en mode "enforce" après

---

## 🎯 Recommandation

Pour **scripts et environnements serveur** :
### ⭐ Option 1 : Admin SDK

Pour **tests rapides en développement** :
### Option 2 ou 3

## 📋 Checklist

- [ ] Choisir l'option adaptée à votre cas
- [ ] Si Option 1 : Télécharger la clé de service
- [ ] Si Option 1 : Installer `firebase-admin`
- [ ] Si Option 1 : Ajouter la clé au `.gitignore`
- [ ] Si Option 2 : Créer un token de debug
- [ ] Si Option 2 : Ajouter le token au `.env`
- [ ] Si Option 3 : Passer App Check en mode "unenforced"
- [ ] Tester le script
- [ ] Vérifier les logs Firebase

## 🔍 Debugging

### Vérifier si App Check bloque

```javascript
try {
  await setDoc(doc(db, "test/test"), { test: true });
  console.log("✅ App Check OK");
} catch (error) {
  if (error.code === "app-check/invalid") {
    console.error("❌ App Check bloque les requêtes");
  }
}
```

### Voir le statut App Check dans Firebase Console

1. Firebase Console
2. App Check → Metrics
3. Regardez "Verified requests" vs "Unverified requests"

Si vous voyez beaucoup de **"Unverified requests"** pendant l'exécution du script, c'est que le script n'a pas App Check.

## 🚀 Exemple complet avec Admin SDK

```javascript
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { nanoid } from "nanoid";

// Charger le service account
const serviceAccount = JSON.parse(
  readFileSync("./firebase-service-account-key.json", "utf8")
);

// Initialiser Admin SDK (bypass App Check automatiquement)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.VITE_DATABASE_URL,
});

const db = admin.firestore();
const rtdb = admin.database();

// Fonction pour sauvegarder les opérations
async function sauvegarderOperationsJour(date, operations) {
  const dayKey = formatDayKey(date);
  const docPath = `comptabilite/historique/days/${dayKey}`;

  // Admin SDK syntax (différent du Client SDK)
  await db.doc(docPath).set({
    operations,
    lastUpdated: Date.now(),
  });

  // Trigger RTDB
  await rtdb.ref("comptabilite_trigger").push({
    action: "bulk_operations_test",
    dayKey,
    count: operations.length,
    timestamp: Date.now(),
  });

  console.log(`✅ ${dayKey}: ${operations.length} opérations sauvegardées`);
}
```

## 🔐 Sécurité

### ⚠️ Ne JAMAIS commiter :
- `firebase-service-account-key.json`
- Tokens de debug App Check dans le code

### ✅ Toujours ajouter au .gitignore :
```gitignore
# Firebase
firebase-service-account-key.json
.env
.env.local
```

### ✅ Pour la production :
- Utiliser Admin SDK avec variables d'environnement sécurisées
- Stocker la clé de service dans un secret manager (Google Secret Manager, etc.)
- Ne jamais exposer les clés côté client

---

**Besoin d'aide ?** Consultez la [documentation officielle Firebase App Check](https://firebase.google.com/docs/app-check)
