import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Truck,
  Clock,
  MapPin,
  ArrowLeft,
  DollarSign,
  Package,
  TrendingUp,
  Search,
  Navigation2,
  Home,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStatistiquesLivraison, formatMonthKey } from "@/toolkits/admin/livraisonStatistiquesToolkit";
import { useCommandes } from "@/toolkits/admin/commandeToolkit";
import { useAdresses } from "@/toolkits/admin/adresseToolkit";
import KPICard from "@/components/statistics/cards/KPICard";

const DesktopLivraisonId = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");

  // Parser l'ID pour extraire le type et la valeur
  // Format: "commune-cotonou" ou "arrondissement-1er"
  const { type, value } = useMemo(() => {
    if (!id) return { type: null, value: null };

    const parts = id.split("-");
    const typeVal = parts[0]; // "commune" ou "arrondissement"
    const valueVal = parts.slice(1).join("-"); // Le reste rejoint avec "-"

    return {
      type: typeVal,
      value: valueVal.replace(/-/g, " "), // Remplacer les tirets par des espaces
    };
  }, [id]);

  // Récupérer les données
  const { commandes } = useCommandes();
  const { adresses } = useAdresses();

  const periode = useMemo(() => formatMonthKey(new Date()), []);

  const { stats, loading, error, refresh } = useStatistiquesLivraison(
    periode,
    commandes,
    adresses
  );

  // Trouver les données de la zone spécifique
  const zoneData = useMemo(() => {
    if (!stats || !type || !value) return null;

    if (type === "commune") {
      return stats.zones.parCommune.find(
        (z) => z.commune.toLowerCase() === value.toLowerCase()
      );
    }

    if (type === "arrondissement") {
      return stats.zones.parArrondissement.find(
        (z) => z.arrondissement.toLowerCase() === value.toLowerCase()
      );
    }

    return null;
  }, [stats, type, value]);

  // Filtrer les sous-zones (arrondissements si c'est une commune)
  const sousZones = useMemo(() => {
    if (!zoneData || type !== "commune") return [];

    return zoneData.arrondissements || [];
  }, [zoneData, type]);

  const filteredSousZones = sousZones.filter((zone) =>
    zone.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Préparer les données pour le graphique des arrondissements
  const arrondissementsChartData = useMemo(() => {
    if (!sousZones || sousZones.length === 0) return [];

    return sousZones
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        nom: item.nom,
        livraisons: item.count,
      }));
  }, [sousZones]);

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
        <p className="text-lg opacity-70">Erreur: {error || "Données non disponibles"}</p>
        <Button onClick={refresh} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  if (!zoneData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <MapPin className="h-16 w-16 opacity-50 mb-4" />
        <p className="text-lg opacity-70">Zone introuvable</p>
        <Button onClick={() => navigate("/admin/statistiques/livraisons")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux statistiques
        </Button>
      </div>
    );
  }

  // Breadcrumb
  const breadcrumb = () => {
    if (type === "commune") {
      return `${zoneData.commune}`;
    }
    if (type === "arrondissement") {
      return `${zoneData.commune} > ${zoneData.arrondissement}`;
    }
    return "";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header avec breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/statistiques/livraisons")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux statistiques
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="h-8 w-8" />
            {type === "commune" ? zoneData.commune : zoneData.arrondissement}
          </h1>
          <p className="text-sm opacity-70 mt-1">
            <Home className="inline h-3 w-3 mr-1" />
            Livraisons &gt; {breadcrumb()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refresh}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs de la zone */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Nombre de Livraisons"
          value={zoneData.nombreLivraisons}
          icon={<Truck className="h-6 w-6" />}
          subtitle="Total pour cette zone"
        />

        <KPICard
          title="Chiffre d'Affaires"
          value={`${(zoneData.montantTotal / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-6 w-6" />}
          subtitle="FCFA"
        />

        <KPICard
          title="Délai Moyen"
          value={`${zoneData.delaiMoyen} min`}
          icon={<Clock className="h-6 w-6" />}
          subtitle="Temps de livraison"
        />

        <KPICard
          title="Ticket Moyen"
          value={`${zoneData.nombreLivraisons > 0 ? Math.round(zoneData.montantTotal / zoneData.nombreLivraisons) : 0}`}
          icon={<Package className="h-6 w-6" />}
          subtitle="FCFA par livraison"
        />
      </div>

      {/* Graphique des arrondissements (seulement pour les communes) */}
      {type === "commune" && arrondissementsChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation2 className="h-5 w-5" />
              Distribution par Arrondissement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={arrondissementsChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis
                  dataKey="nom"
                  type="category"
                  stroke="#6b7280"
                  style={{ fontSize: "11px" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="livraisons" fill="#22c55e" name="Nombre de livraisons" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Liste des arrondissements (seulement pour les communes) */}
      {type === "commune" && sousZones.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Navigation2 className="h-5 w-5" />
                Arrondissements de {zoneData.commune}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  placeholder="Rechercher un arrondissement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSousZones.length > 0 ? (
                filteredSousZones.map((zone, index) => (
                  <div
                    key={zone.nom}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{zone.nom}</h3>
                        <p className="text-sm opacity-70 mt-1">
                          {((zone.count / zoneData.nombreLivraisons) * 100).toFixed(1)}% des
                          livraisons de {zoneData.commune}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="opacity-70">Livraisons</p>
                        <p className="font-bold text-lg">{zone.count}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-70">
                  {searchTerm
                    ? "Aucun arrondissement trouvé"
                    : "Aucun arrondissement disponible"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info complémentaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📍 À propos de cette zone</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {type === "commune" && (
            <>
              <p>
                <strong>Commune:</strong> {zoneData.commune}
              </p>
              <p>
                <strong>Nombre d'arrondissements:</strong> {sousZones.length}
              </p>
              <p>
                <strong>Part des livraisons totales:</strong>{" "}
                {stats.statistiquesGlobales.nombreTotalLivraisons > 0
                  ? (
                      (zoneData.nombreLivraisons /
                        stats.statistiquesGlobales.nombreTotalLivraisons) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </>
          )}
          {type === "arrondissement" && (
            <>
              <p>
                <strong>Commune:</strong> {zoneData.commune}
              </p>
              <p>
                <strong>Arrondissement:</strong> {zoneData.arrondissement}
              </p>
              <p>
                <strong>Part des livraisons totales:</strong>{" "}
                {stats.statistiquesGlobales.nombreTotalLivraisons > 0
                  ? (
                      (zoneData.nombreLivraisons /
                        stats.statistiquesGlobales.nombreTotalLivraisons) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopLivraisonId;
