import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Download,
  Calendar,
  Package,
  CreditCard,
  Truck,
} from "lucide-react";
import {
  useCommandeStatistiques,
  useCommandeStatistiquesWeek,
} from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";
import { useNavigate } from "react-router-dom";

const DesktopVentes = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");

  const { statistiques, loading, isArchiving } = useCommandeStatistiques();
  const { statistiquesWeek, loading: loadingWeek } = useCommandeStatistiquesWeek();

  if (loading || loadingWeek || isArchiving) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg text-gray-600">
          {isArchiving ? "Archivage en cours..." : "Chargement des statistiques..."}
        </p>
      </div>
    );
  }

  // Calculer le ticket moyen
  const ticketMoyen = statistiques?.nombre_commandes > 0
    ? Math.round(statistiques.total_ventes / statistiques.nombre_commandes)
    : 0;

  // Préparer les données pour le graphique d'évolution
  const evolutionData = (statistiquesWeek || []).map(stat => ({
    date: stat.date,
    value: stat.total_ventes || 0,
  }));

  // Préparer les données pour le donut des encaissements
  const encaissementsData = [
    {
      name: "Espèces",
      value: statistiques?.encaissements?.especes || 0,
    },
    {
      name: "Mobile Money",
      value: statistiques?.encaissements?.momo || 0,
    },
  ].filter(item => item.value > 0);

  // Préparer les données pour le graphique par type
  const typeData = [
    {
      name: "Sur place",
      value: statistiques?.total_ventes_sur_place || 0,
    },
    {
      name: "Livraison",
      value: statistiques?.total_ventes_a_livrer || 0,
    },
  ].filter(item => item.value > 0);

  // Export CSV
  const handleExportCSV = () => {
    if (!statistiques) return;

    const csvContent = `Statistiques Ventes - ${new Date().toLocaleDateString()}\n\n` +
      `Chiffre d'affaires total,${statistiques.total_ventes} FCFA\n` +
      `Nombre de commandes,${statistiques.nombre_commandes}\n` +
      `Ticket moyen,${ticketMoyen} FCFA\n` +
      `Tendance,${statistiques.tendance} (${statistiques.tendance_pourcentage}%)\n\n` +
      `Encaissements\n` +
      `Espèces,${statistiques.encaissements?.especes || 0} FCFA\n` +
      `Mobile Money,${statistiques.encaissements?.momo || 0} FCFA\n\n` +
      `Top 5 Produits\n` +
      `Rang,Produit,Quantité vendue\n` +
      statistiques.total_ventes_par_articles
        ?.sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map((article, index) => `${index + 1},${article.denomination},${article.total}`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_ventes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Ventes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Vue complète des statistiques de ventes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Chiffre d'affaires"
          value={`${(statistiques?.total_ventes || 0).toLocaleString()} F`}
          trend={statistiques?.tendance}
          trendValue={statistiques?.tendance_pourcentage || 0}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
          subtitle="CA total du jour"
        />

        <KPICard
          title="Commandes"
          value={statistiques?.nombre_commandes || 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="blue"
          subtitle="Nombre de transactions"
        />

        <KPICard
          title="Ticket moyen"
          value={`${ticketMoyen.toLocaleString()} F`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
          subtitle="CA / Commandes"
        />

        <KPICard
          title="Produits vendus"
          value={statistiques?.total_ventes_par_articles?.length || 0}
          icon={<Package className="h-6 w-6" />}
          color="orange"
          subtitle="Références différentes"
        />
      </div>

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Évolution du CA (7 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart
            data={evolutionData}
            xKey="date"
            yKey="value"
            height={300}
            lineColor="#3b82f6"
          />
        </CardContent>
      </Card>

      {/* Top 5 Produits & Top 5 Vendeurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Produits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Top 5 Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistiques?.total_ventes_par_articles
                ?.sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((article, index) => {
                  const totalVentes = statistiques.total_ventes_par_articles.reduce(
                    (sum, a) => sum + a.total,
                    0
                  );
                  const percentage = ((article.total / totalVentes) * 100).toFixed(1);

                  return (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/statistiques/ventes/${article.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 font-bold rounded-full">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {article.denomination}
                          </p>
                          <p className="text-sm text-gray-500">
                            {article.total} ventes · {percentage}% du total
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {article.total}
                      </Badge>
                    </div>
                  );
                })}

              {(!statistiques?.total_ventes_par_articles || statistiques.total_ventes_par_articles.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Aucune vente aujourd'hui
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Vendeurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Top 5 Vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistiques?.total_ventes_par_vendeur
                ?.sort((a, b) => b.total_ventes - a.total_ventes)
                .slice(0, 5)
                .map((vendeur, index) => {
                  return (
                    <div
                      key={vendeur.userId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 font-bold rounded-full">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {vendeur.nom}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vendeur.total_commandes} commande{vendeur.total_commandes > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {vendeur.total_ventes.toLocaleString()} F
                        </p>
                        <p className="text-xs text-gray-500">
                          ~{Math.round(vendeur.total_ventes / vendeur.total_commandes).toLocaleString()} F/cmd
                        </p>
                      </div>
                    </div>
                  );
                })}

              {(!statistiques?.total_ventes_par_vendeur || statistiques.total_ventes_par_vendeur.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Aucune vente aujourd'hui
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition Encaissements & Par Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition Encaissements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Répartition Encaissements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {encaissementsData.length > 0 ? (
              <>
                <SalesDonutChart
                  data={encaissementsData}
                  colors={["#22c55e", "#3b82f6"]}
                  height={250}
                  showLegend={false}
                />
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full" />
                      <span className="font-medium text-gray-700">Espèces</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {(statistiques?.encaissements?.especes || 0).toLocaleString()} F
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full" />
                      <span className="font-medium text-gray-700">Mobile Money</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {(statistiques?.encaissements?.momo || 0).toLocaleString()} F
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <span className="font-bold text-gray-700">Total</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {(statistiques?.encaissements?.total || 0).toLocaleString()} F
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun encaissement aujourd'hui
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Répartition par Type de Commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <>
                <SalesBarChart
                  data={typeData}
                  xKey="name"
                  yKey="value"
                  height={250}
                  barColor="#f97316"
                  horizontal={true}
                />
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">Sur place</span>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        {(statistiques?.total_ventes_sur_place || 0).toLocaleString()} F
                      </p>
                      <p className="text-xs text-gray-500">
                        {statistiques?.total_ventes > 0
                          ? ((statistiques.total_ventes_sur_place / statistiques.total_ventes) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                    <span className="font-medium text-gray-700">Livraison</span>
                    <div className="text-right">
                      <p className="font-bold text-cyan-600">
                        {(statistiques?.total_ventes_a_livrer || 0).toLocaleString()} F
                      </p>
                      <p className="text-xs text-gray-500">
                        {statistiques?.total_ventes > 0
                          ? ((statistiques.total_ventes_a_livrer / statistiques.total_ventes) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune vente aujourd'hui
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopVentes;
