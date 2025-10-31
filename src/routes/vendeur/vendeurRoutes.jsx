/**
 * Routes pour le rôle VENDEUR
 * - Utilise MainLayout pour toutes les pages
 * - Dashboard, ventes, commandes
 */

import Layout from "@/layouts/layout";
import ProtectedRoute from "@/components/global/ProtectedRoute";

// Import des pages vendeur (à créer)
// import Dashboard from "@/pages/vendeur/Dashboard";
// import Ventes from "@/pages/vendeur/Ventes";
// import Commandes from "@/pages/vendeur/Commandes";

const vendeurRoutes = {
  path: "vendeur",
  element: <Layout />,
  children: [
    {
      path: "dashboard",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["vendeur"]}>
          <div>Vendeur Dashboard</div>
          {/* <Dashboard /> */}
        </ProtectedRoute>
      ),
    },
    {
      path: "ventes",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["vendeur"]}>
          <div>Panneau de vente</div>
          {/* <Ventes /> */}
        </ProtectedRoute>
      ),
    },
    {
      path: "commandes",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["vendeur"]}>
          <div>Mes commandes</div>
          {/* <Commandes /> */}
        </ProtectedRoute>
      ),
    },
  ],
};

export default vendeurRoutes;