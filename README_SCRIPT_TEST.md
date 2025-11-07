# Script de Test des Opérations Comptables

## Description

Ce script génère automatiquement des opérations comptables de test pour simuler l'activité d'une sandwicherie sur une période donnée (1 Juillet 2025 - 7 Novembre 2025).

## Fonctionnalités

### Opérations quotidiennes générées :

- **50 opérations de ventes** :
  - 35 ventes de produits finis (sandwichs, yaourts, menus)
  - 15 ventes de marchandises (boissons, café, etc.)

- **4 opérations de trésorerie** :
  - 2 encaissements en caisse (paiements espèces)
  - 1 encaissement Mobile Money
  - 1 décaissement caisse (petites dépenses)

- **2 opérations de transfert bancaire** :
  - Dépôt depuis la caisse vers la banque
  - Crédit correspondant sur le compte bancaire

- **Opérations diverses** (charges et achats) :
  - Achats de matières premières (2-4x/jour)
  - Fournitures consommables (2-3x/semaine)
  - Transport (2-3x/semaine)
  - Loyer (1er du mois)
  - Téléphone/Internet (5 du mois)
  - Électricité (10 du mois)
  - Rémunérations (25 du mois)
  - Publicité (2x/mois)
  - Charges diverses (aléatoire)

## Prérequis

1. Node.js installé
2. Dépendances installées : `firebase`, `nanoid`
3. Fichier `.env` avec les variables Firebase

## Installation

```bash
# Installer les dépendances si nécessaire
npm install firebase nanoid
```

## Configuration

Créez un fichier `.env` à la racine du projet avec vos credentials Firebase :

```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_auth_domain
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
VITE_DATABASE_URL=your_database_url
```

## Utilisation

```bash
# Exécuter le script
node scripts/testOperationsComptables.js
```

Le script va :
1. Charger les comptes comptables et de trésorerie depuis Firestore
2. Générer des opérations cohérentes pour chaque jour
3. Sauvegarder les opérations dans `comptabilite/historique/days/{YYYY-MM-DD}`
4. Déclencher les triggers RTDB pour les mises à jour

## Détails techniques

### Structure des opérations

Chaque opération contient :
```javascript
{
  id: "op_xxxxx",
  compte_id: "compte_id",
  compte_ohada: "701",
  compte_denomination: "Vente de produits finis",
  montant: 1500,
  motif: "Vente sandwich poulet",
  type_operation: "entree", // ou "sortie"
  date: 1625145600000,
  createdBy: "script_test",
  createdAt: 1625145600000
}
```

### Comptes utilisés

**Produits (Entrées) :**
- 701 : Vente de produits finis
- 707 : Vente de marchandises
- 101 : Capital social
- 411 : Clients
- 4457 : TVA collectée
- 758 : Autres produits

**Charges (Sorties) :**
- 601 : Achats de matières premières
- 602 : Fournitures consommables
- 611 : Transport
- 613 : Loyers
- 615 : Entretien
- 623 : Publicité
- 626 : Téléphone et Internet
- 627 : Honoraires
- 635 : Impôts et taxes
- 641 : Rémunérations
- 658 : Charges diverses
- 401 : Fournisseurs
- 4456 : TVA déductible

**Trésorerie :**
- 511 : Banque
- 5121 : Mobile Money
- 531 : Caisse

### Période couverte

- **Date début** : 1 Juillet 2025
- **Date fin** : 7 Novembre 2025
- **Total** : ~129 jours
- **Opérations estimées** : ~8,000-10,000 opérations

### Variation et réalisme

Le script génère des données réalistes avec :
- Variations de prix aléatoires (+/- 10-20%)
- Horaires de vente réalistes (8h-20h)
- Opérations mensuelles (loyer, salaires, etc.)
- Opérations hebdomadaires (transport, fournitures)
- Opérations quotidiennes (ventes, achats)

## Performance

Le script inclut des pauses automatiques toutes les 10 jours pour éviter de surcharger Firestore. Temps d'exécution estimé : 3-5 minutes.

## Résultat attendu

```
🚀 Démarrage de la génération d'opérations comptables de test
📅 Période: 01/07/2025 - 07/11/2025

📥 Chargement des comptes...
✅ 33 comptes comptables chargés
✅ 3 comptes de trésorerie chargés

✅ 2025-07-01: 62 opérations sauvegardées
✅ 2025-07-02: 65 opérations sauvegardées
...
✅ 2025-11-07: 58 opérations sauvegardées

🎉 Génération terminée avec succès!
📊 Statistiques:
   - Jours traités: 129
   - Total opérations: 8,243
   - Moyenne par jour: 64
```

## Avertissement

⚠️ **ATTENTION** : Ce script écrit directement dans Firestore. Assurez-vous de l'exécuter sur un environnement de test ou de développement, **PAS EN PRODUCTION**.

## Nettoyage

Pour supprimer les données de test, vous devrez manuellement supprimer les documents dans `comptabilite/historique/days/` via la console Firebase.

## Support

Pour toute question ou problème, vérifiez :
1. Que les comptes existent bien dans Firestore
2. Que les variables d'environnement sont correctes
3. Que vous avez les permissions Firebase nécessaires
