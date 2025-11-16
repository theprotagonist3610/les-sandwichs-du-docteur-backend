# Guide de Nettoyage des Notifications

Ce guide explique le système de nettoyage automatique des notifications RTDB.

## 📋 Vue d'ensemble

Le système supprime automatiquement les notifications de **plus de 48 heures** dans les nœuds RTDB :
- `notification/`
- `notifications/`

## 🎯 Cycle de vie des notifications

```
┌─────────────────────────────────────────────────────┐
│ 1. CRÉATION                                         │
│    - Notification ajoutée dans RTDB                 │
│    - timestamp: Date.now()                          │
│    - read: false                                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│ 2. AFFICHAGE (0-48H)                                │
│    - Visible dans NotificationCenter                │
│    - Visible dans Timeline                          │
│    - Peut être marquée comme lue                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│ 3. NETTOYAGE (> 48H)                                │
│    - Suppression automatique                        │
│    - Exécuté toutes les 48H                         │
│    - Appliqué aux 2 nœuds RTDB                      │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Solution 1 : Nettoyage côté client (Implémenté)

### Fichiers créés

- **`src/utils/notificationCleanup.js`** - Service de nettoyage
- **`src/hooks/useNotificationCleanup.js`** - Hook React automatique
- **`src/pages/admin/dashboard/Dashboard.jsx`** - Intégration dans le dashboard

### Fonctionnement

1. **Au montage du Dashboard** : Vérification immédiate si nettoyage nécessaire
2. **Toutes les 1 heure** : Vérification périodique
3. **Si dernière exécution > 48H** : Nettoyage automatique

### Avantages ✅

- Aucune configuration supplémentaire requise
- Fonctionne immédiatement
- Simple à maintenir
- Logs détaillés dans la console

### Inconvénients ❌

- Ne fonctionne que quand un admin ouvre le dashboard
- Peut avoir des exécutions concurrentes (inoffensif)
- Dépend de l'activité des utilisateurs

### Configuration

```javascript
// Dans Dashboard.jsx
useNotificationCleanup({
  enabled: true,              // Activer le nettoyage
  runOnMount: true,           // Vérifier au montage
  checkInterval: 3600000,     // Vérifier toutes les 1H (optionnel)
  onCleanupComplete: (stats) => {
    console.log('Nettoyage terminé:', stats);
  }
});
```

### API disponibles

```javascript
import {
  cleanupOldNotifications,     // Nettoie les notifications > 48H
  shouldRunCleanup,            // Vérifie si nettoyage nécessaire
  getLastCleanupDate,          // Date du dernier nettoyage
  getTimeUntilNextCleanup,     // Temps avant prochain nettoyage
  forceCleanup,                // Force le nettoyage immédiat
} from '@/utils/notificationCleanup';

// Exemple : Nettoyage manuel
const stats = await forceCleanup();
console.log(`${stats.totalDeleted} notifications supprimées`);
```

## 🚀 Solution 2 : Firebase Cloud Functions (Recommandé pour production)

### Prérequis

```bash
npm install -g firebase-tools
firebase init functions
cd functions
npm install firebase-admin firebase-functions
```

### Fonction Cloud (exemple)

Créer le fichier `functions/src/scheduledCleanup.js` :

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialiser si pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

/**
 * Fonction Cloud exécutée tous les jours à 3h du matin
 * Supprime les notifications de plus de 48H
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 3 * * *') // Cron : tous les jours à 3h
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    console.log('🧹 Démarrage du nettoyage des notifications...');

    const now = Date.now();
    const cutoffTimestamp = now - (48 * 60 * 60 * 1000); // 48H
    const cutoffDate = new Date(cutoffTimestamp);

    console.log(`📅 Suppression des notifications avant: ${cutoffDate.toISOString()}`);

    const paths = ['notification', 'notifications'];
    let totalDeleted = 0;

    for (const path of paths) {
      try {
        const ref = db.ref(path);

        // Récupérer les notifications anciennes
        const snapshot = await ref
          .orderByChild('timestamp')
          .endAt(cutoffTimestamp)
          .once('value');

        if (!snapshot.exists()) {
          console.log(`✨ ${path}: Aucune notification à supprimer`);
          continue;
        }

        const toDelete = snapshot.val();
        const keys = Object.keys(toDelete);

        console.log(`🗑️  ${path}: ${keys.length} notification(s) à supprimer`);

        // Supprimer en batch
        const updates = {};
        keys.forEach(key => {
          updates[`${path}/${key}`] = null;
        });

        await db.ref().update(updates);

        totalDeleted += keys.length;
        console.log(`✅ ${path}: ${keys.length} notification(s) supprimée(s)`);
      } catch (error) {
        console.error(`❌ Erreur nettoyage ${path}:`, error);
      }
    }

    console.log(`✅ Nettoyage terminé: ${totalDeleted} notification(s) supprimée(s)`);
    return { totalDeleted, timestamp: now };
  });
```

### Déploiement

```bash
# Tester localement
firebase emulators:start

# Déployer en production
firebase deploy --only functions:cleanupOldNotifications
```

### Avantages ✅

- **Fiable** : S'exécute même si personne n'est connecté
- **Prévisible** : Exécution à heure fixe (3h du matin)
- **Performant** : Suppression en batch
- **Scalable** : Géré par Google Cloud
- **Logs** : Disponibles dans Firebase Console

### Inconvénients ❌

