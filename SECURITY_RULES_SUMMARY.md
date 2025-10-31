# Résumé des règles de sécurité Firebase

Ce document récapitule les règles de sécurité configurées pour votre application "Les Sandwichs du Docteur".

## 📋 Structure des données

### Firestore

#### Collection `emplacements/`
- `emplacements/liste` - Document unique contenant l'array des emplacements
- `emplacements/operations/{DDMMYYYY}` - Documents journaliers des opérations
- Permissions :
  - **Lecture** : Tous utilisateurs authentifiés
  - **Écriture** : Admins uniquement

#### Collection `stock/`
- `stock/liste` - Document unique avec array d'éléments de stock
- `stock/resume` - Document unique avec map des éléments (indexés par ID)
- `stock/emplacements` - Document unique avec map des emplacements et leur stock
- `stock/transactions/{DDMMYYYY}` - Documents journaliers de transactions
- `stock/operationsQueue` - Queue d'opérations en attente
- `stock/queueMetadata` - Métadonnées de gestion de la queue
- Permissions :
  - **Lecture** : Tous utilisateurs authentifiés
  - **Écriture** : Admins uniquement

#### Autres collections
- `preusers/`, `users/`, `menus/`, `boissons/`, `commandes/`, `adresses/`, `comptabilite/`, `statistiques/`, `livraisons/`, `productions/`
- Permissions similaires : Lecture authentifiée, Écriture admin

### Realtime Database (RTDB)

#### Nœud `notification/`
Utilisé pour les notifications en temps réel par les toolkits
- **Structure** :
  ```json
  {
    "userId": "string",
    "userName": "string (optionnel)",
    "title": "string (max 100 caractères)",
    "message": "string (max 500 caractères)",
    "type": "info|warning|error|success",
    "timestamp": "number",
    "read": "boolean (optionnel)"
  }
  ```
- **Permissions** :
  - **Lecture** : Tous utilisateurs authentifiés
  - **Écriture** : Tous utilisateurs authentifiés

#### Nœud `presence/`
Gestion de la présence en ligne des utilisateurs
- **Structure** :
  ```json
  {
    "userId": "string",
    "userName": "string (optionnel)",
    "status": "online|offline|away",
    "updatedAt": "number"
  }
  ```
- **Permissions** :
  - **Lecture** : Tous utilisateurs authentifiés
  - **Écriture** : Tous utilisateurs authentifiés

#### Nœud `todos/`
Gestion des tâches
- **Permissions** :
  - **Lecture** : Tous utilisateurs authentifiés
  - **Écriture** : Tous utilisateurs authentifiés

#### Nœud `users/`
Profils utilisateurs dans RTDB
- **Permissions** :
  - **Lecture** : Propriétaire ou admin
  - **Écriture** : Propriétaire uniquement
- **Rôles supportés** : `admin`, `user`, `superviseur`, `vendeur`, `cuisinier`, `livreur`

## 🔐 Fonctions de sécurité (Firestore)

### `isAuthenticated()`
Vérifie si l'utilisateur est connecté
```javascript
request.auth != null
```

### `isAdmin()`
Vérifie si l'utilisateur a le rôle admin
```javascript
isAuthenticated() &&
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
```

### `isOwner(userId)`
Vérifie si l'utilisateur est propriétaire du document
```javascript
isAuthenticated() && request.auth.uid == userId
```

## ⚙️ Système de transactions atomiques

### emplacementToolkit.jsx
Utilise `runTransaction()` de Firestore pour garantir l'atomicité des opérations :
1. Lecture de `emplacements/liste` et `stock/emplacements`
2. Modification des données
3. Écriture atomique

### stockToolkit.jsx
Utilise un **système de queue** pour éviter les collisions :
1. Ajout d'opérations à `stock/operationsQueue`
2. Exécution séquentielle via `runTransaction()`
3. Validation des quantités non-négatives
4. Nettoyage automatique quotidien

## 🧪 Tests recommandés

### Firestore

#### Test 1 : Admin - Créer un emplacement
```javascript
// Devrait réussir ✓
const emplacementRef = doc(db, 'emplacements/liste');
await setDoc(emplacementRef, { emplacements: [...] });
```

#### Test 2 : Admin - Transaction de stock
```javascript
// Devrait réussir ✓
await runTransaction(db, async (transaction) => {
  const queueRef = doc(db, 'stock/operationsQueue');
  // ... modifications
});
```

