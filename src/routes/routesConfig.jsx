import LoginPage from "@/pages/login/index";
import RegisterPage from "@/pages/login/Register";
import SuperviseurDashboard from "@/pages/superviseur/dashboard/index";
import Ventes from "@/pages/superviseur/ventes/index";
import PanneauDeVente from "@/pages/superviseur/ventes/PanneauDeVente";
import Commandes from "@/pages/superviseur/ventes/Commandes";
import Admin from "@/pages/admin/index";
import Utilisateurs from "@/pages/admin/users/index";
import AjouterUser from "@/pages/admin/users/AjouterUser";
import Users from "@/pages/admin/users/Users";
import UserDetail from "@/pages/admin/users/UserDetail";
import PointDeVente from "@/pages/admin/points_vente/index";
import AjouterPointDeVente from "@/pages/admin/points_vente/AjouterPointDeVente";
import GererPointDeVente from "@/pages/admin/points_vente/GererPointDeVente";
import GererPointDeVenteDetail from "@/pages/admin/points_vente/GererPointDeVenteDetail";
import Adresse from "@/pages/admin/adresses/index";
import AjouterAdresse from "@/pages/admin/adresses/AjouterAdresse";
import GererAdresses from "@/pages/admin/adresses/GererAdresses";
import InitialiserAdresses from "@/pages/admin/adresses/InitialiserAdresses";
import GererUneAdresse from "@/pages/admin/adresses/GererUneAdresse";
import GererMoyenDePaiement from "@/pages/admin/paiement/index";
import InitialiserMoyensDePaiement from "@/pages/admin/paiement/InitialiserMoyensDePaiement";
import AjouterUnMoyenDePaiement from "@/pages/admin/paiement/AjouterUnMoyenDePaiement";
import GererLesMoyensDePaiement from "@/pages/admin/paiement/GererLesMoyensDePaiement";
import GererUnMoyenDePaiement from "@/pages/admin/paiement/GererUnMoyenDePaiement";
import GererBoissons from "@/pages/admin/boissons/index";
import InitialiserBoissons from "@/pages/admin/boissons/InitialiserBoissons";
import AjouterUneBoisson from "@/pages/admin/boissons/AjouterUneBoisson";
import GererLesBoissons from "@/pages/admin/boissons/GererLesBoissons";
import GererUneBoisson from "@/pages/admin/boissons/GererUneBoisson";
import GererMenus from "@/pages/admin/menus/index";
import InitialiserMenus from "@/pages/admin/menus/InitialiserMenus";
import AjouterUnMenu from "@/pages/admin/menus/AjouterUnMenu";
import GererLesMenus from "@/pages/admin/menus/GererLesMenus";
import GererUnMenu from "@/pages/admin/menus/GererUnMenu";
import GererSupplements from "@/pages/admin/supplements/index";
import InitialiserSupplements from "@/pages/admin/supplements/InitialiserSupplements";
import AjouterUnSupplement from "@/pages/admin/supplements/AjouterUnSupplement";
import GererLesSupplements from "@/pages/admin/supplements/GererLesSupplements";
import GererUnSupplement from "@/pages/admin/supplements/GererUnSupplement";
import GererIngredients from "@/pages/admin/ingredients/index";
import InitialiserIngredients from "@/pages/admin/ingredients/InitialiserIngredients";
import AjouterUnIngredient from "@/pages/admin/ingredients/AjouterUnIngredient";
import GererLesIngredients from "@/pages/admin/ingredients/GererLesIngredients";
import GererUnIngredient from "@/pages/admin/ingredients/GererUnIngredient";
import GererLaCompta from "@/pages/admin/compta/index";
import ComptaDashboard from "@/pages/admin/compta/dashboard/Dashboard";
import ComptaDayView from "@/pages/admin/compta/dayview/DayView";
import ComptaWeekView from "@/pages/admin/compta/weekview/WeekView";
import ComptaMonthView from "@/pages/admin/compta/monthview/MonthView";
import ComptaYearView from "@/pages/admin/compta/yearview/YearView";
import ComptaHantdleTransactions from "@/pages/admin/compta/handletransactions/HandleTransactions";
import ComptaClotureManager from "@/pages/admin/compta/cloture/ClotureManager";
// Composants de pages temporaires (tu les remplaceras par tes vrais composants)
const UnauthorizedPage = () => (
  <div className="text-center">
    <h1 className="text-3xl font-bold text-red-600 mb-4">Accès Refusé</h1>
    <p className="text-gray-600 mb-6">
      Vous n'avez pas les permissions pour accéder à cette page.
    </p>
    <a
      href="/login"
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Retour à la connexion
    </a>
  </div>
);

