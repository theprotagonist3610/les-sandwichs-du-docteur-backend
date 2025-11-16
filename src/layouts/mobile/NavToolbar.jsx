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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, ListTodo, ShoppingCart, Bike } from "lucide-react";
import useNotifications from "@/pages/admin/dashboard/hooks/useNotifications";

const NavToolbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { unreadCount } = useNotifications();

  // Fonction pour revenir à la route parente la plus proche
  const handleGoBack = () => {
    const pathParts = location.pathname.split("/").filter(Boolean);

    if (!user?.role) {
      navigate("/dashboard");
      return;
    }

    if (pathParts.length <= 2) {
      // Si on est à la racine du rôle, aller au dashboard
      navigate(`/${user.role}/dashboard`);
    } else {
      // Sinon, remonter d'un niveau
      pathParts.pop();
      navigate(`/${pathParts.join("/")}`);
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
          const showBadge = isNotifications && unreadCount > 0;

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
                  {unreadCount > 9 ? "9+" : unreadCount}
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
