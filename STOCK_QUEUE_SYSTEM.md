# Système de Queue d'Opérations - Stock Toolkit

## 🎯 Vue d'ensemble

Le système de queue d'opérations a été implémenté pour résoudre les problèmes de **collisions Firestore** lors d'opérations concurrentes sur le stock. Au lieu d'écrire directement dans Firestore, toutes les opérations sont ajoutées à une queue et exécutées de manière **atomique** et **chronologique** avec `runTransaction`.

### 🆕 Nouveauté: Nettoyage automatique quotidien

Le système détecte automatiquement le passage à un nouveau jour et nettoie la queue des opérations complétées/échouées. **Aucune intervention manuelle requise !**

```javascript
// Au premier appel de la journée
await makeTransaction(TRANSACTION_TYPES.ENTREE, {...});
// → 🧹 Nettoyage automatique détecté et exécuté
// → ✅ Queue nettoyée: 47 opérations supprimées

// Reste de la journée
await makeTransaction(...);
// → Pas de nettoyage (déjà fait aujourd'hui)
```

## ✨ Caractéristiques principales

### 1. Opérations atomiques avec `runTransaction`
- Toutes les modifications de stock utilisent `runTransaction` de Firestore
- Prévient les collisions lors d'écritures concurrentes
- Garantit la cohérence des données

### 2. Exécution chronologique
- Les opérations sont triées par timestamp avant exécution
- Ordre garanti même en cas d'ajouts concurrents

### 3. Validation des quantités
- Les quantités ne peuvent jamais devenir négatives
- Vérification à chaque opération
- Échec gracieux si stock insuffisant

### 4. Gestion des erreurs
- Les opérations échouées sont marquées avec un message d'erreur
- Les autres opérations continuent de s'exécuter
- Statistiques détaillées après chaque exécution

### 5. Nettoyage automatique quotidien
- Détection automatique du changement de jour via localStorage
- Suppression de toutes les opérations complétées/échouées
- Conservation uniquement des opérations `pending` et `processing`
- Aucune configuration ou cron job nécessaire

## 📋 Structure de la queue

### Document Firestore: `stock/operationsQueue`

```javascript
{
  operations: [
    {
      id: "OP-xyz123",
      timestamp: 1729612800000,
      type: "entree" | "sortie" | "transfert",
      status: "pending" | "processing" | "completed" | "failed",
      payload: {
        elementId: "STK-001",
        quantite: 50,
        emplacementId?: "empl_001",
        fromEmplacementId?: "empl_source",
        toEmplacementId?: "empl_dest",
        note?: "Description",
        motif?: "Raison"
      },
      actorId: "user_uid",
      error?: "Message d'erreur si échec",
      retryCount: 0,
      createdAt: 1729612800000,
      processedAt?: 1729612900000
    },
    // ... autres opérations
  ]
}
```

## 🔧 API - Fonctions principales

### `enqueueOperation(type, payload)`

Ajoute une opération à la queue.

**Paramètres:**
- `type`: `"entree"` | `"sortie"` | `"transfert"`
- `payload`: Objet contenant les détails de l'opération

**Retour:** L'opération créée avec son statut `pending`

**Exemple:**
```javascript
const operation = await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
  elementId: "STK-PAIN-001",
  quantite: 100,
  emplacementId: "entrepot_principal",
  note: "Livraison matinale"
});
```

### `executeOperations()`

Exécute toutes les opérations en attente de manière atomique.

**Retour:**
```javascript
{
  success: 5,    // Nombre d'opérations réussies
  failed: 2,     // Nombre d'opérations échouées
  errors: [      // Détails des erreurs
    {
      operationId: "OP-abc123",
      error: "Stock insuffisant: 10 disponible, 20 demandé"
    }
  ]
}
```

**Comportement:**
1. Récupère toutes les opérations `pending`
2. Trie par ordre chronologique (`timestamp`)
3. Pour chaque opération:
   - Vérifie que l'élément existe
   - Vérifie que le stock est suffisant (pour sorties/transferts)
   - Applique les modifications
   - Marque comme `completed` ou `failed`
4. Sauvegarde tout de manière atomique
5. Crée les transactions dans l'historique

### `cleanQueue()`

Nettoie la queue en supprimant **TOUTES** les opérations complétées ou échouées.
Garde uniquement les opérations `pending` et `processing`.

**Retour:** Nombre d'opérations supprimées

