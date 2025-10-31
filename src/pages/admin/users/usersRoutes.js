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
import Dashboard from "@/pages/admin/users/dashboard/Dashboard";
import Presence from "@/pages/admin/users/presence/Presence";
import Profil from "@/pages/admin/users/profile/Profil";
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
    // Sous-routes de presence
    children: [
      {
        path: ":id",
        nom: "Surveiller la presence des utilisateurs",
        component: null, // ✅ Composant activé
      },
    ],
  },
  {
    path: "profil",
    nom: "Profils",
    description: "Profil des utilisateurs",
    url: "/users.svg",
    component: Profil, // ✅ Composant activé
    // Sous-routes de profils
    children: [
      {
        path: ":id",
        nom: "Surveiller la presence des utilisateurs",
        component: null, // ✅ Composant activé
      },
    ],
  },
];

export default userSubRoutes;
