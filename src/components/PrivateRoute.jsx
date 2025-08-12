// import { Navigate } from "react-router-dom";
// import { useCurrentUser } from "@/components/useCurrentUser";

// export default function PrivateRoute({ children, requiredFonction = null }) {
//   const user = useCurrentUser();

//   if (user === undefined) {
//     // état de chargement
//     return (
//       <div className="flex justify-center items-center min-h-screen text-bordeaux">
//         Chargement...
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/backoffice/login" replace />;
//   }

//   if (requiredFonction) {
//     const fonctionsAutorisees = Array.isArray(requiredFonction)
//       ? requiredFonction
//       : [requiredFonction];

//     if (!fonctionsAutorisees.includes(user.fonction)) {
//       return <Navigate to="/" replace />;
//     }
//   }

//   return children;
// }
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "@/components/useCurrentUser";

export default function PrivateRoute({ children, requiredFonction = null }) {
  const user = useCurrentUser();
  const location = useLocation();

  // État de chargement
  if (user === undefined || user?.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-bordeaux">
        Chargement...
      </div>
    );
  }

  // Non connecté → login (avec retour)
  if (!user || !user?.uid) {
    return (
      <Navigate to="/backoffice/login" replace state={{ from: location }} />
    );
  }

  // Contrôle des rôles si requis
  if (requiredFonction) {
    const allowed = (
      Array.isArray(requiredFonction) ? requiredFonction : [requiredFonction]
    )
      .filter(Boolean)
      .map((f) => String(f).toLowerCase().trim());

    const role = String(user.fonction ?? "")
      .toLowerCase()
      .trim();

    if (allowed.length > 0 && !allowed.includes(role)) {
      // Accès refusé → page publique
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
