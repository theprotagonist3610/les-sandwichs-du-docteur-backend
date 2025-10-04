// components/navigation/HeaderDesktop.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
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
 * Header Desktop avec navigation principale
 * Structure : Logo | Navigation | ThemeSwitcher | User Info (si connecté)
 * Utilise le hook useUser pour les informations utilisateur
 */
const HeaderDesktop = () => {
  const [isDark, setIsDark] = useState(() => isDarkTheme());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, loading, error } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle du thème
  const handleThemeToggle = () => {
    switchTheme();
    setIsDark(isDarkTheme());
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logOutUser();
      setShowUserMenu(false);
      navigate("/login");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      // Forcer la redirection même en cas d'erreur
      navigate("/login");
    }
  };

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // Navigation principale
  const navigationItems = [
    {
      name: "Accueil",
      href: "/",
      icon: Home,
    },
    {
      name: "Commandes",
      href: "/ventes",
      icon: ShoppingCart,
    },
    {
      name: "Statistiques",
      href: "/admin/statistics",
      icon: BarChart3,
    },
    {
      name: "Production",
      href: "/productions",
      icon: Factory,
    },
    {
      name: "Comptabilité",
      href: "/admin/compta",
      icon: Calculator,
    },
    {
      name: "Admin",
      href: "/admin/users",
      icon: Settings,
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16">
      <div className="container mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo à gauche */}
          <div className="flex items-center">
            <NavLink
              to="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img
                src="/logo_petit.PNG"
                alt="Logo"
                className="h-24 w-48 object-contain"
              />
            </NavLink>
          </div>

          {/* Navigation centrale */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg 
                    text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}>
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Groupe de droite : ThemeSwitcher + User (si connecté) */}
          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <button
              onClick={handleThemeToggle}
              className="
                p-2 rounded-lg hover:bg-accent transition-colors
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              "
              aria-label={`Basculer vers le thème ${
                isDark ? "clair" : "sombre"
              }`}>
              {isDark ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>

            {/* User Info - Gestion des états de chargement */}
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                <div className="hidden lg:block space-y-1">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ) : error ? (
              <div className="text-xs text-destructive hidden lg:block">
                Erreur utilisateur
              </div>
            ) : user ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="
                    flex items-center space-x-3 px-3 py-2 rounded-lg
                    hover:bg-accent transition-colors
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                  ">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>

                  <div className="text-left hidden lg:block">
                    <div className="flex items-center space-x-1">
                      <p className="text-xs font-medium text-foreground">
                        {formatUserName(user)}
                      </p>
                      {user.level === "admin" && (
                        <Shield className="h-4 w-4 text-amber-500" />
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={getRoleBadgeClasses(user.role)}>
                        {`${
                          user?.role.charAt(0).toUpperCase() +
                          user?.role.slice(1)
                        }` || "Utilisateur"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Menu déroulant */}
                {showUserMenu && (
                  <div
                    className="
                      absolute right-0 mt-2 w-64 bg-popover border border-border 
                      rounded-lg shadow-lg z-20 py-2
                    ">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm font-medium text-popover-foreground">
                          {formatUserName(user)}
                        </p>
                        {user.level === "admin" && (
                          <Shield className="h-4 w-4 text-amber-500" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {user.email || "email@example.com"}
                      </p>

                      <div className="flex items-center space-x-2">
                        <span className={getRoleBadgeClasses(user.role)}>
                          {`${
                            user?.role.charAt(0).toUpperCase() +
                            user?.role.slice(1)
                          }` || "Utilisateur"}
                        </span>
                        {user.level && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                            {`${
                              user?.level.charAt(0).toUpperCase() +
                              user?.level.slice(1)
                            }` || ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <NavLink
                      to="/account"
                      className="
                        flex items-center px-4 py-2 text-sm 
                        hover:bg-accent hover:text-accent-foreground
                        transition-colors
                      "
                      onClick={() => setShowUserMenu(false)}>
                      <User className="h-4 w-4 mr-3" />
                      Mon compte
                    </NavLink>

                    <button
                      onClick={handleLogout}
                      className="
                        w-full flex items-center px-4 py-2 text-sm 
                        text-destructive hover:bg-destructive/10
                        transition-colors
                      ">
                      <LogOut className="h-4 w-4 mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Utilisateur non connecté - bouton de connexion
              <NavLink
                to="/login"
                className="
                  flex items-center space-x-2 px-4 py-2 rounded-lg
                  bg-primary text-primary-foreground
                  hover:opacity-90 transition-opacity
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                ">
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Se connecter</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderDesktop;
