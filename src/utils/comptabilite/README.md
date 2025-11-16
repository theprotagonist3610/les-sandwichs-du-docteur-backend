# Utilitaires de Trésorerie

Ce dossier contient les utilitaires pour gérer et calculer les données de trésorerie de manière dynamique.

## 📁 Fichiers

### `calculerSoldesTresorerie.js`

Fonctions pour calculer dynamiquement les soldes des comptes de trésorerie à partir des opérations comptables stockées dans Firestore.

#### Fonctionnalités principales

**Calcul des soldes**
- `calculerSoldeCompte(compteTresorerieId, operations)` - Calcule le solde d'un compte spécifique
- `calculerSoldesComptes(comptesTresorerie, operations)` - Calcule les soldes de tous les comptes
- `calculerSoldesAujourdhui(comptesTresorerie)` - Récupère les opérations du jour et calcule les soldes
- `calculerSoldesParJour(comptesTresorerie, dayKey)` - Calcule les soldes pour un jour spécifique

**Calcul de variation**
- `calculerVariationTresorerie(comptesTresorerie)` - Calcule la variation en % entre aujourd'hui et hier

**Filtres d'opérations**
- `filtrerOperationsParDate(operations, dateDebut, dateFin)` - Filtre par période
- `filtrerOperationsParType(operations, typeOperation)` - Filtre par type (entrée/sortie)
- `filtrerOperationsParCompte(operations, compteId)` - Filtre par compte

#### Exemple d'utilisation des filtres

```javascript
import { getOperationsToday } from "@/toolkits/admin/comptabilite/operations";
import {
  filtrerOperationsParDate,
  filtrerOperationsParType,
  filtrerOperationsParCompte,
} from "@/utils/comptabilite/calculerSoldesTresorerie";

// Récupérer toutes les opérations du jour
const { operations } = await getOperationsToday();

// Filtrer les opérations par type (uniquement les entrées)
const entrees = filtrerOperationsParType(operations, "entree");
console.log(`${entrees.length} entrées aujourd'hui`);

// Filtrer les opérations par compte spécifique
const operationsCaisse = filtrerOperationsParCompte(operations, "tresor_abc123");

// Filtrer les opérations par date (dernières 24h)
const hier = new Date();
hier.setDate(hier.getDate() - 1);
const operationsRecentes = filtrerOperationsParDate(operations, hier, new Date());
```

### `tresorerieFormatters.js`

Utilitaires de formatage et configuration visuelle des comptes OHADA.

#### Fonctionnalités
- `formatMontant(montant)` - Formate un montant avec séparateurs
- `getCompteConfig(codeOhada)` - Retourne icône et couleurs selon le code OHADA
- `formatPourcentage(valeur)` - Formate un pourcentage avec signe
- `getVariationStyle(variation)` - Retourne les styles CSS pour une variation

### `tresorerieCharts.js`

Utilitaires pour préparer les données des graphiques (recharts).

#### Fonctionnalités
- `calculerDataRepartition(comptes, soldeTotal)` - Données pour BarChart
- `calculerDataEvolution(comptes, nombreJours)` - Données pour LineChart
- `calculerStatistiquesTresorerie(comptes)` - Statistiques globales
- `grouperComptesParType(comptes)` - Groupement par code OHADA

## 🔄 Flux de données

```
Firestore (operations/today)
        ↓
getOperationsToday()
        ↓
calculerSoldesAujourdhui()
        ↓
Store Zustand (useTresorerieStore)
        ↓
Hook (useTresorerieData)
        ↓
Composants React
```

## 🎯 Calcul des soldes

Les soldes sont calculés en temps réel à partir des opérations :

```
Solde = Σ(Entrées) - Σ(Sorties)
```

Pour chaque opération :
- Si `type_operation === "entree"` → **+montant**
- Si `type_operation === "sortie"` → **-montant**

## 📊 Calcul de la variation

La variation est calculée en comparant aujourd'hui avec hier :

```
Variation (%) = ((SoldeAujourd'hui - SoldeHier) / SoldeHier) × 100
```

**Cas spéciaux :**
- Si `SoldeHier === 0` et `SoldeAujourd'hui > 0` → Retourne `+100%`
- Si `SoldeHier === 0` et `SoldeAujourd'hui === 0` → Retourne `0%`

## 🔍 Filtres disponibles

### Par date

```javascript
// Opérations de la semaine dernière
const debut = new Date();
debut.setDate(debut.getDate() - 7);

const operationsSemaine = filtrerOperationsParDate(operations, debut, new Date());
```

### Par type

```javascript
// Uniquement les entrées
const entrees = filtrerOperationsParType(operations, "entree");

// Uniquement les sorties
const sorties = filtrerOperationsParType(operations, "sortie");
```

### Par compte

```javascript
// Opérations d'un compte spécifique
const operationsBanque = filtrerOperationsParCompte(operations, "tresor_xyz789");
```

### Combinaison de filtres

```javascript
// Entrées de la caisse cette semaine
const debut = new Date();
debut.setDate(debut.getDate() - 7);

let ops = await getOperationsToday();
ops = filtrerOperationsParDate(ops.operations, debut, new Date());
ops = filtrerOperationsParType(ops, "entree");
ops = filtrerOperationsParCompte(ops, compteIdCaisse);

console.log(`${ops.length} entrées en caisse cette semaine`);
```

## ⚡ Optimisations

- **Mémorisation** : Les calculs sont mémorisés avec `useMemo` dans le hook
- **Sélection optimisée** : Utilisation de `useShallow` (Zustand) pour éviter les re-renders
- **Calculs batch** : Tous les soldes sont calculés en une seule passe

## 🚀 Améliorations futures

- [ ] Calculer l'évolution historique réelle (actuellement simulée)
- [ ] Ajouter le calcul des soldes cumulés sur plusieurs jours
- [ ] Implémenter un cache pour les calculs lourds
- [ ] Ajouter des filtres combinés avec opérateurs AND/OR
- [ ] Support des exports (CSV, PDF)
