import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { useProductDetails } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";

const MobileVenteId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { productStats, loading, error } = useProductDetails(id, 7);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-sm text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error || !productStats) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/statistiques/ventes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-lg text-red-600">❌ Produit non trouvé</p>
        </div>
      </div>
    );
  }

  const avgDailySales = productStats.totalQuantity / productStats.days;
  const maxDailySales = Math.max(...productStats.dailySales.map(d => d.quantity));
  const prediction = Math.round(avgDailySales * 1.05);

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/statistiques/ventes")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">
            {productStats.name}
          </h1>
          <Badge
            variant="outline"
            className={
              productStats.trend === "hausse"
                ? "bg-green-50 text-green-700 text-xs"
                : productStats.trend === "baisse"
                ? "bg-red-50 text-red-700 text-xs"
                : "bg-gray-50 text-gray-700 text-xs"
            }
          >
            {productStats.trend === "hausse" && <TrendingUp className="h-3 w-3 mr-1" />}
            {productStats.trend === "baisse" && <TrendingDown className="h-3 w-3 mr-1" />}
            {productStats.trend}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-1">Analyse sur 7 jours</p>
      </div>

      {/* KPIs - 2 colonnes */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Quantité"
          value={productStats.totalQuantity}
          trend={productStats.trend}
          trendValue={productStats.trendPercentage}
          icon={<Package className="h-5 w-5" />}
          color="blue"
        />

        <KPICard
          title="Moy./jour"
          value={avgDailySales.toFixed(1)}
          icon={<BarChart3 className="h-5 w-5" />}
          color="green"
        />

        <KPICard
          title="Maximum"
          value={maxDailySales}
          icon={<TrendingUp className="h-5 w-5" />}
          color="orange"
        />

        <KPICard
          title="Prévision"
          value={`~${prediction}`}
          icon={<Lightbulb className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Insight */}
      {productStats.trend !== "stable" && (
        <div
          className={`p-3 rounded-lg border-l-4 ${
            productStats.trend === "hausse"
              ? "bg-green-50 border-green-500"
              : "bg-orange-50 border-orange-500"
          }`}
        >
          <p className="text-xs font-semibold mb-1">
            {productStats.trend === "hausse" ? "🎉 Tendance +" : "⚠️ Tendance -"}
          </p>
          <p className="text-xs text-gray-700">
            {productStats.trend === "hausse"
              ? `Hausse de ${Math.abs(productStats.trendPercentage).toFixed(1)}%. Augmentez le stock.`
              : `Baisse de ${Math.abs(productStats.trendPercentage).toFixed(1)}%. Analysez les causes.`}
          </p>
        </div>
      )}

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📈 Évolution (7j)</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart
            data={productStats.dailySales.map(d => ({
              date: d.date,
              value: d.quantity,
            }))}
            xKey="date"
            yKey="value"
            height={220}
            lineColor="#3b82f6"
          />
        </CardContent>
      </Card>

      {/* Barres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Par jour</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesBarChart
            data={productStats.dailySales.map(d => ({
              name: d.date?.length === 8 ? `${d.date.slice(0, 2)}/${d.date.slice(2, 4)}` : d.date,
              value: d.quantity,
            }))}
            xKey="name"
            yKey="value"
            height={220}
            barColor="#22c55e"
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 Détails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Total (7j)</span>
              <span className="font-bold">{productStats.totalQuantity}</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Moyenne/jour</span>
              <span className="font-bold">{avgDailySales.toFixed(1)}</span>
            </div>
            <div className="flex justify-between p-2 bg-purple-50 rounded">
              <span className="text-gray-600">Prévision demain</span>
              <span className="font-bold text-purple-600">~{prediction}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileVenteId;