#### Test 3 : User authentifié - Lire le stock
```javascript
// Devrait réussir ✓
const stockRef = doc(db, 'stock/resume');
const stockSnap = await getDoc(stockRef);
```

#### Test 4 : User authentifié - Modifier le stock
```javascript
// Devrait échouer (PERMISSION_DENIED) ✗
const stockRef = doc(db, 'stock/resume');
await setDoc(stockRef, { ... }); // ERREUR
```

#### Test 5 : Non authentifié - Lire le stock
```javascript
// Devrait échouer (PERMISSION_DENIED) ✗
const stockRef = doc(db, 'stock/resume');
await getDoc(stockRef); // ERREUR
```

### Realtime Database

#### Test 6 : User authentifié - Créer notification
```javascript
// Devrait réussir ✓
const notifRef = ref(rtdb, 'notification');
await push(notifRef, {
  userId: auth.currentUser.uid,
  title: 'Test',
  message: 'Message de test',
  timestamp: Date.now()
});
```

#### Test 7 : User authentifié - Lire notifications
```javascript
// Devrait réussir ✓
const notifRef = ref(rtdb, 'notification');
onValue(notifRef, (snapshot) => {
  console.log(snapshot.val());
});
```

## 🚀 Déploiement

### Étape 1 : Vérifier les règles
```bash
# Simulation (dry-run)
firebase deploy --only firestore:rules --dry-run
firebase deploy --only database --dry-run
```

### Étape 2 : Déployer en production
```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les règles RTDB
firebase deploy --only database
```

### Étape 3 : Vérifier dans la console
1. Accéder à [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet
3. Firestore Database → Règles
4. Realtime Database → Règles

## 📊 Monitoring

### Logs à surveiller
1. Erreurs `PERMISSION_DENIED` dans Cloud Logging
2. Opérations d'écriture sur `stock/*` et `emplacements/*`
3. Taille de `stock/operationsQueue`
4. Fréquence des notifications RTDB

### Alertes recommandées
- Alert si > 100 opérations pending dans la queue
- Alert si taux d'échec > 5% sur les transactions
- Alert si > 1000 notifications non lues par utilisateur

## 🔄 Intégration avec les toolkits

### emplacementToolkit.jsx
- Crée/Met à jour : `emplacements/liste`, `stock/emplacements`
- Lit : `emplacements/liste`, `stock/emplacements`
- Écoute : `notification/` (RTDB) pour les mises à jour temps réel

### stockToolkit.jsx
- Crée/Met à jour : `stock/liste`, `stock/resume`, `stock/emplacements`, `stock/transactions/{date}`, `stock/operationsQueue`
- Lit : Tous les documents `stock/*`
- Écoute : `notification/` (RTDB) pour les mises à jour temps réel

## ✅ Points de validation

### Firestore
- ✅ Les admins peuvent créer/modifier/supprimer
- ✅ Les users authentifiés peuvent lire
- ✅ Les users non authentifiés sont bloqués
- ✅ Les transactions atomiques sont supportées
- ✅ Validation des timestamps

### RTDB
- ✅ Les users authentifiés peuvent lire/écrire les notifications
- ✅ Validation stricte de la structure des données
- ✅ Limite de longueur sur les champs texte
- ✅ Support de tous les rôles utilisateurs

## 📝 Notes importantes

1. **Rôle admin** : Le rôle `admin` est vérifié dans `users/{uid}.role` (Firestore)
2. **Transactions atomiques** : Les `runTransaction()` nécessitent les permissions `create` + `update`
3. **Nettoyage automatique** : La queue d'opérations se nettoie automatiquement chaque jour
4. **Cache local** : Les toolkits utilisent localStorage pour améliorer les performances
5. **Notifications temps réel** : RTDB est utilisé pour notifier les changements instantanément

## 🛠️ Maintenance

### Vérification régulière
- [ ] Auditer les logs de permissions
- [ ] Vérifier la taille de la queue d'opérations
- [ ] Surveiller les transactions échouées
- [ ] Nettoyer les anciennes notifications RTDB

### Optimisations possibles
- Ajouter des index Firestore pour les requêtes fréquentes
- Implémenter un TTL sur les notifications RTDB
- Archiver les anciennes transactions de stock
- Compresser les données dans localStorage

---

**Date de création** : 2025-10-26
**Version** : 1.0
**Compatible avec** :
- `emplacementToolkit.jsx` (admin)
- `stockToolkit.jsx` (admin)
