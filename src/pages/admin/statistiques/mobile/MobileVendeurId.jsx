import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVendeurDetailAnalytics } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Package,
  DollarSign,
  Award,
  BarChart3,
} from "lucide-react";

const MobileVendeurId = () => {
  const { vendeurId } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");

  const daysCount = parseInt(period);
  const { vendeurStats, loading, error } = useVendeurDetailAnalytics(
    vendeurId,
    daysCount
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive">
          <AlertDescription>Erreur: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!vendeurStats) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const evolutionLineData = vendeurStats.evolution.map((day) => ({
    date: day.dateFormatted,
    ventes: day.ventes,
  }));

  // Icône de tendance
  const TrendIcon =
    vendeurStats.trend === "hausse"
      ? TrendingUp
      : vendeurStats.trend === "baisse"
      ? TrendingDown
      : Minus;

  const trendColor =
    vendeurStats.trend === "hausse"
      ? "text-green-600"
      : vendeurStats.trend === "baisse"
      ? "text-red-600"
      : "text-gray-600";

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/statistiques/vendeurs")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{vendeurStats.nom}</h1>
          <p className="text-sm opacity-70">Analyse détaillée</p>
        </div>
      </div>

      {/* Filtre */}
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">7 derniers jours</SelectItem>
          <SelectItem value="14">14 derniers jours</SelectItem>
          <SelectItem value="30">30 derniers jours</SelectItem>
          <SelectItem value="60">60 derniers jours</SelectItem>
        </SelectContent>
      </Select>

      {/* KPIs - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="CA Total"
          value={`${(vendeurStats.total_ventes / 1000).toFixed(0)}k`}
          icon={DollarSign}
          trend={vendeurStats.trend}
          trendValue={
            vendeurStats.trendPercentage !== 0
              ? `${vendeurStats.trendPercentage > 0 ? "+" : ""}${vendeurStats.trendPercentage.toFixed(1)}%`
              : undefined
          }
          description="FCFA"
        />

        <KPICard
          title="Commandes"
          value={vendeurStats.total_commandes}
          icon={ShoppingCart}
          trend="neutral"
          description={`${period}j`}
        />

        <KPICard
          title="Panier Moy."
          value={`${(vendeurStats.panier_moyen / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          trend="neutral"
          description="FCFA"
        />

        <KPICard
          title="Part CA"
          value={`${vendeurStats.pourcentage_ca_global.toFixed(1)}%`}
          icon={BarChart3}
          trend="neutral"
          description="Global"
        />
      </div>

      {/* Tendance et Meilleur Jour */}
      <div className="grid grid-cols-1 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              Tendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold capitalize">
                  {vendeurStats.trend}
                </p>
                {vendeurStats.trendPercentage !== 0 && (
                  <p className={`text-sm font-semibold ${trendColor}`}>
                    {vendeurStats.trendPercentage > 0 ? "+" : ""}
                    {vendeurStats.trendPercentage.toFixed(1)}%
                  </p>
                )}
              </div>
              <p className="text-xs opacity-70 text-right max-w-[150px]">
                1ère vs 2nde moitié
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-yellow-600" />
              Meilleur Jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold capitalize">
                {vendeurStats.meilleur_jour}
              </p>
              <div className="text-right text-sm">
                <p className="font-semibold">
                  {(vendeurStats.jours_semaine[vendeurStats.meilleur_jour]?.ventes / 1000).toFixed(0)}k
                </p>
                <p className="text-xs opacity-70">
                  {vendeurStats.jours_semaine[vendeurStats.meilleur_jour]?.commandes} cmd
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Évolution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Évolution des Ventes</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart
            data={evolutionLineData}
            dataKey="ventes"
            xAxisKey="date"
            title="Ventes (FCFA)"
            height={250}
          />
        </CardContent>
      </Card>

      {/* Articles Vendus */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Articles Vendus ({vendeurStats.articles_vendus.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendeurStats.articles_vendus.length > 0 ? (
            <div className="space-y-2">
              {vendeurStats.articles_vendus.slice(0, 10).map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {article.denomination}
                    </p>
                    <p className="text-xs opacity-70 mt-0.5">
                      Qté: {article.quantite}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-bold text-green-600 text-sm">
                      {(article.total_ventes / 1000).toFixed(0)}k
                    </p>
                    <p className="text-[10px] opacity-70">FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center opacity-70 py-6 text-sm">
              Aucun article vendu
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historique Détaillé */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique Quotidien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vendeurStats.evolution.slice().reverse().slice(0, 15).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-semibold text-sm">{day.dateFormatted}</p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {day.commandes} cmd • {(day.panier_moyen / 1000).toFixed(1)}k moy.
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-sm">
                    {(day.ventes / 1000).toFixed(0)}k
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {day.pourcentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileVendeurId;
