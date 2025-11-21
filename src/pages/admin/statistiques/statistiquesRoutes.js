/**
 * Configuration des sous-routes de Settings
 * Ces routes seront intégrées dans adminRoutes
 *
 * Pour ajouter un composant à une route :
 * 1. Créez le composant dans pages/admin/Settings/{nom}.jsx
 * 2. Importez-le en haut de ce fichier
 * 3. Remplacez `component: null` par `component: YourComponent`
 *
 * Pour ajouter des sous-routes (ex: users/create) :
 * Ajoutez un tableau `children` avec la même structure
 */

import EmplacementId from "@/pages/admin/statistiques/EmplacementId";
import Emplacements from "@/pages/admin/statistiques/Emplacements";
import LivraisonId from "@/pages/admin/statistiques/LivraisonId";
import Livraisons from "@/pages/admin/statistiques/Livraisons";
import Paiement from "@/pages/admin/statistiques/Paiement";
import PaiementId from "@/pages/admin/statistiques/PaiementId";
import Production from "@/pages/admin/statistiques/Production";
import ProductionId from "@/pages/admin/statistiques/ProductionId";
import Stock from "@/pages/admin/statistiques/Stock";
import StockId from "@/pages/admin/statistiques/StockId";
import VendeurId from "@/pages/admin/statistiques/VendeurId";
import Vendeurs from "@/pages/admin/statistiques/Vendeurs";
import VenteId from "@/pages/admin/statistiques/VenteId";
import Ventes from "@/pages/admin/statistiques/Ventes";
import ComptabiliteId from "@/pages/admin/statistiques/ComptabiliteId";
import Comptabilite from "@/pages/admin/statistiques/Comptabilite";

// Imports pour le système de comptabilité étendu
import ComptabiliteDashboard from "@/pages/admin/statistiques/comptabilite/ComptabiliteDashboard";
import ComptabiliteBudget from "@/pages/admin/statistiques/comptabilite/budget/ComptabiliteBudget";
import ComptabiliteBudgetCreer from "@/pages/admin/statistiques/comptabilite/budget/ComptabiliteBudgetCreer";
import ComptabiliteBudgetId from "@/pages/admin/statistiques/comptabilite/budget/ComptabiliteBudgetId";
import ComptabilitePrevisions from "@/pages/admin/statistiques/comptabilite/ComptabilitePrevisions";
import ComptabiliteAnalyseFlux from "@/pages/admin/statistiques/comptabilite/ComptabiliteAnalyseFlux";
import ComptabiliteComparaisons from "@/pages/admin/statistiques/comptabilite/ComptabiliteComparaisons";
import ComptabiliteInsights from "@/pages/admin/statistiques/comptabilite/ComptabiliteInsights";

// Import des composants pour chaque section
// À décommenter et créer au fur et à mesure
export const statistiqueSubRoutes = [
  {
    path: "ventes",
    nom: "Ventes",
    description: "Analyse des ventes",
    url: "/users.svg",
    component: Ventes, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Analyse statistique d'un produit",
        component: VenteId, // ✅ Composant activé
      },
    ],
  },
  {
    path: "vendeurs",
    nom: "Vendeurs",
    description: "Analyse des performances des vendeurs",
    url: "/users.svg",
    component: Vendeurs, // ✅ Composant activé
    children: [
      {
        path: ":vendeurId",
        nom: "Analyse statistique d'un vendeur",
        component: VendeurId, // ✅ Composant activé
      },
    ],
  },
  {
    path: "stock",
    nom: "Stock",
    description: "Analyse statistique du stock",
    url: "/users.svg",
    component: Stock, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Analyse statistique d'un element de stock",
        component: StockId, // ✅ Composant activé
      },
    ],
  },
  {
    path: "production",
    nom: "Production",
    description: "Analyse statistique de la production",
    url: "/users.svg",
    component: Production, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Analyse statistique d'une recette",
        component: ProductionId, // ✅ Composant activé
      },
    ],
  },
  {
    path: "paiement",
    nom: "Paiement",
    description: "Analyse du flux financier",
    url: "/users.svg",
    component: Paiement, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Analyse statistique du flux d'un moyen de paiement",
        component: PaiementId, // ✅ Composant activé
      },
    ],
  },
  {
    path: "livraisons",
    nom: "Livraisons",
    description: "Analyse du flux des livraisons",
    url: "/users.svg",
    component: Livraisons, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Analyse statistique du flux d'une zone de livraison",
        component: LivraisonId, // ✅ Composant activé
      },
    ],
  },
  {
    path: "emplacements",
    nom: "Emplacements",
    description: "Analyse du flux commercial des emplacements",
    url: "/users.svg",
    component: Emplacements, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Analyse statistique du flux commercial d'un emplacement",
        component: EmplacementId, // ✅ Composant activé
      },
    ],
  },
  {
    path: "comptabilite",
    nom: "Comptabilité",
    description: "Analyse du flux comptable et gestion financière",
    url: "/users.svg",
    component: Comptabilite, // ✅ Dashboard principal
    children: [
      {
        path: "dashboard",
        nom: "Vue d'ensemble",
        description:
          "Tableau de bord financier complet avec KPIs et graphiques",
        component: ComptabiliteDashboard,
      },
      {
        path: "budget",
        nom: "Budget Prévisionnel",
        description: "Gestion et suivi des budgets mensuels",
        component: ComptabiliteBudget,
        children: [
          {
            path: "creer",
            nom: "Créer un budget",
            description: "Définir un nouveau budget mensuel",
            component: ComptabiliteBudgetCreer,
          },
          {
            path: ":budgetId",
            nom: "Détails du budget",
            description: "Suivi détaillé d'un budget spécifique",
            component: ComptabiliteBudgetId,
          },
        ],
      },
      {
        path: "previsions",
        nom: "Prévisions",
        description: "Projections financières à 30, 60 et 90 jours",
        component: ComptabilitePrevisions,
      },
      {
        path: "analyse-flux",
        nom: "Analyse de Flux",
        description: "Visualisation des flux de trésorerie avec Sankey diagram",
        component: ComptabiliteAnalyseFlux,
      },
      {
        path: "comptes/:compteId",
        nom: "Détails d'un compte",
        description: "Historique et tendances d'un compte comptable",
        component: ComptabiliteId,
      },
      {
        path: "comparaisons",
        nom: "Comparaisons",
        description: "Comparer différentes périodes comptables",
        component: ComptabiliteComparaisons,
      },
      {
        path: "insights",
        nom: "Insights",
        description: "Analyses automatiques et recommandations intelligentes",
        component: ComptabiliteInsights,
      },
    ],
  },
];

export default statistiqueSubRoutes;
