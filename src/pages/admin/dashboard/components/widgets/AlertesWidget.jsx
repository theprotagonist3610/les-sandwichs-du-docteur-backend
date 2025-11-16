/**
 * AlertesWidget - Widget des alertes système
 * Affiche les alertes critiques de tous les modules
 */

import { Bell, AlertCircle, AlertTriangle, Info } from "lucide-react";
import WidgetContainer from "./WidgetContainer";

/**
 * Composant AlertesWidget
 */
const AlertesWidget = ({ alertes = [], onViewMore }) => {
  // Grouper les alertes par type
  const stats = {
    error: alertes.filter((a) => a.type === "error").length,
    warning: alertes.filter((a) => a.type === "warning").length,
    info: alertes.filter((a) => a.type === "info").length,
    total: alertes.length,
  };

  /**
   * Retourne l'icône et le style selon le type d'alerte
   */
  const getAlerteStyle = (type) => {
    switch (type) {
      case "error":
        return {
          icon: AlertCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
          border: "border-destructive/30",
          badge: "bg-destructive",
          label: "URGENT",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-accent-foreground",
          bg: "bg-accent/20",
          border: "border-accent/30",
          badge: "bg-accent",
          label: "ATTENTION",
        };
      case "info":
        return {
          icon: Info,
          color: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
          badge: "bg-primary",
          label: "INFO",
        };
      default:
        return {
          icon: Bell,
          color: "text-muted-foreground",
          bg: "bg-muted/50",
          border: "border-border",
          badge: "bg-muted-foreground",
          label: "INFO",
        };
    }
  };

  /**
   * Formate le timestamp en heure
   */
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <WidgetContainer
      titre="Alertes Système"
      icon={Bell}
      color="red"
      onViewMore={onViewMore}
      viewMoreLabel="Toutes les alertes"
      headerAction={
        stats.total > 0 && (
          <div className="px-2 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-bold">
            {stats.total}
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-lg font-bold text-destructive">{stats.error}</p>
            <p className="text-xs text-destructive font-medium">Urgent</p>
          </div>
          <div className="bg-accent/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-4 h-4 text-accent-foreground" />
            </div>
            <p className="text-lg font-bold text-accent-foreground">{stats.warning}</p>
            <p className="text-xs text-accent-foreground font-medium">Attention</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-primary">{stats.info}</p>
            <p className="text-xs text-primary font-medium">Info</p>
          </div>
        </div>

        {/* Timeline des alertes */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Alertes récentes</h4>

          {alertes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune alerte pour le moment</p>
              <p className="text-xs mt-1">Tout fonctionne correctement 🎉</p>
            </div>
          ) : (
            <div className="relative">
              {/* Ligne verticale de timeline */}
              <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-border" />

              {/* Liste des alertes */}
              <div className="space-y-3">
                {alertes.slice(0, 8).map((alerte, index) => {
                  const style = getAlerteStyle(alerte.type);
                  const Icon = style.icon;

                  return (
                    <div key={alerte.id} className="relative pl-10">
                      {/* Point de timeline */}
                      <div
                        className={`absolute left-2 top-3 w-4 h-4 rounded-full border-2 border-card ${style.bg} ${style.color} flex items-center justify-center z-10`}
                      >
                        <div className={`w-2 h-2 rounded-full ${style.badge}`} />
                      </div>

                      {/* Contenu de l'alerte */}
                      <div
                        className={`
                          border rounded-lg p-3 transition-all hover:shadow-sm cursor-pointer
                          ${style.bg} ${style.border}
                        `}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 ${style.badge} text-white dark:text-white text-xs rounded font-bold`}
                            >
                              {style.label}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {alerte.module}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(alerte.timestamp)}
                          </span>
                        </div>

                        {/* Titre */}
                        <h5 className="text-sm font-semibold text-card-foreground mb-1">
                          {alerte.titre}
                        </h5>

                        {/* Message */}
                        <p className="text-sm text-muted-foreground">{alerte.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton voir plus */}
              {alertes.length > 8 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={onViewMore}
                    className="text-sm text-destructive hover:text-destructive/80 font-medium"
                  >
                    Voir {alertes.length - 8} alertes de plus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default AlertesWidget;
