/**
 * StockWidget - Widget détaillé du stock
 * Affiche les éléments en alerte (stock bas) et derniers mouvements
 */

import { Package, AlertTriangle, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import WidgetContainer from "./WidgetContainer";

/**
 * Composant StockWidget
 */
const StockWidget = ({ kpiData, alertesStock = [], onViewMore }) => {
  const { details } = kpiData;

  // Utiliser les vraies données depuis alertesStock
  // Les derniers mouvements ne sont pas encore disponibles dans le toolkit
  const derniersMouvements = []; // TODO: Ajouter depuis stockToolkit quand disponible

  const stats = {
    critiques: details.critiques || 0,
    attention: details.attention || 0,
    mouvementsJour: 0, // TODO: Récupérer depuis toolkit
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
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-lg font-bold text-destructive">{stats.critiques}</p>
            <p className="text-xs text-destructive font-medium">Critique</p>
          </div>
          <div className="bg-accent/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-4 h-4 text-accent-foreground" />
            </div>
            <p className="text-lg font-bold text-accent-foreground">{stats.attention}</p>
            <p className="text-xs text-accent-foreground font-medium">Attention</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-primary">{stats.mouvementsJour}</p>
            <p className="text-xs text-primary font-medium">Mvts jour</p>
          </div>
        </div>

        {/* Alertes stock bas */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Éléments en alerte ({alertesStock.length})
          </h4>

          {alertesStock.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
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
                          ? "bg-destructive/10 border-destructive/30"
                          : "bg-accent/20 border-accent/30"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      {/* Info élément */}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-card-foreground">
                          {alerte.element}
                        </h5>
                        <p className="text-xs text-muted-foreground">{alerte.emplacement}</p>
                      </div>

                      {/* Quantité */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-bold ${estCritique ? "text-destructive" : "text-accent-foreground"}`}
                        >
                          {alerte.quantite} {alerte.unite}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Seuil: {alerte.seuil} {alerte.unite}
                        </p>
                      </div>
                    </div>

                    {/* Barre de niveau */}
                    <div className="relative">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            estCritique ? "bg-destructive" : "bg-accent"
                          }`}
                          style={{ width: `${Math.min(pourcentage, 100)}%` }}
                        />
                      </div>
                      <p
                        className={`text-xs font-medium mt-1 ${estCritique ? "text-destructive" : "text-accent-foreground"}`}
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

        {/* Derniers mouvements - Masqué si pas de données */}
        {derniersMouvements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Derniers mouvements</h4>

            <div className="space-y-1.5">
              {derniersMouvements.map((mvt) => {
                const Icon = mvt.type === "entree" ? TrendingUp : TrendingDown;
                const colorClass = mvt.type === "entree" ? "text-green-600 dark:text-green-400" : "text-destructive";

                return (
                  <div
                    key={mvt.id}
                    className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg text-xs"
                  >
                    <Icon className={`w-3.5 h-3.5 ${colorClass} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-card-foreground">{mvt.element}</span>
                      <span className="text-muted-foreground mx-1">
                        {mvt.quantite} {mvt.unite}
                      </span>
                      <span className="text-muted-foreground">({mvt.raison})</span>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">{mvt.temps}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default StockWidget;
