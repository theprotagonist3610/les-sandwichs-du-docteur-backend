// src/components/PublicRoute.jsx
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "@/components/useCurrentUser";

export default function PublicRoute({ children }) {
  const user = useCurrentUser();

  // Chargement de l'état d'auth
  if (user === undefined || user?.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-bordeaux">
        Chargement...
      </div>
    );
  }

  // Si connecté → redirige vers /backoffice
  if (user && user?.uid) {
    return <Navigate to="/backoffice" replace />;
  }

  // Sinon, on affiche la page publique
  return children;
}
