/**
 * stockRoutes.js
 * Configuration des routes pour la gestion du stock
 */

import { lazy } from "react";

// Lazy loading des composants
const Dashboard = lazy(() => import("./Dashboard"));
const Emplacements = lazy(() => import("./Emplacements"));
const Emplacement = lazy(() => import("./Emplacement"));
const StockElements = lazy(() => import("./StockElements"));
const StockElement = lazy(() => import("./StockElement"));
const OperationDeStock = lazy(() => import("./OperationDeStock"));

export const stockRoutes = {
  path: "stock",
  nom: "Gestion du Stock",
  description: "Gestion complète du stock et des emplacements",
  url: "/stock.svg",
  children: [
    {
      path: "",
      nom: "Dashboard Stock",
      description: "Vue d'ensemble globale du stock",
      component: Dashboard,
    },
    {
      path: "emplacements",
      nom: "Emplacements",
      description: "Liste de tous les emplacements",
      component: Emplacements,
      children: [
        {
          path: ":id",
          nom: "Détail Emplacement",
          component: Emplacement,
        },
      ],
    },
    {
      path: "elements",
      nom: "Éléments de Stock",
      description: "Liste de tous les éléments de stock",
      component: StockElements,
      children: [
        {
          path: ":id",
          nom: "Détail Élément",
          component: StockElement,
        },
      ],
    },
    {
      path: "operations",
      nom: "Opérations de Stock",
      description: "Gestion des opérations de stock",
      children: [
        {
          path: "create",
          nom: "Nouvelle Opération",
          component: OperationDeStock,
        },
        {
          path: "edit/:id",
          nom: "Éditer Opération",
          component: OperationDeStock,
        },
      ],
    },
  ],
};

export default stockRoutes;
