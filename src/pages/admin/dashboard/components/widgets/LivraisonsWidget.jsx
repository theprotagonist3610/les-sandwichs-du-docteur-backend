/**
 * LivraisonsWidget - Widget détaillé des livraisons
 * Affiche les livraisons en cours et les statistiques
 */

import { Truck, Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import WidgetContainer from "./WidgetContainer";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Composant LivraisonsWidget
 */
const LivraisonsWidget = ({ kpiData, livraisonsEnCours = [], onViewMore }) => {
  const { details } = kpiData;

  // Calculer les stats
  const stats = {
    enCours: details.enCours || 0,
    enRetard: details.enRetard || 0,
    aLHeure: details.enCours - details.enRetard || 0,
    tauxReussite: 96, // TODO: Calculer depuis données réelles
  };

  // Prendre les 5 premières livraisons en cours
  const livraisonsAffichees = livraisonsEnCours.slice(0, 5);

  /**
   * Détermine si une livraison est en retard
   */
  const isEnRetard = (livraison) => {
    if (!livraison.dates?.depart) return false;
    const duree = (Date.now() - livraison.dates.depart) / (1000 * 60);
    return duree > 60;
  };

  /**
   * Calcul du temps écoulé depuis le départ
   */
  const getTempsEcoule = (livraison) => {
    if (!livraison.dates?.depart) return "En attente";
    return formatDistanceToNow(new Date(livraison.dates.depart), {
      locale: fr,
      addSuffix: true,
    });
  };

  return (
    <WidgetContainer
      titre="Livraisons"
      icon={Truck}
      color="orange"
      onViewMore={onViewMore}
      viewMoreLabel="Toutes les livraisons"
    >
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-primary">{stats.enCours}</p>
            <p className="text-xs text-primary font-medium">En cours</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.aLHeure}</p>
            <p className="text-xs text-green-700 dark:text-green-300 font-medium">À l'heure</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-lg font-bold text-destructive">{stats.enRetard}</p>
            <p className="text-xs text-destructive font-medium">En retard</p>
          </div>
        </div>

        {/* Taux de réussite */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Taux de livraison</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{stats.tauxReussite}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.tauxReussite}%` }}
            />
          </div>
        </div>

        {/* Liste des livraisons en cours */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Livraisons en cours</h4>

          {livraisonsAffichees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune livraison en cours</p>
            </div>
          ) : (
            <div className="space-y-2">
              {livraisonsAffichees.map((livraison) => {
                const enRetard = isEnRetard(livraison);
                return (
                  <div
                    key={livraison.id}
                    className={`
                      p-3 rounded-lg border transition-colors cursor-pointer
                      ${
                        enRetard
                          ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/20"
                          : "bg-muted/50 border-border hover:bg-accent"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Info livraison */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-card-foreground">
                            #{livraison.commande_code || livraison.id}
                          </span>
                          {enRetard && (
                            <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full font-medium">
                              Retard
                            </span>
                          )}
                        </div>

                        {/* Adresse */}
                        {livraison.client?.adresse && (
                          <div className="flex items-start gap-1 mb-1">
                            <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {livraison.client.adresse.quartier},{" "}
                              {livraison.client.adresse.commune}
                            </p>
                          </div>
                        )}

                        {/* Livreur et temps */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {livraison.livreur?.nom && (
                            <span>🚴 {livraison.livreur.nom}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTempsEcoule(livraison)}
                          </span>
                        </div>
                      </div>

                      {/* Priorité */}
                      {livraison.priorite === "urgente" && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {livraisonsEnCours.length > 5 && (
            <button
              onClick={onViewMore}
              className="w-full mt-3 text-sm text-accent-foreground hover:text-accent-foreground/80 font-medium"
            >
              Voir {livraisonsEnCours.length - 5} livraisons de plus
            </button>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default LivraisonsWidget;
