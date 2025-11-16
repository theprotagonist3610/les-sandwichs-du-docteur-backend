import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  CheckCircle,
  TrendingUp,
  Clock,
  Download,
  Calendar,
  ChefHat,
  Wine,
} from "lucide-react";
import {
  useProductionStatistiquesJour,
  useProductionStatistiquesWeek,
} from "@/toolkits/admin/productionToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";
import { useNavigate } from "react-router-dom";

const DesktopProduction = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");

  const { statistiques: statsJour, loading, error } = useProductionStatistiquesJour();
  const { statistiques: statsWeek, loading: loadingWeek } = useProductionStatistiquesWeek();

  // Calculer les statistiques agrégées selon la période
  const { statsToDisplay, evolutionData, periodLabel } = useMemo(() => {
    if (!statsWeek || statsWeek.length === 0) {
      return {
        statsToDisplay: statsJour,
        evolutionData: [],
        periodLabel: "Aujourd'hui"
      };
    }

    let filteredStats = [];
    let label = "";

    switch (period) {
      case "today":
        filteredStats = [statsJour];
        label = "Aujourd'hui";
        break;
      case "week":
        filteredStats = statsWeek.slice(-7);
        label = "7 derniers jours";
        break;
      case "month":
        filteredStats = statsWeek.slice(-30);
        label = "30 derniers jours";
        break;
      default:
        filteredStats = [statsJour];
        label = "Aujourd'hui";
    }

    // Si période > aujourd'hui, agréger les stats
    if (period !== "today" && filteredStats.length > 1) {
      const aggregated = {
        date: label,
        total_productions: 0,
        productions_en_cours: 0,
        productions_programmees: 0,
        productions_terminees: 0,
        total_items_produits: 0,
        top_recettes: [],
        productions_par_emplacement: [],
        efficacite: {
          temps_moyen_minutes: 0,
          taux_reussite: 100,
          productions_par_heure: 0,
        },
        tendance: "stable",
        tendance_pourcentage: 0,
      };

      // Agréger les totaux
      filteredStats.forEach(stat => {
        aggregated.total_productions += stat.total_productions || 0;
        aggregated.productions_en_cours += stat.productions_en_cours || 0;
        aggregated.productions_programmees += stat.productions_programmees || 0;
        aggregated.productions_terminees += stat.productions_terminees || 0;
        aggregated.total_items_produits += stat.total_items_produits || 0;
      });

      // Agréger les recettes
      const recettesMap = new Map();
      filteredStats.forEach(stat => {
        stat.top_recettes?.forEach(recette => {
          if (!recettesMap.has(recette.denomination)) {
            recettesMap.set(recette.denomination, {
              ...recette,
              quantite_totale: 0,
              nombre_productions: 0,
            });
          }
          const r = recettesMap.get(recette.denomination);
          r.quantite_totale += recette.quantite_totale;
          r.nombre_productions += recette.nombre_productions;
        });
      });
      aggregated.top_recettes = Array.from(recettesMap.values())
        .sort((a, b) => b.quantite_totale - a.quantite_totale);

      // Calculer efficacité moyenne
      const efficacites = filteredStats
        .filter(s => s.efficacite)
        .map(s => s.efficacite);

      if (efficacites.length > 0) {
        aggregated.efficacite.temps_moyen_minutes =
          efficacites.reduce((sum, e) => sum + e.temps_moyen_minutes, 0) / efficacites.length;
        aggregated.efficacite.taux_reussite =
          efficacites.reduce((sum, e) => sum + e.taux_reussite, 0) / efficacites.length;
        aggregated.efficacite.productions_par_heure =
          efficacites.reduce((sum, e) => sum + e.productions_par_heure, 0) / efficacites.length;
      }

      // Calculer tendance
      const midPoint = Math.floor(filteredStats.length / 2);
      const firstHalf = filteredStats.slice(0, midPoint);
      const secondHalf = filteredStats.slice(midPoint);

      const avgFirst = firstHalf.reduce((sum, s) => sum + (s.total_productions || 0), 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, s) => sum + (s.total_productions || 0), 0) / secondHalf.length;

      if (avgSecond > avgFirst * 1.1) {
        aggregated.tendance = "hausse";
      } else if (avgSecond < avgFirst * 0.9) {
        aggregated.tendance = "baisse";
      }

      aggregated.tendance_pourcentage = avgFirst > 0
        ? ((avgSecond - avgFirst) / avgFirst) * 100
        : 0;

      return {
        statsToDisplay: aggregated,
        evolutionData: filteredStats.map(s => ({
          date: s.date,
          value: s.total_items_produits || 0
        })),
        periodLabel: label,
      };
    }

    return {
      statsToDisplay: statsJour,
      evolutionData: statsWeek.slice(-7).map(s => ({
        date: s.date,
        value: s.total_items_produits || 0
      })),
      periodLabel: label,
    };
  }, [period, statsJour, statsWeek]);

  if (loading || loadingWeek) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg">Chargement des statistiques de production...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg opacity-70">Erreur: {error}</p>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const typeData = [
    {
      name: "Menus",
      value: statsToDisplay?.top_recettes?.filter(r => r.type === "menu")
        .reduce((sum, r) => sum + r.quantite_totale, 0) || 0,
    },
    {
      name: "Boissons",
      value: statsToDisplay?.top_recettes?.filter(r => r.type === "boisson")
        .reduce((sum, r) => sum + r.quantite_totale, 0) || 0,
    },
  ].filter(item => item.value > 0);

  const statusData = [
    {
      name: "Terminées",
      value: statsToDisplay?.productions_terminees || 0,
    },
    {
      name: "En cours",
      value: statsToDisplay?.productions_en_cours || 0,
    },
    {
      name: "Programmées",
      value: statsToDisplay?.productions_programmees || 0,
    },
  ].filter(item => item.value > 0);

  // Taux de complétion
  const tauxCompletion = statsToDisplay?.total_productions > 0
    ? Math.round((statsToDisplay.productions_terminees / statsToDisplay.total_productions) * 100)
    : 0;

  // Export CSV
  const handleExportCSV = () => {
    if (!statsToDisplay) return;

    const csvContent = `Statistiques Production - ${periodLabel} - ${new Date().toLocaleDateString()}\n\n` +
      `Total Productions,${statsToDisplay.total_productions}\n` +
      `Productions Terminées,${statsToDisplay.productions_terminees}\n` +
      `Items Produits,${statsToDisplay.total_items_produits}\n` +
      `Taux de Complétion,${tauxCompletion}%\n` +
      `Efficacité (min/prod),${statsToDisplay.efficacite?.temps_moyen_minutes?.toFixed(1) || 0}\n` +
      `Productions/heure,${statsToDisplay.efficacite?.productions_par_heure?.toFixed(1) || 0}\n\n` +
      `Top 5 Recettes\n` +
      `Rang,Recette,Type,Quantité,Productions\n` +
      statsToDisplay.top_recettes
        ?.slice(0, 5)
        .map((recette, index) =>
          `${index + 1},${recette.denomination},${recette.type},${recette.quantite_totale},${recette.nombre_productions}`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_production_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🍳 Dashboard Production</h1>
          <p className="text-sm opacity-70 mt-1">
            {periodLabel} · Suivi de la production des recettes
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
          title="Total Productions"
          value={statsToDisplay?.total_productions || 0}
          trend={statsToDisplay?.tendance}
          trendValue={statsToDisplay?.tendance_pourcentage || 0}
          icon={<Package className="h-6 w-6" />}
          subtitle={periodLabel}
        />

        <KPICard
          title="Productions Terminées"
          value={statsToDisplay?.productions_terminees || 0}
          icon={<CheckCircle className="h-6 w-6" />}
          subtitle={`${tauxCompletion}% de complétion`}
        />

        <KPICard
          title="Items Produits"
          value={statsToDisplay?.total_items_produits || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle="Quantité totale"
        />

        <KPICard
          title="Efficacité"
          value={`${statsToDisplay?.efficacite?.temps_moyen_minutes?.toFixed(0) || 0} min`}
          icon={<Clock className="h-6 w-6" />}
          subtitle={`${statsToDisplay?.efficacite?.productions_par_heure?.toFixed(1) || 0} prod/h`}
        />
      </div>

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Évolution de la Production ({periodLabel})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart
            data={evolutionData}
            xKey="date"
            yKey="value"
            height={300}
            lineColor="#a41624"
          />
        </CardContent>
      </Card>

      {/* Top 5 Recettes & Répartition Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Recettes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top 5 Recettes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsToDisplay?.top_recettes
                ?.slice(0, 5)
                .map((recette, index) => {
                  const totalQuantite = statsToDisplay.top_recettes.reduce(
                    (sum, r) => sum + r.quantite_totale,
                    0
                  );
                  const percentage = ((recette.quantite_totale / totalQuantite) * 100).toFixed(1);

                  return (
                    <div
                      key={recette.denomination}
                      className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 cursor-pointer transition-opacity border"
                      onClick={() => navigate(`/admin/statistiques/production/${recette.denomination}`)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 border font-bold rounded-full">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {recette.type === "menu" ? (
                              <ChefHat className="h-4 w-4" />
                            ) : (
                              <Wine className="h-4 w-4" />
                            )}
                            <p className="font-medium">{recette.denomination}</p>
                          </div>
                          <p className="text-sm opacity-70">
                            {recette.nombre_productions} production{recette.nombre_productions > 1 ? 's' : ''} · {percentage}%
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {recette.quantite_totale} unités
                      </Badge>
                    </div>
                  );
                })}

              {(!statsToDisplay?.top_recettes || statsToDisplay.top_recettes.length === 0) && (
                <div className="text-center py-8 opacity-70">
                  Aucune production pour cette période
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Répartition Menu vs Boisson */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Répartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <>
                <SalesDonutChart
                  data={typeData}
                  colors={["#a41624", "#ffb564"]}
                  height={250}
                  showLegend={false}
                />
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      <span className="font-medium">Menus</span>
                    </div>
                    <span className="font-bold">
                      {typeData.find(d => d.name === "Menus")?.value || 0} unités
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Wine className="h-4 w-4" />
                      <span className="font-medium">Boissons</span>
                    </div>
                    <span className="font-bold">
                      {typeData.find(d => d.name === "Boissons")?.value || 0} unités
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 opacity-70">
                Aucune production pour cette période
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productions par Statut */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Répartition par Statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <>
              <SalesBarChart
                data={statusData}
                xKey="name"
                yKey="value"
                height={250}
                barColor="#a41624"
                horizontal={false}
              />
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg border">
                  <p className="text-sm opacity-70">Terminées</p>
                  <p className="text-2xl font-bold">{statsToDisplay?.productions_terminees || 0}</p>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <p className="text-sm opacity-70">En cours</p>
                  <p className="text-2xl font-bold">{statsToDisplay?.productions_en_cours || 0}</p>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <p className="text-sm opacity-70">Programmées</p>
                  <p className="text-2xl font-bold">{statsToDisplay?.productions_programmees || 0}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 opacity-70">
              Aucune production pour cette période
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopProduction;
