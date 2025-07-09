import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (checking)
    return (
      <div className="flex justify-center items-center min-h-screen text-bordeaux">
        Chargement...
      </div>
    );

  return user ? children : <Navigate to="/login" />;
}
