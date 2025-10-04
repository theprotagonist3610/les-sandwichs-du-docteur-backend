import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { logOutUser } from "@/toolkits/userToolkit";
import { toast } from "sonner";

// Composant de loading par défaut
const DefaultLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const GrantPage = ({
  allowedRoles = [],
  component: Component,
  componentProps = {},
  children,
  isPublic = false,
  loadingComponent: LoadingComponent = DefaultLoader,
}) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // ✅ SOLUTION 1: Utiliser des refs pour éviter les re-renders en boucle
  const initialCheckDone = useRef(false);
  const currentUserRef = useRef(null);

  // ✅ SOLUTION 2: Mémoriser allowedRoles pour éviter les changements de référence
  const memoizedAllowedRoles = useMemo(
    () => allowedRoles,
    [allowedRoles?.join(",")]
  );

  // Fonction pour récupérer l'utilisateur depuis localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("lsd_user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Erreur lecture localStorage:", error);
      return null;
    }
  };

  // Fonction pour vérifier les autorisations
  const checkAuthorization = (user) => {
    //
    if (user && user?.level === "admin") {
      return true;
    }
    // Route publique : toujours autorisée
    if (isPublic) {
      return true;
    }

    // Si pas d'utilisateur connecté : non autorisé
    if (!user) {
      return false;
    }

    // Si pas de rôles spécifiés : autorisé par défaut (pour compatibilité)
    if (!memoizedAllowedRoles || memoizedAllowedRoles.length === 0) {
      return true;
    }

    // Vérifier si le rôle de l'utilisateur est dans la liste autorisée
    return memoizedAllowedRoles.includes(user.role);
  };

  // Fonction de gestion de l'autorisation
  const handleAuthorization = async (user) => {
    const authorized = checkAuthorization(user);

    if (!authorized && !isPublic) {
      // Si utilisateur connecté mais non autorisé : logout + redirection
      if (user) {
        toast.error("Accès non autorisé. Déconnexion en cours...");
        try {
          await logOutUser();
        } catch (error) {
          console.error("Erreur logout:", error);
        }
      } else {
        toast.error("Connexion requise");
      }

      navigate("/unauthorized");
      return;
    }

    // ✅ Mettre à jour les refs ET les states
    currentUserRef.current = user;
    setIsAuthorized(authorized);
    setCurrentUser(user);
    setIsLoading(false);
  };

  // Fonction de détection des changements suspects
  const detectSuspiciousChanges = (oldUser, newUser) => {
    if (!oldUser || !newUser) return false;

    // Vérifier les changements critiques
    const criticalFields = ["role", "level", "status", "id", "uid"];

    return criticalFields.some((field) => {
      const oldValue = oldUser[field];
      const newValue = newUser[field];

      // Comparaison stricte pour détecter les modifications
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
      }

      return oldValue !== newValue;
    });
  };

  // ✅ SOLUTION 3: Séparer la vérification initiale du monitoring

  // useEffect pour la vérification INITIALE uniquement
  useEffect(() => {
    console.log("🚀 GrantPage: Vérification initiale");

    const user = getCurrentUser();
    handleAuthorization(user);
    initialCheckDone.current = true;

    console.log("✅ GrantPage: Vérification initiale terminée");
  }, []); // ✅ PAS DE DÉPENDANCES - exécuté une seule fois

  // useEffect séparé pour le MONITORING des changements localStorage
  useEffect(() => {
    if (!initialCheckDone.current) {
      return; // Attendre que la vérification initiale soit terminée
    }

    console.log("🔄 GrantPage: Configuration monitoring localStorage");

    // Event listener pour les changements localStorage (cross-tab)
    const handleStorageChange = (event) => {
      console.log("📡 Storage change détecté:", event.key, event.newValue);

      // Vérifier si c'est lsd_user qui a changé
      if (event.key === "lsd_user") {
        const newUser = event.newValue ? JSON.parse(event.newValue) : null;

        // Si l'utilisateur actuel existe, vérifier les changements suspects
        if (currentUserRef.current) {
          const hasSuspiciousChanges = detectSuspiciousChanges(
            currentUserRef.current,
            newUser
          );

          if (hasSuspiciousChanges) {
            toast.error(
              "Modification non autorisée détectée. Déconnexion sécurisée..."
            );
            console.warn("Changements suspects détectés dans lsd_user:", {
              old: currentUserRef.current,
              new: newUser,
            });

            // Effacer le localStorage et déconnecter
            localStorage.removeItem("lsd_user");
            localStorage.removeItem("lsd_all_users");

            // Déconnexion et redirection vers login
            logOutUser()
              .then(() => {
                navigate("/login");
              })
              .catch((error) => {
                console.error("Erreur logout après changement suspect:", error);
                navigate("/login");
              });

            return;
          }
        }

        // Si pas de changements suspects, re-vérifier les autorisations
        handleAuthorization(newUser);
      }

      // Si lsd_user a été supprimé
      if (event.key === "lsd_user" && event.newValue === null) {
        if (currentUserRef.current && !isPublic) {
          toast.info("Session fermée");
          navigate("/login");
        }
      }
    };

    // Event listener pour les changements directs (non cross-tab)
    const handleDirectStorageChange = () => {
      const newUser = getCurrentUser();

      if (currentUserRef.current) {
        const hasSuspiciousChanges = detectSuspiciousChanges(
          currentUserRef.current,
          newUser
        );

        if (hasSuspiciousChanges) {
          toast.error(
            "Modification non autorisée détectée. Déconnexion sécurisée..."
          );

          localStorage.removeItem("lsd_user");
          localStorage.removeUser("lsd_all_users");

          logOutUser()
            .then(() => {
              navigate("/login");
            })
            .catch((error) => {
              console.error("Erreur logout après changement suspect:", error);
              navigate("/login");
            });

          return;
        }
      }

      // Éviter les re-checks inutiles si l'utilisateur n'a pas changé
      if (JSON.stringify(currentUserRef.current) !== JSON.stringify(newUser)) {
        handleAuthorization(newUser);
      }
    };

    // Polling périodique pour détecter les changements directs
    const pollInterval = setInterval(handleDirectStorageChange, 2000); // Réduit à 2s

    // Ajouter les event listeners
    window.addEventListener("storage", handleStorageChange);

    console.log("✅ GrantPage: Monitoring configuré");

    // Cleanup
    return () => {
      console.log("🧹 GrantPage: Nettoyage monitoring");
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [isPublic, navigate]); // ✅ SEULEMENT les dépendances qui ne changent pas souvent

  // ✅ SOLUTION 4: Re-vérifier les autorisations si allowedRoles change
  useEffect(() => {
    if (!initialCheckDone.current) return;

    console.log("🔄 GrantPage: Rôles autorisés ont changé, re-vérification");
    const user = getCurrentUser();
    handleAuthorization(user);
  }, [memoizedAllowedRoles]); // ✅ Seulement si les rôles changent

  // Affichage conditionnel
  if (isLoading) {
    return <LoadingComponent />;
  }

  // Route publique ou autorisée : afficher le composant
  if (isPublic || isAuthorized) {
    // Si children est fourni, l'utiliser (plus flexible pour les props)
    if (children) {
      return children;
    }

    // Sinon, utiliser le component avec les props
    return Component ? <Component {...componentProps} /> : null;
  }

  // Par sécurité, ne rien afficher si pas autorisé
  return null;
};

export default GrantPage;
