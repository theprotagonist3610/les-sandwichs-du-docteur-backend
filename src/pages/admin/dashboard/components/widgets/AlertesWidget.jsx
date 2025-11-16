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
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          badge: "bg-red-600",
          label: "URGENT",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          badge: "bg-yellow-600",
          label: "ATTENTION",
        };
      case "info":
        return {
          icon: Info,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          badge: "bg-blue-600",
          label: "INFO",
        };
      default:
        return {
          icon: Bell,
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
          badge: "bg-gray-600",
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
          <div className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            {stats.total}
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-lg font-bold text-red-600">{stats.error}</p>
            <p className="text-xs text-red-700 font-medium">Urgent</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-lg font-bold text-yellow-600">{stats.warning}</p>
            <p className="text-xs text-yellow-700 font-medium">Attention</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-blue-600">{stats.info}</p>
            <p className="text-xs text-blue-700 font-medium">Info</p>
          </div>
        </div>

        {/* Timeline des alertes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Alertes récentes</h4>

          {alertes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune alerte pour le moment</p>
              <p className="text-xs mt-1">Tout fonctionne correctement 🎉</p>
            </div>
          ) : (
            <div className="relative">
              {/* Ligne verticale de timeline */}
              <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200" />

              {/* Liste des alertes */}
              <div className="space-y-3">
                {alertes.slice(0, 8).map((alerte, index) => {
                  const style = getAlerteStyle(alerte.type);
                  const Icon = style.icon;

                  return (
                    <div key={alerte.id} className="relative pl-10">
                      {/* Point de timeline */}
                      <div
                        className={`absolute left-2 top-3 w-4 h-4 rounded-full border-2 border-white ${style.bg} ${style.color} flex items-center justify-center z-10`}
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
                              className={`px-2 py-0.5 ${style.badge} text-white text-xs rounded font-bold`}
                            >
                              {style.label}
                            </span>
                            <span className="text-xs font-medium text-gray-600">
                              {alerte.module}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTime(alerte.timestamp)}
                          </span>
                        </div>

                        {/* Titre */}
                        <h5 className="text-sm font-semibold text-gray-900 mb-1">
                          {alerte.titre}
                        </h5>

                        {/* Message */}
                        <p className="text-sm text-gray-700">{alerte.message}</p>
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
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
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
