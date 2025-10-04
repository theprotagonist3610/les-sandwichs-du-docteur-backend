# 📊 Documentation Système Comptabilité OHADA

## 🎯 Vue d'ensemble

Système de comptabilité de caisse conforme OHADA pour la gestion comptable d'une sandwicherie.

**Version :** 2.0.0  
**Dernière mise à jour :** Décembre 2024  
**Framework :** React + Vite  
**Base de données :** Firestore + LocalStorage

---

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Configuration Firebase](#configuration-firebase)
4. [Guide d'utilisation](#guide-dutilisation)
5. [Pages et fonctionnalités](#pages-et-fonctionnalités)
6. [Hooks disponibles](#hooks-disponibles)
7. [Composants réutilisables](#composants-réutilisables)
8. [Plan comptable](#plan-comptable)
9. [Clôtures comptables](#clôtures-comptables)
10. [Rapports et exports](#rapports-et-exports)
11. [Mode hors-ligne](#mode-hors-ligne)
12. [Dépannage](#dépannage)

---

## 🏗️ Architecture

### Structure des dossiers

src/
├── pages/admin/compta/
│ ├── dashboard/ # Tableau de bord
│ ├── dayview/ # Vue journalière
│ ├── weekview/ # Vue hebdomadaire
│ ├── monthview/ # Vue mensuelle
│ ├── yearview/ # Vue annuelle
│ ├── handleTransactions/ # Formulaire CRUD
│ └── cloture/ # Gestion clôtures
│
├── components/compta/shared/
│ ├── MetricCard.jsx
│ ├── TransactionTable.jsx
│ ├── FilterToolbar.jsx
│ ├── ChartWrapper.jsx
│ └── ...
│
├── stores/
│ └── comptaStore.js # Store Zustand
│
├── toolkits/comptabilite/
│ ├── hooks/ # Hooks React
│ ├── services/ # Services (Firestore, LocalStorage)
│ ├── models/ # Modèles métier
│ ├── reports/ # Rapports (Grand Livre, Balance)
│ ├── utils/ # Utilitaires
│ └── constants.js
│
└── lib/
├── compta-utils.js
└── animations.js

### Technologies utilisées

- **Frontend :** React 18 + Vite
- **Routing :** React Router v6
- **State Management :** Zustand
- **Base de données :** Firebase Firestore
- **Cache local :** LocalStorage
- **UI Components :** Tailwind CSS
- **Animations :** Framer Motion
- **Graphiques :** Recharts
- **Notifications :** Sonner
- **Validation :** Zod
- **Dates :** date-fns

---

## 🚀 Installation

### Prérequis

- Node.js >= 18
- npm ou yarn
- Compte Firebase

### Étapes d'installation

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd <nom-projet>

# 2. Installer les dépendances
npm install

# 3. Configurer Firebase (voir section suivante)
cp .env.example .env

# 4. Lancer en développement
npm run dev

# 5. Build pour production
npm run build
```