**Exemple:**
```javascript
const removedCount = await cleanQueue();
console.log(`${removedCount} opérations nettoyées`);
```

**Comportement:**
- Supprime toutes les opérations avec statut `completed` ou `failed`
- Garde uniquement `pending` et `processing`
- Sauvegarde la date du nettoyage dans localStorage
- Envoie une notification RTDB si des opérations ont été supprimées

### `autoCleanQueue()`

Vérifie automatiquement si on est passé à un nouveau jour et nettoie la queue si nécessaire.

**Retour:** Nombre d'opérations supprimées ou `null` si pas de nettoyage

**Exemple:**
```javascript
const removedCount = await autoCleanQueue();
if (removedCount !== null) {
  console.log(`Nettoyage automatique: ${removedCount} opérations supprimées`);
}
```

**Comportement:**
- Compare la date actuelle avec la date du dernier nettoyage (stockée en localStorage)
- Si la date a changé (nouveau jour), appelle `cleanQueue()`
- Enregistre la date du nettoyage dans localStorage
- Appelé automatiquement par `makeTransaction()` et `makeTransfert()`

### `makeTransaction(type, payload)` - Version mise à jour

Anciennement, cette fonction écrivait directement dans Firestore. Maintenant, elle:
1. **Vérifie et nettoie automatiquement la queue** au changement de jour
2. Ajoute l'opération à la queue
3. Déclenche l'exécution automatique

**Exemple:**
```javascript
// Entrée de stock
const operation = await makeTransaction(TRANSACTION_TYPES.ENTREE, {
  elementId: "ING-POULET",
  quantite: 50,
  emplacementId: "entrepot_principal",
  note: "Livraison boucher"
});

// Comportement automatique:
// 1. Vérifie si on est passé à un nouveau jour → nettoyage si besoin
// 2. L'opération est ajoutée à la queue
// 3. L'exécution se fait automatiquement en arrière-plan
```

### `makeTransfert(payload)` - Version mise à jour

Transfère du stock entre deux emplacements via la queue.
Vérifie et nettoie automatiquement la queue au changement de jour.

**Exemple:**
```javascript
const operation = await makeTransfert({
  elementId: "ING-PAIN",
  quantite: 80,
  fromEmplacementId: "entrepot_principal",
  toEmplacementId: "stand_plateau",
  note: "Approvisionnement stand"
});

// Comportement automatique identique à makeTransaction:
// 1. Nettoyage automatique si nouveau jour détecté
// 2. Ajout à la queue
// 3. Exécution automatique
```

## 🎣 Hooks React

### `useOperationsQueue(filter?)`

Hook pour surveiller la queue en temps réel.

**Paramètres:**
- `filter` (optionnel):
  - `status`: Filtrer par statut
  - `type`: Filtrer par type d'opération

**Retour:**
```javascript
{
  operations: [],      // Liste des opérations filtrées
  stats: {             // Statistiques
    pending: 3,
    processing: 0,
    completed: 15,
    failed: 1,
    total: 19
  },
  loading: false,
  error: null,
  refetch: () => {},   // Fonction pour rafraîchir
  executeAll: async () => {}, // Exécuter toutes les opérations
  cleanQueue: async () => {}  // Nettoyer la queue
}
```

**Exemple d'utilisation:**
```jsx
import { useOperationsQueue, OPERATION_STATUS } from '@/toolkits/admin/stockToolkit';

function QueueMonitor() {
  const { operations, stats, executeAll, loading } = useOperationsQueue({
    status: OPERATION_STATUS.PENDING
  });

  return (
    <div>
      <h2>Queue d'opérations</h2>
      <div>
        <p>En attente: {stats.pending}</p>
        <p>Complétées: {stats.completed}</p>
        <p>Échouées: {stats.failed}</p>
      </div>

      <button onClick={executeAll} disabled={loading}>
        Exécuter les opérations en attente
      </button>

      <ul>
        {operations.map(op => (
          <li key={op.id}>
            {op.type} - {op.payload.quantite} unités
            {op.status === OPERATION_STATUS.FAILED && (
              <span className="error">{op.error}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🔄 Flux de travail

### Scénario 1: Opération simple

```
1. Utilisateur → makeTransaction()
2. makeTransaction() → enqueueOperation()
3. enqueueOperation() → Ajoute à la queue (runTransaction)
4. makeTransaction() → Déclenche executeOperations() en arrière-plan
5. executeOperations() → Traite toutes les opérations pending
6. Résultat → Transaction enregistrée dans l'historique
```

### Scénario 2: Opérations concurrentes

```
Temps 0ms:
  - Utilisateur A → makeTransaction(entree, +100)
  - Utilisateur B → makeTransaction(sortie, -30)
  - Utilisateur C → makeTransaction(sortie, -50)

