# Firebase Cloud Functions - Nettoyage des Notifications

Ce dossier contient un exemple de Firebase Cloud Function pour le nettoyage automatique des notifications.

## 📦 Contenu

- `index.js` - Point d'entrée principal
- `scheduledCleanup.js` - Fonction de nettoyage automatique
- `package.json` - Dépendances Node.js

## 🚀 Installation

### 1. Installer Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialiser Firebase Functions

```bash
# À la racine du projet
firebase init functions

# Sélectionner:
# - Use an existing project
# - JavaScript (ou TypeScript selon préférence)
# - ESLint: Yes
# - Install dependencies: Yes
```

### 3. Copier les fichiers

```bash
# Copier les fichiers de functions-example vers functions
cp functions-example/scheduledCleanup.js functions/
cp functions-example/index.js functions/

# Ou manuellement copier le contenu des fichiers
```

### 4. Installer les dépendances

```bash
cd functions
npm install firebase-admin firebase-functions
```

## 🎯 Déploiement

### Tester localement

```bash
# Depuis le dossier functions
npm run serve

# Ou depuis la racine
firebase emulators:start --only functions
```

### Déployer en production

```bash
# Déployer toutes les fonctions
firebase deploy --only functions

# Ou déployer uniquement la fonction de nettoyage
firebase deploy --only functions:cleanupOldNotifications
```

## 📋 Fonctions disponibles

### 1. `cleanupOldNotifications` (Schedulée)

**Déclenchement** : Automatique tous les jours à 3h du matin (Europe/Paris)

**Action** : Supprime les notifications de plus de 48H dans les nœuds `notification/` et `notifications/`

**Logs** :
```bash
firebase functions:log --only cleanupOldNotifications
```

### 2. `manualCleanupNotifications` (HTTP)

**URL** : `https://europe-west1-<project-id>.cloudfunctions.net/manualCleanupNotifications`

**Méthode** : GET ou POST

**Action** : Déclenche manuellement le nettoyage (utile pour tests)

**Exemple** :
```bash
curl https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/manualCleanupNotifications
```

⚠️ **Important** : Ajouter une authentification en production !

### 3. `getNotificationStats` (HTTP)

**URL** : `https://europe-west1-<project-id>.cloudfunctions.net/getNotificationStats`

**Méthode** : GET

**Action** : Retourne des statistiques sur les notifications

**Réponse** :
```json
{
  "timestamp": 1700000000000,
  "nodes": {
    "notification": {
      "total": 150,
      "recent": 120,
      "old": 30,
      "percentageOld": "20.0"
    },
    "notifications": {
      "total": 80,
      "recent": 75,
      "old": 5,
      "percentageOld": "6.3"
    }
  }
}
```

## 🔧 Configuration

### Changer le schedule

Dans `scheduledCleanup.js` :

```javascript
// Tous les jours à 3h
.pubsub.schedule('0 3 * * *')

// Toutes les 12 heures
.pubsub.schedule('0 */12 * * *')

// Tous les lundis à 4h
.pubsub.schedule('0 4 * * 1')
```

### Changer la période de rétention

Dans `scheduledCleanup.js` :

```javascript
// 48 heures (défaut)
const RETENTION_PERIOD_MS = 48 * 60 * 60 * 1000;

// 24 heures
const RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000;

// 7 jours
const RETENTION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
```

### Changer la région

Dans `scheduledCleanup.js` :

```javascript
// Europe de l'Ouest (Paris)
.region('europe-west1')

// Europe Centrale (Belgique)
.region('europe-west1')

// USA Est
.region('us-east1')
```

## 📊 Monitoring

### Voir les logs

```bash
# Tous les logs
firebase functions:log

# Logs d'une fonction spécifique
firebase functions:log --only cleanupOldNotifications

# Logs en temps réel
firebase functions:log --only cleanupOldNotifications --follow
```

### Firebase Console

1. Aller sur https://console.firebase.google.com
2. Sélectionner le projet
3. Functions > Logs
4. Filtrer par fonction

### Alertes

Configurer des alertes dans Firebase Console :
- Functions > Usage
- Metrics > Create Alert

## 💰 Coûts

### Estimations (Plan Blaze)

**Fonction schedulée** :
- Exécutions : 30/mois (1x par jour)
- Durée moyenne : ~2 secondes
- Mémoire : 256 MB
- **Coût estimé** : ~0.40$/mois (gratuit sous quota)

**Quota gratuit Firebase** :
- 2M invocations/mois
- 400,000 GB-secondes
- 200,000 CPU-secondes

→ Largement suffisant pour cette fonction !

## 🔒 Sécurité

### Règles Firebase RTDB

Ajouter les index requis dans `database.rules.json` :

```json
{
  "rules": {
    "notification": {
      ".indexOn": ["timestamp"]
    },
    "notifications": {
      ".indexOn": ["timestamp"]
    }
  }
}
```

Déployer :
```bash
firebase deploy --only database
```

### Authentification HTTP

Pour les fonctions HTTP (`manualCleanupNotifications`, `getNotificationStats`), ajouter une authentification :

```javascript
exports.manualCleanupNotifications = functions
  .https.onRequest(async (req, res) => {
    // Vérifier le token
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token || token !== process.env.CLEANUP_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ... reste du code
  });
```

Définir la variable d'environnement :
```bash
firebase functions:config:set cleanup.token="VOTRE_TOKEN_SECRET"
```

## 🧪 Tests

### Test local

```bash
# Démarrer l'émulateur
firebase emulators:start --only functions

# Dans un autre terminal
curl http://localhost:5001/YOUR_PROJECT_ID/europe-west1/manualCleanupNotifications
```

### Test en production (avec précaution)

```bash
# Déclencher manuellement
firebase functions:call cleanupOldNotifications
```

## 🆘 Dépannage

### Erreur "Permission denied"

**Solution** : Vérifier les règles Firebase et les permissions du compte service

```bash
firebase projects:list
firebase use YOUR_PROJECT_ID
```

### Fonction ne s'exécute pas

**Vérifications** :
1. La fonction est bien déployée : `firebase functions:list`
2. Le schedule est correct (timezone, cron)
3. Voir les logs : `firebase functions:log`

### Timeout

**Solution** : Augmenter le timeout dans `runWith()` :

```javascript
.runWith({
  timeoutSeconds: 300, // 5 minutes max
  memory: '512MB',
})
```

## 📚 Documentation

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Cron Syntax](https://crontab.guru/)

## 🔗 Ressources

- Guide complet : Voir `../NOTIFICATION_CLEANUP_GUIDE.md`
- Solution client : Voir `../src/utils/notificationCleanup.js`
