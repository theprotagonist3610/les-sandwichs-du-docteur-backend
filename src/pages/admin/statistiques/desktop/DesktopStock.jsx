import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStockAnalytics, useStockElements, STOCK_TYPES } from "@/toolkits/admin/stockToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
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
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Download,
  Lightbulb,
  AlertCircle,
  ChevronRight,
  ShoppingCart,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const DesktopStock = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");

  const daysCount = parseInt(period);
  const { stats, loading, error } = useStockAnalytics(daysCount);
  const { elements, loading: loadingElements } = useStockElements();

  // Formater les données pour l'export CSV
  const exportCSV = () => {
    if (!stats) return;

    const rows = [
      ["Statistiques de Stock", `Période: ${period} jours`],
      [],
      ["Vue d'ensemble"],
      ["Total Articles", stats.total_articles],
      ["Articles en Alerte", stats.articles_en_alerte],
      ["Articles en Rupture", stats.articles_en_rupture],
      ["Valeur Totale Stock", `${stats.valeur_totale_stock.toFixed(0)} FCFA`],
      [],
      ["Articles par Type"],
      ["Ingrédients", stats.articles_par_type[STOCK_TYPES.INGREDIENT]],
      ["Consommables", stats.articles_par_type[STOCK_TYPES.CONSOMMABLE]],
      ["Périssables", stats.articles_par_type[STOCK_TYPES.PERISSABLE]],
      ["Matériel", stats.articles_par_type[STOCK_TYPES.MATERIEL]],
      ["Emballage", stats.articles_par_type[STOCK_TYPES.EMBALLAGE]],
      [],
      ["Top 10 Consommation"],
      ["Article", "Quantité Sortie", "Nb Sorties", "Stock Actuel", "Seuil"],
    ];

    stats.top_consommation.forEach((item) => {
      rows.push([
        item.denomination,
        `${item.quantite_sortie} ${item.unite?.symbol || ""}`,
        item.nb_sorties,
        `${item.quantite_actuelle} ${item.unite?.symbol || ""}`,
        `${item.seuil_alerte} ${item.unite?.symbol || ""}`,
      ]);
    });

    rows.push([]);
    rows.push(["Articles Critiques"]);
    rows.push(["Article", "Statut", "Stock Actuel", "Jours avant Rupture", "Consommation/Jour"]);

    stats.articles_critiques.forEach((item) => {
      rows.push([
        item.denomination,
        item.statut,
        `${item.quantite_actuelle} ${item.unite?.symbol || ""}`,
        item.jours_avant_rupture || "N/A",
        `${item.consommation_moyenne_jour} ${item.unite?.symbol || ""}`,
      ]);
    });

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_stock_${period}j.csv`;
    link.click();
  };

  const periodLabel = `${period} derniers jours`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement des statistiques de stock...</div>
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  // Données pour le graphique donut des types
  const typesDonutData = [
    { name: "Ingrédients", value: stats.articles_par_type[STOCK_TYPES.INGREDIENT] },
    { name: "Consommables", value: stats.articles_par_type[STOCK_TYPES.CONSOMMABLE] },
    { name: "Périssables", value: stats.articles_par_type[STOCK_TYPES.PERISSABLE] },
    { name: "Matériel", value: stats.articles_par_type[STOCK_TYPES.MATERIEL] },
    { name: "Emballage", value: stats.articles_par_type[STOCK_TYPES.EMBALLAGE] },
  ].filter((item) => item.value > 0);

  // Couleurs distinctes pour chaque type
  const typesColors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Filtrer les articles selon la recherche
  const filteredElements = elements.filter((element) =>
    element.denomination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Badge de statut pour les articles critiques
  const getStatutBadge = (statut) => {
    if (statut === "rupture") {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (statut === "critique") {
      return <Badge variant="destructive" className="opacity-70">Critique</Badge>;
    } else {
      return <Badge variant="outline">Alerte</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistiques de Stock</h1>
          <p className="opacity-70 mt-1">
            Gestion et analyse de l'évolution du stock
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="60">60 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Articles"
          value={stats.total_articles}
          icon={<Package className="h-6 w-6" />}
          subtitle={periodLabel}
        />

        <KPICard
          title="Alertes"
          value={stats.articles_en_alerte}
          icon={<AlertTriangle className="h-6 w-6" />}
          subtitle={`${((stats.articles_en_alerte / stats.total_articles) * 100).toFixed(1)}% du stock`}
        />

        <KPICard
          title="Ruptures"
          value={stats.articles_en_rupture}
          icon={<TrendingDown className="h-6 w-6" />}
          subtitle="Stock épuisé"
        />

        <KPICard
          title="Valeur Stock"
          value={`${(stats.valeur_totale_stock / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-6 w-6" />}
          subtitle="FCFA"
        />
      </div>

      {/* Alertes critiques */}
      {stats.articles_critiques.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Attention:</strong> {stats.articles_critiques.length} article(s) en situation critique.{" "}
            {stats.articles_en_rupture > 0 && (
              <>
                <strong>{stats.articles_en_rupture} rupture(s)</strong> de stock nécessitent un réapprovisionnement immédiat.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Graphiques d'évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution des transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Évolution des Mouvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart
              data={stats.evolution_stock.map((d) => ({
                ...d,
                entrees: d.nb_entrees,
                sorties: d.nb_sorties,
              }))}
              xKey="date"
              yKey="sorties"
              height={280}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-sm opacity-70">Total Entrées</p>
                <p className="text-lg font-bold">
                  {stats.evolution_stock.reduce((sum, d) => sum + d.nb_entrees, 0)}
                </p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-sm opacity-70">Total Sorties</p>
                <p className="text-lg font-bold">
                  {stats.evolution_stock.reduce((sum, d) => sum + d.nb_sorties, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Répartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesDonutChart data={typesDonutData} colors={typesColors} height={280} />
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
      </div>

      {/* Articles critiques */}
      {stats.articles_critiques.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Articles en Situation Critique
              <Badge variant="outline">{stats.articles_critiques.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.articles_critiques.slice(0, 10).map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
                  onClick={() => navigate(`/admin/statistiques/stock/${article.id}`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
                      <Package className="h-5 w-5 opacity-70" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{article.denomination}</p>
                        {getStatutBadge(article.statut)}
                      </div>
                      <p className="text-sm opacity-70">
                        Stock: {article.quantite_actuelle} {article.unite?.symbol || ""} •
                        Consommation: {article.consommation_moyenne_jour} {article.unite?.symbol || ""}/jour
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {article.jours_avant_rupture !== null ? (
                      <>
                        <p className="text-lg font-bold">
                          {article.jours_avant_rupture} j
                        </p>
                        <p className="text-xs opacity-70">avant rupture</p>
                      </>
                    ) : (
                      <p className="text-lg font-bold">RUPTURE</p>
                    )}
                    <ChevronRight className="h-5 w-5 ml-2 inline opacity-70" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top consommation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Top 10 Consommation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.top_consommation.map((article, index) => (
              <div
                key={article.id}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate(`/admin/statistiques/stock/${article.id}`)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
                    <Package className="h-5 w-5 opacity-70" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{article.denomination}</p>
                    <p className="text-sm opacity-70">
                      {article.nb_sorties} sorties • Stock: {article.quantite_actuelle} {article.unite?.symbol || ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {article.quantite_sortie} {article.unite?.symbol || ""}
                  </p>
                  <p className="text-xs opacity-70">sortis</p>
                  <ChevronRight className="h-5 w-5 ml-2 inline opacity-70" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tous les Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tous les Articles
            <Badge variant="outline">{filteredElements.length}</Badge>
          </CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-70" />
            <Input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredElements.length === 0 ? (
              <div className="text-center p-8 opacity-70">
                Aucun article trouvé
              </div>
            ) : (
              filteredElements.map((article) => {
                // Déterminer le statut de l'article
                const quantite = article.quantite_actuelle || 0;
                const seuil = article.seuil_alerte || 0;
                let statut = null;

                if (quantite === 0) {
                  statut = "rupture";
                } else if (seuil > 0 && quantite <= seuil) {
                  statut = "alerte";
                }

                return (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
                    onClick={() => navigate(`/admin/statistiques/stock/${article.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
                        <Package className="h-5 w-5 opacity-70" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{article.denomination}</p>
                          {statut && getStatutBadge(statut)}
                          <Badge variant="outline" className="text-xs">
                            {article.type}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-70">
                          Stock: {quantite} {article.unite?.symbol || ""} •
                          Prix: {(article.prix_unitaire || 0).toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 opacity-70" />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.articles_en_rupture > 0 && (
              <div className="p-3 border rounded-lg">
                <p className="font-medium">Réapprovisionnement Urgent</p>
                <p className="text-sm opacity-70 mt-1">
                  <strong>{stats.articles_en_rupture} article(s)</strong> sont en rupture de stock.
                  Réapprovisionner immédiatement pour éviter les interruptions de service.
                </p>
              </div>
            )}

            {stats.articles_critiques.filter((a) => a.statut === "critique").length > 0 && (
              <div className="p-3 border rounded-lg">
                <p className="font-medium">Commandes Prioritaires</p>
                <p className="text-sm opacity-70 mt-1">
                  <strong>
                    {stats.articles_critiques.filter((a) => a.statut === "critique").length} article(s)
                  </strong>{" "}
                  atteindront la rupture dans moins de 7 jours. Préparez vos commandes dès maintenant.
                </p>
              </div>
            )}

            {stats.articles_en_alerte > 0 && (
              <div className="p-3 border rounded-lg">
                <p className="font-medium">Surveillance des Seuils</p>
                <p className="text-sm opacity-70 mt-1">
                  <strong>{stats.articles_en_alerte} article(s)</strong> ont atteint leur seuil d'alerte.
                  Surveillez l'évolution de la consommation et anticipez les besoins.
                </p>
              </div>
            )}

            <div className="p-3 border rounded-lg">
              <p className="font-medium">Optimisation des Achats</p>
              <p className="text-sm opacity-70 mt-1">
                Cliquez sur chaque article pour voir l'historique des prix et identifier les meilleures périodes d'approvisionnement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopStock;
