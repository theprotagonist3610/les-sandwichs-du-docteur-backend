/**
 * TopBar - Barre supérieure du dashboard
 * Affiche le titre, la date, les notifications et l'utilisateur
 */

import { Bell, RefreshCw, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Composant TopBar
 */
const TopBar = ({ titre = "Centre de Contrôle", nbAlertes = 0, onRefresh = null }) => {
  const now = new Date();
  const dateFormatted = format(now, "EEEE d MMMM yyyy, HH:mm", { locale: fr });

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
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {nbAlertes > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {nbAlertes > 9 ? "9+" : nbAlertes}
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
    </div>
  );
};

export default TopBar;
