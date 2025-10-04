// components/navigation/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
  X,
  Home,
  ShoppingCart,
  BarChart3,
  Factory,
  Calculator,
  Settings,
  Shield,
} from "lucide-react";
import { switchTheme, isDarkTheme } from "@/toolkits/themeToolkit";
import { useUser, logOutUser } from "@/toolkits/userToolkit";
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
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";

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
 * Sidebar avec overlay et animation slide
 * Structure : ThemeSwitcher | Navigation | Auth Group
 * Utilise le hook useUser pour les informations utilisateur
 *
 * @param {boolean} isOpen - État d'ouverture du sidebar
 * @param {Function} onClose - Callback pour fermer le sidebar
 */
const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const [isDark, setIsDark] = useState(() => isDarkTheme());
  const { user, loading, error } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle du thème
  const handleThemeToggle = () => {
    switchTheme();
    setIsDark(isDarkTheme());
  };

  // Gestion de la déconnexion sécurisée
  const handleLogout = async () => {
    try {
      await logOutUser();
      onClose();
      navigate("/login");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      // Forcer la redirection même en cas d'erreur
      onClose();
      navigate("/login");
    }
  };

  // Gestion de la connexion
  const handleLogin = () => {
    onClose();
    navigate("/login");
  };

  // Navigation principale
  const navigationItems = [
    {
      name: "Accueil",
      href: user?.role ? `/${user?.role}/dashboard/` : "/",
      icon: Home,
    },
    {
      name: "Commandes",
      href: user?.role ? `/${user?.role}/ventes/` : "/",
      icon: ShoppingCart,
    },
    {
      name: "Statistiques",
      href: user?.role ? `/${user?.role}/stats/` : "/",
      icon: BarChart3,
    },
    {
      name: "Production",
      href: user?.role ? `/${user?.role}/production/` : "/",
      icon: Factory,
    },
    {
      name: "Comptabilité",
      href: user?.role ? `/${user?.role}/compta/` : "/",
      icon: Calculator,
    },
    {
      name: "Admin",
      href: user?.role ? `/admin/` : "/",
      icon: Settings,
    },
  ];

  // Empêcher le scroll du body quand le sidebar est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Variants pour les animations Framer Motion
  const overlayVariants = {
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const sidebarVariants = {
    hidden: {
      x: "-100%",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    visible: {
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="sidebar-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Sidebar Content */}
          <motion.div
            key="sidebar-content"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed left-0 top-0 z-50 h-full w-80 bg-sidebar border-r border-sidebar-border shadow-lg">
            <div className="flex h-full flex-col">
              {/* Header avec logo et bouton fermer */}
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center space-x-3">
                  <img
                    src="/logo_petit.PNG"
                    alt="Logo"
                    className="h-12 w-24 object-contain"
                  />
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
                  aria-label="Fermer le menu">
                  <X className="h-5 w-5 text-sidebar-foreground" />
                </button>
              </div>

              {/* Theme Switcher en haut */}
              <div className="p-4 border-b border-sidebar-border">
                <button
                  onClick={handleThemeToggle}
                  className="
                    flex items-center justify-center w-full px-4 py-3 rounded-lg
                    bg-sidebar-accent/20 hover:bg-sidebar-accent transition-colors
                    focus:outline-none focus:ring-2 focus:ring-sidebar-ring
                  "
                  aria-label={`Basculer vers le thème ${
                    isDark ? "clair" : "sombre"
                  }`}>
                  {isDark ? (
                    <Sun className="h-5 w-5 text-sidebar-foreground mr-3" />
                  ) : (
                    <Moon className="h-5 w-5 text-sidebar-foreground mr-3" />
                  )}
                  <span className="text-sm font-medium text-sidebar-foreground">
                    Thème {isDark ? "Clair" : "Sombre"}
                  </span>
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== "/" &&
                      location.pathname.startsWith(item.href));

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg 
                        text-sm font-medium transition-colors
                        ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      `}>
                      <IconComponent className="h-5 w-5" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Auth Group en bas */}
              <div className="p-4 border-t border-sidebar-border">
                {loading ? (
                  // État de chargement
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2 bg-sidebar-accent/10 rounded-lg">
                      <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  // État d'erreur
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-xs text-destructive">
                      Erreur utilisateur
                    </p>
                  </div>
                ) : user ? (
                  // Utilisateur connecté
                  <div className="space-y-3">
                    {/* Info utilisateur enrichie */}
                    <div className="flex items-start space-x-3 px-3 py-3 bg-sidebar-accent/10 rounded-lg">
                      <div className="h-10 w-10 bg-sidebar-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-sidebar-primary-foreground" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Nom avec indicateur admin */}
                        <div className="flex items-center space-x-1">
                          <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {formatUserName(user)}
                          </p>
                          {user.level === "admin" && (
                            <Shield className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* Email */}
                        <p className="text-xs text-sidebar-foreground/60 truncate">
                          {user.email || "email@example.com"}
                        </p>

                        {/* Badges rôle et level */}
                        <div className="flex items-center space-x-2">
                          <span className={getRoleBadgeClasses(user.role)}>
                            {user.role || "Utilisateur"}
                          </span>
                          {user.level && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                              {user.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="space-y-2">
                      <NavLink
                        to="/account"
                        onClick={onClose}
                        className="
                          flex items-center space-x-3 px-4 py-2 rounded-lg
                          text-sidebar-foreground hover:bg-sidebar-accent
                          transition-colors text-sm
                        ">
                        <User className="h-4 w-4" />
                        <span>Mon compte</span>
                      </NavLink>

                      <button
                        onClick={handleLogout}
                        className="
                          flex items-center space-x-3 px-4 py-2 rounded-lg
                          text-destructive hover:bg-destructive/10 w-full
                          transition-colors text-sm
                        ">
                        <LogOut className="h-4 w-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Utilisateur non connecté
                  <button
                    onClick={handleLogin}
                    className="
                      flex items-center justify-center space-x-3 w-full px-4 py-3 rounded-lg
                      bg-sidebar-primary text-sidebar-primary-foreground
                      hover:opacity-90 transition-opacity
                      focus:outline-none focus:ring-2 focus:ring-sidebar-ring
                    ">
                    <LogIn className="h-5 w-5" />
                    <span className="font-medium">Se connecter</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;

// Hook pour contrôler le sidebar depuis n'importe où
export const useSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return {
    isOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  };
};
