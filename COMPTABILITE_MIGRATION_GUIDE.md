# 🔄 Guide de Migration - Système de Comptabilité

## 📌 Vue d'ensemble

Vous disposez maintenant de **deux systèmes de comptabilité compatibles**:

### 1. Système Original (comptabiliteToolkit.jsx)
- ✅ **Système de queue anti-collision** pour gérer les écritures concurrentes
- ✅ Fonctions CRUD de base pour comptes, opérations et trésorerie
- ✅ Hooks React simples (useComptes, useOperations, useTresoreries)
- ⚠️ Pas d'archivage automatique
- ⚠️ Pas de statistiques ni bilans automatiques

### 2. Système Modulaire (comptabilite/)
- ✅ **Architecture modulaire** avec 10 fichiers séparés
- ✅ **Auto-détection du changement de jour** avec archivage automatique
- ✅ **Statistiques en temps réel** (jour/semaine/mois)
- ✅ **Bilans automatiques** OHADA (jour/semaine/mois)
- ✅ **16 hooks React avancés** pour toutes les opérations
- ✅ **Validation stricte** avec Zod
- ✅ **Cache 5 minutes** pour optimiser les performances

---

## 🎯 Stratégie de Migration Recommandée

### Option 1: Migration Progressive (RECOMMANDÉE)
Gardez les deux systèmes en parallèle et migrez progressivement:

```javascript
// ANCIEN (comptabiliteToolkit.jsx)
import {
  useComptes,
  useOperations,
  useTresoreries
} from '@/toolkits/admin/comptabiliteToolkit';

// NOUVEAU (comptabilite/)
import {
  useComptesListe,
  useTodayCompta,
  useTresorerieModular as useTresorerie,
  useStatistiquesByDay,
  useBilanByDay
} from '@/toolkits/admin/comptabiliteToolkit'; // Ré-exporté!
```

### Option 2: Migration Immédiate
Remplacez tous les imports d'un coup (risqué mais rapide).

---

## 📊 Tableau de Correspondance

### Hooks

| Ancien Hook | Nouveau Hook | Changements |
|------------|--------------|-------------|
| `useComptes()` | `useComptesListe()` | ✅ Nom différent, même fonctionnalité |
| `useOperations({ date })` | `useTodayCompta()` | ✨ Détection auto du changement de jour |
| `useOperations({ date })` | `useOperationsByDay(dayKey)` | ✅ Pour historique |
| `useTresoreries()` | `useComptesTresorerieListe()` | ✅ Liste des comptes trésorerie |
| `useTresorerie(id)` | `useTresorerie()` | ✨ Nouveau: calcule soldes en temps réel |
| ❌ N'existe pas | `useStatistiquesByDay()` | ✨ Nouveau: statistiques jour |
| ❌ N'existe pas | `useStatistiquesByWeek()` | ✨ Nouveau: statistiques semaine |
| ❌ N'existe pas | `useBilanByDay()` | ✨ Nouveau: bilan jour |
| ❌ N'existe pas | `useBilanByWeek()` | ✨ Nouveau: bilan semaine |
| `useComptaQueue()` | ✅ Conservé | Queue anti-collision toujours disponible |

### Fonctions

| Ancienne Fonction | Nouvelle Fonction | Changements |
|------------------|-------------------|-------------|
| `createCompte()` | `creerCompte()` | ✅ Même logique |
| `getAllComptes()` | `getAllComptes()` | ✅ Identique + cache |
| `createOperation()` | `creerOperation()` | ✨ + Trigger stats automatiques |
| `getOperationsByDate()` | `getOperationsByDay()` | ✅ Clé format DDMMYYYY |
| `createTresorerie()` | `creerCompteTresorerie()` | ✅ Nom différent |
| `getAllTresoreries()` | `getAllComptesTresorerie()` | ✅ Nom différent |
| ❌ N'existe pas | `calculerStatistiquesJour()` | ✨ Nouveau |
| ❌ N'existe pas | `creerBilanJour()` | ✨ Nouveau |
| ❌ N'existe pas | `archiverOperationsVeille()` | ✨ Nouveau |

### Schemas

