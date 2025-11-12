import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStockAnalytics, STOCK_TYPES } from "@/toolkits/admin/stockToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

const MobileStock = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");

  const daysCount = parseInt(period);
  const { stats, loading, error } = useStockAnalytics(daysCount);

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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  const typesDonutData = [
    { name: "Ingrédients", value: stats.articles_par_type[STOCK_TYPES.INGREDIENT] },
    { name: "Consommables", value: stats.articles_par_type[STOCK_TYPES.CONSOMMABLE] },
    { name: "Périssables", value: stats.articles_par_type[STOCK_TYPES.PERISSABLE] },
    { name: "Matériel", value: stats.articles_par_type[STOCK_TYPES.MATERIEL] },
    { name: "Emballage", value: stats.articles_par_type[STOCK_TYPES.EMBALLAGE] },
  ].filter((item) => item.value > 0);

  const getStatutBadge = (statut) => {
    if (statut === "rupture") {
      return <Badge variant="destructive" className="text-xs">Rupture</Badge>;
    } else if (statut === "critique") {
      return <Badge variant="destructive" className="opacity-70 text-xs">Critique</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs">Alerte</Badge>;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Statistiques de Stock</h1>
          <p className="text-sm opacity-70 mt-1">Gestion et analyse du stock</p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="60">60 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Articles"
          value={stats.total_articles}
          icon={<Package className="h-5 w-5" />}
          subtitle={`${period}j`}
        />

        <KPICard
          title="Alertes"
          value={stats.articles_en_alerte}
          icon={<AlertTriangle className="h-5 w-5" />}
          subtitle={`${((stats.articles_en_alerte / stats.total_articles) * 100).toFixed(0)}%`}
        />

        <KPICard
          title="Ruptures"
          value={stats.articles_en_rupture}
          icon={<TrendingDown className="h-5 w-5" />}
          subtitle="épuisés"
        />

        <KPICard
          title="Valeur"
          value={`${(stats.valeur_totale_stock / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="FCFA"
        />
      </div>

      {/* Alerte critique */}
      {stats.articles_critiques.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 text-sm">
            <strong>{stats.articles_critiques.length} article(s)</strong> en situation critique.
            {stats.articles_en_rupture > 0 && (
              <> <strong>{stats.articles_en_rupture} rupture(s)</strong> nécessitent réapprovisionnement.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Répartition par type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Répartition par Type
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SalesDonutChart data={typesDonutData} height={200} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {typesDonutData.map((item) => (
              <div key={item.name} className="text-center p-2 border rounded-lg">
                <p className="text-xs font-medium opacity-70">{item.name}</p>
                <p className="text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Articles critiques */}
      {stats.articles_critiques.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Articles Critiques
              <Badge variant="outline" className="text-xs">{stats.articles_critiques.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stats.articles_critiques.slice(0, 5).map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all active:scale-95"
                  onClick={() => navigate(`/admin/statistiques/stock/${article.id}`)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 opacity-70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{article.denomination}</p>
                        {getStatutBadge(article.statut)}
                      </div>
                      <p className="text-xs opacity-70 truncate">
                        Stock: {article.quantite_actuelle} {article.unite?.symbol || ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    {article.jours_avant_rupture !== null ? (
                      <>
                        <p className="text-sm font-bold">{article.jours_avant_rupture}j</p>
                        <ChevronRight className="h-4 w-4 inline opacity-70" />
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold">RUPTURE</p>
                        <ChevronRight className="h-4 w-4 inline opacity-70" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top consommation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Top Consommation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {stats.top_consommation.slice(0, 5).map((article, index) => (
              <div
                key={article.id}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all active:scale-95"
                onClick={() => navigate(`/admin/statistiques/stock/${article.id}`)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{article.denomination}</p>
                    <p className="text-xs opacity-70">
                      {article.nb_sorties} sorties
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold">
                    {article.quantite_sortie} {article.unite?.symbol || ""}
                  </p>
                  <ChevronRight className="h-4 w-4 inline opacity-70" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileStock;
