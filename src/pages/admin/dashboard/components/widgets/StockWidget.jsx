/**
 * StockWidget - Widget détaillé du stock
 * Affiche les éléments en alerte (stock bas) et derniers mouvements
 */

import { Package, AlertTriangle, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import WidgetContainer from "./WidgetContainer";

/**
 * Composant StockWidget
 */
const StockWidget = ({ kpiData, onViewMore }) => {
  const { details } = kpiData;

  // Données simulées - TODO: Récupérer depuis stockToolkit
  const alertesStock = [
    {
      id: 1,
      element: "Tomates",
      quantite: 12,
      unite: "kg",
      seuil: 20,
      emplacement: "Entrepôt Central",
      niveau: "critique",
    },
    {
      id: 2,
      element: "Pain",
      quantite: 8,
      unite: "unités",
      seuil: 15,
      emplacement: "Point Vente Akpakpa",
      niveau: "critique",
    },
    {
      id: 3,
      element: "Oignons",
      quantite: 22,
      unite: "kg",
      seuil: 20,
      emplacement: "Entrepôt Central",
      niveau: "attention",
    },
    {
      id: 4,
      element: "Coca 33cl",
      quantite: 18,
      unite: "unités",
      seuil: 15,
      emplacement: "Stand Marché",
      niveau: "attention",
    },
    {
      id: 5,
      element: "Mayonnaise",
      quantite: 3,
      unite: "L",
      seuil: 2,
      emplacement: "Entrepôt",
      niveau: "attention",
    },
  ];

  const derniersMouvements = [
    {
      id: 1,
      type: "sortie",
      element: "Tomates",
      quantite: 3,
      unite: "kg",
      raison: "Production",
      temps: "Il y a 15 min",
    },
    {
      id: 2,
      type: "sortie",
      element: "Pain",
      quantite: 30,
      unite: "u",
      raison: "Production",
      temps: "Il y a 20 min",
    },
    {
      id: 3,
      type: "entree",
      element: "Viande",
      quantite: 15,
      unite: "kg",
      raison: "Achat",
      temps: "Il y a 45 min",
    },
  ];

  const stats = {
    critiques: alertesStock.filter((a) => a.niveau === "critique").length,
    attention: alertesStock.filter((a) => a.niveau === "attention").length,
    mouvementsJour: 23, // TODO: Récupérer depuis toolkit
  };

  /**
   * Calcule le pourcentage de stock restant
   */
  const getPourcentageStock = (quantite, seuil) => {
    return Math.round((quantite / seuil) * 100);
  };

  return (
    <WidgetContainer
      titre="Stock"
      icon={Package}
      color="yellow"
      onViewMore={onViewMore}
      viewMoreLabel="Voir tout le stock"
    >
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-lg font-bold text-red-600">{stats.critiques}</p>
            <p className="text-xs text-red-700 font-medium">Critique</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-lg font-bold text-yellow-600">{stats.attention}</p>
            <p className="text-xs text-yellow-700 font-medium">Attention</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-blue-600">{stats.mouvementsJour}</p>
            <p className="text-xs text-blue-700 font-medium">Mvts jour</p>
          </div>
        </div>

        {/* Alertes stock bas */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Éléments en alerte ({alertesStock.length})
          </h4>

          {alertesStock.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune alerte stock</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertesStock.slice(0, 5).map((alerte) => {
                const pourcentage = getPourcentageStock(alerte.quantite, alerte.seuil);
                const estCritique = alerte.niveau === "critique";

                return (
                  <div
                    key={alerte.id}
                    className={`
                      p-3 rounded-lg border transition-colors
                      ${
                        estCritique
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      {/* Info élément */}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-gray-900">
                          {alerte.element}
                        </h5>
                        <p className="text-xs text-gray-600">{alerte.emplacement}</p>
                      </div>

                      {/* Quantité */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-bold ${estCritique ? "text-red-600" : "text-yellow-600"}`}
                        >
                          {alerte.quantite} {alerte.unite}
                        </p>
                        <p className="text-xs text-gray-500">
                          Seuil: {alerte.seuil} {alerte.unite}
                        </p>
                      </div>
                    </div>

                    {/* Barre de niveau */}
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            estCritique ? "bg-red-600" : "bg-yellow-600"
                          }`}
                          style={{ width: `${Math.min(pourcentage, 100)}%` }}
                        />
                      </div>
                      <p
                        className={`text-xs font-medium mt-1 ${estCritique ? "text-red-600" : "text-yellow-600"}`}
                      >
                        {pourcentage}% du seuil
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Derniers mouvements */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Derniers mouvements</h4>

          <div className="space-y-1.5">
            {derniersMouvements.map((mvt) => {
              const Icon = mvt.type === "entree" ? TrendingUp : TrendingDown;
              const colorClass = mvt.type === "entree" ? "text-green-600" : "text-red-600";

              return (
                <div
                  key={mvt.id}
                  className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg text-xs"
                >
                  <Icon className={`w-3.5 h-3.5 ${colorClass} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{mvt.element}</span>
                    <span className="text-gray-600 mx-1">
                      {mvt.quantite} {mvt.unite}
                    </span>
                    <span className="text-gray-500">({mvt.raison})</span>
                  </div>
                  <span className="text-gray-500 flex-shrink-0">{mvt.temps}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default StockWidget;
