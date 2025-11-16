# 📦 Système de Gestion du Stock - Guide de Démarrage Rapide

## 🎯 En Bref

Le **Stock Toolkit** gère automatiquement:
- ✅ Les opérations de stock (entrées, sorties, transferts)
- ✅ La prévention des collisions Firestore
- ✅ Le nettoyage quotidien de la queue
- ✅ La validation des données

**Aucune configuration requise - Tout est automatique !**

## 🚀 Utilisation Rapide

### 1. Importer les fonctions

```javascript
import {
  createElement,
  makeTransaction,
  makeTransfert,
  useStockElements,
  useOperationsQueue,
  TRANSACTION_TYPES,
  STOCK_TYPES,
} from '@/toolkits/admin/stockToolkit';
```

### 2. Créer un élément de stock

```javascript
const nouvelElement = await createElement({
  denomination: "Pain baguette",
  unite: {
    nom: "unité",
    symbol: "u"
  },
  type: STOCK_TYPES.INGREDIENT,
  description: "Pain frais du jour",
  imgURL: "/images/pain.jpg"
});

// Retour: { id: "STK-xyz123", quantite_actuelle: 0, status: true, ... }
```

### 3. Ajouter du stock (Entrée)

```javascript
await makeTransaction(TRANSACTION_TYPES.ENTREE, {
  elementId: "STK-PAIN-001",
  quantite: 100,
  emplacementId: "entrepot_principal",
  note: "Livraison matinale"
});

// Le système fait automatiquement:
// ✅ Nettoyage quotidien si nouveau jour
// ✅ Ajout à la queue
// ✅ Exécution atomique
// ✅ Mise à jour du stock
```

### 4. Retirer du stock (Sortie)

```javascript
await makeTransaction(TRANSACTION_TYPES.SORTIE, {
  elementId: "STK-PAIN-001",
  quantite: 30,
  emplacementId: "stand_plateau",
  motif: "Ventes"
});

// Vérifie automatiquement que le stock est suffisant
// Échoue si quantité > stock disponible
```

### 5. Transférer entre emplacements

```javascript
await makeTransfert({
  elementId: "STK-PAIN-001",
  quantite: 50,
  fromEmplacementId: "entrepot_principal",
  toEmplacementId: "stand_plateau",
  note: "Approvisionnement du stand"
});

// Transfert atomique:
// ✅ Vérifie stock source
// ✅ Retire de la source
// ✅ Ajoute à la destination
// ✅ Tout ou rien (atomicité)
```

### 6. Afficher le stock en temps réel

```jsx
import { useStockElements } from '@/toolkits/admin/stockToolkit';

function StockList() {
  const { elements, loading, error, refetch } = useStockElements({
    type: STOCK_TYPES.INGREDIENT,
    status: true
  });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {elements.map(element => (
        <div key={element.id}>
          {element.denomination}: {element.quantite_actuelle} {element.unite.symbol}
        </div>
      ))}
    </div>
  );
}
```

### 7. Surveiller la queue

```jsx
import { useOperationsQueue, OPERATION_STATUS } from '@/toolkits/admin/stockToolkit';

function QueueMonitor() {
  const { operations, stats, loading, executeAll } = useOperationsQueue({
    status: OPERATION_STATUS.PENDING
  });

  return (
    <div>
      <h2>Queue Status</h2>
      <p>En attente: {stats.pending}</p>
      <p>Complétées: {stats.completed}</p>
      <p>Échouées: {stats.failed}</p>

      <button onClick={executeAll}>
        Exécuter toutes les opérations
      </button>

      <ul>
        {operations.map(op => (
          <li key={op.id}>
            {op.type} - {op.payload.quantite} unités
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🔑 Concepts Clés

### Système de Queue

**Toutes les opérations passent par une queue:**
1. Opération ajoutée à `stock/operationsQueue`
2. Exécution automatique avec `runTransaction` (atomique)
3. Mise à jour du stock si succès
4. Historique créé dans `stock/transactions/[DATE]`

**Avantages:**
- ✅ Pas de collisions Firestore
- ✅ Ordre chronologique garanti
- ✅ Quantités toujours cohérentes
- ✅ Traçabilité complète

### Nettoyage Automatique

**Au premier appel de chaque jour:**
- Détection du changement de jour (localStorage)
- Suppression des opérations `completed` et `failed`
- Conservation des opérations `pending` et `processing`

**Vous n'avez rien à faire !**

### Validation Automatique

**Toutes les données sont validées avec Zod:**
- Types corrects
- Valeurs dans les limites
- Champs requis présents
- Nettoyage automatique des données corrompues

## 📚 Documentation Détaillée

### Pour Commencer

- 📖 **Ce fichier** - Guide de démarrage rapide
- 📖 [STOCK_AUTO_CLEANUP_README.md](./STOCK_AUTO_CLEANUP_README.md) - Nettoyage automatique

### Documentation Complète

- 📖 [STOCK_QUEUE_SYSTEM.md](./STOCK_QUEUE_SYSTEM.md) - Système de queue complet
- 📖 [SCHEMA_VALIDATION_GUIDE.md](./SCHEMA_VALIDATION_GUIDE.md) - Validation Zod
- 📖 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Résumé technique

### Code Source

- 💻 [src/toolkits/admin/stockToolkit.jsx](./src/toolkits/admin/stockToolkit.jsx) - Code principal
- 🧪 [src/test/stockToolkit.queue.test.js](./src/test/stockToolkit.queue.test.js) - Tests

## 🛠️ API Rapide

### Fonctions Principales

| Fonction | Description | Retour |
|----------|-------------|--------|
| `createElement(data)` | Créer un élément | `Promise<Element>` |
| `updateElement(id, updates)` | Mettre à jour | `Promise<Element>` |
| `getElement(id)` | Récupérer par ID | `Promise<Element\|null>` |
| `listElements(filter)` | Lister avec filtres | `Promise<Element[]>` |
| `makeTransaction(type, payload)` | Entrée/Sortie | `Promise<Operation>` |
| `makeTransfert(payload)` | Transfert | `Promise<Operation>` |
| `executeOperations()` | Exécuter queue | `Promise<Results>` |
| `cleanQueue()` | Nettoyer queue | `Promise<number>` |

### Hooks React

| Hook | Description | Retour |
|------|-------------|--------|
| `useStockElement(id, days)` | Un élément + historique | `{element, transactions, ...}` |
| `useStockElements(filter)` | Liste avec temps réel | `{elements, loading, ...}` |
| `useTransactions(days, filter)` | Historique | `{transactions, loading, ...}` |
| `useOperationsQueue(filter)` | Queue | `{operations, stats, executeAll, ...}` |

### Constantes

```javascript
// Types d'éléments
STOCK_TYPES = {
  INGREDIENT: "ingredient",
  CONSOMMABLE: "consommable",
  PERISSABLE: "perissable",
  MATERIEL: "materiel",
  EMBALLAGE: "emballage"
}

