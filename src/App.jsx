// App.jsx - Version finale complète (React 19 compatible)
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
// Composants principaux
import GrantPage from "@/components/GrantPage";

// Layouts
import MainLayout from "@/components/layouts/MainLayout";
import AuthLayout from "@/components/layouts/AuthLayout";
import MinimalLayout from "@/components/layouts/MinimalLayout";

// Configuration des routes
import { routesConfig, getPageTitle } from "@/routes/routesConfig";

// Hook personnalisé
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
// Mapping des layouts
const layouts = {
  main: MainLayout,
  auth: AuthLayout,
  minimal: MinimalLayout,
  none: MinimalLayout, //React.Fragment, // Pour les cas où pas de layout
};

// Composant pour gérer le titre dynamique des pages
const PageTitleManager = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const fullTitle = `${pageTitle} - Mon Restaurant`;

  // Utiliser notre hook personnalisé
  useDocumentTitle(fullTitle);

  // Initialiser les meta tags de base une seule fois
  useEffect(() => {
    // Meta description
    if (!document.querySelector('meta[name="description"]')) {
      const metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      metaDescription.setAttribute(
        "content",
        "Système de gestion pour restaurant"
      );
      document.head.appendChild(metaDescription);
    }

    // Meta viewport
    if (!document.querySelector('meta[name="viewport"]')) {
      const metaViewport = document.createElement("meta");
      metaViewport.setAttribute("name", "viewport");
      metaViewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1"
      );
      document.head.appendChild(metaViewport);
    }

    // Meta charset
    if (!document.querySelector("meta[charset]")) {
      const metaCharset = document.createElement("meta");
      metaCharset.setAttribute("charset", "UTF-8");
      document.head.insertBefore(metaCharset, document.head.firstChild);
    }
  }, []); // Exécuter une seule fois au montage

  return null; // Ce composant ne rend rien visuellement
};

// Composant pour une route individuelle
const RouteComponent = ({ route }) => {
  const Layout = layouts[route.layout] || layouts.none;
  const Component = route.component;

  return (
    <GrantPage allowedRoles={route.allowedRoles} isPublic={route.isPublic}>
      <Layout>
        <Component {...(route.props || {})} />
      </Layout>
    </GrantPage>
  );
};

// Composant pour redirection intelligente basée sur l'utilisateur connecté
const SmartRedirect = () => {
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("lsd_user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Erreur lecture user localStorage:", error);
      return null;
    }
  };

  const user = getCurrentUser();

  if (user && user.status) {
    // Utilisateur connecté et actif : rediriger selon son rôle
    const roleRoutes = {
      superviseur: "/superviseur/dashboard",
      vendeuse: "/vendeuse/orders",
      cuisiniere: "/cuisiniere/kitchen",
      livreur: "/livreur/deliveries",
    };

    const defaultRoute = roleRoutes[user.role] || "/profile";
    return <Navigate to={defaultRoute} replace />;
  }

  // Pas d'utilisateur ou utilisateur inactif : aller au login
  return <Navigate to="/login" replace />;
};

// Composant App principal
const App = () => {
  return (
    <div className="App min-h-screen">
      <PageTitleManager />

      <Routes>
        {/* Redirection racine intelligente */}
        <Route path="/" element={<SmartRedirect />} />

        {/* Routes dynamiques à partir de la configuration */}
        {routesConfig.map((route, index) => (
          <Route
            key={`route-${index}-${route.path}`}
            path={route.path}
            element={<RouteComponent route={route} />}
          />
        ))}
      </Routes>

      {/* Toast notifications globales */}
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: {
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: {
              border: "1px solid #10b981",
            },
          },
          error: {
            style: {
              border: "1px solid #ef4444",
            },
          },
          warning: {
            style: {
              border: "1px solid #f59e0b",
            },
          },
        }}
      />
      {/* Overlay de développement (seulement en dev) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {window.location.pathname}
        </div>
      )}
    </div>
  );
};

export default App;