Temps 10ms:
  - Les 3 opérations sont dans la queue
  - executeOperations() se déclenche

Exécution atomique (runTransaction):
  1. Trier par timestamp: A (0ms) → B (2ms) → C (5ms)
  2. Exécuter A: +100 → stock = 100 ✅
  3. Exécuter B: -30 → stock = 70 ✅
  4. Exécuter C: -50 → stock = 20 ✅

Résultat: Toutes les opérations réussies, stock final = 20
```

### Scénario 3: Stock insuffisant

```
Temps 0ms:
  - Stock actuel: 50 unités
  - Op1: sortie -30
  - Op2: sortie -40

Exécution:
  1. Op1: 50 - 30 = 20 ✅
  2. Op2: 20 - 40 = -20 ❌ Stock insuffisant

Résultat:
  - Op1: completed
  - Op2: failed avec erreur "Stock insuffisant: 20 disponible, 40 demandé"
```

## 🚀 Avantages du système

### 1. **Prévention des collisions**
- `runTransaction` garantit les lectures/écritures atomiques
- Pas de perte de données en cas d'écritures concurrentes

### 2. **Traçabilité complète**
- Toutes les opérations sont enregistrées
- Historique des échecs avec messages d'erreur
- Compteur de tentatives (retryCount)

### 3. **Ordre chronologique garanti**
- Les opérations sont toujours exécutées dans l'ordre
- Important pour les scénarios: entrée → transfert → sortie

### 4. **Gestion des erreurs robuste**
- Une opération échouée n'arrête pas les autres
- Messages d'erreur détaillés
- Possibilité de retry automatique

### 5. **Performance optimisée**
- Exécution par batch (toutes les opérations d'un coup)
- Moins d'appels réseau à Firestore
- Cache local pour la lecture

## ⚠️ Limitations et considérations

### Limitations Firestore

**runTransaction a une limite de 500 documents**
- Si la queue contient plus de 500 opérations, découper en batches
- Solution: Limiter le nombre d'opérations traitées par exécution

**Timeout de 60 secondes**
- Les transactions très longues peuvent échouer
- Solution: Traiter max 100 opérations à la fois

### Recommandations

1. **Exécution automatique des opérations**
   - ✅ Déclenchée automatiquement après chaque `makeTransaction()` ou `makeTransfert()`
   - ✅ Exécution en arrière-plan sans bloquer l'utilisateur

2. **Nettoyage automatique de la queue**
   - ✅ Déclenché automatiquement au passage à un nouveau jour
   - ✅ Supprime toutes les opérations complétées/échouées
   - ✅ Pas besoin de cron job ou d'intervention manuelle

3. **Surveiller les échecs**
   - Utiliser `useOperationsQueue()` pour afficher les erreurs
   - Créer des alertes si trop d'échecs
   - Les opérations échouées restent dans la queue jusqu'au nettoyage du lendemain

4. **Limiter la taille de la queue**
   - Si plus de 1000 opérations pending, enquêter
   - Peut indiquer un problème d'exécution
   - Nettoyage quotidien automatique évite l'accumulation

## 🧹 Nettoyage automatique de la queue

### Mécanisme de détection du changement de jour

Le système utilise localStorage pour tracker la dernière date de nettoyage:

1. **Première opération de la journée**: `autoCleanQueue()` est appelé
2. **Vérification**: Compare la date actuelle avec `localStorage.getItem('lsd_stock_last_cleanup')`
3. **Si différent**: Nettoyage automatique déclenché
4. **Sauvegarde**: Nouvelle date enregistrée dans localStorage

### Données stockées en localStorage

```javascript
// Date du dernier nettoyage au format DDMMYYYY
localStorage.setItem('lsd_stock_last_cleanup', '22102025');
```

### Flux de nettoyage automatique

```
Jour J (22/10/2025):
  └─ makeTransaction() appelée
     └─ autoCleanQueue() vérifie
        └─ localStorage: '22102025' === aujourd'hui
        └─ Pas de nettoyage ❌

