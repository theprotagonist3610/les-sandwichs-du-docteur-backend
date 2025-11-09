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

import Dashboard from "@/pages/admin/stock/Dashboard";
import Emplacement from "@/pages/admin/stock/Emplacement";
import Emplacements from "@/pages/admin/stock/Emplacements";
import OperationDeStock from "@/pages/admin/stock/OperationDeStock";
import StockElement from "@/pages/admin/stock/StockElement";
import StockElements from "@/pages/admin/stock/StockElements";

// Import des composants pour chaque section
// À décommenter et créer au fur et à mesure
export const stockSubRoutes = [
  {
    path: "dashboard",
    nom: "Tableau de bord",
    description: "Monitoring du stock",
    url: "/users.svg",
    component: Dashboard, // ✅ Composant activé
  },
  {
    path: "emplacements",
    nom: "Emplacements",
    description: "Les points de vente",
    url: "/users.svg",
    component: Emplacements, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Surveiller un emplacement",
        component: Emplacement, // ✅ Composant activé
      },
    ],
  },
  {
    path: "stock",
    nom: "Le stock",
    description: "Etat du stock",
    url: "/users.svg",
    component: StockElements, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Surveiller un élément de stock",
        component: StockElement, // ✅ Composant activé
      },
    ],
  },
  {
    path: "operation",
    nom: "Faire une opération de stock",
    description: "Etat du stock",
    url: "/users.svg",
    component: OperationDeStock, // ✅ Composant activé
  },
];

export default stockSubRoutes;
