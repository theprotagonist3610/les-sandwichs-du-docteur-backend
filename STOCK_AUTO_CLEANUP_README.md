# 🧹 Nettoyage Automatique de la Queue - Stock Toolkit

## Résumé

Le système de queue d'opérations dispose maintenant d'un **nettoyage automatique quotidien** qui se déclenche automatiquement au passage à un nouveau jour.

## Comment ça marche ?

### Détection automatique

Chaque fois que `makeTransaction()` ou `makeTransfert()` est appelé, le système:

1. ✅ Vérifie la date actuelle
2. ✅ Compare avec la date du dernier nettoyage (stockée en localStorage)
3. ✅ Si différent → nettoyage automatique
4. ✅ Sauvegarde la nouvelle date

### Ce qui est nettoyé

**Supprimé:**
- Toutes les opérations avec statut `completed`
- Toutes les opérations avec statut `failed`

**Conservé:**
- Opérations avec statut `pending`
- Opérations avec statut `processing`

## Exemple de logs

### Premier appel du jour (nettoyage déclenché)

```
🧹 Détection d'un nouveau jour - Nettoyage automatique de la queue
✅ Queue nettoyée: 47 opérations supprimées
✅ Date de nettoyage sauvegardée: 23102025
✅ Transaction entree ajoutée à la queue: OP-abc123
🔄 Début de l'exécution des opérations...
```

### Appels suivants du même jour (pas de nettoyage)

```
✅ Transaction sortie ajoutée à la queue: OP-def456
🔄 Début de l'exécution des opérations...
```

## Avantages

✅ **Complètement automatique** - Aucune intervention manuelle
✅ **Efficace** - Nettoyage 1x par jour maximum
✅ **Non-bloquant** - Ne ralentit pas les opérations
✅ **Robuste** - Les erreurs de nettoyage ne bloquent pas les transactions
✅ **Traçable** - Logs détaillés + notifications RTDB

## Stockage localStorage

Le système utilise une seule clé localStorage:

```javascript
// Clé: 'lsd_stock_last_cleanup'
// Valeur: Date au format DDMMYYYY
localStorage.getItem('lsd_stock_last_cleanup'); // "22102025"
```

## Nettoyage manuel (optionnel)

Si nécessaire, vous pouvez forcer un nettoyage:

```javascript
import { cleanQueue } from '@/toolkits/admin/stockToolkit';

// Option 1: Nettoyage direct
const removedCount = await cleanQueue();
console.log(`${removedCount} opérations supprimées`);

// Option 2: Réinitialiser la date
localStorage.removeItem('lsd_stock_last_cleanup');
// Le prochain makeTransaction() déclenchera le nettoyage
```

## Fonctions disponibles

### `cleanQueue()`

Nettoie immédiatement la queue (toutes les opérations completed/failed).

```javascript
const removedCount = await cleanQueue();
```

### `autoCleanQueue()`

Vérifie si on est passé à un nouveau jour et nettoie si nécessaire.

```javascript
const removedCount = await autoCleanQueue();
// null si pas de nettoyage, nombre d'opérations sinon
```

### Déjà intégrées dans:

- ✅ `makeTransaction(type, payload)`
- ✅ `makeTransfert(payload)`

**Vous n'avez rien à faire !** Le nettoyage est automatique.

## Configuration

Aucune configuration requise ! Le système fonctionne out-of-the-box.

## FAQ

### Q: Que se passe-t-il si localStorage n'est pas disponible?

R: Le système log une erreur mais continue de fonctionner. Le nettoyage sera effectué à chaque appel (moins optimal mais fonctionnel).

### Q: Puis-je désactiver le nettoyage automatique?

R: Non, mais vous pouvez modifier le code source si vraiment nécessaire. Cependant, le nettoyage est essentiel pour éviter l'accumulation d'opérations.

### Q: Les opérations échouées sont-elles perdues?

R: Non, elles restent dans la queue jusqu'au lendemain. Vous pouvez les consulter avec `useOperationsQueue()` et les analyser avant qu'elles soient nettoyées.

### Q: Que se passe-t-il à minuit exactement?

R: Le nettoyage ne se déclenche pas à minuit précis, mais au **premier appel** de `makeTransaction()` ou `makeTransfert()` du nouveau jour.

### Q: Peut-on voir l'historique des nettoyages?

R: Les nettoyages génèrent des notifications RTDB et des logs console. Pour un historique persistant, vous devrez implémenter votre propre système de logging.

## Monitoring

### Via le hook React

```jsx
import { useOperationsQueue } from '@/toolkits/admin/stockToolkit';

function QueueMonitor() {
  const { stats, operations } = useOperationsQueue();

  return (
    <div>
      <h3>Queue Status</h3>
      <p>Pending: {stats.pending}</p>
      <p>Completed: {stats.completed}</p>
      <p>Failed: {stats.failed}</p>

      {stats.completed > 100 && (
        <button onClick={async () => {
          const removed = await cleanQueue();
          alert(`${removed} opérations nettoyées`);
        }}>
          Nettoyer maintenant
        </button>
      )}
    </div>
  );
}
```

## Documentation complète

Pour plus de détails sur le système de queue:
- 📖 [STOCK_QUEUE_SYSTEM.md](./STOCK_QUEUE_SYSTEM.md) - Documentation complète
- 📖 [SCHEMA_VALIDATION_GUIDE.md](./SCHEMA_VALIDATION_GUIDE.md) - Validation des données

---

**Note:** Cette fonctionnalité a été ajoutée pour améliorer les performances et éviter l'accumulation d'opérations dans Firestore. Elle est production-ready et testée.
