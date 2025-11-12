import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  Lightbulb,
  DollarSign,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useArticleAnalytics } from "@/toolkits/admin/stockToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";

const DesktopStockId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { articleStats, loading, error } = useArticleAnalytics(id, 30);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg">Chargement de l'analyse...</p>
      </div>
    );
  }

  if (error || !articleStats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg opacity-70">
          {error || "Article introuvable"}
        </p>
        <button
          onClick={() => navigate("/admin/statistiques/stock")}
          className="mt-4 px-4 py-2 border rounded hover:opacity-80"
        >
          Retour au dashboard
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
    <div className="p-6 space-y-6">
      {/* Header avec retour */}
      <div>
        <button
          onClick={() => navigate("/admin/statistiques/stock")}
          className="flex items-center gap-2 opacity-70 hover:opacity-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Retour au dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8" />
              <h1 className="text-3xl font-bold">{articleStats.denomination}</h1>
              <Badge variant="outline">
                {stockStatus === "critique" && <AlertTriangle className="h-3 w-3 mr-1" />}
                {stockStatus === "critique" ? "Rupture Imminente" :
                 stockStatus === "faible" ? "Stock Faible" :
                 "Stock OK"}
              </Badge>
            </div>
            <p className="text-sm opacity-70 mt-1">
              Analyse détaillée sur 30 jours
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Stock */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Stock Actuel"
          value={stockActuel}
          icon={<Package className="h-6 w-6" />}
          subtitle={articleStats.unite?.symbol || "unités"}
        />

        <KPICard
          title="Consommation Moyenne"
          value={consommationMoyenne.toFixed(1)}
          icon={<Calendar className="h-6 w-6" />}
          subtitle="par jour"
        />

        <KPICard
          title="Jours avant Rupture"
          value={joursAvantRupture === Infinity ? "∞" : joursAvantRupture}
          icon={<AlertTriangle className="h-6 w-6" />}
          subtitle={joursAvantRupture <= 5 ? "Urgent!" : "jours"}
        />

        <KPICard
          title="Quantité Recommandée"
          value={quantiteRecommandee}
          icon={<ShoppingCart className="h-6 w-6" />}
          subtitle="à commander"
        />
      </div>

      {/* Alerte Stock Critique */}
      {stockStatus === "critique" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">
            ⚠️ Rupture de stock imminente!
          </AlertTitle>
          <AlertDescription>
            Le stock actuel ne permet de tenir que <strong>{joursAvantRupture} jour{joursAvantRupture > 1 ? 's' : ''}</strong>.
            <br />
            💡 <strong>Action Urgente :</strong> Commander immédiatement {quantiteRecommandee} {articleStats.unite?.symbol || "unités"}.
          </AlertDescription>
        </Alert>
      )}

      {/* Analyse des Prix d'Achat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 Analyse des Prix d'Achat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Prix Moyen</p>
              <p className="text-2xl font-bold">
                {articleStats.prix_achat_moyen?.toLocaleString() || "0"} FCFA
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Prix Minimum</p>
              <p className="text-2xl font-bold">
                {articleStats.prix_achat_min?.toLocaleString() || "0"} FCFA
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Prix Maximum</p>
              <p className="text-2xl font-bold">
                {articleStats.prix_achat_max?.toLocaleString() || "0"} FCFA
              </p>
            </div>
          </div>

          {articleStats.periode_optimale_achat && (
            <div className="mb-6 p-4 rounded-lg border-l-4 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5" />
                <p className="font-bold">Période Optimale d'Achat</p>
              </div>
              <p className="text-sm opacity-90">
                Meilleure période : <strong>{articleStats.periode_optimale_achat.mois}</strong>
                <br />
                Prix moyen durant cette période : <strong>{articleStats.periode_optimale_achat.prix_moyen?.toLocaleString()} FCFA</strong>
              </p>
            </div>
          )}

          {articleStats.evolution_prix && articleStats.evolution_prix.length > 0 && (
            <>
              <h3 className="text-sm font-semibold mb-3">Évolution des Prix</h3>
              <SalesLineChart
                data={articleStats.evolution_prix}
                xKey="date"
                yKey="prix"
                height={250}
                lineColor="#16a34a"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Évolution de la Consommation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Évolution de la Consommation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {articleStats.evolution_quantite && articleStats.evolution_quantite.length > 0 && (
            <>
              <SalesLineChart
                data={articleStats.evolution_quantite}
                xKey="date"
                yKey="entrees"
                secondYKey="sorties"
                height={300}
                lineColor="#3b82f6"
                secondLineColor="#ef4444"
              />

              {articleStats.trend && articleStats.trend !== "stable" && (
                <div className="mt-4 p-4 rounded-lg border-l-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    {articleStats.trend === "hausse" ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <p className="font-bold">
                      Tendance : {articleStats.trend === "hausse" ? "Hausse" : "Baisse"}
                    </p>
                  </div>
                  <p className="text-sm opacity-90">
                    {articleStats.trend === "hausse"
                      ? "La consommation est en hausse. Prévoyez d'augmenter les commandes."
                      : "La consommation est en baisse. Vous pouvez réduire les commandes."}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Historique des Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Historique des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {articleStats.historique_transactions && articleStats.historique_transactions.length > 0 ? (
              articleStats.historique_transactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 opacity-70" />
                    <div>
                      <p className="font-medium">
                        {transaction.date}
                      </p>
                      <p className="text-xs opacity-70">
                        {transaction.type === "entree" ? "Entrée" : "Sortie"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {transaction.prix_unitaire?.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs opacity-70">
                      Qté: {transaction.quantite}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 opacity-70">
                Aucune transaction enregistrée
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stockStatus === "critique" && (
              <div className="p-3 rounded-lg border-l-4 border-red-500">
                <p className="text-sm font-semibold mb-1">🚨 Commander en Urgence</p>
                <p className="text-sm opacity-90">
                  Stock critique! Commander {quantiteRecommandee} {articleStats.unite?.symbol || "unités"} immédiatement.
                </p>
              </div>
            )}

            {stockStatus === "faible" && (
              <div className="p-3 rounded-lg border-l-4 border-orange-500">
                <p className="text-sm font-semibold mb-1">⚠️ Prévoir une Commande</p>
                <p className="text-sm opacity-90">
                  Stock faible. Prévoir une commande de {quantiteRecommandee} {articleStats.unite?.symbol || "unités"} sous peu.
                </p>
              </div>
            )}

            {articleStats.periode_optimale_achat && (
              <div className="p-3 rounded-lg border-l-4 border">
                <p className="text-sm font-semibold mb-1">💡 Période Optimale</p>
                <p className="text-sm opacity-90">
                  Acheter durant le mois de <strong>{articleStats.periode_optimale_achat.mois}</strong> pour économiser
                  (prix moyen: {articleStats.periode_optimale_achat.prix_moyen?.toLocaleString()} FCFA vs {articleStats.prix_achat_moyen?.toLocaleString()} FCFA actuellement).
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg border-l-4 border">
              <p className="text-sm font-semibold mb-1">📦 Quantité Recommandée</p>
              <p className="text-sm opacity-90">
                Commandez {quantiteRecommandee} {articleStats.unite?.symbol || "unités"} pour couvrir environ 7 jours de consommation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopStockId;
