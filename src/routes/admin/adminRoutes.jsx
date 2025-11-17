/**
 * Routes pour le rôle ADMIN
 * - Utilise MainLayout pour toutes les pages
 * - Dashboard et autres fonctionnalités d'administration
 */

import Layout from "@/layouts/layout";
import ProtectedRoute from "@/components/global/ProtectedRoute";
import Dashboard from "@/pages/admin/dashboard/Dashboard";
import Settings from "@/pages/admin/Settings/Settings";
import settingsSubRoutes from "@/pages/admin/Settings/settingsRoutes";
import Users from "@/pages/admin/users/Users";
import userSubRoutes from "@/pages/admin/users/usersRoutes";
import commandeSubRoutes from "@/pages/admin/commandes/commandesRoutes";
import Commandes from "@/pages/admin/commandes/Commandes";
import productionSubRoutes from "@/pages/admin/production/productionRoutes";
import Production from "@/pages/admin/production/Production";
import comptabiliteSubroutes from "@/pages/admin/comptabilite/comptabiliteRoutes";
import Comptabilite from "@/pages/admin/comptabilite/Comptabilite";
import Statistiques from "@/pages/admin/statistiques/Statistiques";
import statistiqueSubRoutes from "@/pages/admin/statistiques/statistiquesRoutes";
import Stock from "@/pages/admin/stock/Stock";
import stockSubRoutes from "@/pages/admin/stock/stockRoutes";
import Notifications from "@/pages/admin/notifications/Notifications";
//import notificationSubRoutes from "@/pages/admin/notifications/notificationRoutes";
import livraisonsSubRoutes from "@/pages/admin/livraisons/livraisonsRoutes";
import Livraisons from "@/pages/admin/livraisons/Livraisons";
const adminRoutes = {
  path: "admin",
  element: <Layout />,
  children: [
    {
      path: "dashboard",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "notifications",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Notifications />
        </ProtectedRoute>
      ),
    },
    {
      path: "settings",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Settings />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...settingsSubRoutes.flatMap((route) => {
      const routes = [];

      // Route principale
      routes.push({
        path: `settings/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });

      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `settings/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
    {
      path: "users",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Users />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...userSubRoutes.flatMap((route) => {
      const routes = [];

      // Route principale
      routes.push({
        path: `users/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });

      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `users/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
    {
      path: "commandes",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Commandes />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...commandeSubRoutes.flatMap((route) => {
      const routes = [];

      // Route principale
      routes.push({
        path: `commandes/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });

      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `commandes/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
    {
      path: "production",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Production />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...productionSubRoutes.flatMap((route) => {
      const routes = [];

      // Route principale
      routes.push({
        path: `production/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });

      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `production/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
    {
      path: "comptabilite",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Comptabilite />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...comptabiliteSubroutes.flatMap((route) => {
      const routes = [];

      // Route principale
      routes.push({
        path: `comptabilite/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });

      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `comptabilite/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
    {
      path: "statistiques",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Statistiques />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...statistiqueSubRoutes.flatMap((route) => {
      const routes = [];

      // Route principale
      routes.push({
        path: `statistiques/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });

      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `statistiques/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
    {
      path: "stock",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Stock />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...stockSubRoutes.flatMap((route) => {
      const routes = [];

      // Route principale
      routes.push({
        path: `stock/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });

      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `stock/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
    {
      path: "livraisons",
      element: (
        <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
          <Livraisons />
        </ProtectedRoute>
      ),
    },
    // Générer dynamiquement les sous-routes de settings
    ...livraisonsSubRoutes.flatMap((route) => {
      const routes = [];
      // Route principale
      routes.push({
        path: `livraisons/${route.path}`,
        element: (
          <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
            {route.component ? (
              <route.component />
            ) : (
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-foreground">
                  {route.nom}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {route.description}
                </p>
                <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Cette page est en cours de développement.
                  </p>
                </div>
              </div>
            )}
          </ProtectedRoute>
        ),
      });
      // Ajouter les routes enfants si elles existent
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          routes.push({
            path: `livraisons/${route.path}/${child.path}`,
            element: (
              <ProtectedRoute requireAuth={true} allowedRoles={["admin"]}>
                {child.component ? (
                  <child.component />
                ) : (
                  <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold text-foreground">
                      {child.nom}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Composant à créer pour cette route
                    </p>
                  </div>
                )}
              </ProtectedRoute>
            ),
          });
        });
      }

      return routes;
    }),
  ],
};

export default adminRoutes;
