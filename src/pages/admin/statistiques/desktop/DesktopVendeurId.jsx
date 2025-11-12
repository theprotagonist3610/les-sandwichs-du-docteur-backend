import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVendeurDetailAnalytics } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";
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
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Download,
  Package,
  DollarSign,
  Calendar,
  Award,
  BarChart3,
} from "lucide-react";

const DesktopVendeurId = () => {
  const { vendeurId } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");

  const daysCount = parseInt(period);
  const { vendeurStats, loading, error } = useVendeurDetailAnalytics(
    vendeurId,
    daysCount
  );

  // Export CSV
  const exportCSV = () => {
    if (!vendeurStats) return;

    const rows = [
      [`Statistiques du Vendeur: ${vendeurStats.nom}`, `Période: ${period} derniers jours`],
      [],
      ["Résumé"],
      ["Total Ventes", `${vendeurStats.total_ventes.toFixed(0)} FCFA`],
      ["Total Commandes", vendeurStats.total_commandes],
      ["Panier Moyen", `${vendeurStats.panier_moyen.toFixed(0)} FCFA`],
      ["Part du CA Global", `${vendeurStats.pourcentage_ca_global.toFixed(1)}%`],
      ["Tendance", vendeurStats.trend],
      ["Meilleur Jour", vendeurStats.meilleur_jour],
      [],
      ["Évolution Quotidienne"],
      ["Date", "Commandes", "Ventes (FCFA)", "Panier Moyen", "% CA Jour"],
    ];

    vendeurStats.evolution.forEach((day) => {
      rows.push([
        day.dateFormatted,
        day.commandes,
        day.ventes.toFixed(0),
        day.panier_moyen.toFixed(0),
        day.pourcentage.toFixed(1) + "%",
      ]);
    });

    rows.push([]);
    rows.push(["Articles Vendus"]);
    rows.push(["Article", "Quantité", "Ventes (FCFA)"]);

    vendeurStats.articles_vendus.forEach((article) => {
      rows.push([
        article.denomination,
        article.quantite,
        article.total_ventes.toFixed(0),
      ]);
    });

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vendeur_${vendeurStats.nom}_${period}j.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <AlertDescription>Erreur: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!vendeurStats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const evolutionLineData = vendeurStats.evolution.map((day) => ({
    date: day.dateFormatted,
    ventes: day.ventes,
  }));

  const joursOrdre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const joursBarData = joursOrdre.map((jour) => ({
    jour: jour.charAt(0).toUpperCase() + jour.slice(1).slice(0, 3),
    ventes: vendeurStats.jours_semaine[jour].ventes,
    commandes: vendeurStats.jours_semaine[jour].commandes,
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/statistiques/vendeurs")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-3xl font-bold">{vendeurStats.nom}</h1>
            <p className="opacity-70 mt-1">
              Analyse détaillée des performances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="14">14 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="60">60 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Chiffre d'Affaires"
          value={`${vendeurStats.total_ventes.toLocaleString()} FCFA`}
          icon={<DollarSign className="h-5 w-5" />}
          trend={vendeurStats.trend}
          trendValue={
            vendeurStats.trendPercentage !== 0
              ? `${vendeurStats.trendPercentage > 0 ? "+" : ""}${vendeurStats.trendPercentage.toFixed(1)}%`
              : undefined
          }
          description={`${period} derniers jours`}
        />

        <KPICard
          title="Total Commandes"
          value={vendeurStats.total_commandes}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend="neutral"
          description="Nombre de commandes"
        />

        <KPICard
          title="Panier Moyen"
          value={`${vendeurStats.panier_moyen.toFixed(0)} FCFA`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="neutral"
          description="Par commande"
        />

        <KPICard
          title="Part du CA Global"
          value={`${vendeurStats.pourcentage_ca_global.toFixed(1)}%`}
          icon={<BarChart3 className="h-5 w-5" />}
          trend="neutral"
          description={`Sur ${period} jours`}
        />
      </div>

      {/* Tendance et Meilleur Jour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendIcon className={`h-5 w-5 ${trendColor}`} />
              Tendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-bold capitalize">
                  {vendeurStats.trend}
                </p>
                {vendeurStats.trendPercentage !== 0 && (
                  <p className={`text-sm font-semibold ${trendColor}`}>
                    {vendeurStats.trendPercentage > 0 ? "+" : ""}
                    {vendeurStats.trendPercentage.toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="opacity-70 text-sm">
                Comparaison première moitié vs seconde moitié de la période
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-yellow-600" />
              Meilleur Jour de la Semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold capitalize">
                {vendeurStats.meilleur_jour}
              </p>
              <p className="text-sm opacity-70">
                {vendeurStats.jours_semaine[vendeurStats.meilleur_jour]?.ventes.toLocaleString()}{" "}
                FCFA •{" "}
                {vendeurStats.jours_semaine[vendeurStats.meilleur_jour]?.commandes} commande(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des Ventes */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart
              data={evolutionLineData}
              dataKey="ventes"
              xAxisKey="date"
              title="Ventes (FCFA)"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Performance par Jour de la Semaine */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par Jour de la Semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBarChart
              data={joursBarData}
              dataKey="ventes"
              xAxisKey="jour"
              title="Ventes (FCFA)"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Articles Vendus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles Vendus ({vendeurStats.articles_vendus.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendeurStats.articles_vendus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vendeurStats.articles_vendus.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{article.denomination}</p>
                    <p className="text-sm opacity-70 mt-1">
                      Quantité: {article.quantite}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {article.total_ventes.toLocaleString()}
                    </p>
                    <p className="text-xs opacity-70">FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center opacity-70 py-8">Aucun article vendu</p>
          )}
        </CardContent>
      </Card>

      {/* Performance Détaillée par Jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Performance Détaillée par Jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Date</th>
                  <th className="text-right p-3">Commandes</th>
                  <th className="text-right p-3">Ventes (FCFA)</th>
                  <th className="text-right p-3">Panier Moyen</th>
                  <th className="text-right p-3">% CA Jour</th>
                </tr>
              </thead>
              <tbody>
                {vendeurStats.evolution.slice().reverse().map((day) => (
                  <tr key={day.date} className="border-b hover:bg-muted/30">
                    <td className="p-3">{day.dateFormatted}</td>
                    <td className="text-right p-3">{day.commandes}</td>
                    <td className="text-right p-3 font-semibold">
                      {day.ventes.toLocaleString()}
                    </td>
                    <td className="text-right p-3">
                      {day.panier_moyen.toFixed(0)}
                    </td>
                    <td className="text-right p-3">
                      <Badge variant="outline">
                        {day.pourcentage.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopVendeurId;
