/**
 * NotificationCenter - Centre de notifications
 * Affiche toutes les notifications avec filtres et actions
 */

import { useState, useMemo } from "react";
import {
  Bell,
  X,
  Check,
  Filter,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";

/**
 * Composant NotificationCenter
 */
const NotificationCenter = ({ notifications = [], onClose = null, onMarkAsRead = null, onClearAll = null }) => {
  const [filter, setFilter] = useState("all"); // all, unread, error, warning, info

  // Filtrer les notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter !== "all") {
      filtered = filtered.filter((n) => n.type === filter);
    }

    return filtered;
  }, [notifications, filter]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      error: notifications.filter((n) => n.type === "error").length,
      warning: notifications.filter((n) => n.type === "warning").length,
      info: notifications.filter((n) => n.type === "info").length,
    };
  }, [notifications]);

  /**
   * Retourne l'icône selon le type
   */
  const getIcon = (type) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  /**
   * Retourne les styles selon le type
   */
  const getStyles = (type) => {
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
      case "info":
        return {
          icon: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
        };
      default:
        return {
          icon: "text-muted-foreground",
          bg: "bg-muted/50",
          border: "border-border",
        };
    }
  };

  /**
   * Formate le timestamp
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-card-foreground">Notifications</h2>
            {stats.unread > 0 && (
              <span className="px-2 py-0.5 bg-destructive/20 text-destructive rounded-full text-xs font-bold">
                {stats.unread}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onClearAll && notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                title="Tout supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === "unread"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Non lus ({stats.unread})
          </button>
          <button
            onClick={() => setFilter("error")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === "error"
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Urgent ({stats.error})
          </button>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
            {filter === "unread" ? (
              <>
                <CheckCircle className="w-16 h-16 mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucune notification non lue</p>
                <p className="text-xs mt-1">Tout est à jour ! 🎉</p>
              </>
            ) : (
              <>
                <Bell className="w-16 h-16 mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucune notification</p>
                <p className="text-xs mt-1">Les notifications apparaîtront ici</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => {
              const styles = getStyles(notification.type);
              const icon = getIcon(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => onMarkAsRead?.(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
                      {icon}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {notification.module}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-card-foreground mb-1">
                        {notification.titre}
                      </h4>

                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>

                    {/* Bouton marquer comme lu */}
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead?.(notification.id);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 rounded transition-colors flex-shrink-0"
                        title="Marquer comme lu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
