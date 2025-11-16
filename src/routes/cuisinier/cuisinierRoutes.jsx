/**
 * Routes pour le r�le CUISINIER
 * - Utilise MainLayout pour toutes les pages
 * - Dashboard, commandes en cours
 */

import Layout from "@/layouts/layout";
import ProtectedRoute from "@/components/global/ProtectedRoute";

// Import des pages cuisinier (� cr�er)
// import Dashboard from "@/pages/cuisinier/Dashboard";
// import Commandes from "@/pages/cuisinier/Commandes";

const cuisinierRoutes = {
  path: "cuisinier",
  element: <Layout />,
  children: [
    {
      path: "dashboard",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["cuisinier"]}>
          <div>Cuisinier Dashboard</div>
          {/* <Dashboard /> */}
        </ProtectedRoute>
      ),
    },
    {
      path: "commandes",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["cuisinier"]}>
          <div>Commandes à préparer</div>
          {/* <Commandes /> */}
        </ProtectedRoute>
      ),
    },
  ],
};

export default cuisinierRoutes;