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
import Dashboard from "@/pages/admin/comptabilite/Dashboard";
import CreateOperationComptable from "@/pages/admin/comptabilite/CreateOperationComptable";
import GererLesOperationsComptables from "@/pages/admin/comptabilite/GererLesOperationsComptables";
import GererUneOperationComptable from "@/pages/admin/comptabilite/GererUneOperationComptable";
import Tresorerie from "@/pages/admin/comptabilite/Tresorerie";
import HistoriqueCompteTresorerie from "@/pages/admin/comptabilite/HistoriqueCompteTresorerie";
import CloturerJournee from "@/pages/admin/comptabilite/CloturerJournee";

export const comptabiliteSubRoutes = [
  {
    path: "dashboard",
    nom: "Tableau de bord",
    description: "Monitoring de la comptabilite",
    url: "/users.svg",
    component: Dashboard, // ✅ Composant activé
  },
  {
    path: "create",
    nom: "Création une opération comptable",
    description: "Créer une nouvelle opération comptable",
    url: "/users.svg",
    component: CreateOperationComptable, // ✅ Composant activé
  },
  {
    path: "tresorerie",
    nom: "Gérer la trésorerie",
    description: "Vue d'ensemble des comptes de trésorerie",
    url: "/users.svg",
    component: Tresorerie, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Historique compte de trésorerie",
        component: HistoriqueCompteTresorerie,
      },
    ],
  },
  {
    path: "cloture",
    nom: "Clôturer la journée",
    description: "Validation des transactions journalières",
    url: "/users.svg",
    component: CloturerJournee, // ✅ Composant activé
  },
  {
    path: "gerer",
    nom: "Gestion des opérations comptables",
    description: "Gestion des opérations comptables",
    url: "/users.svg",
    component: GererLesOperationsComptables, // ✅ Composant activé
    children: [
      {
        path: ":id",
        nom: "Gérer une opération comptable",
        component: GererUneOperationComptable,
      },
    ],
  },
];

export default comptabiliteSubRoutes;
