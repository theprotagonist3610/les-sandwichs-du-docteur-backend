# Système de Comptabilité - Documentation

## Vue d'ensemble

Le système de comptabilité est implémenté dans `src/toolkits/admin/comptabiliteToolkit.jsx` et suit les normes comptables OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires).

## Architecture Firestore

### Structure des documents

```
comptabilite/
├── comptes                              # Document contenant tous les comptes
│   └── liste: Array<Compte>
├── operations/
│   └── liste/
│       ├── 29102025                     # Document journalier (format DDMMYYYY)
│       │   └── liste: Array<Operation>
│       └── 30102025
│           └── liste: Array<Operation>
├── tresorerie                           # Document contenant les comptes de trésorerie
│   └── liste: Array<Tresorerie>
└── operationsQueue                      # Queue pour éviter les collisions
    └── operations: Array<QueuedOperation>
```

## Schémas de données

### Compte
```javascript
{
  id: string,
  code_ohada: string,              // Ex: "601", "701"
  denomination: string,            // Ex: "Achats de matières premières"
  description: string,
  type: "entree" | "sortie" | "entree/sortie"
}
```

### Opération
```javascript
{
  id: string,
  type: "recette" | "depense",
  compte_code: string,             // Code OHADA du compte utilisé
  compte_denomination: string,
  montant: number,
  tresorerie_id: string,           // ID du compte de trésorerie impacté
  observation: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string,
  updatedBy: string
}
```

### Trésorerie
```javascript
{
  id: string,
  denomination: string,            // Ex: "Caisse principale"
  type: "Compte bancaire" | "Mobile Money" | "Momo pay" | "Moov money" | "Caisse",
  solde: number,                   // Solde actuel en FCFA
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Système de Queue (Anti-collision)

### Pourquoi une queue ?

Lorsque plusieurs utilisateurs effectuent des opérations simultanément, il peut y avoir des collisions lors de l'écriture dans Firestore. Le système de queue garantit que :
- Toutes les opérations sont traitées dans l'ordre chronologique
- Les lectures sont effectuées AVANT toute écriture (read-before-write)
- Une seule transaction atomique traite toutes les opérations pending
- Aucune opération n'est perdue en cas d'erreur

### Fonctionnement

1. **Ajout à la queue** : `createOperation()`, `updateOperation()`, `deleteOperation()` ajoutent l'opération à la queue avec statut "pending"
2. **Exécution automatique** : `executeComptaOperations()` est appelé automatiquement après chaque ajout
3. **Traitement batch** : Toutes les opérations pending sont traitées en une seule transaction
4. **Mise à jour des statuts** : Les opérations sont marquées "completed" ou "failed"
5. **Nettoyage** : `cleanComptaQueue()` supprime les opérations terminées

### États des opérations en queue

- `pending` : En attente de traitement
- `processing` : En cours de traitement (rarement visible, très court)
- `completed` : Traitée avec succès
- `failed` : Échec du traitement (avec message d'erreur)

## Utilisation

### 1. Initialiser les comptes OHADA

```javascript
import { initializeComptesOHADA } from '@/toolkits/admin/comptabiliteToolkit';

// À exécuter une seule fois lors du setup initial
await initializeComptesOHADA();
```

Cela crée 37 comptes par défaut selon le plan OHADA simplifié.

### 2. Créer des comptes de trésorerie

```javascript
import { createTresorerie } from '@/toolkits/admin/comptabiliteToolkit';

await createTresorerie({
  denomination: "Caisse principale",
  type: "Caisse",
  solde: 50000  // Solde initial en FCFA
});

await createTresorerie({
  denomination: "Mobile Money vendeur 1",
  type: "Momo pay",
  solde: 0
});
```

### 3. Enregistrer des opérations

```javascript
import { createOperation } from '@/toolkits/admin/comptabiliteToolkit';

// Recette (vente de sandwichs)
await createOperation({
  type: "recette",
  compte_code: "701",  // Ventes de marchandises
  montant: 5000,
  tresorerie_id: "caisse_principale",
  observation: "Vente de 10 sandwichs"
}, "user_id_123");

// Dépense (achat d'ingrédients)
await createOperation({
  type: "depense",
  compte_code: "601",  // Achats de matières premières
  montant: 15000,
  tresorerie_id: "caisse_principale",
  observation: "Achat de pain et charcuterie"
}, "user_id_123");
```

### 4. Utiliser les hooks React

#### Lister tous les comptes

```javascript
import { useComptes } from '@/toolkits/admin/comptabiliteToolkit';

function ComptesPage() {
  const { comptes, loading, error } = useComptes();

  // Filtrer par type
  const { comptes: comptesEntree } = useComptes({ filterType: "entree" });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <ul>
      {comptes.map(compte => (
        <li key={compte.id}>
          {compte.code_ohada} - {compte.denomination}
        </li>
      ))}
    </ul>
  );
}
```

#### Afficher les opérations du jour

```javascript
import { useOperations } from '@/toolkits/admin/comptabiliteToolkit';

function OperationsJour() {
  const { operations, loading, error } = useOperations();

  // Filtrer par type
  const { operations: recettes } = useOperations({ filterType: "recette" });

  // Filtrer par compte de trésorerie
  const { operations: caisse } = useOperations({
    filterTresorerieId: "caisse_principale"
  });

  return (
    <ul>
      {operations.map(op => (
        <li key={op.id}>
          {op.type === "recette" ? "+" : "-"} {op.montant} FCFA
          - {op.compte_denomination}
        </li>
      ))}
    </ul>
  );
}
```

#### Surveiller la queue

```javascript
import { useComptaQueue } from '@/toolkits/admin/comptabiliteToolkit';