const NotFoundPage = () => (
  <div className="text-center">
    <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
      Page introuvable
    </h2>
    <p className="text-gray-600 mb-6">
      La page que vous cherchez n'existe pas.
    </p>
    <a
      href="/"
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Retour à l'accueil
    </a>
  </div>
);

// Pages par rôle (temporaires)

const VendeuseOrdersPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Gestion des Commandes</h1>
    <div className="bg-white p-6 rounded-lg shadow border">
      <p className="text-gray-600">Liste des commandes en cours...</p>
      <div className="mt-4 space-y-2">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          Commande #001 - En préparation
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          Commande #002 - Prête
        </div>
      </div>
    </div>
  </div>
);

const CuisiniereKitchen = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Espace Cuisine</h1>
    <div className="bg-white p-6 rounded-lg shadow border">
      <p className="text-gray-600">Commandes à préparer...</p>
      <div className="mt-4 space-y-2">
        <div className="p-3 bg-orange-50 border border-orange-200 rounded">
          Menu du jour - 3 commandes en attente
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          Boissons - 2 commandes
        </div>
      </div>
    </div>
  </div>
);

const LivreurDeliveries = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Mes Livraisons</h1>
    <div className="bg-white p-6 rounded-lg shadow border">
      <p className="text-gray-600">Livraisons du jour...</p>
      <div className="mt-4 space-y-2">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
          Livraison #001 - Ganhi, 14h30
        </div>
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
          Livraison #002 - Akpakpa, 15h00
        </div>
      </div>
    </div>
  </div>
);

const ProfilePage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Mon Profil</h1>
    <div className="bg-white p-6 rounded-lg shadow border">
      <p className="text-gray-600">Informations de votre compte...</p>
      <div className="mt-4">
        <div className="mb-2">
          <strong>Nom :</strong> John Doe
        </div>
        <div className="mb-2">
          <strong>Rôle :</strong> Superviseur
        </div>
        <div className="mb-2">
          <strong>Email :</strong> john@example.com
        </div>
      </div>
    </div>
  </div>
);

// ===========================================
// CONFIGURATION DES ROUTES
// ===========================================

