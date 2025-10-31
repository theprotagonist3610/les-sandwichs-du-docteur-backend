# 🔐 Configuration des règles de sécurité Firebase

Ce document explique comment configurer et déployer les règles de sécurité Firebase pour votre application "Les Sandwichs du Docteur".

## 📁 Fichiers de configuration

### Règles de sécurité
- **`firestore.rules`** - Règles de sécurité pour Firestore
- **`database.rules.json`** - Règles de sécurité pour Realtime Database
- **`firebase.json`** - Configuration Firebase (inclut les chemins vers les règles)

### Documentation
- **`SECURITY_RULES_SUMMARY.md`** - Résumé détaillé des règles et permissions
- **`FIREBASE_RULES_README.md`** - Ce fichier (guide de déploiement)

### Scripts de déploiement
- **`deploy-rules.sh`** - Script bash pour Linux/Mac
- **`deploy-rules.ps1`** - Script PowerShell pour Windows

## 🚀 Déploiement rapide

### Option 1 : Utiliser les scripts

#### Sur Windows (PowerShell)
```powershell
# Test (simulation)
.\deploy-rules.ps1 -DryRun

# Déploiement réel
.\deploy-rules.ps1
```

#### Sur Linux/Mac (Bash)
```bash
# Rendre le script exécutable
chmod +x deploy-rules.sh

# Test (simulation)
./deploy-rules.sh --dry-run

# Déploiement réel
./deploy-rules.sh
```

### Option 2 : Commandes Firebase CLI

```bash
# Test des règles Firestore
firebase deploy --only firestore:rules --dry-run

# Test des règles RTDB
firebase deploy --only database --dry-run

# Déploiement réel
firebase deploy --only firestore:rules
firebase deploy --only database
```

## 📋 Prérequis

### 1. Installer Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Se connecter à Firebase
```bash
firebase login
```

### 3. Sélectionner le projet
```bash
# Lister les projets disponibles
firebase projects:list

# Sélectionner votre projet
firebase use <project-id>

# Ou ajouter un alias
firebase use --add
```

## 🔍 Vérification des règles

### Avant déploiement

1. **Vérifier la syntaxe** :
   ```bash
   firebase deploy --only firestore:rules --dry-run
   firebase deploy --only database --dry-run
   ```

