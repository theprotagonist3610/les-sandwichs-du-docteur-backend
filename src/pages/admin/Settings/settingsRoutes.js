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
import Users from "@/pages/admin/settings/users/Users";
import CreateUser from "@/pages/admin/settings/users/CreateUser";
import GererLesUsers from "@/pages/admin/settings/users/GererLesUsers";
import GererUnUser from "@/pages/admin/settings/users/GererUnUser";
import Menus from "@/pages/admin/settings/menus/Menus";
import CreateMenu from "@/pages/admin/settings/menus/CreateMenu";
import InitialiserMenus from "@/pages/admin/settings/menus/InitialiserMenus";
import GererLesMenus from "@/pages/admin/settings/menus/GererLesMenus";
import GererUnMenu from "@/pages/admin/settings/menus/GererUnMenu";
import GererUneBoisson from "@/pages/admin/settings/boissons/GererUneBoisson";
import GererLesBoissons from "@/pages/admin/settings/boissons/GererLesBoissons";
import CreateBoisson from "@/pages/admin/settings/boissons/CreateBoisson";
import InitialiserBoissons from "@/pages/admin/settings/boissons/InitialiserBoissons";
import Boissons from "@/pages/admin/settings/boissons/Boissons";
import Adresses from "@/pages/admin/settings/adresses/Adresses";
import Stock from "@/pages/admin/settings/stock/Stock";
import Emplacements from "@/pages/admin/settings/emplacements/Emplacements";
import InitialiserStock from "@/pages/admin/settings/stock/InitialiserStock";
import CreateAdresse from "@/pages/admin/settings/adresses/CreateAdresse";
import GererLesAdresses from "@/pages/admin/settings/adresses/GererLesAdresses";
import GererUneAdresse from "@/pages/admin/settings/adresses/GererUneAdresse";
import InitialiserAdresses from "@/pages/admin/settings/adresses/InitialiserAdresses";
import CreateStock from "@/pages/admin/settings/stock/CreateStock";
import GererLeStock from "@/pages/admin/settings/stock/GererLeStock";
import GererUnStock from "@/pages/admin/settings/stock/GererUnStock";
import CreateEmplacement from "@/pages/admin/settings/emplacements/CreateEmplacement";
import GererLesEmplacements from "@/pages/admin/settings/emplacements/GererLesEmplacements";
import GererUnEmplacement from "@/pages/admin/settings/emplacements/GererUnEmplacement";
import InitialiserComptes from "@/pages/admin/settings/comptabilite/InitialiserComptes";
import CreateCompte from "@/pages/admin/settings/comptabilite/CreateCompte";
import GererLesComptes from "@/pages/admin/settings/comptabilite/GererLesComptes";
import GererUnCompte from "@/pages/admin/settings/comptabilite/GererUnCompte";
import CreateProduction from "@/pages/admin/settings/production/CreateProduction";
import GererLesProductions from "@/pages/admin/settings/production/GererLesProductions";
import GererUneProduction from "@/pages/admin/settings/production/GererUneProduction";
import Comptabilite from "@/pages/admin/settings/comptabilite/Comptabilite";
import Production from "@/pages/admin/settings/production/Production";
// import Stats from "@/pages/admin/Settings/Stats";
// import Comptabilite from "@/pages/admin/Settings/Comptabilite";
// import Tresorerie from "@/pages/admin/Settings/Tresorerie";
// import Adresses from "@/pages/admin/Settings/Adresses";
// import Menus from "@/pages/admin/Settings/Menus";
// import Boissons from "@/pages/admin/Settings/Boissons";
// import Paiements from "@/pages/admin/Settings/Paiements";
// import Stock from "@/pages/admin/Settings/Stock";
// import Production from "@/pages/admin/Settings/Production";
// import Commandes from "@/pages/admin/Settings/Commandes";

