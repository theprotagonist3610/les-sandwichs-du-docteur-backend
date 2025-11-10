# 🟢 Système de Présence Robuste

## Problème résolu

Avant, la présence utilisateur était seulement mise à jour au `login` et au `logout`. Si un utilisateur fermait simplement la page ou perdait sa connexion internet, il restait marqué comme "online" indéfiniment.

## Solution implémentée

Le nouveau système de présence combine **4 techniques** pour détecter de manière fiable si un utilisateur est vraiment connecté et actif :

### 1. **onDisconnect de Firebase RTDB**
Détecte automatiquement la perte de connexion réseau et marque l'utilisateur comme "offline"

### 2. **Heartbeat périodique**
Envoie un signal toutes les 30 secondes pour mettre à jour le timestamp `lastSeen`

### 3. **Event beforeunload**
Tente de marquer l'utilisateur comme "offline" lors de la fermeture de page/onglet

### 4. **Timestamp lastSeen**
Permet de vérifier si un utilisateur est réellement actif (dernier heartbeat < 90 secondes)

---

## 🚀 Utilisation

### Option 1 : Utilisation automatique (Recommandé)

La fonction `loginUser()` configure **automatiquement** tout le système :

```jsx
import { loginUser } from './toolkits/admin/userToolkit.jsx';

// Dans votre composant de login
const handleLogin = async () => {
  try {
    await loginUser(
      email,
      password,
      navigate,
      '/dashboard',
      {
        enableHeartbeat: true,      // Active le heartbeat (défaut: true)
        heartbeatInterval: 30000    // Intervalle en ms (défaut: 30s)
      }
    );

    // L'utilisateur est maintenant :
    // ✅ Connecté
    // ✅ Marqué comme "online"
    // ✅ Heartbeat démarré
    // ✅ onDisconnect configuré
    // ✅ beforeunload configuré
  } catch (error) {
    console.error(error);
  }
};
```

### Option 2 : Utilisation avec le Hook usePresenceManager

Pour gérer automatiquement la présence dans votre App :

```jsx
import { usePresenceManager } from './toolkits/admin/userToolkit.jsx';

function App() {
  // Active la gestion automatique de présence
  const { isActive, lastSeen, error } = usePresenceManager({
    enabled: true,
    heartbeatInterval: 30000  // 30 secondes
  });

  return (
    <div>
      <p>Statut: {isActive ? '🟢 Actif' : '🔴 Inactif'}</p>
      {lastSeen && (
        <p>Dernière activité: {new Date(lastSeen).toLocaleString()}</p>
      )}
    </div>
  );
}
```

### Option 3 : Gestion manuelle (Avancé)

Si vous avez besoin de contrôle total :

```jsx
import {
  setupPresenceSystem,
  startHeartbeat,
  stopHeartbeat
} from './toolkits/admin/userToolkit.jsx';

// Au login
const userId = auth.currentUser.uid;
const userName = "John Doe";

// Configurer le système
await setupPresenceSystem(userId, userName);

// Démarrer le heartbeat
startHeartbeat(userId, 30000);

// Au logout ou démontage du composant
stopHeartbeat();
```

---

## 📊 Afficher les utilisateurs réellement actifs

Le hook `useUserMetrics` a été amélioré pour distinguer les utilisateurs "online" des utilisateurs **vraiment actifs** :

```jsx
import { useUserMetrics } from './toolkits/admin/userToolkit.jsx';

function Dashboard() {
  const { metrics, loading } = useUserMetrics({
    activityThreshold: 90000  // 90 secondes
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Statistiques Utilisateurs</h2>
      <p>Total: {metrics.total}</p>
      <p>Marqués online: {metrics.online}</p>
      <p>🟢 Vraiment actifs: {metrics.reallyOnline}</p>
      <p>Offline: {metrics.offline}</p>
    </div>
  );
}
```

### Vérifier si un utilisateur spécifique est actif

```jsx
import { isUserActive } from './toolkits/admin/userToolkit.jsx';

function UserCard({ user }) {
  const active = isUserActive(user.presence, 90000);

  return (
    <div>
      <h3>{user.nom}</h3>
      <span>{active ? '🟢 Actif' : '⚪ Inactif'}</span>
    </div>
  );
}
```

---

## 🔧 Configuration

### Modifier l'intervalle du heartbeat

```jsx
// Heartbeat toutes les 60 secondes au lieu de 30
await loginUser(email, password, navigate, '/dashboard', {
  enableHeartbeat: true,
  heartbeatInterval: 60000
});
```

### Modifier le seuil d'activité

```jsx
// Considérer inactif après 2 minutes (120 secondes)
const { metrics } = useUserMetrics({
  activityThreshold: 120000
});

// Vérifier avec un seuil personnalisé
const active = isUserActive(presence, 120000);
```

---

## 📝 Schéma de présence mis à jour

Le schéma de présence inclut maintenant le champ `lastSeen` :

```javascript
{
  userId: "abc123",
  status: "online",      // "online" | "offline" | "away"
  updatedAt: 1234567890, // Timestamp de la dernière mise à jour
  lastSeen: 1234567890,  // 🆕 Timestamp du dernier heartbeat
  userName: "John Doe"   // Optionnel
}
```

