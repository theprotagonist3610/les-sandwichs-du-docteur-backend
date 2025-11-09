/**
 * Configuration des sous-routes de Stock
 * Ces routes seront intégrées dans adminRoutes
 *
 * Pour ajouter un composant à une route :
 * 1. Créez le composant dans pages/admin/stock/{nom}.jsx
 * 2. Importez-le en haut de ce fichier
 * 3. Remplacez `component: null` par `component: YourComponent`
 *
 * Pour ajouter des sous-routes (ex: elements/:id) :
 * Ajoutez un tableau `children` avec la même structure
 */

// Import des composants pour chaque section
import Dashboard from "@/pages/admin/stock/Dashboard";
import Emplacements from "@/pages/admin/stock/Emplacements";
import Emplacement from "@/pages/admin/stock/Emplacement";
import StockElements from "@/pages/admin/stock/StockElements";
import StockElement from "@/pages/admin/stock/StockElement";
import OperationDeStock from "@/pages/admin/stock/OperationDeStock";

export const stockSubRoutes = [
  {
    path: "dashboard",
    nom: "Dashboard Stock",
    description: "Vue d'ensemble globale du stock",
    url: "/stock.svg",
    component: Dashboard, // ✅ Composant activé
  },
  {
    path: "emplacements",
    nom: "Emplacements",
    description: "Liste de tous les emplacements",
    url: "/stock.svg",
    component: Emplacements, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Détail Emplacement",
        component: Emplacement, // ✅ Composant activé
      },
    ],
  },
  {
    path: "elements",
    nom: "Éléments de Stock",
    description: "Liste de tous les éléments de stock",
    url: "/stock.svg",
    component: StockElements, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Détail Élément",
        component: StockElement, // ✅ Composant activé
      },
    ],
  },
  {
    path: "operations/create",
    nom: "Nouvelle Opération",
    description: "Créer une nouvelle opération de stock",
    url: "/stock.svg",
    component: OperationDeStock, // ✅ Composant activé
  },
  {
    path: "operations/edit/:id",
    nom: "Éditer Opération",
    description: "Éditer une opération de stock",
    url: "/stock.svg",
    component: OperationDeStock, // ✅ Composant activé
  },
];

export default stockSubRoutes;
