/**
 * ProductionWidget - Widget détaillé de la production
 * Affiche le planning de production de la journée
 */

import { ChefHat, CheckCircle, Clock, Calendar, Play } from "lucide-react";
import WidgetContainer from "./WidgetContainer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Composant ProductionWidget
 */
const ProductionWidget = ({ kpiData, productionsJour = [], onViewMore }) => {
  const { details } = kpiData;

  // Utiliser les vraies données depuis productionsJour
  const productions = productionsJour;

  const stats = {
    terminees: details.terminees || 0,
    enCours: details.enCours || 0,
    planifiees: details.planifiees || 0,
    total: details.recettes || 0,
  };

  /**
   * Retourne l'icône et la couleur selon le statut
   */
  const getStatutStyle = (status) => {
    switch (status) {
      case "termine":
        return {
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-950/20",
          label: "Terminé",
        };
      case "en_cours":
        return {
          icon: Play,
          color: "text-primary",
          bg: "bg-primary/10",
          label: "En cours",
        };
      case "planifie":
        return {
          icon: Calendar,
          color: "text-muted-foreground",
          bg: "bg-muted/50",
          label: "Planifié",
        };
      default:
        return {
          icon: Clock,
          color: "text-muted-foreground",
          bg: "bg-muted/50",
          label: "Inconnu",
        };
    }
  };

  return (
    <WidgetContainer
      titre="Production"
      icon={ChefHat}
      color="purple"
      onViewMore={onViewMore}
      viewMoreLabel="Toutes les productions">
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">
              Total
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {stats.total}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2 text-center">
            <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
              OK
            </p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {stats.terminees}
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg p-2 text-center">
            <p className="text-xs text-primary font-medium mb-1">Actif</p>
            <p className="text-lg font-bold text-primary">{stats.enCours}</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Prévu
            </p>
            <p className="text-lg font-bold text-muted-foreground">
              {stats.planifiees}
            </p>
          </div>
        </div>

        {/* Planning de production */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Planning du {format(new Date(), "d MMMM", { locale: fr })}
          </h4>

          <div className="space-y-2">
            {productions.map((prod) => {
              const style = getStatutStyle(prod.status);
              const Icon = style.icon;

              return (
                <div
                  key={prod.id}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${
                      prod.status === "en_cours"
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-muted/50"
                    }
                  `}>
                  <div className="flex items-start gap-3">
                    {/* Icône statut */}
                    <div className={`${style.bg} p-2 rounded-lg flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${style.color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-card-foreground">
                          {prod.denomination || prod.nom}
                        </h5>
                        <span className={`text-xs font-medium ${style.color}`}>
                          {style.label}
                        </span>
                      </div>
                      {/* Quantité */}
                      <p className="text-xs text-muted-foreground mb-2">
                        {prod.principal_cible?.quantite || prod.quantite || 0}{" "}
                        {prod.principal_cible?.unite?.symbol ||
                          prod.principal_cible?.unite?.nom ||
                          prod.unite ||
                          "unités"}
                      </p>

                      {/* Heure et progression */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {prod.date
                              ? format(new Date(prod.date), "HH:mm")
                              : "N/A"}
                            {prod.updatedAt &&
                              prod.status === "termine" &&
                              ` - ${format(new Date(prod.updatedAt), "HH:mm")}`}
                          </span>
                        </div>
                      </div>

                      {/* Barre de progression pour production en cours */}
                      {prod.status === "en_cours" && prod.progression && (
                        <div className="mt-2">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${prod.progression}%` }}
                            />
                          </div>
                          <p className="text-xs text-primary font-medium mt-1">
                            {prod.progression}% terminé
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default ProductionWidget;