- Nécessite configuration Firebase Functions
- Coût potentiel (très faible pour cette tâche)
- Déploiement séparé

## 📊 Règles Firebase requises

Pour que le nettoyage fonctionne, ajouter un index dans `database.rules.json` :

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

Déployer les règles :
```bash
firebase deploy --only database
```

## 🔍 Monitoring

### Console logs

**Client (Solution 1)** :
```
🔍 useNotificationCleanup: Vérification si nettoyage nécessaire...
✅ useNotificationCleanup: Nettoyage nécessaire
🧹 Démarrage du nettoyage des notifications...
📅 Suppression des notifications avant: 14/11/2025, 12:00:00
🔍 Analyse du nœud: notification
🗑️  notification: 15 notification(s) à supprimer
✅ notification: 15 notification(s) supprimée(s)
🔍 Analyse du nœud: notifications
✨ notifications: Aucune notification à supprimer
✅ Nettoyage terminé en 1.23s
📊 Statistiques: { total: 15, details: { notification: 15, notifications: 0 } }
```

**Cloud Functions (Solution 2)** :
Voir dans Firebase Console > Functions > Logs

### Vérifier manuellement

```javascript
import { getLastCleanupDate, getTimeUntilNextCleanup } from '@/utils/notificationCleanup';

// Quand a eu lieu le dernier nettoyage ?
const lastCleanup = getLastCleanupDate();
console.log('Dernier nettoyage:', lastCleanup);

// Temps avant le prochain nettoyage
const timeUntil = getTimeUntilNextCleanup();
const hoursUntil = (timeUntil / (1000 * 60 * 60)).toFixed(1);
console.log(`Prochain nettoyage dans ${hoursUntil}h`);
```

## 🎛️ Configuration avancée

### Changer la période de rétention

Dans `src/utils/notificationCleanup.js` :

```javascript
// 48 heures (défaut)
const RETENTION_PERIOD_MS = 48 * 60 * 60 * 1000;

// Exemples alternatives :
// 24 heures
const RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000;

// 7 jours
const RETENTION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

// 30 jours
const RETENTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
```

### Changer la fréquence de vérification

Dans `src/hooks/useNotificationCleanup.js` :

```javascript
// Vérifier toutes les 30 minutes
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

// Ou directement dans l'appel du hook
useNotificationCleanup({
  checkInterval: 30 * 60 * 1000, // 30 minutes
});
```

### Désactiver temporairement

```javascript
// Dans Dashboard.jsx
useNotificationCleanup({
  enabled: false, // Désactiver complètement
});
```

## 🧪 Tests

### Test manuel depuis la console

```javascript
// Ouvrir la console du navigateur sur le dashboard
import { forceCleanup } from '@/utils/notificationCleanup';

// Forcer un nettoyage immédiat
const stats = await forceCleanup();
console.log(stats);
// { totalDeleted: 42, deletedByNode: { notification: 30, notifications: 12 }, ... }
```

### Créer des notifications de test

```javascript
import { ref, push } from 'firebase/database';
import { rtdb } from '@/firebase.js';

// Créer une notification expirée (50h dans le passé)
const testNotif = {
  title: 'Test notification ancienne',
  message: 'Cette notification devrait être supprimée',
  timestamp: Date.now() - (50 * 60 * 60 * 1000), // 50h passé
  read: false,
};

await push(ref(rtdb, 'notification'), testNotif);
console.log('Notification de test créée');
```

## 📈 Recommandations

### Pour le développement
✅ Utiliser **Solution 1** (côté client)
- Simple à déboguer
- Pas de configuration supplémentaire
- Logs directs dans la console

### Pour la production
✅ Utiliser **Solution 2** (Cloud Functions)
- Plus fiable
- Exécution garantie
- Meilleure performance
- Monitoring centralisé

### Compromis
✅ Utiliser **les deux**
- Cloud Function comme méthode principale
- Client comme backup (si CF échoue)
- Redondance = fiabilité

## 🆘 Dépannage

### Le nettoyage ne s'exécute pas

1. Vérifier que `enabled: true` dans le hook
2. Vérifier les logs dans la console
3. Vérifier la dernière exécution : `getLastCleanupDate()`
4. Forcer le nettoyage : `forceCleanup()`

### Erreur "Permission denied"

- Vérifier les règles Firebase RTDB
- L'utilisateur doit avoir les permissions d'écriture sur `notification/` et `notifications/`

### Erreur "Index not defined"

- Ajouter l'index `timestamp` dans les règles RTDB (voir section Règles Firebase)

### Les anciennes notifications ne sont pas supprimées

- Vérifier que `timestamp` existe dans les notifications
- Vérifier que le format est bien un nombre (millisecondes depuis epoch)
- Vérifier les logs pour voir si une erreur s'est produite

## 📝 Notes importantes

1. **LocalStorage** : Le tracking de la dernière exécution utilise `localStorage`. Si l'utilisateur vide son cache, le nettoyage sera ré-exécuté.

2. **Concurrence** : Si plusieurs admins sont connectés simultanément, ils peuvent tous déclencher le nettoyage. Ce n'est pas un problème car Firebase RTDB gère la concurrence.

3. **Performance** : Pour des milliers de notifications, préférer la Solution 2 (Cloud Functions) qui supporte les suppressions en batch.

4. **Backup** : Avant de déployer en production, considérer faire un backup des notifications existantes.

## 🔗 Liens utiles

- [Firebase Realtime Database Rules](https://firebase.google.com/docs/database/security)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
