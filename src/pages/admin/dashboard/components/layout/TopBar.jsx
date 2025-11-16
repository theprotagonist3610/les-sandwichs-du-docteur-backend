/**
 * TopBar - Barre supérieure du dashboard
 * Affiche le titre, la date, les notifications et l'utilisateur
 */

import { useState } from "react";
import { Bell, RefreshCw, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import NotificationCenter from "../notifications/NotificationCenter";
import useNotifications from "../../hooks/useNotifications";

/**
 * Composant TopBar
 */
const TopBar = ({ titre = "Centre de Contrôle", nbAlertes = 0, onRefresh = null }) => {
  const now = new Date();
  const dateFormatted = format(now, "EEEE d MMMM yyyy, HH:mm", { locale: fr });

  // État du panneau de notifications
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Hook pour les notifications
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Gauche: Titre et date */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{titre}</h1>
          <p className="text-sm text-gray-600 mt-1 capitalize">{dateFormatted}</p>
        </div>

        {/* Droite: Actions */}
        <div className="flex items-center gap-4">
          {/* Bouton Rafraîchir */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Utilisateur */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </button>
        </div>
      </div>

      {/* Panneau de notifications */}
      {isNotificationPanelOpen && (
        <>
          {/* Overlay pour fermer */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setIsNotificationPanelOpen(false)}
          />

          {/* Panneau NotificationCenter */}
          <NotificationCenter
            notifications={notifications}
            onClose={() => setIsNotificationPanelOpen(false)}
            onMarkAsRead={markAsRead}
            onClearAll={clearAll}
          />
        </>
      )}
    </div>
  );
};

export default TopBar;
