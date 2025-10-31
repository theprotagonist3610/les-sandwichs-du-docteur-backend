import { useState, useEffect } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { FullPageLoaderProvider } from "@/components/global/FullPageLoader";
import { useUser } from "@/toolkits/global/userToolkit";
import { buildRoutesConfig } from "@/routes/routes";
import SmallLoader from "@/components/global/SmallLoader";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const { user, loading } = useUser();
  const [router, setRouter] = useState(null);
  const [routesLoading, setRoutesLoading] = useState(true);

  useEffect(() => {
    async function loadRoutes() {
      setRoutesLoading(true);
      try {
        // Construire les routes en fonction du rôle de l'utilisateur
        const userRole = user?.role || null;
        const routesConfig = await buildRoutesConfig(userRole);
        const newRouter = createBrowserRouter(routesConfig);
        setRouter(newRouter);
      } catch (error) {
        console.error("Erreur lors du chargement des routes:", error);
      } finally {
        setRoutesLoading(false);
      }
    }

    loadRoutes();
  }, [user?.role]);

  // Afficher un loader pendant le chargement de l'authentification ou des routes
  if (loading || routesLoading || !router) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SmallLoader text="Chargement de l'application" />
      </div>
    );
  }

  return (
    <FullPageLoaderProvider>
      <RouterProvider router={router} />
      <Toaster />
    </FullPageLoaderProvider>
  );
}

export default App;