function QueueMonitor() {
  const { queue, stats, loading } = useComptaQueue();

  return (
    <div>
      <h3>État de la queue</h3>
      <p>En attente: {stats.pending}</p>
      <p>Terminées: {stats.completed}</p>
      <p>Échouées: {stats.failed}</p>

      <ul>
        {queue.map(op => (
          <li key={op.id}>
            {op.type} - {op.status}
            {op.error && ` - Erreur: ${op.error}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Afficher les comptes de trésorerie

```javascript
import { useTresoreries } from '@/toolkits/admin/comptabiliteToolkit';

function TresoreriePage() {
  const { tresoreries, loading, error } = useTresoreries();

  // Filtrer par type
  const { tresoreries: caisses } = useTresoreries({
    filterType: "Caisse"
  });

  return (
    <ul>
      {tresoreries.map(treso => (
        <li key={treso.id}>
          {treso.denomination} ({treso.type}): {treso.solde} FCFA
        </li>
      ))}
    </ul>
  );
}
```

### 5. Opérations avancées

#### Mise à jour d'une opération

```javascript
import { updateOperation } from '@/toolkits/admin/comptabiliteToolkit';

await updateOperation(
  "op_abc123",              // ID de l'opération
  {
    montant: 6000,
    observation: "Montant corrigé"
  },
  new Date(),              // Date de l'opération originale
  "user_id_123"            // ID de l'utilisateur
);
```

#### Suppression d'une opération

```javascript
import { deleteOperation } from '@/toolkits/admin/comptabiliteToolkit';

await deleteOperation(
  "op_abc123",              // ID de l'opération
  new Date(),              // Date de l'opération
  "user_id_123"            // ID de l'utilisateur
);
```

⚠️ **Important** : La suppression annule automatiquement l'impact sur la trésorerie.

#### Créer plusieurs opérations en batch

```javascript
import { batchCreateOperations } from '@/toolkits/admin/comptabiliteToolkit';

await batchCreateOperations([
  {
    type: "recette",
    compte_code: "701",
    montant: 5000,
    tresorerie_id: "caisse_principale",
    observation: "Vente 1"
  },
  {
    type: "recette",
    compte_code: "701",
    montant: 3000,
    tresorerie_id: "mobile_money",
    observation: "Vente 2"
  }
], "user_id_123");
```

#### Nettoyage de la queue

```javascript
import { cleanComptaQueue } from '@/toolkits/admin/comptabiliteToolkit';

// Supprime toutes les opérations "completed" et "failed"
const removedCount = await cleanComptaQueue();
console.log(`${removedCount} opérations supprimées de la queue`);
```

## Notifications en temps réel (RTDB)

Le système envoie des notifications via Firebase Realtime Database à chaque action importante :
- Ajout d'une opération à la queue
- Succès du traitement
- Échec du traitement
- Mise à jour/suppression d'opération

Ces notifications sont écoutées par les hooks et déclenchent automatiquement le rafraîchissement des données.

## Cache local

Toutes les données sont mises en cache dans localStorage avec timestamps :
- `comptes` : Liste des comptes (cache: 1 heure)
- `operations_DDMMYYYY` : Opérations par jour (cache: 5 minutes)
- `tresoreries` : Comptes de trésorerie (cache: 5 minutes)

Le cache est automatiquement invalidé lors des modifications.

## Bonnes pratiques

1. **Toujours passer l'ID utilisateur** lors des créations/modifications d'opérations
2. **Ne pas appeler executeComptaOperations() manuellement** (sauf cas particulier) - c'est automatique
3. **Surveiller la queue** avec `useComptaQueue()` pour détecter les opérations échouées
4. **Nettoyer régulièrement** la queue avec `cleanComptaQueue()` (peut être automatisé)
5. **Utiliser batchCreateOperations()** plutôt que plusieurs createOperation() pour les imports

## Dépannage

### Les opérations restent "pending"

- Vérifier qu'`executeComptaOperations()` n'est pas bloqué
- Regarder la console pour les erreurs
- Vérifier que les IDs de trésorerie existent

### Opérations "failed" dans la queue

- Utiliser `useComptaQueue()` pour voir l'erreur
- Causes fréquentes : trésorerie inexistante, montant invalide
- Supprimer l'opération failed ou corriger les données et retry

### Soldes de trésorerie incorrects

- Les soldes sont calculés automatiquement
- En cas d'incohérence, vérifier les opérations dans la queue
- Ne jamais modifier manuellement les soldes de trésorerie

## Exemples de comptes OHADA disponibles

| Code | Dénomination | Type |
|------|--------------|------|
| 101 | Capital social | entree |
| 108 | Compte de l'exploitant | entree/sortie |
| 2183 | Matériel et outillage | sortie |
| 2184 | Mobilier de bureau | sortie |
| 401 | Fournisseurs | sortie |
| 411 | Clients | entree |
| 421 | Personnel - Salaires | sortie |
| 531 | Caisse | entree/sortie |
| 601 | Achats de matières premières | sortie |
| 602 | Achats d'emballages | sortie |
| 605 | Achats de fournitures | sortie |
| 606 | Achats de produits d'entretien | sortie |
| 622 | Location et charges locatives | sortie |
| 624 | Transports | sortie |
| 625 | Frais de déplacement | sortie |
| 626 | Frais postaux et télécommunications | sortie |
| 627 | Services bancaires | sortie |
| 628 | Publicité et communication | sortie |
| 631 | Frais bancaires | sortie |
| 644 | Taxes et impôts | sortie |
| 661 | Charges d'intérêts | sortie |
| 701 | Ventes de marchandises | entree |
| 706 | Services vendus | entree |
| 771 | Gains de change | entree |
| 791 | Subventions d'exploitation | entree |

## Support

Pour toute question ou problème, consulter le code source : `src/toolkits/admin/comptabiliteToolkit.jsx`
