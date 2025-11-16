# 💰 Système de Comptabilité OHADA - Documentation Complète

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fichiers de Documentation](#fichiers-de-documentation)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [Usage](#usage)
6. [Support](#support)

---

## 🎯 Vue d'ensemble

Ce projet dispose d'un **système complet de comptabilité** basé sur les normes OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires).

### Caractéristiques principales

✅ **37 comptes OHADA par défaut** (Classes 1 à 7)
✅ **3 comptes de trésorerie** (Banque, Mobile Money, Caisse)
✅ **Archivage automatique** quotidien des opérations
✅ **Statistiques en temps réel** (jour/semaine/mois)
✅ **Bilans automatiques** avec calcul de résultat
✅ **16 React hooks** pour l'interface utilisateur
✅ **Système anti-collision** pour opérations concurrentes
✅ **Cache 5 minutes** pour optimiser les performances

---

## 📚 Fichiers de Documentation

Ce projet contient **4 documents de référence**:

### 1. [COMPTABILITE_IMPLEMENTATION_COMPLETE.md](./COMPTABILITE_IMPLEMENTATION_COMPLETE.md)
**📖 Le guide principal - À lire en premier**

Contient:
- ✅ Description complète de l'architecture
- ✅ Liste de tous les schémas Zod (11 schemas)
- ✅ Documentation des 20+ fonctions
- ✅ Documentation des 16 hooks React
- ✅ Exemples de code complets
- ✅ Formules de calcul des bilans
- ✅ Guide de workflow
- ✅ Tests recommandés

**👉 Lisez ce document pour comprendre le système.**

### 2. [COMPTABILITE_TOOLKIT_SPEC.md](./COMPTABILITE_TOOLKIT_SPEC.md)
**🔧 Spécifications techniques détaillées**

Contient:
- ✅ Liste complète des fichiers créés
- ✅ Spécifications de chaque fonction
- ✅ Exemples de code pour chaque module
- ✅ Statut de l'implémentation (100% complété)

**👉 Consultez ce document pour les détails techniques.**

### 3. [COMPTABILITE_MIGRATION_GUIDE.md](./COMPTABILITE_MIGRATION_GUIDE.md)
**🔄 Guide de migration depuis l'ancien système**

Contient:
- ✅ Comparaison ancien vs nouveau système
- ✅ Tableau de correspondance des hooks
- ✅ Exemples de migration pas à pas
- ✅ Plan de migration en 4 étapes
- ✅ Troubleshooting des problèmes courants

**👉 Lisez ce document si vous migrez depuis comptabiliteToolkit.jsx.**

### 4. [README_COMPTABILITE.md](./README_COMPTABILITE.md) (ce fichier)
**📌 Point d'entrée et résumé**

**👉 Commencez ici pour une vue d'ensemble.**

---

## 🚀 Quick Start

### Installation

Le système est déjà installé dans:
```
src/toolkits/admin/comptabilite/
```

### Initialisation (première utilisation)

```javascript
import {
  initialiserComptesDefault,
  initialiserTresorerieDefault
} from '@/toolkits/admin/comptabilite';

// Initialiser les 37 comptes OHADA
await initialiserComptesDefault(userId);

// Initialiser les 3 comptes de trésorerie
await initialiserTresorerieDefault(userId);
```

### Utilisation basique

#### 1. Afficher les opérations du jour
```javascript
import { useTodayCompta } from '@/toolkits/admin/comptabilite';

function OperationsPage() {
  const { operations, loading, dayKey } = useTodayCompta();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Opérations du {dayKey}</h2>
      {operations.map(op => (
        <div key={op.id}>
          {op.compte_denomination} - {op.montant} FCFA
        </div>
      ))}
    </div>
  );
}
```

#### 2. Créer une opération
```javascript
import { creerOperation } from '@/toolkits/admin/comptabilite';

const operation = await creerOperation({
  compte_id: "cmpte_abc123",
  montant: 50000,
  motif: "Vente de sandwichs",
  type_operation: "entree",
  date: Date.now()
}, userId);
```

#### 3. Afficher les statistiques
```javascript
import { useStatistiquesByDay } from '@/toolkits/admin/comptabilite';

function StatistiquesPage() {
  const { statistiques, loading } = useStatistiquesByDay();

  return (
    <div>
      <p>Entrées: {statistiques?.total_entrees} FCFA</p>
      <p>Sorties: {statistiques?.total_sorties} FCFA</p>
      <p>Solde: {statistiques?.solde_journalier} FCFA</p>
    </div>
  );
}
```

#### 4. Afficher le bilan
```javascript
import { useBilanByDay } from '@/toolkits/admin/comptabilite';

function BilanPage() {
  const { bilan, loading } = useBilanByDay();

  return (
    <div>
      <h2>Bilan du jour</h2>
      <p className={bilan?.statut === 'positif' ? 'text-green-600' : 'text-red-600'}>
        Résultat: {bilan?.resultat} FCFA ({bilan?.statut})
      </p>
    </div>
  );
}
```

---

## 🏗️ Architecture

### Structure des fichiers

```
src/toolkits/admin/
├── comptabilite/                    # ✨ Nouveau système modulaire
│   ├── index.js                    # Point d'entrée principal
│   ├── schemas.js                  # 11 schémas Zod
│   ├── constants.js                # Comptes OHADA, paths, cache
│   ├── utils.js                    # Fonctions utilitaires
│   ├── comptes.js                  # CRUD comptes
│   ├── operations.js               # CRUD opérations
│   ├── archivage.js                # Archivage automatique
│   ├── statistiques.js             # Calcul statistiques
│   ├── bilans.js                   # Calcul bilans
│   └── hooks.js                    # 16 React hooks
│
└── comptabiliteToolkit.jsx         # ⚙️ Système original (compatible)
```

### Firestore Structure

```
comptabilite/
├── comptes                          # Document avec array de 37 comptes
├── tresorerie                       # Document avec array de 3 comptes
├── today                            # Opérations du jour actuel
├── historique/
│   └── days/
│       ├── 06112025                # Opérations archivées par jour
│       └── 07112025
├── statistiques/
│   └── weeks/
│       ├── 04112025-10112025       # Stats hebdomadaires
│       └── 11112025-17112025
└── bilan/
    └── weeks/
        ├── 04112025-10112025       # Bilans hebdomadaires
        └── 11112025-17112025
```

### Workflow automatique

```
1. Utilisateur crée opération
   ↓
2. Opération stockée dans "today"
   ↓
3. Trigger RTDB envoyé
   ↓
4. Statistiques recalculées automatiquement
   ↓
5. À minuit (changement de jour):
   - Détection automatique par useTodayCompta()
   - Archivage des opérations de la veille
   - Vidage du document "today"
   ↓
6. Bilan calculé à la demande ou automatiquement
```

---

## 💡 Usage

### Hooks disponibles

#### Comptes
```javascript
useComptesListe()              // Liste tous les comptes
useComptesTresorerieListe()    // Liste comptes trésorerie
```

#### Opérations
```javascript
useTodayCompta()               // Opérations du jour (+ auto-archive)
useOperationsByDay(dayKey)     // Opérations d'un jour spécifique
useOperationsByWeek(weekKey)   // Opérations d'une semaine
useOperationsByMonth(monthKey) // Opérations d'un mois
```

#### Historique
```javascript
useHistoriqueByDay(dayKey)     // Historique d'un jour
useHistoriqueByWeek(weekKey)   // Historique d'une semaine
useHistoriqueByMonth(monthKey) // Historique d'un mois
```

#### Statistiques
```javascript
useStatistiquesByDay(dayKey)   // Stats d'un jour
useStatistiquesByWeek(weekKey) // Stats d'une semaine
useStatistiquesByMonth(monthKey) // Stats d'un mois (agrégées)
```

#### Bilans
```javascript
useBilanByDay(dayKey)          // Bilan d'un jour
useBilanByWeek(weekKey)        // Bilan d'une semaine
useBilanByMonth(monthKey)      // Bilan d'un mois (agrégé)
```

#### Utilitaires
```javascript
useTresorerie()                // Soldes de trésorerie en temps réel
```

### Fonctions principales

#### Initialisation
```javascript
initialiserComptesDefault(userId)
initialiserTresorerieDefault(userId)
```

#### Comptes
```javascript
creerCompte(data, userId)
updateCompte(id, data, userId)
getAllComptes()
findCompteById(id)
```

#### Opérations
```javascript
creerOperation(data, userId)
creerOperations(array, userId)    // Bulk create
updateOperation(id, data, userId)
deleteOperation(id, userId)
getOperationsToday()
getOperationsByDay(dayKey)
```

#### Archivage
```javascript
archiverOperationsVeille()
detecterEtArchiverSiNouveauJour(lastDayKey)
```

#### Statistiques
```javascript
calculerStatistiquesJour(dayKey)
calculerStatistiquesSemaine(weekKey)
updateStatistiquesEnTempsReel()
```

#### Bilans
```javascript
creerBilanJour(dayKey)
creerBilanSemaine(weekKey)
getBilansPlusieuresSemaines(n)
```

---

## 📊 Exemples Avancés

### Dashboard Comptable Complet

```javascript
import {
  useTodayCompta,
  useStatistiquesByDay,
  useBilanByDay,
  useTresorerie,
  useComptesListe
} from '@/toolkits/admin/comptabilite';

function DashboardComptabilite() {
  // Données du jour
  const { operations } = useTodayCompta();
  const { statistiques } = useStatistiquesByDay();
  const { bilan } = useBilanByDay();
  const { soldes, total } = useTresorerie();
  const { comptes } = useComptesListe();

  return (
    <div className="dashboard-grid">
      {/* KPIs */}
      <div className="card">
        <h3>📈 Entrées du jour</h3>
        <p className="text-3xl text-green-600">
          {statistiques?.total_entrees || 0} FCFA
        </p>
      </div>

      <div className="card">
        <h3>📉 Sorties du jour</h3>
        <p className="text-3xl text-red-600">
          {statistiques?.total_sorties || 0} FCFA
        </p>
      </div>

      <div className="card">
        <h3>💰 Solde journalier</h3>
        <p className={`text-3xl ${
          (statistiques?.solde_journalier || 0) >= 0
            ? 'text-green-600'
            : 'text-red-600'
        }`}>
          {statistiques?.solde_journalier || 0} FCFA
        </p>
      </div>

      <div className="card">
        <h3>🏦 Trésorerie totale</h3>
        <p className="text-3xl text-blue-600">
          {total} FCFA
        </p>
      </div>

      {/* Bilan */}
      <div className="card col-span-2">
        <h3>📊 Bilan du jour</h3>
        <div className="flex items-center gap-4">
          <div className={`badge ${
            bilan?.statut === 'positif' ? 'badge-success' :
            bilan?.statut === 'negatif' ? 'badge-error' :
            'badge-neutral'
          }`}>
            {bilan?.statut}
          </div>
          <p className="text-2xl">
            Résultat: {bilan?.resultat || 0} FCFA
          </p>
        </div>
      </div>

      {/* Détail trésorerie */}
      <div className="card">
        <h3>💳 Détail Trésorerie</h3>
        {soldes.map(s => (
          <div key={s.compte_id} className="flex justify-between">
            <span>{s.denomination}</span>
            <span className="font-bold">{s.solde} FCFA</span>
          </div>
        ))}
      </div>

      {/* Top comptes */}
      <div className="card">
        <h3>🔥 Comptes les plus utilisés</h3>
        {statistiques?.comptes
          .sort((a, b) => b.nombre_operations - a.nombre_operations)
          .slice(0, 5)
          .map(c => (
            <div key={c.compte_id} className="flex justify-between">
              <span>{c.denomination}</span>
              <span className="badge">{c.nombre_operations} ops</span>
            </div>
          ))}
      </div>

      {/* Dernières opérations */}
      <div className="card col-span-2">
        <h3>📝 Dernières opérations</h3>
        <div className="operations-list">
          {operations.slice(0, 10).map(op => (
            <div key={op.id} className="operation-item">
              <span className={`badge ${
                op.type_operation === 'entree'
                  ? 'badge-success'
                  : 'badge-error'
              }`}>
                {op.type_operation}
              </span>
              <span>{op.compte_denomination}</span>
              <span>{op.motif}</span>
              <span className="font-bold">{op.montant} FCFA</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Graphique d'Évolution

```javascript
import { getBilansPlusieuresSemaines } from '@/toolkits/admin/comptabilite';
import { LineChart } from 'recharts';

function GraphiqueEvolution() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const bilans = await getBilansPlusieuresSemaines(4);
      const chartData = bilans.map(b => ({
        semaine: `${b.debut}-${b.fin}`,
        entrees: b.total_entrees,
        sorties: b.total_sorties,
        resultat: b.resultat
      }));
      setData(chartData);
    }
    loadData();
  }, []);

  return (
    <LineChart width={600} height={300} data={data}>
      <Line type="monotone" dataKey="entrees" stroke="#10b981" />
      <Line type="monotone" dataKey="sorties" stroke="#ef4444" />
      <Line type="monotone" dataKey="resultat" stroke="#3b82f6" />
    </LineChart>
  );
}
```

---

## 🎓 Ressources Supplémentaires

### Documentation Complète
- 📖 **Guide principal:** [COMPTABILITE_IMPLEMENTATION_COMPLETE.md](./COMPTABILITE_IMPLEMENTATION_COMPLETE.md)
- 🔧 **Spécifications:** [COMPTABILITE_TOOLKIT_SPEC.md](./COMPTABILITE_TOOLKIT_SPEC.md)
- 🔄 **Migration:** [COMPTABILITE_MIGRATION_GUIDE.md](./COMPTABILITE_MIGRATION_GUIDE.md)

### Code Source
- **Système modulaire:** `src/toolkits/admin/comptabilite/`
- **Système original:** `src/toolkits/admin/comptabiliteToolkit.jsx`

### Normes OHADA
- **Organisation:** OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires)
- **Système:** SYSCOHADA (Système Comptable OHADA)
- **Pays:** 17 pays d'Afrique de l'Ouest et Centrale

---

## 🛠️ Support

### En cas de problème

1. **Consultez la documentation:**
   - [Guide principal](./COMPTABILITE_IMPLEMENTATION_COMPLETE.md)
   - [Guide de migration](./COMPTABILITE_MIGRATION_GUIDE.md)

2. **Vérifiez les logs:**
   ```javascript
   // Les fonctions logguent automatiquement
   console.log("✅ Opération créée");
   console.log("❌ Erreur:");
   ```

3. **Testez avec les données de démo:**
   ```javascript
   // Initialiser avec les comptes par défaut
   await initialiserComptesDefault("test_user");
   await initialiserTresorerieDefault("test_user");
   ```

### Troubleshooting Commun

**Problème:** Hook ne se rafraîchit pas
**Solution:** Vérifier les triggers RTDB dans operations.js

**Problème:** Archivage ne fonctionne pas
**Solution:** Attendre 1 minute après minuit ou forcer manuellement

**Problème:** Statistiques incorrectes
**Solution:** Recalculer avec `updateStatistiquesEnTempsReel()`

---

## ✅ Checklist Quick Start

- [ ] Lire [COMPTABILITE_IMPLEMENTATION_COMPLETE.md](./COMPTABILITE_IMPLEMENTATION_COMPLETE.md)
- [ ] Initialiser les comptes OHADA (`initialiserComptesDefault()`)
- [ ] Initialiser la trésorerie (`initialiserTresorerieDefault()`)
- [ ] Créer une première opération de test
- [ ] Vérifier que les statistiques se calculent
- [ ] Tester un hook dans un composant
- [ ] Vérifier l'archivage (attendre minuit ou forcer)
- [ ] Consulter le bilan du jour
- [ ] Implémenter un dashboard simple
- [ ] Lire le [guide de migration](./COMPTABILITE_MIGRATION_GUIDE.md) si migration nécessaire

---

## 🎉 Conclusion

Vous disposez maintenant d'un **système de comptabilité complet, automatisé et conforme OHADA** !

**Fonctionnalités clés:**
- ✅ 37 comptes OHADA + 3 trésorerie
- ✅ Archivage automatique quotidien
- ✅ Statistiques temps réel
- ✅ Bilans automatiques
- ✅ 16 hooks React
- ✅ Queue anti-collision
- ✅ Cache optimisé

**Prêt pour la production ! 🚀**

---

*Documentation générée pour le projet Les Sandwichs du Docteur*
*Dernière mise à jour: 6 novembre 2025*
