import { Navigate } from "react-router-dom";
import { useCurrentUser } from "@/components/useCurrentUser";

export default function PrivateRoute({ children, requiredFonction = null }) {
  const user = useCurrentUser();

  if (user === undefined) {
    // état de chargement
    return (
      <div className="flex justify-center items-center min-h-screen text-bordeaux">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredFonction) {
    const fonctionsAutorisees = Array.isArray(requiredFonction)
      ? requiredFonction
      : [requiredFonction];

    if (!fonctionsAutorisees.includes(user.fonction)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
