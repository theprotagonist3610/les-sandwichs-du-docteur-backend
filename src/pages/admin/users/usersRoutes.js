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
import Dashboard from "@/pages/admin/users/dashboard/Dashboard";
import Presence from "@/pages/admin/users/presence/Presence";
import Profiles from "@/pages/admin/users/profile/Profiles";
import Profile from "@/pages/admin/users/profile/Profile";
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
    nom: "Profils",
    description: "Liste des utilisateurs",
    url: "/users.svg",
    component: Profiles, // ✅ Composant activé
  },
  {
    path: "profile/:id",
    nom: "Profil détaillé",
    description: "Détail d'un utilisateur",
    url: "/users.svg",
    component: Profile, // ✅ Composant activé
  },
];

export default userSubRoutes;
