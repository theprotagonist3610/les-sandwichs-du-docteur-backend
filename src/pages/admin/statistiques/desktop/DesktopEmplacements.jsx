import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  Store,
  Users,
  Package,
  Search,
  CheckCircle,
  XCircle,
  Warehouse,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmplacementsAnalytics, EMPLACEMENT_TYPES } from "@/toolkits/admin/emplacementToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";

const DesktopEmplacements = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { stats, loading, error } = useEmplacementsAnalytics(30);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg opacity-70">{error || "Erreur de chargement"}</p>
      </div>
    );
  }

  // Filtrer les emplacements
  const filteredEmplacements = stats.liste_emplacements.filter((emp) => {
    const matchSearch =
      emp.denomination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.commune?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType === "all" || emp.type === filterType;
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" && emp.status) ||
      (filterStatus === "inactive" && !emp.status);

    return matchSearch && matchType && matchStatus;
  });

  // Préparer les données pour le donut chart (types)
  const typesDonutData = [
    {
      name: "Entrepôt",
      value: stats.emplacements_par_type[EMPLACEMENT_TYPES.ENTREPOT],
    },
    {
      name: "Point de vente",
      value: stats.emplacements_par_type[EMPLACEMENT_TYPES.POINT_DE_VENTE],
    },
    {
      name: "Stand",
      value: stats.emplacements_par_type[EMPLACEMENT_TYPES.STAND],
    },
  ].filter((item) => item.value > 0);

  const typesColors = ["#3b82f6", "#22c55e", "#f59e0b"];

  // Préparer les données pour le bar chart (distribution géographique)
  const geoData = stats.distribution_geographique.slice(0, 10).map((loc) => ({
    name: loc.commune,
    value: loc.count,
  }));

  // Icônes pour les types
  const getTypeIcon = (type) => {
    switch (type) {
      case EMPLACEMENT_TYPES.ENTREPOT:
        return <Warehouse className="h-4 w-4" />;
      case EMPLACEMENT_TYPES.POINT_DE_VENTE:
        return <Store className="h-4 w-4" />;
      case EMPLACEMENT_TYPES.STAND:
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MapPin className="h-8 w-8" />
          Gestion des Emplacements
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Analysez et optimisez vos emplacements pour maximiser la performance
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Emplacements"
          value={stats.total_emplacements}
          icon={<Store className="h-6 w-6" />}
          subtitle={`${stats.emplacements_actifs} actifs`}
        />

        <KPICard
          title="Avec Vendeur"
          value={stats.emplacements_avec_vendeur}
          icon={<Users className="h-6 w-6" />}
          subtitle={`${stats.emplacements_sans_vendeur} sans vendeur`}
        />

        <KPICard
          title="Avec Stock"
          value={stats.emplacements_avec_stock}
          icon={<Package className="h-6 w-6" />}
          subtitle={`${stats.total_emplacements - stats.emplacements_avec_stock} sans stock`}
        />

        <KPICard
          title="Valeur Stock Total"
          value={`${(stats.valeur_totale_stock / 1000).toFixed(0)}k`}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle="FCFA"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Répartition par Type
              <Badge variant="outline">{stats.total_emplacements}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typesDonutData.length > 0 ? (
              <SalesDonutChart data={typesDonutData} colors={typesColors} height={280} />
            ) : (
              <div className="text-center py-8 opacity-70">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution géographique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Distribution Géographique
              <Badge variant="outline">
                {stats.distribution_geographique.length} zones
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {geoData.length > 0 ? (
              <SalesBarChart data={geoData} xKey="name" yKey="value" height={280} />
            ) : (
              <div className="text-center py-8 opacity-70">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste des emplacements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Tous les Emplacements
            <Badge variant="outline">{filteredEmplacements.length}</Badge>
          </CardTitle>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-70" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value={EMPLACEMENT_TYPES.ENTREPOT}>Entrepôt</SelectItem>
                <SelectItem value={EMPLACEMENT_TYPES.POINT_DE_VENTE}>
                  Point de vente
                </SelectItem>
                <SelectItem value={EMPLACEMENT_TYPES.STAND}>Stand</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre par statut */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEmplacements.length > 0 ? (
              filteredEmplacements.map((emplacement) => (
                <div
                  key={emplacement.id}
                  className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/admin/statistiques/emplacements/${emplacement.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getTypeIcon(emplacement.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{emplacement.denomination}</p>
                          {emplacement.status ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs opacity-70">
                            {emplacement.commune} - {emplacement.departement}
                          </p>
                          {emplacement.theme && (
                            <Badge variant="outline" className="text-xs">
                              {emplacement.theme}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">{emplacement.vendeur}</p>
                      <p className="text-xs opacity-70">
                        {emplacement.nb_articles_stock} articles
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 opacity-70">
                Aucun emplacement trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zones prioritaires */}
      {stats.distribution_geographique.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Zones Prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.distribution_geographique.slice(0, 5).map((loc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-semibold">
                      {loc.commune}, {loc.departement}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {loc.emplacements.map((e) => e.denomination).join(", ")}
                    </p>
                  </div>
                  <Badge variant="outline">{loc.count} emplacements</Badge>
                </div>
              ))}
            </div>

            {/* Recommandations */}
            <div className="mt-6 p-4 rounded-lg border-l-4 border bg-opacity-10">
              <p className="font-semibold mb-2">💡 Recommandations</p>
              <ul className="text-sm opacity-90 space-y-1">
                {stats.emplacements_sans_vendeur > 0 && (
                  <li>
                    • {stats.emplacements_sans_vendeur} emplacement(s) sans vendeur assigné
                  </li>
                )}
                {stats.total_emplacements - stats.emplacements_avec_stock > 0 && (
                  <li>
                    • {stats.total_emplacements - stats.emplacements_avec_stock}{" "}
                    emplacement(s) sans stock
                  </li>
                )}
                {stats.emplacements_inactifs > 0 && (
                  <li>• {stats.emplacements_inactifs} emplacement(s) inactif(s)</li>
                )}
                {stats.distribution_geographique[0] && (
                  <li>
                    • Zone la plus dense: {stats.distribution_geographique[0].commune} (
                    {stats.distribution_geographique[0].count} emplacements)
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopEmplacements;
