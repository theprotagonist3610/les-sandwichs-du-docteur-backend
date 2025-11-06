# Système de Statistiques de Production

## Vue d'ensemble

Le système de statistiques de production a été implémenté dans `productionToolkit.jsx`. Il suit automatiquement les productions terminées sur les 7 derniers jours et calcule les tendances par rapport à la veille.

## Structure Firestore

### Document: `productions/statistiques`

```javascript
{
  statistiques: [
    {
      jour: "03112025",  // Format DDMMYYYY
      recettesProduites: [
        {
          ingredient_principal: "Pain baguette",
          quantite_produite: 150,
          unite: {
            nom: "unité",
            symbol: "u"
          },
          tendance: "hausse" | "baisse" | "stable" | "nouvelle"
        },
        // ... autres recettes du jour
      ]
    },
    // ... jusqu'à 7 jours
  ],
  lastUpdated: 1730649600000  // Timestamp
}
```

## Schémas Zod

### `recetteProduitSchema`
Définit une recette produite avec:
- `ingredient_principal`: Nom de l'ingrédient/produit
- `quantite_produite`: Quantité totale produite dans la journée
- `unite`: Unité de mesure
- `tendance`: Tendance par rapport à la veille (optionnel)

### `statistiqueJourSchema`
Définit les statistiques d'un jour:
- `jour`: Date au format DDMMYYYY (validé par regex)
- `recettesProduites`: Array de recettes produites

### `statistiquesSchema`
Document complet des statistiques:
- `statistiques`: Array limité à 7 jours maximum
- `lastUpdated`: Timestamp de dernière mise à jour

## Calcul des Tendances

Les tendances sont calculées automatiquement en comparant avec la veille:

- **"nouvelle"**: Produit non fabriqué la veille
- **"stable"**: Variation < 5% par rapport à la veille
- **"hausse"**: Augmentation ≥ 5%
- **"baisse"**: Diminution ≥ 5%

### Formule
```javascript
const diff = quantite_aujourd_hui - quantite_hier;
const diffPercent = Math.abs(diff / quantite_hier);

if (diffPercent < 0.05) tendance = "stable";
else if (diff > 0) tendance = "hausse";
else tendance = "baisse";
```

## Fonctionnalités Automatiques

### 1. Détection de Changement de Jour
Le système utilise `formatDayKey()` qui génère automatiquement la clé du jour au format DDMMYYYY. Chaque production terminée met à jour le jour correspondant.

### 2. Mise à Jour Automatique
Quand une production est terminée via `completeProduction()`:
1. La production est sauvegardée dans `productions/historique/days/{DDMMYYYY}`
2. Le résultat est ajouté au stock
3. **Les statistiques sont mises à jour automatiquement**
4. Une notification RTDB est envoyée

### 3. Agrégation par Ingrédient Principal
Si plusieurs productions du même produit sont faites dans la journée, les quantités sont automatiquement additionnées.

Exemple:
```javascript
// Production 1: Pain baguette - 50 unités
// Production 2: Pain baguette - 100 unités
// Résultat dans statistiques: Pain baguette - 150 unités
```

### 4. Rotation Automatique (7 jours)
Le système conserve automatiquement uniquement les 7 derniers jours:
- Tri par date (plus récent en premier)
- Limitation à 7 entrées maximum
- Suppression automatique des jours plus anciens

## API Functions

### `updateProductionStatistiques(dayKey, completedInstance)`
**Privée** - Appelée automatiquement par `completeProduction()`
- Récupère toutes les productions terminées du jour
- Agrège par ingrédient principal
- Calcule les tendances vs veille
- Sauvegarde dans Firestore
- Gère la rotation des 7 jours

### `getProductionStatistiques()`
**Publique** - Récupère les statistiques
```javascript
const stats = await getProductionStatistiques();
// Retourne: { statistiques: [...], lastUpdated: timestamp }
```

### `parseDayKey(dayKey)`
**Privée** - Convertit une clé DDMMYYYY en timestamp
```javascript
parseDayKey("03112025") // → 1730649600000
```

## Hook React

### `useProductionStatistiques()`
Hook pour composants React avec synchronisation automatique:

