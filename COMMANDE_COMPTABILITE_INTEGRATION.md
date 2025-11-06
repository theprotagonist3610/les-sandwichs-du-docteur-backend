# 🔗 Intégration Comptabilité ↔ Commandes

## ✅ Mise à jour complétée

Le `commandeToolkit.jsx` a été mis à jour pour utiliser le **nouveau système de comptabilité modulaire** avec queue anti-collision.

---

## 🎯 Changements effectués

### 1. Imports mis à jour

#### AVANT (ancien système)
```javascript
import { createOperation, getDateKey } from "./comptabiliteToolkit";
```

#### APRÈS (nouveau système modulaire)
```javascript
import {
  createOperationWithQueue,
  creerOperation,
  formatDayKey,
  getAllComptesTresorerie,
  findCompteByCodeOhada,
} from "./comptabiliteToolkit";
```

### 2. Fonction `createComptabiliteOperationsForCommande` refactorisée

#### Améliorations principales:

✅ **Utilise `createOperationWithQueue`** au lieu de l'ancien `createOperation`
✅ **Récupère dynamiquement les comptes** OHADA (701, 411, 531, 5121)
✅ **Trouve les IDs réels** des comptes via `findCompteByCodeOhada`
✅ **Vérifie l'existence** des comptes de trésorerie avant création
✅ **Nouveau format** des opérations compatible avec le système modulaire
✅ **Queue anti-collision** pour éviter les problèmes de concurrence

---

## 📊 Workflow d'intégration

```
1. Client passe une commande
   ↓
2. Commande créée dans ventes/today
   ↓
3. Commande clôturée (statut: "livree" ou "servi")
   ↓
4. executeCommandeOperations() détecte la clôture
   ↓
5. createComptabiliteOperationsForCommande() appelée
   ↓
6. Récupération des comptes OHADA:
   - 701: Vente de produits finis
   - 411: Clients (pour dettes)
   - 531: Caisse (pour espèces)
   - 5121: Mobile Money
   ↓
7. Création des opérations selon le paiement:
   ├─ Espèces → Compte 701 (Ventes)
   ├─ Mobile Money → Compte 701 (Ventes)
   └─ Dette → Compte 411 (Clients)
   ↓
8. Opérations ajoutées à la queue comptable
   ↓
9. executeComptaOperations() les traite
   ↓
10. Statistiques comptables mises à jour
```

---

## 💡 Exemple d'utilisation

### Scénario: Vente de sandwich à 2500 FCFA

```javascript
// 1. Créer la commande
await CreateCommande({
  details: [
    {
      id: "prod_001",
      denomination: "Sandwich Poulet",
      quantite: 1,
      prix: 2500
    }
  ],
  statut: "non servi", // Pas encore servi
  type: "sur place",
  point_de_vente: { id: "pdv_001", denomination: "Point 1" },
  client: { nom: "Client Test", numero: "97000001" },
  paiement: {
    total: 2500,
    livraison: 0,
    montant_total_recu: 2500,
    monnaie_rendue: 0,
    montant_momo_recu: 0,
    montant_espece_recu: 2500, // Payé en espèces
    reduction: 0,
    dette: 0
  }
}, userId);

// ✅ Commande créée mais PAS d'opération comptable encore

// 2. Marquer la commande comme servie
await UpdateCommande(commandeId, {
  statut: "servi" // Clôture de la commande
}, userId);

// ✅ Opération comptable AUTOMATIQUEMENT créée:
// {
//   compte_id: "cmpte_701",         // ID du compte "Vente de produits finis"
//   montant: 2500,
//   motif: "Vente commande cmd_xxx - Client Test - Espèces",
//   type_operation: "entree"
// }
// ✅ Ajoutée à la queue comptable
// ✅ Exécutée automatiquement
// ✅ Stats comptables mises à jour
```

---

## 🔍 Détection automatique des comptes

### Codes OHADA utilisés

| Code | Compte | Usage |
|------|--------|-------|
| **701** | Vente de produits finis | Sandwichs, yaourts, produits fabriqués |
| **707** | Vente de marchandises | Boissons, biscuits (future utilisation) |
| **411** | Clients | Créances/dettes |
| **531** | Caisse | Encaissements espèces |
| **5121** | Mobile Money | Encaissements mobile |

### Algorithme de création

