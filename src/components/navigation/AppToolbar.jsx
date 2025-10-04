// components/navigation/AppToolbar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCcw,
  User,
  Bell,
  ListTodo,
  ArrowBigDown,
  ArrowBigUp,
} from "lucide-react";

/**
 * Toolbar d'actions rapides avec hauteur fixe de 32px
 * Contient 6 icônes en inline flex
 *
 * @param {boolean} isCollapsed - État collapse/expand
 * @param {Function} onToggleCollapse - Callback pour toggle le collapse
 */
const AppToolbar = ({ isCollapsed = false, onToggleCollapse = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Actions des boutons
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // Navigation retour
    } else {
      navigate("/"); // Retour accueil si pas d'historique
    }
  };

  const handleRefresh = () => {
    window.location.reload(); // Refresh de la page
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Configuration des icônes avec leurs actions
  const toolbarIcons = [
    {
      icon: ArrowLeft,
      label: "Retour",
      action: handleBack,
      className: "hover:bg-accent hover:text-accent-foreground",
    },
    {
      icon: RefreshCcw,
      label: "Actualiser",
      action: handleRefresh,
      className: "hover:bg-accent hover:text-accent-foreground",
    },
    {
      icon: User,
      label: "Compte",
      action: () => handleNavigate("/account"),
      className: `hover:bg-accent hover:text-accent-foreground ${
        location.pathname === "/account"
          ? "bg-primary text-primary-foreground"
          : ""
      }`,
    },
    {
      icon: Bell,
      label: "Notifications",
      action: () => handleNavigate("/notifications"),
      className: `hover:bg-accent hover:text-accent-foreground ${
        location.pathname === "/notifications"
          ? "bg-primary text-primary-foreground"
          : ""
      }`,
    },
    {
      icon: ListTodo,
      label: "Tâches",
      action: () => handleNavigate("/todos"),
      className: `hover:bg-accent hover:text-accent-foreground ${
        location.pathname === "/todos"
          ? "bg-primary text-primary-foreground"
          : ""
      }`,
    },
    {
      icon: isCollapsed ? ArrowBigUp : ArrowBigDown,
      label: isCollapsed ? "Étendre" : "Réduire",
      action: onToggleCollapse,
      className: "hover:bg-secondary hover:text-secondary-foreground",
    },
  ];

  return (
    <div className="h-8 bg-card border-b border-border">
      {" "}
      {/* Hauteur fixe 32px */}
      <div className="h-full flex items-center px-2">
        {/* Inline flex des 6 icônes réparties sur toute la largeur */}
        <div className="flex items-center justify-evenly w-full">
          {toolbarIcons.map((item, index) => {
            const IconComponent = item.icon;

            return (
              <button
                key={index}
                onClick={item.action}
                className={`
                  p-1.5 rounded transition-colors 
                  text-foreground flex-1 flex items-center justify-center
                  ${item.className}
                `}
                title={item.label}
                aria-label={item.label}>
                <IconComponent className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppToolbar;

// Exemple d'utilisation dans HeaderMobile
/*
// Dans HeaderMobile.jsx
import AppToolbar from './AppToolbar';

const HeaderMobile = ({ toggleSidebar, pageTitle, isCollapsed, onToggleCollapse }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card">
      // ... structure du header existante
      
      // AppToolbar en bas du header
      <AppToolbar 
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </header>
  );
};
*/

// Version alternative avec plus de customisation
export const AppToolbarCustom = ({
  isCollapsed = false,
  onToggleCollapse = () => {},
  showBackButton = true,
  customActions = [],
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Actions de base
  const baseActions = [
    showBackButton && {
      icon: ArrowLeft,
      label: "Retour",
      action: () => navigate(-1),
    },
    {
      icon: RefreshCcw,
      label: "Actualiser",
      action: () => window.location.reload(),
    },
    {
      icon: User,
      label: "Compte",
      action: () => navigate("/account"),
      isActive: location.pathname === "/account",
    },
    {
      icon: Bell,
      label: "Notifications",
      action: () => navigate("/notifications"),
      isActive: location.pathname === "/notifications",
    },
    {
      icon: ListTodo,
      label: "Tâches",
      action: () => navigate("/todos"),
      isActive: location.pathname === "/todos",
    },
  ].filter(Boolean);

  // Combiner avec les actions personnalisées
  const allActions = [
    ...baseActions,
    ...customActions,
    {
      icon: isCollapsed ? ArrowBigUp : ArrowBigDown,
      label: isCollapsed ? "Étendre" : "Réduire",
      action: onToggleCollapse,
      isToggle: true,
    },
  ];

  return (
    <div className="h-8 bg-card border-b border-border">
      <div className="h-full flex items-center px-4">
        <div className="flex items-center space-x-1">
          {allActions.map((action, index) => {
            const IconComponent = action.icon;

            return (
              <button
                key={index}
                onClick={action.action}
                className={`
                  p-1.5 rounded transition-colors text-foreground
                  ${
                    action.isActive
                      ? "bg-primary text-primary-foreground"
                      : action.isToggle
                      ? "hover:bg-secondary hover:text-secondary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }
                `}
                title={action.label}
                aria-label={action.label}>
                <IconComponent className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