```javascript
const {
  statistiques,    // Array des 7 derniers jours
  loading,         // État de chargement
  error,           // Message d'erreur éventuel
  lastUpdated,     // Timestamp dernière màj
  sync             // Fonction pour forcer sync
} = useProductionStatistiques();
```

**Fonctionnalités:**
- Chargement automatique au montage
- Synchronisation via notifications RTDB quand une production est terminée
- Détection de l'action "complete" dans les notifications
- Rafraîchissement automatique en temps réel

## Exemple d'Utilisation

### Dans un Composant React
```javascript
import { useProductionStatistiques } from '@/toolkits/admin/productionToolkit';

function StatsComponent() {
  const { statistiques, loading, error } = useProductionStatistiques();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {statistiques.map(stat => (
        <div key={stat.jour}>
          <h3>{stat.jour}</h3>
          {stat.recettesProduites.map(recette => (
            <div key={recette.ingredient_principal}>
              <p>{recette.ingredient_principal}: {recette.quantite_produite} {recette.unite.symbol}</p>
              <span className={`tendance-${recette.tendance}`}>
                {recette.tendance === "hausse" && "📈"}
                {recette.tendance === "baisse" && "📉"}
                {recette.tendance === "stable" && "➡️"}
                {recette.tendance === "nouvelle" && "✨"}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Flux de Données

```
Production terminée (completeProduction)
    ↓
Sauvegarde dans productions/historique/days/{DDMMYYYY}
    ↓
Ajout au stock (addResultToEmplacement)
    ↓
Mise à jour statistiques (updateProductionStatistiques)
    ├─ Récupération toutes productions du jour
    ├─ Agrégation par ingrédient
    ├─ Calcul tendances vs veille
    ├─ Rotation 7 jours
    └─ Sauvegarde dans productions/statistiques
    ↓
Notification RTDB envoyée
    ↓
Hook useProductionStatistiques détecte notification
    ↓
Synchronisation automatique des composants React
```

## Gestion d'Erreurs

Le système est conçu pour ne jamais bloquer une production:

```javascript
async function updateProductionStatistiques(dayKey, completedInstance) {
  try {
    // ... logique
  } catch (error) {
    console.error("❌ Erreur mise à jour statistiques:", error);
    // Ne pas bloquer la production si les statistiques échouent
  }
}
```

Si les statistiques échouent:
- L'erreur est loggée
- La production continue normalement
- Le stock est quand même mis à jour
- Les utilisateurs sont notifiés

## Validation

Toutes les données sont validées avec Zod avant sauvegarde:
- Format du jour (DDMMYYYY)
- Quantités positives
- Unités complètes
- Maximum 7 jours de statistiques

## Performance

- **Cache**: Non implémenté pour statistiques (données légères)
- **Agrégation**: O(n) où n = nombre de productions du jour
- **Tri**: O(n log n) où n ≤ 7
- **Espace**: Maximum ~7 jours × ~20 recettes × ~200 bytes ≈ 28 KB

## Notes Importantes

1. **Détection automatique du jour**: Utilise `formatDayKey()` qui retourne automatiquement le jour actuel si non spécifié
2. **Pas de modification manuelle**: Les statistiques sont uniquement mises à jour par le système
3. **Temps réel**: Les composants React se mettent à jour automatiquement via RTDB
4. **Sécurité**: Les règles Firestore doivent autoriser l'écriture sur `productions/statistiques`

## Règles Firestore Recommandées

```javascript
match /productions/statistiques {
  // Lecture: tous les utilisateurs authentifiés
  allow read: if request.auth != null;

  // Écriture: uniquement via Cloud Functions ou admin
  allow write: if request.auth.token.admin == true;
}
```

## Tests

Pour tester le système:
1. Terminer une production via `completeProduction()`
2. Vérifier que `productions/statistiques` est créé/mis à jour
3. Vérifier les tendances calculées
4. Terminer une autre production du même type
5. Vérifier l'agrégation des quantités
6. Vérifier la rotation après 7 jours

## Exports

Ajoutés dans le default export de `productionToolkit.jsx`:
- Schemas: `recetteProduitSchema`, `statistiqueJourSchema`, `statistiquesSchema`
- Fonction: `getProductionStatistiques`
- Hook: `useProductionStatistiques`