```javascript
// Espèces reçues ?
if (paiement.montant_espece_recu > 0) {
  → Créer opération: Compte 701 (Ventes), type "entree"
}

// Mobile Money reçu ?
if (paiement.montant_momo_recu > 0) {
  → Créer opération: Compte 701 (Ventes), type "entree"
}

// Dette enregistrée ?
if (paiement.dette > 0) {
  → Créer opération: Compte 411 (Clients), type "entree"
}
```

---

## 🛡️ Sécurité et fiabilité

### Vérifications effectuées

✅ **Existence du module comptabilité**
```javascript
if (!createOperationWithQueue || typeof createOperationWithQueue !== 'function') {
  // Module non disponible → ignorer gracieusement
  return;
}
```

✅ **Existence des comptes OHADA**
```javascript
const compteVente = await findCompteByCodeOhada("701");
if (!compteVente) {
  console.warn("Compte 701 non trouvé");
  return; // Arrêter si compte absent
}
```

✅ **Existence des comptes de trésorerie**
```javascript
const compteCaisse = comptesTreesorerie.find(c => c.code_ohada === "531");
if (paiement.montant_espece_recu > 0 && compteCaisse) {
  // OK, créer l'opération
}
```

### Gestion d'erreurs

- ❌ **Si module comptabilité absent** → Log info, continuer sans comptabilité
- ❌ **Si compte OHADA absent** → Log warning, ne pas créer d'opération
- ❌ **Si création échoue** → Promise.allSettled, ne pas bloquer la commande
- ✅ **La commande est TOUJOURS créée**, même si la comptabilité échoue

---

## 📈 Avantages du nouveau système

### 1. Queue anti-collision
```javascript
// Plusieurs utilisateurs créent des ventes simultanément
User1: CreateCommande() → Queue → Traité séquentiellement
User2: CreateCommande() → Queue → Traité séquentiellement
User3: CreateCommande() → Queue → Traité séquentiellement

// ✅ Pas de collision Firestore
// ✅ Toutes les opérations traitées dans l'ordre
```

### 2. Comptes dynamiques
```javascript
// AVANT: IDs en dur
tresorerie_id: "caisse" // ❌ String arbitraire

// APRÈS: IDs réels récupérés
compte_id: "cmpte_abc123" // ✅ ID réel du compte OHADA 701
```

### 3. Validation stricte
```javascript
// Le système modulaire valide avec Zod
operationSchema.parse({
  compte_id: "cmpte_xxx",
  montant: 2500,
  motif: "Vente...",
  type_operation: "entree"
});
// ✅ Erreur si données invalides
```

### 4. Statistiques automatiques
```javascript
// Après chaque opération comptable
updateStatistiquesEnTempsReel()
// ✅ Stats jour recalculées
// ✅ Bilans mis à jour
// ✅ Hooks rafraîchis
```

---

## 🚀 Prochaines étapes recommandées

### 1. Initialiser les comptes OHADA
```javascript
import {
  initialiserComptesDefault,
  initialiserTresorerieDefault
} from '@/toolkits/admin/comptabiliteToolkit';

// Une seule fois, au setup initial
await initialiserComptesDefault(userId);
await initialiserTresorerieDefault(userId);
```

### 2. Tester le workflow complet
```javascript
// 1. Créer une commande
const cmd = await CreateCommande({...}, userId);

// 2. La marquer comme servie
await UpdateCommande(cmd.id, { statut: "servi" }, userId);

// 3. Vérifier dans la console:
// ✅ "Opération comptable ajoutée à la queue"
// ✅ "Statistiques mises à jour"
```

### 3. Surveiller la queue comptable
```javascript
import { useComptaQueue } from '@/toolkits/admin/comptabiliteToolkit';

function QueueMonitor() {
  const { queue, stats } = useComptaQueue();

  return (
    <div>
      <p>En attente: {stats.pending}</p>
      <p>Complétées: {stats.completed}</p>
      <p>Échouées: {stats.failed}</p>
    </div>
  );
}
```

### 4. Dashboard comptable pour les ventes
```javascript
import {
  useStatistiquesByDay,
  useTodayCompta
} from '@/toolkits/admin/comptabiliteToolkit';

function VentesDashboard() {
  const { statistiques } = useStatistiquesByDay();
  const { operations } = useTodayCompta();

  // Filtrer les opérations de ventes (compte 701)
  const operationsVentes = operations.filter(
    op => op.compte_ohada === "701"
  );

  return (
    <div>
      <h3>Ventes du jour</h3>
      <p>Total: {statistiques?.total_entrees || 0} FCFA</p>
      <p>Nombre d'opérations: {operationsVentes.length}</p>
    </div>
  );
}
```

