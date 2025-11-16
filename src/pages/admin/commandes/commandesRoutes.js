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
import Dashboard from "@/pages/admin/commandes/Dashboard";
import Ventes from "@/pages/admin/commandes/Ventes";
import PanneauDeVente from "@/pages/admin/commandes/PanneauDeVente";
import GererUneVente from "@/pages/admin/commandes/GererUneVente";
import GererLesVentes from "@/pages/admin/commandes/GererLesVentes";
import ALivrer from "@/pages/admin/commandes/ALivrer";
import SurPlace from "@/pages/admin/commandes/SurPlace";
export const commandeSubRoutes = [
  {
    path: "dashboard",
    nom: "Tableau de bord",
    description: "Monitoring des ventes",
    url: "/users.svg",
    component: Dashboard, // ✅ Composant activé
  },
  {
    path: "panneau_de_ventes",
    nom: "Panneau de ventes",
    description: "Prendre les commandes",
    url: "/users.svg",
    component: PanneauDeVente, // ✅ Composant activé
    children: [
      {
        path: "a_livrer",
        nom: "Prendre les commandes",
        component: ALivrer, // ✅ Composant activé
      },
      {
        path: "sur_place",
        nom: "Prendre les commandes",
        component: SurPlace, // ✅ Composant activé
      },
    ],
  },
  {
    path: "ventes",
    nom: "Ventes",
    description: "Gestion des ventes",
    url: "/users.svg",
    component: Ventes, // ✅ Composant activé
    // Sous-routes de presence
    children: [
      {
        path: "ventes",
        nom: "Gestion des commandes",
        component: GererLesVentes, // ✅ Composant activé
      },
      {
        path: ":id",
        nom: "Gerer une commande",
        component: GererUneVente, // ✅ Composant activé
      },
    ],
  },
];

export default commandeSubRoutes;