// Types de transactions
TRANSACTION_TYPES = {
  ENTREE: "entree",
  SORTIE: "sortie",
  TRANSFERT: "transfert"
}

// Statuts d'opérations
OPERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed"
}
```

## 🎬 Exemples Complets

### Scénario: Livraison Matinale

```javascript
// 1. Créer les éléments si première fois
const pain = await createElement({
  denomination: "Pain baguette",
  unite: { nom: "unité", symbol: "u" },
  type: STOCK_TYPES.INGREDIENT
});

const poulet = await createElement({
  denomination: "Poulet",
  unite: { nom: "kilogramme", symbol: "kg" },
  type: STOCK_TYPES.INGREDIENT
});

// 2. Réception de la livraison
await makeTransaction(TRANSACTION_TYPES.ENTREE, {
  elementId: pain.id,
  quantite: 200,
  emplacementId: "entrepot_principal",
  note: "Livraison boulangerie - 8h00"
});

await makeTransaction(TRANSACTION_TYPES.ENTREE, {
  elementId: poulet.id,
  quantite: 50,
  emplacementId: "entrepot_principal",
  note: "Livraison boucher - 8h30"
});

// 3. Approvisionnement des stands
await makeTransfert({
  elementId: pain.id,
  quantite: 80,
  fromEmplacementId: "entrepot_principal",
  toEmplacementId: "stand_plateau",
  note: "Approvisionnement matin"
});

await makeTransfert({
  elementId: poulet.id,
  quantite: 20,
  fromEmplacementId: "entrepot_principal",
  toEmplacementId: "stand_plateau"
});

// Résultat:
// - Entrepôt: Pain=120, Poulet=30
// - Stand: Pain=80, Poulet=20
```

### Scénario: Ventes de la Journée

```javascript
// Enregistrer les ventes
await makeTransaction(TRANSACTION_TYPES.SORTIE, {
  elementId: "STK-PAIN-001",
  quantite: 60,
  emplacementId: "stand_plateau",
  motif: "Ventes journée"
});

// Si stock insuffisant, l'opération échoue automatiquement
// avec un message d'erreur détaillé
```

## ❓ FAQ

### Q: Comment voir l'historique d'un élément?

```javascript
const { element, transactions } = useStockElement("STK-PAIN-001", 30);
// element = données actuelles
// transactions = historique sur 30 jours
```

### Q: Comment savoir si une opération a réussi?

```javascript
const operation = await makeTransaction(...);
// operation.status = "pending" → en attente

// Surveiller avec le hook
const { operations } = useOperationsQueue();
const myOp = operations.find(op => op.id === operation.id);
// myOp.status = "completed" | "failed"
```

### Q: Que faire si trop d'opérations échouent?

1. Vérifier les logs console
2. Utiliser `useOperationsQueue()` pour voir les erreurs
3. Corriger les données source (stocks, IDs, etc.)
4. Les opérations échouées seront nettoyées le lendemain

### Q: Puis-je annuler une opération?

Non, les opérations ne peuvent pas être annulées une fois ajoutées à la queue. Vous devez créer une opération inverse (ex: sortie → entrée).

## 🎉 C'est Tout !

Vous êtes prêt à utiliser le système de gestion du stock.

**En cas de problème:**
1. Vérifiez les logs console
2. Consultez la documentation détaillée
3. Utilisez `useOperationsQueue()` pour debugger

---

**Bon développement ! 🚀**