---

## ⚠️ Points d'attention

### 1. Les comptes doivent exister

**Avant toute vente, s'assurer que:**
- ✅ Compte 701 (Vente de produits finis) existe
- ✅ Compte 411 (Clients) existe
- ✅ Comptes de trésorerie (531, 5121) existent

**Sinon:**
```javascript
// Logs d'avertissement mais pas d'erreur bloquante
console.warn("⚠️ Compte vente 701 non trouvé");
// La commande EST créée quand même
```

### 2. Timing de création

**Opérations comptables créées UNIQUEMENT quand:**
- ✅ Commande passe de `"non servi"` → `"servi"`
- ✅ Commande passe de `"non livree"` → `"livree"`
- ❌ PAS lors de la création initiale

**Pourquoi?**
- Comptabiliser uniquement les ventes **confirmées**
- Pas de comptabilisation si commande annulée avant service

### 3. Gestion des dettes

```javascript
// Client paie 1000 FCFA sur total de 2500 FCFA
paiement: {
  total: 2500,
  montant_espece_recu: 1000,
  montant_momo_recu: 0,
  dette: 1500  // Dette enregistrée
}

// Opérations créées:
// 1. Compte 701: +1000 FCFA (espèces)
// 2. Compte 411: +1500 FCFA (créance client)
```

---

## 🧪 Tests recommandés

### Test 1: Vente simple en espèces
```javascript
✅ Créer commande avec paiement cash complet
✅ Marquer comme "servi"
✅ Vérifier: 1 opération comptable créée (701)
✅ Vérifier: Statistiques mises à jour
```

### Test 2: Vente avec Mobile Money
```javascript
✅ Créer commande avec paiement momo
✅ Marquer comme "servi"
✅ Vérifier: 1 opération comptable créée (701)
```

### Test 3: Vente avec dette
```javascript
✅ Créer commande avec dette partielle
✅ Marquer comme "servi"
✅ Vérifier: 2 opérations créées (701 + 411)
```

### Test 4: Vente mixte
```javascript
✅ Créer commande: 1000 cash + 500 momo + 1000 dette
✅ Marquer comme "servi"
✅ Vérifier: 3 opérations créées
```

### Test 5: Commande annulée
```javascript
✅ Créer commande
✅ Marquer comme "annulee"
✅ Vérifier: AUCUNE opération comptable créée
```

---

## 📊 Monitoring

### Logs à surveiller

```javascript
// Succès
✅ "Opération comptable ajoutée à la queue"
✅ "3 opération(s) comptable(s) ajoutée(s) à la queue"
✅ "Statistiques mises à jour"

// Warnings (non bloquants)
⚠️ "Compte vente 701 non trouvé"
⚠️ "Impossible de récupérer les comptes de trésorerie"
⚠️ "Compte client 411 non trouvé"

// Info
ℹ️ "Module comptabilité non disponible"
ℹ️ "Aucune opération comptable à créer"
```

---

## ✅ Checklist de vérification

- [x] Imports mis à jour vers le système modulaire
- [x] `createOperationWithQueue` utilisé au lieu de `createOperation`
- [x] Comptes OHADA récupérés dynamiquement
- [x] IDs réels utilisés (pas de strings arbitraires)
- [x] Format des opérations compatible avec le nouveau système
- [x] Gestion d'erreurs robuste (ne bloque pas les commandes)
- [x] Logs informatifs pour debugging
- [x] Compatible avec la queue anti-collision

---

## 🎉 Conclusion

L'intégration entre le système de commandes et la comptabilité est maintenant **complète et robuste**:

✅ **Automatique**: Les ventes déclenchent automatiquement les opérations comptables
✅ **Sécurisé**: Queue anti-collision pour éviter les problèmes de concurrence
✅ **Fiable**: Vérifications multiples, gestion d'erreurs gracieuse
✅ **Traçable**: Logs détaillés pour monitoring
✅ **Conforme OHADA**: Utilise les bons codes comptables
✅ **Non bloquant**: Les commandes fonctionnent même si la comptabilité échoue

**Prêt pour la production! 🚀**

---

*Intégration Commandes ↔ Comptabilité v1.0*
*Mise à jour: 6 novembre 2025*
