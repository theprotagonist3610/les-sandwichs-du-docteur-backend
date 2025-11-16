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
const ProductionWidget = ({ kpiData, onViewMore }) => {
  const { details } = kpiData;

  // Données simulées - TODO: Récupérer depuis productionToolkit
  const productions = [
    {
      id: 1,
      nom: "Sandwich Poulet Mayo",
      quantite: 50,
      statut: "termine",
      heureDebut: new Date().setHours(8, 0),
      heureFin: new Date().setHours(10, 0),
    },
    {
      id: 2,
      nom: "Sandwich Viande",
      quantite: 30,
      statut: "en_cours",
      heureDebut: new Date().setHours(10, 30),
      progression: 65,
    },
    {
      id: 3,
      nom: "Menu Complet",
      quantite: 40,
      statut: "planifie",
      heureDebut: new Date().setHours(14, 0),
    },
    {
      id: 4,
      nom: "Sauce Oignon",
      quantite: 2,
      unite: "L",
      statut: "planifie",
      heureDebut: new Date().setHours(15, 30),
    },
  ];

  const stats = {
    terminees: productions.filter((p) => p.statut === "termine").length,
    enCours: productions.filter((p) => p.statut === "en_cours").length,
    planifiees: productions.filter((p) => p.statut === "planifie").length,
    total: productions.length,
  };

  /**
   * Retourne l'icône et la couleur selon le statut
   */
  const getStatutStyle = (statut) => {
    switch (statut) {
      case "termine":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
          label: "Terminé",
        };
      case "en_cours":
        return {
          icon: Play,
          color: "text-blue-600",
          bg: "bg-blue-50",
          label: "En cours",
        };
      case "planifie":
        return {
          icon: Calendar,
          color: "text-gray-600",
          bg: "bg-gray-50",
          label: "Planifié",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bg: "bg-gray-50",
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
      viewMoreLabel="Toutes les productions"
    >
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-700 font-medium mb-1">Total</p>
            <p className="text-lg font-bold text-purple-600">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-green-700 font-medium mb-1">OK</p>
            <p className="text-lg font-bold text-green-600">{stats.terminees}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-blue-700 font-medium mb-1">Actif</p>
            <p className="text-lg font-bold text-blue-600">{stats.enCours}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-700 font-medium mb-1">Prévu</p>
            <p className="text-lg font-bold text-gray-600">{stats.planifiees}</p>
          </div>
        </div>

        {/* Planning de production */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Planning du {format(new Date(), "d MMMM", { locale: fr })}
          </h4>

          <div className="space-y-2">
            {productions.map((prod) => {
              const style = getStatutStyle(prod.statut);
              const Icon = style.icon;

              return (
                <div
                  key={prod.id}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${
                      prod.statut === "en_cours"
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône statut */}
                    <div className={`${style.bg} p-2 rounded-lg flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${style.color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-gray-900">{prod.nom}</h5>
                        <span className={`text-xs font-medium ${style.color}`}>
                          {style.label}
                        </span>
                      </div>

                      {/* Quantité */}
                      <p className="text-xs text-gray-600 mb-2">
                        {prod.quantite} {prod.unite || "unités"}
                      </p>

                      {/* Heure et progression */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(prod.heureDebut), "HH:mm")}
                            {prod.heureFin && ` - ${format(new Date(prod.heureFin), "HH:mm")}`}
                          </span>
                        </div>
                      </div>

                      {/* Barre de progression pour production en cours */}
                      {prod.statut === "en_cours" && prod.progression && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${prod.progression}%` }}
                            />
                          </div>
                          <p className="text-xs text-blue-600 font-medium mt-1">
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
