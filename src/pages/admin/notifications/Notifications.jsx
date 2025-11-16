/**
 * Notifications - Page dédiée aux notifications
 *
 * Affiche toutes les notifications en grid responsive avec cards cliquables
 * - Desktop: 4 colonnes
 * - Mobile: 2 colonnes
 * - Navigation contextuelle vers les modules (commandes, comptabilite, production, livraisons, stock)
 */

import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ShoppingCart,
  DollarSign,
  Factory,
  Truck,
  Package,
  Users
} from "lucide-react";
import useNotifications from "@/pages/admin/dashboard/hooks/useNotifications";

/**
 * Fonction helper pour déterminer la route de navigation selon le module
 */
const getNavigationPath = (module) => {
  const moduleRoutes = {
    "Commandes": "/admin/commandes",
    "Ventes": "/admin/commandes",
    "Comptabilité": "/admin/comptabilite",
    "Production": "/admin/production",
    "Livraisons": "/admin/livraisons",
    "Stock": "/admin/stock",
    "Équipe": "/admin/users",
    "Utilisateurs": "/admin/users",
    "Système": "/admin/dashboard",
  };

  return moduleRoutes[module] || "/admin/dashboard";
};

/**
 * Fonction helper pour obtenir l'icône selon le module
 */
const getModuleIcon = (module) => {
  const moduleIcons = {
    "Commandes": ShoppingCart,
    "Ventes": ShoppingCart,
    "Comptabilité": DollarSign,
    "Production": Factory,
    "Livraisons": Truck,
    "Stock": Package,
    "Équipe": Users,
    "Utilisateurs": Users,
    "Système": Info,
  };

  const IconComponent = moduleIcons[module] || Info;
  return <IconComponent className="w-4 h-4" />;
};

/**
 * Fonction helper pour obtenir l'icône selon le type
 */
const getTypeIcon = (type) => {
  switch (type) {
    case "error":
      return <AlertCircle className="w-5 h-5" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5" />;
    case "success":
      return <CheckCircle className="w-5 h-5" />;
    case "info":
    default:
      return <Info className="w-5 h-5" />;
  }
};

/**
 * Fonction helper pour obtenir les styles selon le type
 */
const getTypeStyles = (type) => {
  switch (type) {
    case "error":
      return {
        icon: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/30",
      };
    case "warning":
      return {
        icon: "text-accent-foreground",
        bg: "bg-accent/20",
        border: "border-accent/30",
      };
    case "success":
      return {
        icon: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950/20",
        border: "border-green-200 dark:border-green-800",
      };
    case "info":
    default:
      return {
        icon: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
      };
  }
};

/**
 * Composant NotificationCard
 */
const NotificationCard = ({ notification, onClick }) => {
  const styles = getTypeStyles(notification.type);
  const icon = getTypeIcon(notification.type);
  const moduleIcon = getModuleIcon(notification.module);

  // Formatter la date et l'heure
  const date = new Date(notification.timestamp);
  const dateFormatted = format(date, "dd MMM yyyy", { locale: fr });
  const timeFormatted = format(date, "HH:mm", { locale: fr });

  return (
    <div
      onClick={() => onClick(notification)}
      className={`
        relative p-4 rounded-lg border transition-all cursor-pointer
        ${styles.bg} ${styles.border}
        hover:shadow-md hover:scale-[1.02]
        ${!notification.read ? 'ring-2 ring-primary/20' : ''}
      `}
    >
      {/* Badge non lu */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      )}

      {/* Header avec icône type et module */}
      <div className="flex items-center justify-between mb-2">
        <div className={`${styles.icon} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {moduleIcon}
          <span>{notification.module}</span>
        </div>
      </div>

      {/* Titre */}
      <h3 className="text-sm font-semibold text-card-foreground mb-2 line-clamp-2">
        {notification.titre}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
        {notification.message}
      </p>

      {/* Footer: Date et heure */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{dateFormatted}</span>
        <span>{timeFormatted}</span>
      </div>
    </div>
  );
};

/**
 * Composant Notifications principal
 */
const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
  } = useNotifications();

  // Handler pour le clic sur une notification
  const handleNotificationClick = (notification) => {
    // Marquer comme lue
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Naviguer vers le module approprié
    const path = getNavigationPath(notification.module);
    navigate(path);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              Chargement des notifications...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-8 max-w-md">
            <h3 className="text-destructive font-bold text-lg mb-2">
              Erreur de chargement
            </h3>
            <p className="text-destructive/80 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Notifications
        </h1>
        <p className="text-muted-foreground">
          {notifications.length} notification{notifications.length > 1 ? 's' : ''}
          {unreadCount > 0 && (
            <span className="ml-2 text-primary font-medium">
              · {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Grid de notifications */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Info className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucune notification
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Les nouvelles notifications apparaîtront ici. Vous recevrez des alertes pour les commandes, le stock, la production et bien plus encore.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