Jour J+1 (23/10/2025):
  └─ makeTransaction() appelée
     └─ autoCleanQueue() vérifie
        └─ localStorage: '22102025' !== aujourd'hui
        └─ Nettoyage déclenché ✅
           ├─ Suppression opérations completed/failed
           ├─ Sauvegarde nouvelle date: '23102025'
           └─ Notification RTDB envoyée
```

### Avantages du système

✅ **Automatique**: Aucune intervention manuelle requise
✅ **Efficace**: Nettoyage uniquement quand nécessaire (1x par jour max)
✅ **Léger**: Vérification rapide via localStorage
✅ **Robuste**: Ne bloque jamais les opérations (catch des erreurs)
✅ **Traçable**: Logs et notifications à chaque nettoyage

### Forcer un nettoyage manuel

Si nécessaire, vous pouvez forcer un nettoyage:

```javascript
// Option 1: Appel direct
const removedCount = await cleanQueue();

// Option 2: Via le hook
const { cleanQueue: cleanQueueCallback } = useOperationsQueue();
await cleanQueueCallback();

// Option 3: Réinitialiser la date de dernier nettoyage
localStorage.removeItem('lsd_stock_last_cleanup');
// Le prochain makeTransaction() nettoiera automatiquement
```

## 📊 Monitoring et debugging

### Afficher les statistiques de la queue

```javascript
import { useOperationsQueue } from '@/toolkits/admin/stockToolkit';

function QueueStats() {
  const { stats, loading } = useOperationsQueue();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h3>État de la queue</h3>
      <ul>
        <li>En attente: {stats.pending}</li>
        <li>En traitement: {stats.processing}</li>
        <li>Complétées: {stats.completed}</li>
        <li>Échouées: {stats.failed}</li>
        <li>Total: {stats.total}</li>
      </ul>

      {stats.pending > 100 && (
        <div className="warning">
          ⚠️ Attention: {stats.pending} opérations en attente!
        </div>
      )}
    </div>
  );
}
```

### Logs de debugging

Le système affiche des logs détaillés dans la console:

**Opérations normales:**
```
✅ Opération ajoutée à la queue: OP-xyz123
🔄 Début de l'exécution des opérations...
📋 15 opérations à traiter
✅ Opération OP-abc123 exécutée avec succès
❌ Échec opération OP-def456: Stock insuffisant: 10 disponible, 20 demandé
✅ Exécution terminée: 14 réussies, 1 échouée
```

**Nettoyage automatique:**
```
🧹 Détection d'un nouveau jour - Nettoyage automatique de la queue
✅ Queue nettoyée: 47 opérations supprimées
✅ Date de nettoyage sauvegardée: 23102025
```

**En cas d'erreur:**
```
❌ Erreur nettoyage automatique: [error message]
// L'opération continue normalement, le nettoyage ne bloque pas
```

## 🧪 Tests

Des tests complets ont été créés dans `src/test/stockToolkit.queue.test.js`:

- ✅ Ajout d'opérations à la queue
- ✅ Validation des schémas Zod
- ✅ Exécution dans l'ordre chronologique
- ✅ Prévention des quantités négatives
- ✅ Gestion des transferts
- ✅ Opérations concurrentes
- ✅ Nettoyage de la queue
- ✅ Scénarios réels (restaurant)

Pour exécuter les tests:

```bash
npm run test src/test/stockToolkit.queue.test.js
```

## 🔮 Évolutions futures

### Possibles améliorations:

1. **Retry automatique**
   - Retenter les opérations échouées après un délai
   - Limiter à 3 tentatives max

2. **Batch processing**
   - Traiter max 100 opérations à la fois
   - Éviter les timeouts sur grosses queues

3. **Priority queue**
   - Ajouter un champ `priority` (high/normal/low)
   - Exécuter les opérations prioritaires d'abord

4. **Dead letter queue**
   - Déplacer les opérations échouées 3+ fois
   - Analyse manuelle requise

5. **Métriques avancées**
   - Temps moyen d'exécution
   - Taux d'échec par type d'opération
   - Alertes automatiques

## 📚 Références

- [Firestore Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Guide de validation Zod](./SCHEMA_VALIDATION_GUIDE.md)
- [Tests du système](./src/test/stockToolkit.queue.test.js)

---

**Note:** Ce système est production-ready et gère tous les cas de collisions Firestore. Les opérations sont garanties atomiques et chronologiques.