export const routesConfig = [
  // ================================
  // ROUTES PUBLIQUES
  // ================================
  {
    path: "/login",
    component: LoginPage,
    isPublic: true,
    layout: "auth",
    title: "Connexion",
  },
  {
    path: "/register",
    component: RegisterPage,
    isPublic: true,
    layout: "auth",
    title: "Inscription",
  },
  {
    path: "/unauthorized",
    component: UnauthorizedPage,
    isPublic: true,
    layout: "minimal",
    title: "Accès refusé",
  },
  {
    path: "*",
    component: NotFoundPage,
    isPublic: true,
    layout: "minimal",
    title: "Page introuvable",
  },

  // ================================
  // ROUTES PAR RÔLE (UNE SEULE PAR RÔLE POUR TESTER)
  // ================================
  //routes admins
  {
    path: "/admin/",
    component: Admin,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin",
  },
  //routes admin/users
  {
    path: "/admin/users/",
    component: Utilisateurs,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Users",
  },
  {
    path: "/admin/users/ajouter/",
    component: AjouterUser,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Créer un utilisateur",
  },
  {
    path: "/admin/users/users/",
    component: Users,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les utilisateurs",
  },
  {
    path: "/admin/users/users/:uid",
    component: UserDetail,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les utilisateurs",
  },
  //routes admin/compta
  {
    path: "/admin/compta/",
    component: GererLaCompta,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer la comptabilité",
  },
  // {
  //   path: "/admin/compta/init/",
  //   component: DashboardCompta,
  //   allowedRoles: ["admin"],
  //   layout: "main",
  //   title: "Admin - Tableau de bord de la comptabilité",
  // },
  {
    path: "/admin/compta/dashboard/",
    component: ComptaDashboard,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  {
    path: "/admin/compta/dayview/:id",
    component: ComptaDayView,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  {
    path: "/admin/compta/weekview/:id",
    component: ComptaWeekView,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  {
    path: "/admin/compta/monthview/:id",
    component: ComptaMonthView,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  {
    path: "/admin/compta/yearview/:id",
    component: ComptaYearView,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  {
    path: "/admin/compta/handleTransactions",
    component: ComptaHantdleTransactions,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  {
    path: "/admin/compta/handleTransactions/:id",
    component: ComptaHantdleTransactions,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  {
    path: "/admin/compta/cloture/",
    component: ComptaClotureManager,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Tableau de bord de la comptabilité",
  },
  //routes admin/points de vente
  {
    path: "/admin/points_vente/",
    component: PointDeVente,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les points de vente",
  },
  {
    path: "/admin/points_vente/ajouter/",
    component: AjouterPointDeVente,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Créer un point de vente",
  },
  {
    path: "/admin/points_vente/points_vente/",
    component: GererPointDeVente,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les points de vente",
  },
  {
    path: "/admin/points_vente/points_vente/:empl_id",
    component: GererPointDeVenteDetail,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Point de vente",
  },
  // route admin - adresses
  {
    path: "/admin/adresses/",
    component: Adresse,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les adresses",
  },
  {
    path: "/admin/adresses/init/",
    component: InitialiserAdresses,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Initialiser les adresses",
  },
  {
    path: "/admin/adresses/ajouter/",
    component: AjouterAdresse,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Ajouter une nouvelle adresse",
  },
  {
    path: "/admin/adresses/adresses/",
    component: GererAdresses,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Ajouter une nouvelle adresse",
  },
  {
    path: "/admin/adresses/adresses/:id",
    component: GererUneAdresse,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer une adresse",
  },
  // route admin - moyen de paiement
  {
    path: "/admin/paiement/",
    component: GererMoyenDePaiement,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les moyens de paiement",
  },
  {
    path: "/admin/paiement/init/",
    component: InitialiserMoyensDePaiement,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Initialiser les moyens de paiement",
  },
  {
    path: "/admin/paiement/ajouter/",
    component: AjouterUnMoyenDePaiement,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Créer un nouveau moyen de paiement",
  },
  {
    path: "/admin/paiement/paiement/",
    component: GererLesMoyensDePaiement,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les moyens de paiement",
  },
  {
    path: "/admin/paiement/paiement/:id",
    component: GererUnMoyenDePaiement,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer un moyen de paiement",
  },
  // route admin - boisons
  {
    path: "/admin/boissons/",
    component: GererBoissons,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les boissons",
  },
  {
    path: "/admin/boissons/init/",
    component: InitialiserBoissons,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Initialiser les boissons",
  },
  {
    path: "/admin/boissons/ajouter/",
    component: AjouterUneBoisson,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Ajouter une nouvelle boisson",
  },
  {
    path: "/admin/boissons/boissons/",
    component: GererLesBoissons,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les boissons disponibles",
  },
  {
    path: "/admin/boissons/boissons/:id",
    component: GererUneBoisson,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer une boisson",
  },
  // route admin - menus
  {
    path: "/admin/menus/",
    component: GererMenus,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les menus",
  },
  {
    path: "/admin/menus/init/",
    component: InitialiserMenus,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Initialiser les menus",
  },
  {
    path: "/admin/menus/ajouter/",
    component: AjouterUnMenu,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Ajouter un nouveau menu",
  },
  {
    path: "/admin/menus/menus/",
    component: GererLesMenus,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les menus disponibles",
  },
  {
    path: "/admin/menus/menus/:id",
    component: GererUnMenu,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer un menu",
  },
  // route admin - supplements
  {
    path: "/admin/supplements/",
    component: GererSupplements,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les suppléments",
  },
  {
    path: "/admin/supplements/init/",
    component: InitialiserSupplements,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Initialiser les suppléments",
  },
  {
    path: "/admin/supplements/ajouter/",
    component: AjouterUnSupplement,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Ajouter un nouveau supplément",
  },
  {
    path: "/admin/supplements/supplements/",
    component: GererLesSupplements,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les suppléments disponibles",
  },
  {
    path: "/admin/supplements/supplements/:id",
    component: GererUnSupplement,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer un supplément",
  },
  // route admin - ingredients
  {
    path: "/admin/ingredients/",
    component: GererIngredients,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les ingredients",
  },
  {
    path: "/admin/ingredients/init/",
    component: InitialiserIngredients,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Initialiser les ingredients",
  },
  {
    path: "/admin/ingredients/ajouter/",
    component: AjouterUnIngredient,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Ajouter un nouvel ingredient",
  },
  {
    path: "/admin/ingredients/ingredients/",
    component: GererLesIngredients,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer les ingredients disponibles",
  },
  {
    path: "/admin/ingredients/ingredients/:id",
    component: GererUnIngredient,
    allowedRoles: ["admin"],
    layout: "main",
    title: "Admin - Gérer un ingredient",
  },
  //routes des superviseurs
  {
    path: "/superviseur/dashboard/",
    component: SuperviseurDashboard,
    allowedRoles: ["superviseur"],
    layout: "main",
    title: "Dashboard Superviseur",
  },
  {
    path: "/superviseur/ventes/",
    component: Ventes,
    allowedRoles: ["superviseur"],
    layout: "main",
    title: "Ventes",
  },
  {
    path: "/superviseur/ventes/panneau_de_vente",
    component: PanneauDeVente,
    allowedRoles: ["superviseur"],
    layout: "main",
    title: "Panneau de vente",
  },
  {
    path: "/superviseur/ventes/commandes",
    component: Commandes,
    allowedRoles: ["superviseur"],
    layout: "main",
    title: "Commandes",
  },
  //
  {
    path: "/vendeuse/orders",
    component: VendeuseOrdersPage,
    allowedRoles: ["vendeuse"],
    layout: "main",
    title: "Gestion des Commandes",
  },
  {
    path: "/cuisiniere/kitchen",
    component: CuisiniereKitchen,
    allowedRoles: ["cuisiniere"],
    layout: "main",
    title: "Espace Cuisine",
  },
  {
    path: "/livreur/deliveries",
    component: LivreurDeliveries,
    allowedRoles: ["livreur"],
    layout: "main",
    title: "Mes Livraisons",
  },

  // ================================
  // ROUTES PARTAGÉES
  // ================================
  {
    path: "/profile",
    component: ProfilePage,
    allowedRoles: ["superviseur", "vendeuse", "cuisiniere", "livreur"],
    layout: "main",
    title: "Mon Profil",
  },
];

// ===========================================
// FONCTIONS HELPERS
// ===========================================

// Fonction pour obtenir la route par défaut selon le rôle
export const getDefaultRouteByRole = (userRole) => {
  const roleRoutes = {
    superviseur: "/superviseur/dashboard/",
    vendeuse: "/vendeuse/dashboard/",
    cuisiniere: "/cuisiniere/dashboard/",
    livreur: "/livreur/dashboard/",
  };

  return roleRoutes[userRole] || "/profile";
};

// Fonction pour obtenir le titre de la page
export const getPageTitle = (pathname) => {
  const route = routesConfig.find((route) => {
    // Gérer les routes dynamiques comme /orders/:orderId
    if (route.path.includes(":")) {
      const routePattern = route.path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return (
      route.path === pathname ||
      (route.path === "*" &&
        !routesConfig.find((r) => r.path === pathname && r.path !== "*"))
    );
  });

  return route?.title || "Mon Restaurant";
};

// Fonction pour vérifier si un utilisateur a accès à une route
export const hasAccessToRoute = (pathname, userRole) => {
  const route = routesConfig.find((r) => r.path === pathname);

  if (!route) return false;
  if (route.isPublic) return true;
  if (!route.allowedRoles) return true;

  return route.allowedRoles.includes(userRole);
};
