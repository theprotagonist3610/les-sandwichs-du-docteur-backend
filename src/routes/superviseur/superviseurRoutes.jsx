/**
 * Routes pour le r�le SUPERVISEUR
 * - Utilise MainLayout pour toutes les pages
 * - Dashboard, ventes, commandes
 */

import Layout from "@/layouts/layout";
import ProtectedRoute from "@/components/global/ProtectedRoute";

// Import des pages superviseur (� cr�er)
// import Dashboard from "@/pages/superviseur/Dashboard";
// import Ventes from "@/pages/superviseur/ventes/Ventes";
// import Commandes from "@/pages/superviseur/ventes/Commandes";

const superviseurRoutes = {
  path: "superviseur",
  element: <Layout />,
  children: [
    {
      path: "dashboard",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["superviseur"]}>
          <div>Superviseur Dashboard</div>
          {/* <Dashboard /> */}
        </ProtectedRoute>
      ),
    },
    {
      path: "ventes",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["superviseur"]}>
          <div>Panneau de vente</div>
          {/* <Ventes /> */}
        </ProtectedRoute>
      ),
    },
    {
      path: "commandes",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["superviseur"]}>
          <div>Commandes</div>
          {/* <Commandes /> */}
        </ProtectedRoute>
      ),
    },
  ],
};

export default superviseurRoutes;
