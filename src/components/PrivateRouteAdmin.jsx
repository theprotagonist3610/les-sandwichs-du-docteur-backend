// src/routes/PrivateRouteAdmin.jsx
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "@/components/useCurrentUser";

export default function PrivateRouteAdmin({ children }) {
  const user = useCurrentUser();

  if (user === null) {
    // null = non connecté OU en cours de chargement
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement...
      </div>
    );
  }

  if (!user) {
    // Pas connecté
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    // Connecté, mais pas admin
    return <Navigate to="/" replace />;
  }

  // ✅ Accès autorisé
  return children;
}
