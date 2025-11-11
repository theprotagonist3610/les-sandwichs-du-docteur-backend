import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  CreditCard,
  Truck,
  Users,
} from "lucide-react";
import {
  useCommandeStatistiques,
  useCommandeStatistiquesWeek,
} from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import { useNavigate } from "react-router-dom";

const MobileVentes = () => {
  const navigate = useNavigate();

  const { statistiques, loading, isArchiving } = useCommandeStatistiques();
  const { statistiquesWeek, loading: loadingWeek } = useCommandeStatistiquesWeek();

  if (loading || loadingWeek || isArchiving) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-sm text-gray-600 text-center">
          {isArchiving ? "Archivage en cours..." : "Chargement..."}
        </p>
      </div>
    );
  }

  const ticketMoyen = statistiques?.nombre_commandes > 0
    ? Math.round(statistiques.total_ventes / statistiques.nombre_commandes)
    : 0;

  const evolutionData = (statistiquesWeek || []).map(stat => ({
    date: stat.date,
    value: stat.total_ventes || 0,
  }));

  const encaissementsData = [
    { name: "Espèces", value: statistiques?.encaissements?.especes || 0 },
    { name: "Mobile Money", value: statistiques?.encaissements?.momo || 0 },
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Ventes</h1>
        <p className="text-xs text-gray-600 mt-1">Statistiques du jour</p>
      </div>

      {/* KPIs - 2 colonnes sur mobile */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="CA Total"
          value={`${(statistiques?.total_ventes || 0).toLocaleString()} F`}
          trend={statistiques?.tendance}
          trendValue={statistiques?.tendance_pourcentage || 0}
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />

        <KPICard
          title="Commandes"
          value={statistiques?.nombre_commandes || 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="blue"
        />

        <KPICard
          title="Ticket Moyen"
          value={`${ticketMoyen.toLocaleString()} F`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />

        <KPICard
          title="Produits"
          value={statistiques?.total_ventes_par_articles?.length || 0}
          icon={<Package className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📈 Évolution (7j)</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart
            data={evolutionData}
            xKey="date"
            yKey="value"
            height={220}
            lineColor="#3b82f6"
          />
        </CardContent>
      </Card>

      {/* Top 5 Produits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            Top 5 Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statistiques?.total_ventes_par_articles
              ?.sort((a, b) => b.total - a.total)
              .slice(0, 5)
              .map((article, index) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-blue-50 active:bg-blue-100"
                  onClick={() => navigate(`/admin/statistiques/ventes/${article.id}`)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 font-bold rounded-full text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{article.denomination}</p>
                      <p className="text-xs text-gray-500">{article.total} ventes</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {article.total}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Encaissements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-purple-600" />
            Encaissements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {encaissementsData.length > 0 ? (
            <>
              <SalesDonutChart
                data={encaissementsData}
                colors={["#22c55e", "#3b82f6"]}
                height={180}
                showLegend={false}
              />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between p-2 bg-green-50 rounded text-sm">
                  <span>💵 Espèces</span>
                  <span className="font-bold text-green-600">
                    {(statistiques?.encaissements?.especes || 0).toLocaleString()} F
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded text-sm">
                  <span>📱 MoMo</span>
                  <span className="font-bold text-blue-600">
                    {(statistiques?.encaissements?.momo || 0).toLocaleString()} F
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500 py-4">
              Aucun encaissement
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileVentes;