| Ancien Schema | Nouveau Schema | Changements |
|--------------|----------------|-------------|
| `CompteSchema` | `compteSchema` | ✅ Compatible, validation renforcée |
| `OperationSchema` | `operationSchema` | ⚠️ Structure légèrement différente |
| `TresorerieSchema` | `compteTresorerieSchema` | ⚠️ Nom et structure différents |

---

## 🔧 Exemples de Migration

### Exemple 1: Page Liste des Comptes

#### AVANT (ancien système)
```javascript
import { useComptes } from '@/toolkits/admin/comptabiliteToolkit';

function ComptesPage() {
  const { comptes, loading, error } = useComptes();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {comptes.map(compte => (
        <div key={compte.id}>
          {compte.denomination} - {compte.code_ohada}
        </div>
      ))}
    </div>
  );
}
```

#### APRÈS (nouveau système)
```javascript
import { useComptesListe } from '@/toolkits/admin/comptabiliteToolkit';

function ComptesPage() {
  const { comptes, loading, error, refetch } = useComptesListe();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>Rafraîchir</button>
      {comptes.map(compte => (
        <div key={compte.id}>
          {compte.denomination} - {compte.code_ohada}
          <span className={
            compte.categorie === 'entree' ? 'text-green-600' : 'text-red-600'
          }>
            ({compte.categorie})
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Exemple 2: Page Opérations du Jour

#### AVANT (ancien système)
```javascript
import { useOperations, createOperation } from '@/toolkits/admin/comptabiliteToolkit';

function OperationsPage() {
  const { operations, loading } = useOperations({ date: new Date() });

  const handleCreate = async (data) => {
    await createOperation(data);
    // Pas de rafraîchissement automatique
  };

  return (
    <div>
      <h2>Opérations du jour</h2>
      {operations.map(op => (
        <div key={op.id}>{op.montant} FCFA</div>
      ))}
    </div>
  );
}
```

#### APRÈS (nouveau système)
```javascript
import { useTodayCompta } from '@/toolkits/admin/comptabiliteToolkit';
import { creerOperation } from '@/toolkits/admin/comptabilite';

function OperationsPage() {
  const { operations, loading, dayKey } = useTodayCompta();
  // ✨ Auto-détection du changement de jour
  // ✨ Archivage automatique de la veille
  // ✨ Rafraîchissement automatique temps réel

  const handleCreate = async (data) => {
    await creerOperation(data, userId);
    // ✨ Stats et bilans mis à jour automatiquement
    // ✨ Hook se rafraîchit automatiquement via RTDB
  };

  return (
    <div>
      <h2>Opérations du {dayKey}</h2>
      <p>{operations.length} opération(s)</p>
      {operations.map(op => (
        <div key={op.id}>
          {op.montant} FCFA - {op.motif}
        </div>
      ))}
    </div>
  );
}
```

### Exemple 3: Dashboard avec Statistiques (NOUVEAU)

#### NOUVEAU - Impossible avec l'ancien système
```javascript
import {
  useTodayCompta,
  useStatistiquesByDay,
  useBilanByDay,
  useTresorerie
} from '@/toolkits/admin/comptabiliteToolkit';

