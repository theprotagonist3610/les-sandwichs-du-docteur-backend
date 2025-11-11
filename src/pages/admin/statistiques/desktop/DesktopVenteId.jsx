import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { useProductDetails } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";

const DesktopVenteId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { productStats, loading, error } = useProductDetails(id, 7);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg text-gray-600">Chargement du produit...</p>
      </div>
    );
  }

  if (error || !productStats) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/admin/statistiques/ventes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl text-red-600">❌ Produit non trouvé</p>
          <p className="text-gray-500 mt-2">
            {error || "Aucune donnée disponible pour ce produit"}
          </p>
        </div>
      </div>
    );
  }

  // Calculer quelques insights
  const avgDailySales = productStats.totalQuantity / productStats.days;
  const maxDailySales = Math.max(...productStats.dailySales.map(d => d.quantity));
  const minDailySales = Math.min(...productStats.dailySales.map(d => d.quantity));

  // Prédiction simple (moyenne mobile)
  const prediction = Math.round(avgDailySales * 1.05); // +5% de tendance optimiste

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/statistiques/ventes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {productStats.name}
              </h1>
              <Badge
                variant="outline"
                className={
                  productStats.trend === "hausse"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : productStats.trend === "baisse"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }
              >
                {productStats.trend === "hausse" && <TrendingUp className="h-3 w-3 mr-1" />}
                {productStats.trend === "baisse" && <TrendingDown className="h-3 w-3 mr-1" />}
                {productStats.trend}
              </Badge>
            </div>
            <p className="text-sm opacity-70 mt-1">
              Analyse détaillée sur {productStats.days} jours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 opacity-70" />
          <span className="text-sm opacity-70">7 derniers jours</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Quantité vendue"
          value={productStats.totalQuantity}
          trend={productStats.trend}
          trendValue={productStats.trendPercentage}
          icon={<Package className="h-6 w-6" />}
          color="blue"
          subtitle={`${productStats.days} derniers jours`}
        />

        <KPICard
          title="Vente moyenne/jour"
          value={avgDailySales.toFixed(1)}
          icon={<BarChart3 className="h-6 w-6" />}
          color="green"
          subtitle="Moyenne quotidienne"
        />

        <KPICard
          title="Pic de ventes"
          value={maxDailySales}
          icon={<TrendingUp className="h-6 w-6" />}
          color="orange"
          subtitle="Maximum atteint"
        />

        <KPICard
          title="Prévision demain"
          value={`~${prediction}`}
          icon={<Lightbulb className="h-6 w-6" />}
          color="purple"
          subtitle="Prédiction moyenne mobile"
        />
      </div>

      {/* Insights IA */}
      {productStats.trend !== "stable" && (
        <Alert
          className={
            productStats.trend === "hausse"
              ? "bg-green-50 border-green-200"
              : "bg-orange-50 border-orange-200"
          }
        >
          <Lightbulb
            className={`h-4 w-4 ${
              productStats.trend === "hausse" ? "text-green-600" : "text-orange-600"
            }`}
          />
          <AlertTitle className="font-bold">
            {productStats.trend === "hausse"
              ? "🎉 Tendance positive détectée !"
              : "⚠️ Baisse de popularité détectée"}
          </AlertTitle>
          <AlertDescription>
            {productStats.trend === "hausse" ? (
              <>
                Les ventes de ce produit sont en hausse de{" "}
                <strong>{Math.abs(productStats.trendPercentage).toFixed(1)}%</strong>.
                <br />
                💡 <strong>Recommandation :</strong> Augmenter le stock pour anticiper la demande.
                {maxDailySales > avgDailySales * 1.5 && (
                  <span> Attention: pic de {maxDailySales} ventes détecté.</span>
                )}
              </>
            ) : (
              <>
                Les ventes de ce produit sont en baisse de{" "}
                <strong>{Math.abs(productStats.trendPercentage).toFixed(1)}%</strong>.
                <br />
                💡 <strong>Recommandation :</strong> Analyser les raisons (rupture de stock, concurrence, saisonnalité).
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Évolution des ventes ({productStats.days} jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart
            data={productStats.dailySales.map(d => ({
              date: d.date,
              value: d.quantity,
            }))}
            xKey="date"
            yKey="value"
            height={350}
            lineColor="#3b82f6"
          />

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Moyenne/jour</p>
              <p className="text-2xl font-bold text-blue-600">
                {avgDailySales.toFixed(1)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Maximum</p>
              <p className="text-2xl font-bold text-green-600">{maxDailySales}</p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Minimum</p>
              <p className="text-2xl font-bold text-orange-600">{minDailySales}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Répartition par jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Répartition par jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesBarChart
            data={productStats.dailySales.map(d => ({
              name: d.date?.length === 8
                ? `${d.date.slice(0, 2)}/${d.date.slice(2, 4)}`
                : d.date,
              value: d.quantity,
            }))}
            xKey="name"
            yKey="value"
            height={300}
            barColor="#22c55e"
          />
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Statistiques détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analyse de performance */}
            <div className="space-y-4">
              <h3 className="font-semibold">Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Total vendu ({productStats.days}j)</span>
                  <span className="font-bold">{productStats.totalQuantity} unités</span>
                </div>
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Moyenne quotidienne</span>
                  <span className="font-bold">{avgDailySales.toFixed(1)} unités/j</span>
                </div>
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Tendance</span>
                  <Badge
                    className={
                      productStats.trend === "hausse"
                        ? "bg-green-100 text-green-700"
                        : productStats.trend === "baisse"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {productStats.trend} ({productStats.trendPercentage > 0 ? "+" : ""}
                    {productStats.trendPercentage.toFixed(1)}%)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Prévisions & Recommandations */}
            <div className="space-y-4">
              <h3 className="font-semibold">Prévisions & Recommandations</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-purple-50 rounded border">
                  <span className="opacity-70">Prévision demain</span>
                  <span className="font-bold text-purple-600">~{prediction} unités</span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 rounded border">
                  <span className="opacity-70">Prévision J+3</span>
                  <span className="font-bold text-purple-600">
                    ~{Math.round(prediction * 3)} unités
                  </span>
                </div>
                <div className="p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm">
                    <strong>💡 Conseil :</strong>{" "}
                    {productStats.trend === "hausse"
                      ? "Augmentez le stock de 20% pour éviter les ruptures."
                      : productStats.trend === "baisse"
                      ? "Réduisez les commandes pour éviter le surstockage."
                      : "Maintenez le niveau de stock actuel."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopVenteId;
