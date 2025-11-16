# Dashboard - Centre de Contrôle

## Description

Le Dashboard est le centre de contrôle central de l'application Les Sandwichs du Docteur. Il offre une vue d'ensemble de toutes les fonctionnalités et permet un accès rapide aux différents modules.

## Phase 1: Foundation ✅

### Composants créés

#### Layout
- **DashboardLayout** - Layout principal avec TopBar et conteneur de contenu
- **TopBar** - Barre supérieure avec titre, date, notifications et profil utilisateur
- **QuickActions** - Barre d'actions rapides pour les opérations courantes

#### KPIs
- **KPICard** - Carte d'affichage d'un indicateur clé de performance
- **KPIGrid** - Grille responsive pour organiser les KPICards

#### Hooks
- **useDashboardGlobal** - Hook central pour récupérer toutes les données des KPIs

### Structure des fichiers

```
src/pages/admin/dashboard/
├── Dashboard.jsx                    # Page principale
├── index.js                         # Point d'entrée du module
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx     # Layout principal
│   │   ├── TopBar.jsx              # Barre supérieure
│   │   └── QuickActions.jsx        # Actions rapides
│   ├── kpis/
│   │   ├── KPICard.jsx             # Carte KPI
│   │   └── KPIGrid.jsx             # Grille KPIs
│   ├── widgets/                     # (À venir Phase 2)
│   ├── charts/                      # (À venir Phase 4)
│   ├── timeline/                    # (À venir Phase 3)
│   └── notifications/               # (À venir Phase 3)
├── hooks/
│   └── useDashboardGlobal.js       # Hook principal
└── utils/                           # (À venir)
```

## KPIs Disponibles

Le dashboard affiche 6 KPIs principaux:

1. **Trésorerie** 💰
   - Solde total des comptes
   - Balance du jour
   - Variation en pourcentage

2. **Commandes** 🛒
   - Nombre de commandes du jour
   - Variation vs hier
   - Panier moyen

3. **Livraisons** 🚚
   - Livraisons en cours
   - Livraisons en retard
   - Total livraisons

4. **Production** 👨‍🍳
   - Productions du jour
   - Productions en cours
   - Productions terminées

5. **Stock** 📦
   - Nombre d'alertes stock
   - Éléments en stock bas
   - Total éléments

6. **Présence** 👥
   - Utilisateurs présents
   - Total utilisateurs
   - Pourcentage présence

## Fonctionnalités

### Auto-refresh
Les données sont automatiquement rafraîchies toutes les 30 secondes.

### Actions Rapides
- Nouvelle Vente
- Opération Comptable
- Production
- Livraison
- Mouvement Stock
- Statistiques

### Alertes
Le dashboard affiche les alertes critiques de tous les modules:
- Comptes négatifs
- Livraisons en retard
- Stock bas
- Dépassements budgétaires (à venir)

## Utilisation

### Import
```javascript
import { Dashboard } from "@/pages/admin/dashboard";
```

### Routing (exemple React Router)
```javascript
import { Dashboard } from "@/pages/admin/dashboard";

// Dans vos routes
<Route path="/admin/dashboard" element={<Dashboard />} />
```

### Hook personnalisé
```javascript
import useDashboardGlobal from "@/pages/admin/dashboard/hooks/useDashboardGlobal";

function MonComposant() {
  const { isLoading, error, kpis, alertes, refresh } = useDashboardGlobal();

  // Utiliser les données...
}
```

## Prochaines Phases

### Phase 2: Widgets Modules (Semaine 2)
- Widget Comptabilité avec mini-graphiques
- Widget Ventes avec top vendeurs
- Widget Livraisons avec carte zones
- Widget Production avec planning
- Widget Stock avec mouvements récents
- Widget Alertes détaillé

### Phase 3: Temps Réel (Semaine 3)
- Timeline activités en direct
- Centre de notifications
- Listeners RTDB
- Auto-refresh KPIs amélioré

### Phase 4: Graphiques & Stats (Semaine 4)
- Graphiques évolution
- Comparaisons multi-périodes
- Dashboards spécialisés par module
- Exports PDF/Excel

### Phase 5: Polish & UX (Semaine 5)
- Animations Framer Motion
- Optimisation responsive mobile
- Performance optimization
- Tests unitaires

## Technologies Utilisées

- **React 19** - Framework principal
- **Framer Motion** - Animations
- **Lucide React** - Icônes
- **date-fns** - Manipulation dates
- **Tailwind CSS** - Styling
- **React Router** - Navigation

## Dépendances des Toolkits

Le dashboard utilise les toolkits suivants:
- `@/toolkits/admin/comptabilite` - Données comptabilité
- `@/toolkits/admin/livraisons` - Données livraisons
- `@/toolkits/admin/livreurs` - Données livreurs
- Plus de toolkits à intégrer dans les prochaines phases

## Notes de Développement

### TODO
- [ ] Intégrer données commandes depuis commandeToolkit
- [ ] Intégrer données production depuis productionToolkit
- [ ] Intégrer alertes stock depuis stockToolkit
- [ ] Intégrer présence utilisateurs depuis userToolkit
- [ ] Ajouter navigation vers modules au clic sur KPI
- [ ] Implémenter actions rapides
- [ ] Ajouter tests unitaires

### Limitations actuelles
- Pas de carte interactive pour les livraisons (à venir Phase 4)
- Données commandes/production/stock en placeholder
- Navigation vers modules non implémentée
- Actions rapides non fonctionnelles

## Auteur

Dashboard créé dans le cadre du projet Les Sandwichs du Docteur.
Date: Novembre 2025