function DashboardComptabilite() {
  const { operations } = useTodayCompta();
  const { statistiques } = useStatistiquesByDay();
  const { bilan } = useBilanByDay();
  const { soldes, total } = useTresorerie();

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Résumé du jour */}
      <div className="card">
        <h3>Aujourd'hui</h3>
        <p>Entrées: {statistiques?.total_entrees} FCFA</p>
        <p>Sorties: {statistiques?.total_sorties} FCFA</p>
        <p>Solde: {statistiques?.solde_journalier} FCFA</p>
        <p>{operations.length} opération(s)</p>
      </div>

      {/* Bilan */}
      <div className="card">
        <h3>Bilan</h3>
        <p className={bilan?.statut === 'positif' ? 'text-green-600' : 'text-red-600'}>
          Résultat: {bilan?.resultat} FCFA
        </p>
        <p>Statut: {bilan?.statut}</p>
      </div>

      {/* Trésorerie */}
      <div className="card">
        <h3>Trésorerie</h3>
        <p className="text-2xl font-bold">{total} FCFA</p>
        {soldes.map(s => (
          <div key={s.compte_id}>
            {s.denomination}: {s.solde} FCFA
          </div>
        ))}
      </div>

      {/* Top comptes */}
      <div className="card">
        <h3>Comptes les plus utilisés</h3>
        {statistiques?.comptes
          .sort((a, b) => b.nombre_operations - a.nombre_operations)
          .slice(0, 5)
          .map(c => (
            <div key={c.compte_id}>
              {c.denomination}: {c.nombre_operations} ops
            </div>
          ))}
      </div>
    </div>
  );
}
```

---

## ⚠️ Points d'Attention

### 1. Structure des Opérations

#### Ancien format
```javascript
{
  id: "op_xxx",
  type: "recette" | "depense",
  compte_code: "701",
  montant: 50000,
  tresorerie_id: "tresor_xxx",
  observation: "Vente",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Nouveau format
```javascript
{
  id: "op_xxx",
  type_operation: "entree" | "sortie",
  compte_id: "cmpte_xxx",
  compte_ohada: "701",
  compte_denomination: "Vente de produits finis",
  montant: 50000,
  motif: "Vente",
  date: timestamp,
  createdAt: timestamp,
  createdBy: "user_xxx"
}
```

**⚠️ Différences clés:**
- `type` → `type_operation` (valeurs: "entree"/"sortie" au lieu de "recette"/"depense")
- `compte_code` → `compte_id` + `compte_ohada` + `compte_denomination`
- `observation` → `motif`
- Ajout de `createdBy` et `updatedBy`

### 2. Format des Dates

#### Ancien: Date objects
```javascript
const operations = await getOperationsByDate(new Date());
```

#### Nouveau: DDMMYYYY strings
```javascript
const dayKey = "06112025"; // 6 novembre 2025
const operations = await getOperationsByDay(dayKey);

// Ou utiliser l'helper
const dayKey = formatDayKey(new Date());
```

### 3. Trésorerie

#### Ancien: Solde stocké directement
```javascript
{
  id: "tresor_xxx",
  denomination: "Caisse",
  type: "Caisse",
  solde: 150000 // Stocké en dur
}
```

#### Nouveau: Solde calculé dynamiquement
```javascript
// Compte de trésorerie
{
  id: "tresor_xxx",
  code_ohada: "531",
  denomination: "Caisse",
  categorie: "entree/sortie"
}

// Solde calculé via statistiques
const { soldes } = useTresorerie();
// soldes[0].solde = calculé depuis les opérations
```

---

## 🚀 Plan de Migration en 4 Étapes

### Étape 1: Tests (1-2 jours)
1. ✅ Créer une branche de test
2. ✅ Importer les nouveaux hooks dans un composant de test
3. ✅ Vérifier que les données s'affichent correctement
4. ✅ Tester la création d'opérations

### Étape 2: Migration des Composants Read-Only (3-5 jours)
Migrer les composants qui **lisent** uniquement (pas d'écriture):
- ✅ Page liste des comptes
- ✅ Page historique des opérations
- ✅ Dashboard de visualisation
- ✅ Rapports et statistiques

### Étape 3: Migration des Composants d'Écriture (5-7 jours)
Migrer les composants qui **créent/modifient**:
- ✅ Formulaire création d'opération
- ✅ Formulaire modification d'opération
- ✅ Gestion des comptes
- ✅ Gestion de la trésorerie

**⚠️ Attention:** Vérifier la compatibilité du format des données!

### Étape 4: Tests de Production (2-3 jours)
1. ✅ Déployer sur environnement de staging
2. ✅ Tester avec données réelles
3. ✅ Vérifier l'archivage automatique (attendre minuit)
4. ✅ Vérifier les statistiques
5. ✅ Vérifier les bilans
6. ✅ Déploiement production

---

## 🎨 Nouvelles Fonctionnalités Disponibles

### 1. Dashboard Statistiques
```javascript
import { useStatistiquesByDay } from '@/toolkits/admin/comptabiliteToolkit';

function StatsPage() {
  const { statistiques, loading } = useStatistiquesByDay();

  return (
    <div>
      <h2>Statistiques du jour</h2>
      <p>Total entrées: {statistiques?.total_entrees} FCFA</p>
      <p>Total sorties: {statistiques?.total_sorties} FCFA</p>
      <p>Solde: {statistiques?.solde_journalier} FCFA</p>
    </div>
  );
}
```

### 2. Bilans Hebdomadaires
```javascript
import { useBilanByWeek } from '@/toolkits/admin/comptabiliteToolkit';

function BilanPage() {
  const { bilan, loading } = useBilanByWeek();

  return (
    <div>
      <h2>Bilan de la semaine</h2>
      <p>Période: {bilan?.debut} - {bilan?.fin}</p>
      <p>Résultat: {bilan?.resultat} FCFA</p>
      <p>Statut: {bilan?.statut}</p>
    </div>
  );
}
```

### 3. Historique par Période
```javascript
import { useHistoriqueByWeek } from '@/toolkits/admin/comptabilite';

function HistoriquePage() {
  const weekKey = "04112025-10112025"; // Lundi 4 au Dimanche 10
  const { operations, loading } = useHistoriqueByWeek(weekKey);

  return (
    <div>
      <h2>Historique de la semaine</h2>
      <p>{operations.length} opération(s)</p>
      {operations.map(op => (
        <div key={op.id}>
          {op.date} - {op.motif} - {op.montant} FCFA
        </div>
      ))}
    </div>
  );
}
```

---

## 🛠️ Troubleshooting

### Problème 1: Import errors
```
Error: Cannot find module '@/toolkits/admin/comptabilite'
```

**Solution:** Vérifier que le dossier existe:
```
src/toolkits/admin/comptabilite/
├── index.js
├── schemas.js
├── constants.js
└── ...
```

### Problème 2: Hook ne se rafraîchit pas
```
Les opérations ne s'affichent pas après création
```

**Solution:** Vérifier que les triggers RTDB sont configurés:
```javascript
// Dans operations.js
await push(ref(rtdb, RTDB_COMPTA_TRIGGER_PATH), {
  action: "create_operation",
  timestamp: Date.now()
});
```

### Problème 3: Archivage ne fonctionne pas
```
Les opérations d'hier ne s'archivent pas
```

**Solution:** Le hook `useTodayCompta()` vérifie le changement de jour toutes les minutes. Attendre 1 minute après minuit ou forcer avec:
```javascript
import { detecterEtArchiverSiNouveauJour } from '@/toolkits/admin/comptabilite';

await detecterEtArchiverSiNouveauJour(lastDayKey);
```

---

## 📚 Ressources

- **Spécifications complètes:** [COMPTABILITE_TOOLKIT_SPEC.md](./COMPTABILITE_TOOLKIT_SPEC.md)
- **Guide d'implémentation:** [COMPTABILITE_IMPLEMENTATION_COMPLETE.md](./COMPTABILITE_IMPLEMENTATION_COMPLETE.md)
- **Code source modulaire:** `src/toolkits/admin/comptabilite/`
- **Code source original:** `src/toolkits/admin/comptabiliteToolkit.jsx`

---

## ✅ Checklist de Migration

- [ ] Lire ce guide complet
- [ ] Créer une branche de test
- [ ] Importer les nouveaux hooks dans un composant de test
- [ ] Vérifier compatibilité des données
- [ ] Migrer les composants read-only
- [ ] Migrer les composants d'écriture
- [ ] Tester l'archivage automatique
- [ ] Tester les statistiques
- [ ] Tester les bilans
- [ ] Déployer en staging
- [ ] Tests utilisateurs
- [ ] Déployer en production
- [ ] Surveiller les logs pendant 48h
- [ ] Former l'équipe sur les nouvelles fonctionnalités

---

## 🎉 Conclusion

Le nouveau système modulaire offre:
- ✅ **Meilleure maintenabilité** avec 10 fichiers séparés
- ✅ **Archivage automatique** quotidien
- ✅ **Statistiques en temps réel**
- ✅ **Bilans OHADA automatiques**
- ✅ **Cache optimisé** pour les performances
- ✅ **16 hooks React** pour tous les besoins

Tout en conservant:
- ✅ **Queue anti-collision** de l'ancien système
- ✅ **Compatibilité** avec les composants existants
- ✅ **Migration progressive** possible

**Bonne migration! 🚀**
