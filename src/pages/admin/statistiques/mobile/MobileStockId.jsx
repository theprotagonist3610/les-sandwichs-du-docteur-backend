import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useArticleAnalytics } from "@/toolkits/admin/stockToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";

const MobileStockId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { articleStats, loading, error } = useArticleAnalytics(id, 30);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-sm text-center">Chargement de l'analyse...</p>
      </div>
    );
  }

  if (error || !articleStats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-sm opacity-70 text-center">
          {error || "Article introuvable"}
        </p>
        <button
          onClick={() => navigate("/admin/statistiques/stock")}
          className="mt-4 px-4 py-2 border rounded text-sm"
        >
          Retour
        </button>
      </div>
    );
  }

  // Calculs pour les KPIs
  const stockActuel = articleStats.quantite_actuelle || 0;
  const consommationMoyenne = articleStats.consommation_moyenne_jour || 0;
  const joursAvantRupture = consommationMoyenne > 0
    ? Math.floor(stockActuel / consommationMoyenne)
    : Infinity;
  const quantiteRecommandee = articleStats.quantite_recommandee || Math.ceil(consommationMoyenne * 7);

  // Déterminer le statut de stock
  const getStockStatus = () => {
    if (joursAvantRupture === Infinity) return "stable";
    if (joursAvantRupture <= 2) return "critique";
    if (joursAvantRupture <= 5) return "faible";
    return "normal";
  };

  const stockStatus = getStockStatus();

  return (
    <div className="p-4 space-y-4">
      {/* Header avec retour */}
      <div>
        <button
          onClick={() => navigate("/admin/statistiques/stock")}
          className="flex items-center gap-2 opacity-70 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs">Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h1 className="text-xl font-bold">{articleStats.denomination}</h1>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {stockStatus === "critique" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {stockStatus === "critique" ? "Rupture!" :
             stockStatus === "faible" ? "Faible" :
             "OK"}
          </Badge>
          <p className="text-xs opacity-70">Analyse sur 30 jours</p>
        </div>
      </div>

      {/* KPIs Stock - Grille 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Stock"
          value={stockActuel}
          icon={<Package className="h-5 w-5" />}
          subtitle={articleStats.unite?.symbol || "unités"}
        />

        <KPICard
          title="Moy/Jour"
          value={consommationMoyenne.toFixed(1)}
          icon={<Calendar className="h-5 w-5" />}
          subtitle="consommation"
        />

        <KPICard
          title="Rupture"
          value={joursAvantRupture === Infinity ? "∞" : joursAvantRupture}
          icon={<AlertTriangle className="h-5 w-5" />}
          subtitle="jours"
        />

        <KPICard
          title="À commander"
          value={quantiteRecommandee}
          icon={<ShoppingCart className="h-5 w-5" />}
          subtitle={articleStats.unite?.symbol || "unités"}
        />
      </div>

      {/* Alerte Stock Critique */}
      {stockStatus === "critique" && (
        <div className="p-3 rounded-lg border-l-4 border-red-500">
          <p className="text-xs font-semibold mb-1">🚨 Rupture imminente!</p>
          <p className="text-xs opacity-90">
            Stock pour {joursAvantRupture} jour{joursAvantRupture > 1 ? 's' : ''}.
            Commander {quantiteRecommandee} {articleStats.unite?.symbol || "unités"}.
          </p>
        </div>
      )}

      {/* Analyse des Prix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💰 Prix d'Achat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded border">
              <p className="text-xs opacity-70">Moyen</p>
              <p className="text-sm font-bold">
                {articleStats.prix_achat_moyen?.toFixed(2) || "0.00"} €
              </p>
            </div>
            <div className="text-center p-2 rounded border">
              <p className="text-xs opacity-70">Min</p>
              <p className="text-sm font-bold">
                {articleStats.prix_achat_min?.toFixed(2) || "0.00"} €
              </p>
            </div>
            <div className="text-center p-2 rounded border">
              <p className="text-xs opacity-70">Max</p>
              <p className="text-sm font-bold">
                {articleStats.prix_achat_max?.toFixed(2) || "0.00"} €
              </p>
            </div>
          </div>

          {articleStats.periode_optimale_achat && (
            <div className="mb-4 p-2 rounded border text-xs">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3" />
                <p className="font-semibold">Période Optimale</p>
              </div>
              <p className="opacity-90">
                {articleStats.periode_optimale_achat.mois} - {articleStats.periode_optimale_achat.prix_moyen?.toFixed(2)} €
              </p>
            </div>
          )}

          {articleStats.evolution_prix && articleStats.evolution_prix.length > 0 && (
            <SalesLineChart
              data={articleStats.evolution_prix}
              xKey="date"
              yKey="prix"
              height={200}
              lineColor="#16a34a"
            />
          )}
        </CardContent>
      </Card>

      {/* Évolution Consommation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📈 Consommation</CardTitle>
        </CardHeader>
        <CardContent>
          {articleStats.evolution_quantite && articleStats.evolution_quantite.length > 0 && (
            <>
              <SalesLineChart
                data={articleStats.evolution_quantite}
                xKey="date"
                yKey="entrees"
                secondYKey="sorties"
                height={200}
                lineColor="#3b82f6"
                secondLineColor="#ef4444"
              />

              {articleStats.trend && articleStats.trend !== "stable" && (
                <div className="mt-3 p-2 rounded border text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    {articleStats.trend === "hausse" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <p className="font-semibold">
                      {articleStats.trend === "hausse" ? "Hausse" : "Baisse"}
                    </p>
                  </div>
                  <p className="opacity-90">
                    {articleStats.trend === "hausse"
                      ? "Augmentez les commandes"
                      : "Réduisez les commandes"}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Historique Compact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📅 Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {articleStats.historique_transactions && articleStats.historique_transactions.length > 0 ? (
              articleStats.historique_transactions.slice(0, 5).map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded border text-xs"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-3 w-3 opacity-70 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{transaction.date}</p>
                      <p className="opacity-70">
                        {transaction.type === "entree" ? "Entrée" : "Sortie"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{transaction.prix_unitaire?.toFixed(2)} €</p>
                    <p className="opacity-70">Qté: {transaction.quantite}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 opacity-70 text-sm">
                Aucune transaction
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stockStatus === "critique" && (
              <div className="p-2 rounded border-l-4 border-red-500 text-xs">
                <p className="font-semibold mb-1">🚨 Urgence</p>
                <p className="opacity-90">
                  Commander {quantiteRecommandee} {articleStats.unite?.symbol || "unités"}
                </p>
              </div>
            )}

            {stockStatus === "faible" && (
              <div className="p-2 rounded border-l-4 border-orange-500 text-xs">
                <p className="font-semibold mb-1">⚠️ Prévoir</p>
                <p className="opacity-90">
                  Commander {quantiteRecommandee} {articleStats.unite?.symbol || "unités"}
                </p>
              </div>
            )}

            {articleStats.periode_optimale_achat && (
              <div className="p-2 rounded border-l-4 border text-xs">
                <p className="font-semibold mb-1">💰 Période optimale</p>
                <p className="opacity-90">
                  Acheter en {articleStats.periode_optimale_achat.mois}
                </p>
              </div>
            )}

            <div className="p-2 rounded border-l-4 border text-xs">
              <p className="font-semibold mb-1">📦 Quantité</p>
              <p className="opacity-90">
                {quantiteRecommandee} {articleStats.unite?.symbol || "unités"} pour 7 jours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileStockId;
