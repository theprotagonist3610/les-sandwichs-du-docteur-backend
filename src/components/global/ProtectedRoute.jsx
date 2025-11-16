import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import SmallLoader from "./SmallLoader";

/**
 * ProtectedRoute - Composant de protection des routes
 * @param {React.ReactNode} children - Composant enfant à afficher si autorisé
 * @param {boolean} requireAuth - Nécessite une authentification (défaut: true)
 * @param {string[]} allowedRoles - Liste des rôles autorisés (optionnel, si vide = tous les rôles autorisés)
 */
const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = [] }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  // Afficher le loader pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SmallLoader text="Vérification de l'authentification" />
      </div>
    );
  }

  // Si la route nécessite une authentification et qu'il n'y a pas d'utilisateur
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est connecté et essaie d'accéder aux pages login/register
  if (!requireAuth && user) {
    const role = user.role || "admin";
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  // Vérification des rôles autorisés
  if (requireAuth && user && allowedRoles.length > 0) {
    // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!allowedRoles.includes(user.role)) {
      console.warn(
        `⚠️ Accès refusé: l'utilisateur avec le rôle "${user.role}" n'est pas autorisé à accéder à cette route. Rôles autorisés:`,
        allowedRoles
      );
      return <Navigate to="/not-authorized" replace />;
    }
  }

  // Force remount when user changes by using user.uid as key
  // This ensures components reload correctly after login/logout
  return <div key={user?.uid || 'no-user'}>{children}</div>;
};

export default ProtectedRoute;