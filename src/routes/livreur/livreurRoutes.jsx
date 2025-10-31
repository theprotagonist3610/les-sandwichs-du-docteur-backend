/**
 * Routes pour le r�le LIVREUR
 * - Utilise MainLayout pour toutes les pages
 * - Dashboard, livraisons
 */

import Layout from "@/layouts/layout";
import ProtectedRoute from "@/components/global/ProtectedRoute";

// Import des pages livreur (� cr�er)
// import Dashboard from "@/pages/livreur/Dashboard";
// import Livraisons from "@/pages/livreur/Livraisons";

const livreurRoutes = {
  path: "livreur",
  element: <Layout />,
  children: [
    {
      path: "dashboard",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["livreur"]}>
          <div>Livreur Dashboard</div>
          {/* <Dashboard /> */}
        </ProtectedRoute>
      ),
    },
    {
      path: "livraisons",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["livreur"]}>
          <div>Mes livraisons</div>
          {/* <Livraisons /> */}
        </ProtectedRoute>
      ),
    },
  ],
};

export default livreurRoutes;