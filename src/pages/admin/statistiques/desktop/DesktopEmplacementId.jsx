import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  MapPin,
  Store,
  Users,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  History,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmplacementDetailAnalytics } from "@/toolkits/admin/emplacementToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";

const DesktopEmplacementId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { emplacementStats, loading, error } = useEmplacementDetailAnalytics(id, 30);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg">Chargement de l'analyse...</p>
      </div>
    );
  }

  if (error || !emplacementStats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg opacity-70">{error || "Emplacement introuvable"}</p>
        <button
          onClick={() => navigate("/admin/statistiques/emplacements")}
          className="mt-4 px-4 py-2 border rounded hover:opacity-80"
        >
          Retour au dashboard
        </button>
      </div>
    );
  }

  const joursOuvertureMap = {
    lun: "Lundi",
    mar: "Mardi",
    mer: "Mercredi",
    jeu: "Jeudi",
    ven: "Vendredi",
    sam: "Samedi",
    dim: "Dimanche",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/admin/statistiques/emplacements")}
          className="flex items-center gap-2 opacity-70 hover:opacity-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Retour au dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8" />
              <h1 className="text-3xl font-bold">{emplacementStats.denomination}</h1>
              {emplacementStats.status ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{emplacementStats.type}</Badge>
              {emplacementStats.theme && (
                <Badge variant="outline">{emplacementStats.theme}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Ventes"
          value={`${(emplacementStats.total_ventes / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-6 w-6" />}
          subtitle="FCFA"
        />

        <KPICard
          title="Commandes"
          value={emplacementStats.nombre_commandes}
          icon={<ShoppingCart className="h-6 w-6" />}
          subtitle="total"
        />

        <KPICard
          title="Articles Stock"
          value={emplacementStats.nb_articles_stock}
          icon={<Package className="h-6 w-6" />}
          subtitle="articles"
        />

        <KPICard
          title="Valeur Stock"
          value={`${(emplacementStats.valeur_totale_stock / 1000).toFixed(0)}k`}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle="FCFA"
        />

        <KPICard
          title="Depuis création"
          value={emplacementStats.jours_depuis_creation}
          icon={<Calendar className="h-6 w-6" />}
          subtitle="jours"
        />

        <KPICard
          title="Ouverture"
          value={emplacementStats.jours_ouverture}
          icon={<Clock className="h-6 w-6" />}
          subtitle="j/semaine"
        />
      </div>

      {/* Alertes */}
      {!emplacementStats.status && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Emplacement inactif</AlertTitle>
          <AlertDescription>
            Cet emplacement est actuellement désactivé.
          </AlertDescription>
        </Alert>
      )}

      {/* Informations générales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Position */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Position Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-70">Département</p>
                <p className="font-semibold">
                  {emplacementStats.position_actuelle?.departement || "Non spécifié"}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-70">Commune</p>
                <p className="font-semibold">
                  {emplacementStats.position_actuelle?.commune || "Non spécifié"}
                </p>
              </div>
              {emplacementStats.position_actuelle?.quartier && (
                <div>
                  <p className="text-sm opacity-70">Quartier</p>
                  <p className="font-semibold">
                    {emplacementStats.position_actuelle.quartier}
                  </p>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs opacity-70">
                  Position stable depuis{" "}
                  <strong>{emplacementStats.jours_position_actuelle} jours</strong>
                </p>
                {emplacementStats.nb_changements_position > 0 && (
                  <p className="text-xs opacity-70 mt-1">
                    {emplacementStats.nb_changements_position} changement(s) de position
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendeur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vendeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emplacementStats.a_vendeur ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm opacity-70">Nom</p>
                  <p className="font-semibold">
                    {emplacementStats.vendeur_actuel?.nom}
                  </p>
                </div>
                {emplacementStats.vendeur_actuel?.prenoms &&
                  emplacementStats.vendeur_actuel.prenoms.length > 0 && (
                    <div>
                      <p className="text-sm opacity-70">Prénoms</p>
                      <p className="font-semibold">
                        {emplacementStats.vendeur_actuel.prenoms.join(" ")}
                      </p>
                    </div>
                  )}
                <div className="pt-2 border-t">
                  <Badge variant="outline" className="text-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vendeur assigné
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto opacity-30 mb-3" />
                <p className="text-sm opacity-70">Aucun vendeur assigné</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Horaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires d'Ouverture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(emplacementStats.horaires || {}).map(([key, horaire]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border ${
                  horaire.ouvert ? "border-green-500" : "opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{joursOuvertureMap[key]}</p>
                  {horaire.ouvert ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 opacity-50" />
                  )}
                </div>
                {horaire.ouvert && (
                  <div className="text-xs opacity-70">
                    {horaire.ouverture || "?"} - {horaire.fermeture || "?"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques de Ventes */}
      {emplacementStats.nombre_commandes > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Évolution des Ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm opacity-70">
                  Moyenne: {(emplacementStats.ventes_moyennes_par_jour / 1000).toFixed(1)}k FCFA/jour
                  • {emplacementStats.commandes_moyennes_par_jour.toFixed(1)} commandes/jour
                </p>
              </div>
              {emplacementStats.evolution_ventes.length > 0 ? (
                <SalesLineChart
                  data={emplacementStats.evolution_ventes}
                  xKey="date"
                  yKey="ventes"
                  height={280}
                />
              ) : (
                <div className="text-center py-8 opacity-70">
                  Pas assez de données pour afficher l'évolution
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Articles les Plus Vendus
                </div>
                <Badge variant="outline">{emplacementStats.top_5_articles_vendus.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emplacementStats.top_5_articles_vendus.length > 0 ? (
                <div className="space-y-3">
                  {emplacementStats.top_5_articles_vendus.map((article, idx) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{article.denomination}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {article.quantite_vendue} unités vendues
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {(article.total_ventes / 1000).toFixed(1)}k FCFA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-70">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3" />
                  <p>Aucun article vendu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Actuel
            </div>
            <Badge variant="outline">{emplacementStats.nb_articles_stock} articles</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emplacementStats.top_5_articles.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold mb-3">Top 5 Articles par Valeur</p>
              {emplacementStats.top_5_articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-semibold">{article.denomination}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {article.quantite_actuelle} {article.unite?.symbol || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {article.valeur_totale.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs opacity-70">
                      {article.prix_unitaire.toLocaleString()} FCFA / unité
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 opacity-70">
              <Package className="h-12 w-12 mx-auto mb-3" />
              <p>Aucun article en stock</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique positions */}
      {emplacementStats.historique_positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emplacementStats.historique_positions.map((pos, idx) => {
                const dateDebut = new Date(pos.dateDebut).toLocaleDateString();
                const dateFin = pos.dateFin
                  ? new Date(pos.dateFin).toLocaleDateString()
                  : "Actuel";

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-semibold">
                        {pos.commune}, {pos.departement}
                      </p>
                      {pos.quartier && (
                        <p className="text-xs opacity-70 mt-1">{pos.quartier}</p>
                      )}
                    </div>
                    <div className="text-right text-xs opacity-70">
                      <p>{dateDebut}</p>
                      <p>→ {dateFin}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      {emplacementStats.recommandations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emplacementStats.recommandations.map((recommandation, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    recommandation.type === "error"
                      ? "border-red-500"
                      : recommandation.type === "warning"
                      ? "border-orange-500"
                      : "border-blue-500"
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">{recommandation.titre}</p>
                  <p className="text-sm opacity-90">{recommandation.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopEmplacementId;
