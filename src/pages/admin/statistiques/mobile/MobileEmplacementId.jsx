import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmplacementDetailAnalytics } from "@/toolkits/admin/emplacementToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";

const MobileEmplacementId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { emplacementStats, loading, error } = useEmplacementDetailAnalytics(id, 30);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-sm text-center">Chargement...</p>
      </div>
    );
  }

  if (error || !emplacementStats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-sm opacity-70 text-center">
          {error || "Emplacement introuvable"}
        </p>
        <button
          onClick={() => navigate("/admin/statistiques/emplacements")}
          className="mt-4 px-4 py-2 border rounded text-sm"
        >
          Retour
        </button>
      </div>
    );
  }

  const joursOuvertureMap = {
    lun: "Lun",
    mar: "Mar",
    mer: "Mer",
    jeu: "Jeu",
    ven: "Ven",
    sam: "Sam",
    dim: "Dim",
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/admin/statistiques/emplacements")}
          className="flex items-center gap-2 opacity-70 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs">Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <Store className="h-6 w-6" />
          <h1 className="text-xl font-bold">{emplacementStats.denomination}</h1>
          {emplacementStats.status ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {emplacementStats.type}
          </Badge>
          {emplacementStats.theme && (
            <Badge variant="outline" className="text-xs">
              {emplacementStats.theme}
            </Badge>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Total Ventes"
          value={`${(emplacementStats.total_ventes / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="FCFA"
        />

        <KPICard
          title="Commandes"
          value={emplacementStats.nombre_commandes}
          icon={<ShoppingCart className="h-5 w-5" />}
          subtitle="total"
        />

        <KPICard
          title="Articles Stock"
          value={emplacementStats.nb_articles_stock}
          icon={<Package className="h-5 w-5" />}
          subtitle="articles"
        />

        <KPICard
          title="Valeur Stock"
          value={`${(emplacementStats.valeur_totale_stock / 1000).toFixed(0)}k`}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="FCFA"
        />
      </div>

      {/* Alerte */}
      {!emplacementStats.status && (
        <div className="p-3 rounded-lg border-l-4 border-red-500 text-xs">
          <p className="font-semibold mb-1">⚠️ Emplacement inactif</p>
          <p className="opacity-90">Cet emplacement est désactivé.</p>
        </div>
      )}

      {/* Position */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs opacity-70">Département</p>
              <p className="font-semibold">
                {emplacementStats.position_actuelle?.departement || "Non spécifié"}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-70">Commune</p>
              <p className="font-semibold">
                {emplacementStats.position_actuelle?.commune || "Non spécifié"}
              </p>
            </div>
            {emplacementStats.position_actuelle?.quartier && (
              <div>
                <p className="text-xs opacity-70">Quartier</p>
                <p className="font-semibold">
                  {emplacementStats.position_actuelle.quartier}
                </p>
              </div>
            )}
            <div className="pt-2 border-t text-xs opacity-70">
              <p>
                Position stable depuis{" "}
                <strong>{emplacementStats.jours_position_actuelle} jours</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendeur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emplacementStats.a_vendeur ? (
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs opacity-70">Nom</p>
                <p className="font-semibold">{emplacementStats.vendeur_actuel?.nom}</p>
              </div>
              {emplacementStats.vendeur_actuel?.prenoms &&
                emplacementStats.vendeur_actuel.prenoms.length > 0 && (
                  <div>
                    <p className="text-xs opacity-70">Prénoms</p>
                    <p className="font-semibold">
                      {emplacementStats.vendeur_actuel.prenoms.join(" ")}
                    </p>
                  </div>
                )}
              <div className="pt-2 border-t">
                <Badge variant="outline" className="text-xs text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Assigné
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-8 w-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs opacity-70">Aucun vendeur</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(emplacementStats.horaires || {}).map(([key, horaire]) => (
              <div
                key={key}
                className={`p-2 rounded border text-xs ${
                  horaire.ouvert ? "border-green-500" : "opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold">{joursOuvertureMap[key]}</p>
                  {horaire.ouvert ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 opacity-50" />
                  )}
                </div>
                {horaire.ouvert && (
                  <p className="opacity-70 text-xs">
                    {horaire.ouverture || "?"} - {horaire.fermeture || "?"}
                  </p>
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
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Évolution Ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-xs opacity-70">
                Moy: {(emplacementStats.ventes_moyennes_par_jour / 1000).toFixed(1)}k FCFA/jour
                • {emplacementStats.commandes_moyennes_par_jour.toFixed(1)} cmd/jour
              </div>
              {emplacementStats.evolution_ventes.length > 0 ? (
                <SalesLineChart
                  data={emplacementStats.evolution_ventes}
                  xKey="date"
                  yKey="ventes"
                  height={200}
                />
              ) : (
                <div className="text-center py-6 opacity-70 text-xs">
                  Pas assez de données
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Articles Vendus
                </div>
                <Badge variant="outline" className="text-xs">
                  {emplacementStats.top_5_articles_vendus.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emplacementStats.top_5_articles_vendus.length > 0 ? (
                <div className="space-y-2">
                  {emplacementStats.top_5_articles_vendus.slice(0, 3).map((article, idx) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-2 rounded border text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{article.denomination}</p>
                          <p className="opacity-70 mt-1">{article.quantite_vendue} vendus</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600 flex-shrink-0">
                        {(article.total_ventes / 1000).toFixed(1)}k
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 opacity-70 text-xs">
                  Aucun article vendu
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock
            </div>
            <Badge variant="outline" className="text-xs">
              {emplacementStats.nb_articles_stock}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emplacementStats.top_5_articles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold mb-2">Top 3 Articles</p>
              {emplacementStats.top_5_articles.slice(0, 3).map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-2 rounded border text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{article.denomination}</p>
                    <p className="opacity-70 mt-1">
                      {article.quantite_actuelle} {article.unite?.symbol || ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">
                      {(article.valeur_totale / 1000).toFixed(0)}k FCFA
                    </p>
                    <p className="opacity-70">
                      {article.prix_unitaire.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 opacity-70">
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">Aucun article</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommandations */}
      {emplacementStats.recommandations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">💡 Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emplacementStats.recommandations.map((recommandation, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border-l-4 text-xs ${
                    recommandation.type === "error"
                      ? "border-red-500"
                      : recommandation.type === "warning"
                      ? "border-orange-500"
                      : "border-blue-500"
                  }`}
                >
                  <p className="font-semibold mb-1">{recommandation.titre}</p>
                  <p className="opacity-90">{recommandation.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileEmplacementId;
