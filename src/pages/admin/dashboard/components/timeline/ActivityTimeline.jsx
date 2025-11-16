/**
 * ActivityTimeline - Timeline des activités récentes en temps réel
 * Affiche un flux d'activités de tous les modules
 */

import {
  ShoppingCart,
  Truck,
  ChefHat,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import useActivities from "../../hooks/useActivities";

/**
 * Map des icônes par type d'activité
 */
const ACTIVITY_ICONS = {
  vente: ShoppingCart,
  livraison: Truck,
  production: ChefHat,
  stock: Package,
  comptabilite: DollarSign,
  alerte: AlertTriangle,
};

/**
 * Map des couleurs par type d'activité
 */
const ACTIVITY_COLORS = {
  vente: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20",
    dot: "bg-green-600 dark:bg-green-500",
  },
  livraison: {
    icon: "text-accent-foreground",
    bg: "bg-accent/20",
    dot: "bg-accent",
  },
  production: {
    icon: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    dot: "bg-purple-600 dark:bg-purple-500",
  },
  stock: {
    icon: "text-accent-foreground",
    bg: "bg-accent/20",
    dot: "bg-accent",
  },
  comptabilite: {
    icon: "text-primary",
    bg: "bg-primary/10",
    dot: "bg-primary",
  },
  alerte: {
    icon: "text-destructive",
    bg: "bg-destructive/10",
    dot: "bg-destructive",
  },
};

/**
 * Composant ActivityTimeline
 */
const ActivityTimeline = ({ maxItems = 10 }) => {
  // Récupérer les activités en temps réel via le hook
  const { activities, loading, error } = useActivities({ maxItems });

  // Si chargement, afficher un spinner
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-card-foreground">
                Activités Récentes
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">Chargement...</span>
            </div>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Si erreur, afficher un message
  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-card-foreground">
              Activités Récentes
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive font-medium">Erreur de chargement</p>
            <p className="text-xs text-destructive mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const displayedActivities = activities;

  /**
   * Formate le temps relatif
   */
  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), {
      locale: fr,
      addSuffix: true,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-card-foreground">
              Activités Récentes
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">En direct</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        ) : (
          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-[1.125rem] top-2 bottom-2 w-0.5 bg-border" />

            {/* Liste des activités */}
            <div className="space-y-4">
              {displayedActivities.map((activity, index) => {
                const Icon =
                  ACTIVITY_ICONS[activity.type] || CheckCircle;
                const colors = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.vente;

                return (
                  <div
                    key={activity.id}
                    className="relative pl-12 pb-4 last:pb-0"
                  >
                    {/* Icône */}
                    <div
                      className={`
                        absolute left-0 top-0 w-9 h-9 rounded-full border-2 border-card
                        ${colors.bg} ${colors.icon}
                        flex items-center justify-center shadow-sm z-10
                      `}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Contenu */}
                    <div className="bg-muted/50 rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="text-sm font-semibold text-card-foreground">
                          {activity.titre}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bouton voir plus */}
        {activities.length > maxItems && (
          <div className="mt-6 text-center">
            <button className="text-sm text-primary hover:text-primary/80 font-medium">
              Voir {activities.length - maxItems} activités de plus
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
