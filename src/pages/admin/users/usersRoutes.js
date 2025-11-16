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
import Dashboard from "@/pages/admin/users/Dashboard";
import Presence from "@/pages/admin/users/Presence";
import Profiles from "@/pages/admin/users/Profiles";
import Profile from "@/pages/admin/users/Profile";

export const userSubRoutes = [
  {
    path: "dashboard",
    nom: "Tableau de bord",
    description: "Monitoring des utilisateurs",
    url: "/users.svg",
    component: Dashboard, // ✅ Composant activé
  },
  {
    path: "presence",
    nom: "Présence",
    description: "Presence des utilisateurs",
    url: "/users.svg",
    component: Presence, // ✅ Composant activé
  },
  {
    path: "profiles",
    nom: "Profiles",
    description: "Profiles des utilisateurs",
    url: "/users.svg",
    component: Profiles, // ✅ Composant activé
    // Sous-routes de profils
    children: [
      {
        path: ":userId",
        nom: "Surveiller la presence des utilisateurs",
        component: Profile, // ✅ Composant activé
      },
    ],
  },
];

export default userSubRoutes;