export const settingsSubRoutes = [
  {
    path: "users",
    nom: "Utilisateurs",
    description: "Gestion des utilisateurs",
    url: "/users.svg",
    component: Users, // ✅ Composant activé
    // Sous-routes de users
    children: [
      {
        path: "create",
        nom: "Créer un utilisateur",
        component: CreateUser, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer les utilisateurs",
        component: GererLesUsers, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer un utilisateur",
        component: GererUnUser, // ✅ Composant activé
      },
    ],
  },
  {
    path: "stats",
    nom: "Statistiques",
    description: "Tableaux de bord",
    url: "/statistiques.svg",
    component: null, // Remplacer par : Stats
  },
  {
    path: "comptabilite",
    nom: "Comptabilité",
    description: "Gestion comptable",
    url: "/comptabilite.svg",
    component: Comptabilite, // Remplacer par : Comptabilite
    children: [
      {
        path: "init",
        nom: "Initialiser les comptes",
        component: InitialiserComptes, // ✅ Composant activé
      },
      {
        path: "create",
        nom: "Créer un compte",
        component: CreateCompte, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer les comptes",
        component: GererLesComptes, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer un compte",
        component: GererUnCompte, // ✅ Composant activé
      },
    ],
  },
  // {
  //   path: "tresorerie",
  //   nom: "Trésorerie",
  //   description: "Suivi trésorerie",
  //   url: "/tresorerie.svg",
  //   component: null, // Remplacer par : Tresorerie
  // },
  {
    path: "adresses",
    nom: "Adresses",
    description: "Gestion des adresses",
    url: "/adresses.svg",
    component: Adresses, // Remplacer par : Adresses
    children: [
      {
        path: "init",
        nom: "Initialiser adresses",
        component: InitialiserAdresses, // ✅ Composant activé
      },
      {
        path: "create",
        nom: "Créer une adresse",
        component: CreateAdresse, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer les adresses",
        component: GererLesAdresses, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer une adresse",
        component: GererUneAdresse, // ✅ Composant activé
      },
    ],
  },
  {
    path: "emplacements",
    nom: "Emplacements",
    description: "Gestion des emplacements  (Points de vente)",
    url: "/emplacements.svg",
    component: Emplacements, // Remplacer par : Adresses
    children: [
      {
        path: "create",
        nom: "Créer un emplacement",
        component: CreateEmplacement, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer les emplacements",
        component: GererLesEmplacements, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer un emplacement",
        component: GererUnEmplacement, // ✅ Composant activé
      },
    ],
  },
  {
    path: "menus",
    nom: "Menus",
    description: "Gestion des menus",
    url: "/menus.svg",
    component: Menus, // Remplacer par : Menus
    children: [
      {
        path: "init",
        nom: "Initialiser les menus",
        component: InitialiserMenus, // ✅ Composant activé
      },
      {
        path: "create",
        nom: "Créer un menu",
        component: CreateMenu, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer les menus",
        component: GererLesMenus, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer un menu",
        component: GererUnMenu, // ✅ Composant activé
      },
    ],
  },
  {
    path: "boissons",
    nom: "Boissons",
    description: "Gestion des boissons",
    url: "/boissons.svg",
    component: Boissons, // Remplacer par : Boissons
    children: [
      {
        path: "init",
        nom: "Initialiser les boissons",
        component: InitialiserBoissons, // ✅ Composant activé
      },
      {
        path: "create",
        nom: "Créer une boisson",
        component: CreateBoisson, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer les boissons",
        component: GererLesBoissons, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer une boisson",
        component: GererUneBoisson, // ✅ Composant activé
      },
    ],
  },
  // {
  //   path: "ingredients",
  //   nom: "Ingrédients",
  //   description: "Gestion des ingrédients",
  //   url: "/ingredients.svg",
  //   component: Ingredients, // Remplacer par : Boissons
  //   children: [
  //     {
  //       path: "init",
  //       nom: "Initialiser les ingrédients",
  //       component: InitialiserIngredients, // ✅ Composant activé
  //     },
  //     {
  //       path: "create",
  //       nom: "Créer un ingrédient",
  //       component: CreateIngredient, // ✅ Composant activé
  //     },
  //     {
  //       path: "gerer",
  //       nom: "Gerer les ingrédients",
  //       component: GererLesIngredients, // ✅ Composant activé
  //     },
  //     {
  //       path: "gerer/:id",
  //       nom: "Gerer un ingrédient",
  //       component: GererUnIngredient, // ✅ Composant activé
  //     },
  //   ],
  // },
  {
    path: "paiements",
    nom: "Paiements",
    description: "Moyens de paiement",
    url: "/paiements.svg",
    component: null, // Remplacer par : Paiements
  },
  {
    path: "stock",
    nom: "Stock",
    description: "Gestion du stock",
    url: "/stock.svg",
    component: Stock, // Remplacer par : Stock
    children: [
      {
        path: "init",
        nom: "Initialiser le stock",
        component: InitialiserStock, // ✅ Composant activé
      },
      {
        path: "create",
        nom: "Ajouter un stock",
        component: CreateStock, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer le stock",
        component: GererLeStock, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer un stock",
        component: GererUnStock, // ✅ Composant activé
      },
    ],
  },
  {
    path: "production",
    nom: "Production",
    description: "Suivi production",
    url: "/productions.svg",
    component: Production, // Remplacer par : Production
    children: [
      {
        path: "create",
        nom: "Créer un compte",
        component: CreateProduction, // ✅ Composant activé
      },
      {
        path: "gerer",
        nom: "Gerer les productions",
        component: GererLesProductions, // ✅ Composant activé
      },
      {
        path: "gerer/:id",
        nom: "Gerer une production",
        component: GererUneProduction, // ✅ Composant activé
      },
    ],
  },
  {
    path: "commandes",
    nom: "Commandes",
    description: "Gestion commandes",
    url: "/commander.svg",
    component: null, // Remplacer par : Commandes
  },
];

export default settingsSubRoutes;
