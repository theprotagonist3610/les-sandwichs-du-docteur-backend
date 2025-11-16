import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  Target,
  ChefHat,
  Wine,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecetteDetails } from "@/toolkits/admin/productionToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";

const MobileProductionId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { recetteStats, loading, error } = useRecetteDetails(id, 7);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-sm text-center">Chargement de l'analyse...</p>
      </div>
    );
  }

  if (error || !recetteStats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-sm opacity-70 text-center">
          {error || "Recette introuvable"}
        </p>
        <button
          onClick={() => navigate("/admin/statistiques/production")}
          className="mt-4 px-4 py-2 border rounded text-sm"
        >
          Retour
        </button>
      </div>
    );
  }

  // Calculs pour les KPIs
  const avgDailyQuantite = recetteStats.avgQuantite;
  const prediction = Math.round(avgDailyQuantite * (recetteStats.trend === "hausse" ? 1.1 : recetteStats.trend === "baisse" ? 0.9 : 1));

  return (
    <div className="p-4 space-y-4">
      {/* Header avec retour */}
      <div>
        <button
          onClick={() => navigate("/admin/statistiques/production")}
          className="flex items-center gap-2 opacity-70 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs">Retour</span>
        </button>

        <div className="flex items-center gap-2">
          {recetteStats.type === "menu" ? (
            <ChefHat className="h-6 w-6" />
          ) : (
            <Wine className="h-6 w-6" />
          )}
          <h1 className="text-xl font-bold">{recetteStats.denomination}</h1>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {recetteStats.trend === "hausse" && <TrendingUp className="h-3 w-3 mr-1" />}
            {recetteStats.trend === "baisse" && <TrendingDown className="h-3 w-3 mr-1" />}
            {recetteStats.trend}
          </Badge>
          <p className="text-xs opacity-70">Analyse sur 7 jours</p>
        </div>
      </div>

      {/* KPIs Recette - Grille 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Total"
          value={recetteStats.totalQuantite}
          icon={<Package className="h-5 w-5" />}
          subtitle="unités"
        />

        <KPICard
          title="Moy/Jour"
          value={avgDailyQuantite.toFixed(1)}
          icon={<Calendar className="h-5 w-5" />}
          subtitle="unités"
        />

        <KPICard
          title="Max"
          value={recetteStats.maxQuantite}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle={`Min: ${recetteStats.minQuantite}`}
        />

        <KPICard
          title="Prévision"
          value={`~${prediction}`}
          icon={<Target className="h-5 w-5" />}
          subtitle="demain"
        />
      </div>

      {/* Insight */}
      {recetteStats.trend !== "stable" && (
        <div className="p-3 rounded-lg border-l-4 border">
          <p className="text-xs font-semibold mb-1">
            {recetteStats.trend === "hausse" ? "🎉 Tendance +" : "⚠️ Tendance -"}
          </p>
          <p className="text-xs opacity-90">
            {recetteStats.trend === "hausse"
              ? `Hausse de ${Math.abs(recetteStats.trendPercentage).toFixed(1)}%. Augmentez le stock d'ingrédients.`
              : `Baisse de ${Math.abs(recetteStats.trendPercentage).toFixed(1)}%. Analysez les causes.`}
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
            data={recetteStats.dailyProductions}
            xKey="date"
            yKey="quantite"
            height={220}
            lineColor="#a41624"
          />
        </CardContent>
      </Card>

      {/* Stats Rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between p-2 rounded border text-sm">
              <span className="opacity-70">Productions</span>
              <span className="font-bold">{recetteStats.totalProductions}</span>
            </div>
            <div className="flex justify-between p-2 rounded border text-sm">
              <span className="opacity-70">Moyenne/jour</span>
              <span className="font-bold">{avgDailyQuantite.toFixed(1)}</span>
            </div>
            <div className="flex justify-between p-2 rounded border text-sm">
              <span className="opacity-70">Prévision demain</span>
              <span className="font-bold">~{prediction}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique Détaillé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📅 Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recetteStats.dailyProductions.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-2 rounded border text-sm"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="h-3 w-3 opacity-70 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">
                      {day.date?.length === 8
                        ? `${day.date.slice(0, 2)}/${day.date.slice(2, 4)}`
                        : day.date}
                    </p>
                    <p className="text-xs opacity-70">
                      {day.productions} prod
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{day.quantite}</p>
                  <p className="text-xs opacity-70">unités</p>
                </div>
              </div>
            ))}

            {recetteStats.dailyProductions.length === 0 && (
              <div className="text-center py-6 opacity-70 text-sm">
                Aucune production
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileProductionId;
