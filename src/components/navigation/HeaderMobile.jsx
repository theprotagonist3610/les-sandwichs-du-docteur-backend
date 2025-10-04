// components/navigation/HeaderMobile.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Shield } from "lucide-react";
import AppToolbar from "./AppToolbar";
import { useUser } from "@/toolkits/userToolkit";
/**
 * Fonction utilitaire pour formater le nom utilisateur
 * @param {Object} user - Objet utilisateur
 * @returns {string} - Nom formaté (Mr./Mme. Initial1. Initial2. Nom)
 */
const formatUserName = (user) => {
  if (!user?.nom || !user?.prenoms || !user?.sexe) {
    return "Utilisateur";
  }

  // Préfixe selon le sexe
  const prefix = user.sexe === "F" ? "Mme." : "Mr.";

  // Récupérer maximum 2 initiales des prénoms
  const initials = user.prenoms
    .slice(0, 2) // Maximum 2 prénoms
    .map((prenom) => prenom.charAt(0).toUpperCase() + ".")
    .join(" ");

  return `${prefix} ${initials} ${user.nom}`;
};

/**
 * Fonction utilitaire pour obtenir les classes CSS du badge de rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {string} - Classes CSS pour le badge
 */
const getRoleBadgeClasses = (role) => {
  const baseClasses = "px-1.5 py-0.5 text-xs font-medium rounded";

  switch (role?.toLowerCase()) {
    case "superviseur":
      return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`;
    case "livreur":
      return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
    case "vendeuse":
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
    case "cuisiniere":
      return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300`;
    default:
      return `${baseClasses} bg-secondary text-secondary-foreground`;
  }
};

/**
 * Header mobile avec structure à 2 lignes principales - Animé avec Framer Motion
 * - Première ligne : Logo/Burger + Info utilisateur (collapsible)
 * - Deuxième ligne : AppToolbar (toujours visible)
 *
 * @param {Function} toggleSidebar - Fonction pour toggle le sidebar
 * @param {string} pageTitle - Titre de la page courante
 */
const HeaderMobile = ({ toggleSidebar, pageTitle = "Accueil" }) => {
  // Hook pour récupérer les données utilisateur
  const { user, loading, error } = useUser();
  // État local pour le collapse basé sur localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("lsd_collapse_header") === "true";
  });

  /**
   * Fonction pour toggle le collapse du header
   * Sauvegarde l'état dans localStorage
   */
  const toggleCollapse = () => {
    const newCollapseState = !isCollapsed;
    setIsCollapsed(newCollapseState);
    localStorage.setItem("lsd_collapse_header", newCollapseState.toString());

    // Dispatch un événement personnalisé pour les autres composants
    window.dispatchEvent(
      new CustomEvent("headerCollapseChange", {
        detail: { isCollapsed: newCollapseState },
      })
    );
  };

  /**
   * Écouter les changements de localStorage pour la synchronisation
   * entre onglets/fenêtres
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "lsd_collapse_header") {
        const newValue = e.newValue === "true";
        setIsCollapsed(newValue);
      }
    };

    // Écouter les changements de localStorage (cross-tab)
    window.addEventListener("storage", handleStorageChange);

    // Écouter notre événement personnalisé (same-tab)
    const handleCustomEvent = (e) => {
      setIsCollapsed(e.detail.isCollapsed);
    };

    window.addEventListener("headerCollapseChange", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("headerCollapseChange", handleCustomEvent);
    };
  }, []);

  // Variants pour les animations Framer Motion
  const headerVariants = {
    expanded: {
      height: "128px", // h-32 (96px première ligne + 32px toolbar)
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    collapsed: {
      height: "32px", // h-8 (toolbar seulement)
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const firstLineVariants = {
    visible: {
      opacity: 1,
      y: 0,
      height: "auto",
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    hidden: {
      opacity: 0,
      y: -20,
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-card overflow-hidden"
      variants={headerVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      initial={false} // Évite l'animation au premier rendu
    >
      {/* Première ligne principale - Collapsible */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key="first-line"
            variants={firstLineVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="border-b border-border">
            <div className="h-24">
              {/* Sous-ligne 1 : Logo et Menu Burger */}
              <div className="flex items-center justify-between px-4 py-2">
                {/* Logo */}
                <div className="flex items-center">
                  <img
                    src="/logo_petit.PNG"
                    alt="Logo"
                    className="h-12 w-24 object-contain"
                  />
                </div>

                {/* Menu Burger */}
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Ouvrir le menu">
                  <Menu className="h-5 w-5 text-foreground" />
                </button>
              </div>

              {/* Sous-ligne 2 : PageTitle, User Name, User Role */}
              <div className="flex items-center justify-between px-4 pb-2">
                {/* Titre de la page */}
                <h1 className="text-base font-semibold text-foreground truncate flex-1">
                  {pageTitle}
                </h1>

                {/* Informations utilisateur */}
                {loading ? (
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-5 w-12 bg-muted animate-pulse rounded"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center space-x-2 ml-4">
                    <p className="text-xs text-destructive">Erreur</p>
                  </div>
                ) : user ? (
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Nom de l'utilisateur */}
                    <div className="text-right min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {formatUserName(user)}
                      </p>
                    </div>

                    {/* Badge de fonction avec couleur selon le rôle */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {/* Icône Shield pour les admins */}
                      {user.level === "admin" && (
                        <Shield className="h-3 w-3 text-amber-500" />
                      )}

                      <span className={getRoleBadgeClasses(user.role)}>
                        {`${
                          user?.role.charAt(0).toUpperCase() +
                          user?.role.slice(1)
                        }` || "Utilisateur"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 ml-4">
                    <p className="text-xs text-muted-foreground">
                      Non connecté
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deuxième ligne : AppToolbar - Toujours visible */}
      <div className={`${!isCollapsed ? "" : "border-t-0"}`}>
        <AppToolbar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>
    </motion.header>
  );
};

export default HeaderMobile;

// Hook personnalisé pour écouter l'état du header collapse
export const useHeaderCollapse = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("lsd_collapse_header") === "true";
  });

  useEffect(() => {
    const handleCollapseChange = (e) => {
      setIsCollapsed(e.detail.isCollapsed);
    };

    window.addEventListener("headerCollapseChange", handleCollapseChange);

    return () => {
      window.removeEventListener("headerCollapseChange", handleCollapseChange);
    };
  }, []);

  return isCollapsed;
};

// Fonction utilitaire pour forcer un état de collapse depuis n'importe où
export const setHeaderCollapse = (collapsed) => {
  localStorage.setItem("lsd_collapse_header", collapsed.toString());
  window.dispatchEvent(
    new CustomEvent("headerCollapseChange", {
      detail: { isCollapsed: collapsed },
    })
  );
};