2. **Tester dans la console Firebase** :
   - Allez sur [Firebase Console](https://console.firebase.google.com/)
   - Sélectionnez votre projet
   - Firestore Database → Règles → Tester

### Après déploiement

1. **Vérifier dans la console** :
   - Firestore Database → Règles
   - Realtime Database → Règles

2. **Surveiller les logs** :
   - Cloud Logging → Firestore
   - Rechercher les erreurs `PERMISSION_DENIED`

## 🎯 Structure des permissions

### Firestore

| Collection | Lecture | Écriture | Notes |
|------------|---------|----------|-------|
| `users/*` | Propriétaire ou Admin | Propriétaire | Profils utilisateurs |
| `emplacements/*` | Authentifié | Admin | Gestion des emplacements |
| `stock/*` | Authentifié | Admin | Gestion du stock |
| `menus/*` | Authentifié | Admin | Gestion des menus |
| `boissons/*` | Authentifié | Admin | Gestion des boissons |
| `commandes/*` | Authentifié | Admin | Gestion des commandes |
| Autres | Authentifié | Admin | Collections générales |

### Realtime Database

| Nœud | Lecture | Écriture | Notes |
|------|---------|----------|-------|
| `notification/` | Authentifié | Authentifié | Notifications temps réel |
| `presence/` | Authentifié | Authentifié | Présence en ligne |
| `todos/` | Authentifié | Authentifié | Gestion des tâches |
| `users/` | Propriétaire ou Admin | Propriétaire | Profils RTDB |

## 🧪 Tests de sécurité

### Test 1 : Admin peut créer un emplacement
```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// En tant qu'admin
const emplacementRef = doc(db, 'emplacements/liste');
await setDoc(emplacementRef, {
  emplacements: [/* ... */]
});
// ✅ Devrait réussir
```

### Test 2 : User authentifié peut lire le stock
```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// En tant qu'utilisateur authentifié
const stockRef = doc(db, 'stock/resume');
const stockSnap = await getDoc(stockRef);
// ✅ Devrait réussir
```

### Test 3 : User authentifié ne peut pas modifier le stock
```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// En tant qu'utilisateur authentifié (non admin)
const stockRef = doc(db, 'stock/resume');
await setDoc(stockRef, { /* ... */ });
// ❌ Devrait échouer avec PERMISSION_DENIED
```

### Test 4 : User peut créer une notification RTDB
```javascript
import { ref, push } from 'firebase/database';
import { rtdb, auth } from './firebase';

// En tant qu'utilisateur authentifié
const notifRef = ref(rtdb, 'notification');
await push(notifRef, {
  userId: auth.currentUser.uid,
  title: 'Test',
  message: 'Message de test',
  timestamp: Date.now()
});
// ✅ Devrait réussir
```

## 🔧 Dépannage

### Erreur : "No currently active project"
**Solution** :
```bash
firebase use --add
# Sélectionnez votre projet dans la liste
```

### Erreur : "PERMISSION_DENIED"
**Causes possibles** :
1. L'utilisateur n'est pas authentifié
2. L'utilisateur n'a pas le rôle admin (pour les opérations d'écriture)
3. Les règles n'ont pas été déployées

**Solution** :
```bash
# Vérifier l'état des règles
firebase deploy --only firestore:rules --dry-run

# Redéployer si nécessaire
firebase deploy --only firestore:rules
firebase deploy --only database
```

### Erreur de syntaxe dans les règles
**Solution** :
1. Vérifier la syntaxe dans `firestore.rules` ou `database.rules.json`
2. Utiliser le simulateur dans Firebase Console
3. Tester avec `--dry-run` avant de déployer

### Les modifications ne sont pas prises en compte
**Solution** :
1. Vérifier que les règles ont bien été déployées
2. Attendre quelques minutes (propagation)
3. Vider le cache du navigateur
4. Recharger l'application

## 📊 Monitoring

### Métriques à surveiller

1. **Taux d'erreurs PERMISSION_DENIED**
   - Alert si > 5% des requêtes échouent

2. **Taille de la queue d'opérations**
   - Alert si > 100 opérations pending
   - Voir `stock/operationsQueue`

3. **Notifications non lues**
   - Alert si > 1000 par utilisateur
   - Nettoyer régulièrement

### Cloud Logging

Requête pour trouver les erreurs de permissions :
```
resource.type="cloud_firestore_database"
protoPayload.status.code=7
```

## 🔄 Mise à jour des règles

### Workflow recommandé

1. **Modifier les règles localement**
   - `firestore.rules` ou `database.rules.json`

2. **Tester en mode simulation**
   ```bash
   firebase deploy --only firestore:rules --dry-run
   firebase deploy --only database --dry-run
   ```

3. **Déployer sur un environnement de test** (si disponible)
   ```bash
   firebase use test-env
   firebase deploy --only firestore:rules,database
   ```

4. **Valider avec des tests**
   - Exécuter les tests de sécurité
   - Vérifier les logs

5. **Déployer en production**
   ```bash
   firebase use production
   firebase deploy --only firestore:rules,database
   ```

6. **Surveiller les logs**
   - Vérifier qu'il n'y a pas d'erreurs PERMISSION_DENIED inattendues

## 📚 Ressources

### Documentation officielle
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Realtime Database Rules](https://firebase.google.com/docs/database/security)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

### Documentation du projet
- [`SECURITY_RULES_SUMMARY.md`](./SECURITY_RULES_SUMMARY.md) - Résumé détaillé des règles
- [`emplacementToolkit.jsx`](./src/toolkits/admin/emplacementToolkit.jsx) - Gestion des emplacements
- [`stockToolkit.jsx`](./src/toolkits/admin/stockToolkit.jsx) - Gestion du stock

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] Les règles ont été testées en mode `--dry-run`
- [ ] Les tests de sécurité passent tous
- [ ] La documentation est à jour
- [ ] L'équipe a été notifiée
- [ ] Un backup des anciennes règles existe
- [ ] Le monitoring est en place
- [ ] Les logs sont configurés

## 🆘 Support

En cas de problème :

1. Consulter [`SECURITY_RULES_SUMMARY.md`](./SECURITY_RULES_SUMMARY.md)
2. Vérifier les logs dans Cloud Logging
3. Tester dans le simulateur Firebase Console
4. Consulter la documentation officielle Firebase

---

**Dernière mise à jour** : 2025-10-26
**Version des règles** : 1.0
**Compatible avec** : Firebase SDK v10+