---

## 🎯 Cas d'utilisation

### 1. Utilisateur ferme la page normalement

1. Event `beforeunload` déclenché
2. Présence mise à "offline" immédiatement
3. ✅ Fonctionne instantanément

### 2. Utilisateur ferme brutalement (crash, fermeture forcée)

1. `beforeunload` peut ne pas se déclencher
2. Connexion Firebase perdue
3. `onDisconnect` détecte la perte de connexion
4. Présence mise à "offline" automatiquement
5. ✅ Fonctionne en quelques secondes

### 3. Utilisateur perd sa connexion internet

1. Heartbeat ne peut plus être envoyé
2. Connexion Firebase perdue
3. `onDisconnect` détecte la perte de connexion
4. Présence mise à "offline" automatiquement
5. ✅ Fonctionne en quelques secondes

### 4. Page reste ouverte mais utilisateur inactif

1. Heartbeat continue à s'envoyer
2. `lastSeen` mis à jour toutes les 30s
3. L'utilisateur reste "online"
4. Mais `isUserActive()` peut détecter l'inactivité basée sur d'autres critères
5. ✅ Permet de distinguer "connecté" vs "actif"

---

## ⚠️ Points importants

### 1. Firebase RTDB requis

Ce système nécessite **Firebase Realtime Database** (RTDB) en plus de Firestore. Le `onDisconnect()` n'existe que dans RTDB.

### 2. Règles de sécurité

Assurez-vous que vos règles `database.rules.json` permettent :

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 3. Nettoyage lors du logout

Le `logoutUser()` arrête automatiquement le heartbeat :

```jsx
import { logoutUser } from './toolkits/admin/userToolkit.jsx';

const handleLogout = async () => {
  await logoutUser(navigate, '/login');
  // ✅ Heartbeat arrêté
  // ✅ Présence mise à "offline"
};
```

---

## 🧪 Tester le système

### Test 1 : Fermeture normale
1. Se connecter
2. Fermer l'onglet normalement
3. Vérifier dans RTDB que le statut est "offline"

### Test 2 : Perte de connexion
1. Se connecter
2. Désactiver le wifi/réseau
3. Attendre 5-10 secondes
4. Vérifier dans RTDB que le statut est "offline"

### Test 3 : Heartbeat
1. Se connecter
2. Observer les logs dans la console : "💓 Heartbeat envoyé"
3. Vérifier dans RTDB que `lastSeen` se met à jour toutes les 30s

### Test 4 : Utilisateurs actifs
1. Avoir plusieurs utilisateurs connectés
2. Utiliser `useUserMetrics()`
3. Comparer `metrics.online` vs `metrics.reallyOnline`

---

## 📚 Fonctions disponibles

| Fonction | Description |
|----------|-------------|
| `setupPresenceSystem(userId, userName)` | Configure onDisconnect et marque online |
| `startHeartbeat(userId, intervalMs)` | Démarre le heartbeat périodique |
| `stopHeartbeat()` | Arrête le heartbeat |
| `setupBeforeUnload(userId)` | Configure l'event beforeunload |
| `isUserActive(presence, thresholdMs)` | Vérifie si un utilisateur est actif |
| `usePresenceManager(options)` | Hook pour gestion automatique |

---

## 🔄 Migration depuis l'ancien système

L'ancien code continue de fonctionner ! Le système est **rétrocompatible**.

**Avant :**
```jsx
await loginUser(email, password, navigate);
```

**Après (automatiquement amélioré) :**
```jsx
await loginUser(email, password, navigate);
// ✅ Heartbeat activé automatiquement
// ✅ onDisconnect configuré automatiquement
```

**Pour désactiver le nouveau système :**
```jsx
await loginUser(email, password, navigate, '/dashboard', {
  enableHeartbeat: false
});
```

---

## 💡 Recommandations

1. **Toujours utiliser `loginUser()`** pour bénéficier de la configuration automatique
2. **Utiliser `usePresenceManager()`** dans votre App principale
3. **Utiliser `isUserActive()`** pour afficher le statut réel des utilisateurs
4. **Garder l'intervalle heartbeat à 30s** (bon compromis performance/précision)
5. **Utiliser un seuil d'activité de 90s** (3x l'intervalle heartbeat)

---

## 🐛 Dépannage

### Le heartbeat ne fonctionne pas
- Vérifier que RTDB est configuré dans `firebase.js`
- Vérifier les règles de sécurité RTDB
- Vérifier que l'utilisateur est bien connecté

### L'utilisateur reste "online" après fermeture
- Vérifier que `onDisconnect` est bien configuré
- Tester la connexion réseau
- Vérifier les logs de la console

### `reallyOnline` toujours à 0
- Vérifier que `lastSeen` est bien mis à jour dans RTDB
- Vérifier le seuil d'activité (peut-être trop court)
- Vérifier que le heartbeat fonctionne

---

## 📞 Support

Pour toute question ou problème, créer une issue sur le repository.

---

**Auteur:** Système de gestion de présence robuste
**Version:** 2.0
**Date:** 2025
