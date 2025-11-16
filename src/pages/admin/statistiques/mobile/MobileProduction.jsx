import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  CheckCircle,
  TrendingUp,
  Clock,
  ChefHat,
  Wine,
} from "lucide-react";
import {
  useProductionStatistiquesJour,
} from "@/toolkits/admin/productionToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import { useNavigate } from "react-router-dom";

const MobileProduction = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");

  const { statistiques, loading, error } = useProductionStatistiquesJour();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-sm text-center">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-sm opacity-70 text-center">Erreur: {error}</p>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const typeData = [
    {
      name: "Menus",
      value: statistiques?.top_recettes?.filter(r => r.type === "menu")
        .reduce((sum, r) => sum + r.quantite_totale, 0) || 0,
    },
    {
      name: "Boissons",
      value: statistiques?.top_recettes?.filter(r => r.type === "boisson")
        .reduce((sum, r) => sum + r.quantite_totale, 0) || 0,
    },
  ].filter(item => item.value > 0);

  // Taux de complétion
  const tauxCompletion = statistiques?.total_productions > 0
    ? Math.round((statistiques.productions_terminees / statistiques.total_productions) * 100)
    : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">🍳 Production</h1>
        <p className="text-xs opacity-70 mt-1">
          Aujourd'hui · Statistiques de production
        </p>
      </div>

      {/* KPIs principaux - Grille 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Productions"
          value={statistiques?.total_productions || 0}
          trend={statistiques?.tendance}
          trendValue={statistiques?.tendance_pourcentage || 0}
          icon={<Package className="h-5 w-5" />}
        />

        <KPICard
          title="Terminées"
          value={statistiques?.productions_terminees || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          subtitle={`${tauxCompletion}%`}
        />

        <KPICard
          title="Items"
          value={statistiques?.total_items_produits || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="Produits"
        />

        <KPICard
          title="Efficacité"
          value={`${statistiques?.efficacite?.temps_moyen_minutes?.toFixed(0) || 0}m`}
          icon={<Clock className="h-5 w-5" />}
          subtitle={`${statistiques?.efficacite?.productions_par_heure?.toFixed(1) || 0}/h`}
        />
      </div>

      {/* Top 5 Recettes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Top 5 Recettes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistiques?.top_recettes
              ?.slice(0, 5)
              .map((recette, index) => (
                <div
                  key={recette.denomination}
                  className="flex items-center justify-between p-2 rounded hover:opacity-80 active:opacity-60 cursor-pointer border"
                  onClick={() => navigate(`/admin/statistiques/production/${recette.denomination}`)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 border font-bold rounded-full text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {recette.type === "menu" ? (
                          <ChefHat className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <Wine className="h-3 w-3 flex-shrink-0" />
                        )}
                        <p className="font-medium text-sm truncate">{recette.denomination}</p>
                      </div>
                      <p className="text-xs opacity-70">
                        {recette.nombre_productions} prod · {recette.quantite_totale} u
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {recette.quantite_totale}
                  </Badge>
                </div>
              ))}

            {(!statistiques?.top_recettes || statistiques.top_recettes.length === 0) && (
              <div className="text-center py-6 opacity-70 text-sm">
                Aucune production aujourd'hui
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Répartition Menu vs Boisson */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Répartition par Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typeData.length > 0 ? (
            <>
              <SalesDonutChart
                data={typeData}
                colors={["#a41624", "#ffb564"]}
                height={200}
                showLegend={false}
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-2 rounded border text-sm">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    <span className="font-medium">Menus</span>
                  </div>
                  <span className="font-bold">
                    {typeData.find(d => d.name === "Menus")?.value || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded border text-sm">
                  <div className="flex items-center gap-2">
                    <Wine className="h-4 w-4" />
                    <span className="font-medium">Boissons</span>
                  </div>
                  <span className="font-bold">
                    {typeData.find(d => d.name === "Boissons")?.value || 0}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 opacity-70 text-sm">
              Aucune production
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Par Statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded border">
              <p className="text-xs opacity-70">Terminées</p>
              <p className="text-lg font-bold">{statistiques?.productions_terminees || 0}</p>
            </div>
            <div className="text-center p-2 rounded border">
              <p className="text-xs opacity-70">En cours</p>
              <p className="text-lg font-bold">{statistiques?.productions_en_cours || 0}</p>
            </div>
            <div className="text-center p-2 rounded border">
              <p className="text-xs opacity-70">Programmées</p>
              <p className="text-lg font-bold">{statistiques?.productions_programmees || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileProduction;
