import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DollarSign,
  ShoppingCart as ShoppingCartIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmplacementsAnalytics, EMPLACEMENT_TYPES } from "@/toolkits/admin/emplacementToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";

const MobileEmplacements = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { stats, loading, error } = useEmplacementsAnalytics(30);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-sm text-center">Chargement...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-sm opacity-70 text-center">
          {error || "Erreur de chargement"}
        </p>
      </div>
    );
  }

  // Filtrer les emplacements
  const filteredEmplacements = stats.liste_emplacements.filter((emp) => {
    const matchSearch =
      emp.denomination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.commune?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
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

  // Icônes pour les types
  const getTypeIcon = (type) => {
    switch (type) {
      case EMPLACEMENT_TYPES.ENTREPOT:
        return <Warehouse className="h-3 w-3" />;
      case EMPLACEMENT_TYPES.POINT_DE_VENTE:
        return <Store className="h-3 w-3" />;
      case EMPLACEMENT_TYPES.STAND:
        return <ShoppingBag className="h-3 w-3" />;
      default:
        return <MapPin className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Emplacements
        </h1>
        <p className="text-xs opacity-70 mt-1">
          Optimisez vos emplacements
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Emplacements"
          value={stats.total_emplacements}
          icon={<Store className="h-5 w-5" />}
          subtitle={`${stats.emplacements_actifs} actifs`}
        />

        <KPICard
          title="Ventes"
          value={`${(stats.total_ventes_tous_emplacements / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="FCFA"
        />

        <KPICard
          title="Commandes"
          value={stats.total_commandes_tous_emplacements}
          icon={<ShoppingCartIcon className="h-5 w-5" />}
          subtitle="total"
        />

        <KPICard
          title="Valeur Stock"
          value={`${(stats.valeur_totale_stock / 1000).toFixed(0)}k`}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="FCFA"
        />
      </div>

      {/* Répartition par type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Répartition par Type
            <Badge variant="outline" className="text-xs">{stats.total_emplacements}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typesDonutData.length > 0 ? (
            <SalesDonutChart data={typesDonutData} colors={typesColors} height={200} />
          ) : (
            <div className="text-center py-6 opacity-70 text-sm">
              Aucune donnée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des emplacements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Emplacements
            <Badge variant="outline" className="text-xs">{filteredEmplacements.length}</Badge>
          </CardTitle>

          {/* Recherche */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-70" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredEmplacements.length > 0 ? (
              filteredEmplacements.slice(0, 20).map((emplacement) => (
                <div
                  key={emplacement.id}
                  className="p-3 rounded-lg border active:scale-95 transition-transform"
                  onClick={() => navigate(`/admin/statistiques/emplacements/${emplacement.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getTypeIcon(emplacement.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">
                            {emplacement.denomination}
                          </p>
                          {emplacement.status ? (
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs opacity-70 truncate mt-1">
                          {emplacement.commune}
                        </p>
                        {emplacement.theme && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {emplacement.theme}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-green-600">
                        {(emplacement.total_ventes / 1000).toFixed(1)}k
                      </p>
                      <p className="text-xs opacity-70">{emplacement.nombre_commandes} cmd</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 opacity-70 text-sm">
                Aucun emplacement
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Emplacements par Ventes */}
      {stats.top_emplacements_ventes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Top Ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.top_emplacements_ventes.slice(0, 5).map((emplacement, idx) => (
                <div
                  key={emplacement.id}
                  className="flex items-center justify-between p-2 rounded border text-xs active:scale-95 transition-transform"
                  onClick={() => navigate(`/admin/statistiques/emplacements/${emplacement.id}`)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{emplacement.denomination}</p>
                      <p className="opacity-70 mt-1">
                        {emplacement.nombre_commandes} cmd
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600">
                      {(emplacement.total_ventes / 1000).toFixed(1)}k
                    </p>
                    <p className="opacity-70">FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones prioritaires */}
      {stats.distribution_geographique.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zones Prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.distribution_geographique.slice(0, 3).map((loc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded border text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {loc.commune}
                    </p>
                    <p className="opacity-70 mt-1 truncate">
                      {loc.emplacements[0]?.denomination}
                      {loc.emplacements.length > 1 && ` +${loc.emplacements.length - 1}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {loc.count}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Recommandations */}
            <div className="mt-4 p-3 rounded border-l-4 border text-xs">
              <p className="font-semibold mb-2">💡 Recommandations</p>
              <ul className="opacity-90 space-y-1">
                {stats.emplacements_sans_vendeur > 0 && (
                  <li>• {stats.emplacements_sans_vendeur} sans vendeur</li>
                )}
                {stats.total_emplacements - stats.emplacements_avec_stock > 0 && (
                  <li>
                    • {stats.total_emplacements - stats.emplacements_avec_stock} sans stock
                  </li>
                )}
                {stats.emplacements_inactifs > 0 && (
                  <li>• {stats.emplacements_inactifs} inactif(s)</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileEmplacements;
