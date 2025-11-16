/**
 * TopBar - Barre supérieure du dashboard
 * Affiche le titre, la date et l'icône de refresh
 */

import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Composant TopBar
 */
const TopBar = ({ titre = "Centre de Contrôle", onRefresh = null, isLoading = false }) => {
  const now = new Date();
  const dateFormatted = format(now, "EEEE d MMMM yyyy, HH:mm", { locale: fr });

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Gauche: Titre et date */}
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{titre}</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{dateFormatted}</p>
        </div>

        {/* Droite: Icône refresh */}
        <button
          onClick={onRefresh}
          disabled={!onRefresh || isLoading}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isLoading ? "Chargement..." : "Actualiser"}
        >
          <RefreshCw
            className={`w-5 h-5 text-muted-foreground transition-all ${
              isLoading ? 'animate-spin text-primary' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
