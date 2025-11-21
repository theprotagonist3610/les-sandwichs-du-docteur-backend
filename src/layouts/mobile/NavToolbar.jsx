/**
 * NavToolbar - Barre d'outils de navigation mobile
 *
 * Une toolbar avec des raccourcis rapides selon le rôle :
 * - Tous : Retour, Notifications
 * - Livreurs : + Livraisons
 * - Cuisiniers : + Todos
 * - Vendeurs : + Commandes, Livraisons
 * - Superviseurs : + Todos, Commandes
 * - Admins : Tous les raccourcis
 */

import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import { useTodos } from "@/toolkits/admin/todoToolkit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, ListTodo, ShoppingCart, Bike } from "lucide-react";
import useNotifications from "@/pages/admin/dashboard/hooks/useNotifications";

const NavToolbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const { todos } = useTodos();

  // Calculer le nombre de todos non terminés
  const incompleteTodosCount = todos.filter((todo) => !todo.status).length;

  // Fonction pour revenir en arrière comme le bouton natif du navigateur
  const handleGoBack = () => {
    // Si l'utilisateur a un historique de navigation, retourner en arrière
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Sinon (arrivé par lien direct), fallback intelligent
      if (user?.role) {
        navigate(`/${user.role}/dashboard`);
      } else {
        navigate("/404");
      }
    }
  };

  // Définir les actions visibles selon le rôle
  const getVisibleActions = () => {
    const role = user?.role;

    const actions = {
      notifications: {
        icon: Bell,
        label: "Notifications",
        onClick: () => navigate(`/${role}/notifications`),
        visible: true, // Visible pour tous
      },
      todos: {
        icon: ListTodo,
        label: "Tâches",
        onClick: () => navigate(`/${role}/todos`),
        visible: ["admin", "superviseur", "cuisinier"].includes(role),
      },
      commandes: {
        icon: ShoppingCart,
        label: "Commandes",
        onClick: () => navigate(`/${role}/commandes`),
        visible: ["admin", "superviseur", "vendeur"].includes(role),
      },
      livraisons: {
        icon: Bike,
        label: "Livraisons",
        onClick: () => navigate(`/${role}/livraisons`),
        visible: ["admin", "vendeur", "livreur"].includes(role),
      },
    };

    return Object.entries(actions).filter(([_, action]) => action.visible);
  };

  const visibleActions = getVisibleActions();

  return (
    <div className="flex items-center px-4 py-2 border-b bg-background">
      {/* Actions rapides - réparties sur tout l'espace disponible */}
      <div className="flex flex-1 items-center justify-between">
        {/* Bouton retour */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="shrink-0"
          title="Retour">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {visibleActions.map(([key, action]) => {
          const Icon = action.icon;
          const isNotifications = key === "notifications";
          const isTodos = key === "todos";
          const notificationsBadge = isNotifications && unreadCount > 0;
          const todosBadge = isTodos && incompleteTodosCount > 0;
          const showBadge = notificationsBadge || todosBadge;
          const badgeCount = isNotifications
            ? unreadCount
            : incompleteTodosCount;

          return (
            <Button
              key={key}
              variant="ghost"
              size="icon"
              onClick={action.onClick}
              title={action.label}
              className="relative">
              <Icon className="h-5 w-5" />
              {showBadge && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default NavToolbar;
