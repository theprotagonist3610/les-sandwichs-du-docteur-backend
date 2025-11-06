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

// Import des composants pour chaque section
// À décommenter et créer au fur et à mesure
import Dashboard from "@/pages/admin/production/Dashboard";
import GererLesProductions from "@/pages/admin/production/GererLesProductions";
import GererUneProduction from "@/pages/admin/production/GererUneProduction";
import CreateProduction from "@/pages/admin/production/CreateProduction";
export const productionSubRoutes = [
  {
    path: "dashboard",
    nom: "Tableau de bord",
    description: "Monitoring de la production",
    url: "/users.svg",
    component: Dashboard, // ✅ Composant activé
  },
  {
    path: "create",
    nom: "Creation d'une production",
    description: "Creer une nouvelle production",
    url: "/users.svg",
    component: CreateProduction, // ✅ Composant activé
  },
  {
    path: "gerer",
    nom: "Tableau de bord",
    description: "Monitoring de la production",
    url: "/users.svg",
    component: GererLesProductions, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Gerer une production",
        component: GererUneProduction,
      },
    ],
  },
];

export default productionSubRoutes;
