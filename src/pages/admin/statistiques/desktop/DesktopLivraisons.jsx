import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Truck,
  Clock,
  MapPin,
  TrendingUp,
  Calendar,
  Download,
  Search,
  Package,
  DollarSign,
  BarChart3,
  Navigation,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useStatistiquesLivraison, formatDayKey, formatMonthKey } from "@/toolkits/admin/livraisonStatistiquesToolkit";
import { useCommandes } from "@/toolkits/admin/commandeToolkit";
import { useAdresses } from "@/toolkits/admin/adresseToolkit";
import KPICard from "@/components/statistics/cards/KPICard";

const DesktopLivraisons = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");

  // Récupérer les caches
  const { commandes } = useCommandes();
  const { adresses } = useAdresses();

  // Calculer la période
  const periode = useMemo(() => {
    const now = new Date();
    if (period === "today") {
      return formatDayKey(now);
    } else if (period === "month") {
      return formatMonthKey(now);
    }
    // Pour la semaine, on utilise le mois courant et on filtrera après
    return formatMonthKey(now);
  }, [period]);

  // Récupérer les statistiques
  const { stats, loading, error, refresh } = useStatistiquesLivraison(
    periode,
    commandes,
    adresses
  );

  // Filtrer les communes selon la recherche (calculé même pendant le chargement)
  const filteredCommunes = useMemo(() => {
    if (!stats || !stats.zones || !stats.zones.parCommune) return [];
    return stats.zones.parCommune.filter((zone) =>
      zone.commune.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stats, searchTerm]);

  // Préparer les données pour le graphique des délais par tranche horaire
  const delaisParTrancheData = useMemo(() => {
    if (!stats || !stats.delais || !stats.delais.parTrancheHoraire) return [];
    return stats.delais.parTrancheHoraire.map((item) => ({
      heure: item.heure,
      delai: item.delaiMoyen,
      livraisons: item.nombreLivraisons,
    }));
  }, [stats]);

  // Préparer les données pour le graphique des horaires courtants
  const horairesData = useMemo(() => {
    if (!stats || !stats.horairesCourtants) return [];

    // Combiner les commandes et livraisons
    const horaireMap = new Map();

    stats.horairesCourtants.commandes.forEach((item) => {
      horaireMap.set(item.heure, {
        heure: item.heure,
        commandes: item.count,
        livraisons: 0,
      });
    });

    stats.horairesCourtants.livraisons.forEach((item) => {
      if (horaireMap.has(item.heure)) {
        horaireMap.get(item.heure).livraisons = item.count;
      } else {
        horaireMap.set(item.heure, {
          heure: item.heure,
          commandes: 0,
          livraisons: item.count,
        });
      }
    });

    return Array.from(horaireMap.values()).sort((a, b) =>
      a.heure.localeCompare(b.heure)
    );
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg">Chargement des statistiques de livraison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg opacity-70">Erreur: {error}</p>
        <Button onClick={refresh} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg opacity-70">Aucune donnée disponible</p>
      </div>
    );
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!stats) return;

    const csvContent =
      `Statistiques Livraisons - ${period} - ${new Date().toLocaleDateString()}\n\n` +
      `DÉLAIS DE LIVRAISON\n` +
      `Délai moyen,${stats.delais.moyen} min\n` +
      `Délai médiane,${stats.delais.mediane} min\n` +
      `Délai minimum,${stats.delais.min} min\n` +
      `Délai maximum,${stats.delais.max} min\n\n` +
      `STATISTIQUES GLOBALES\n` +
      `Nombre total de livraisons,${stats.statistiquesGlobales.nombreTotalLivraisons}\n` +
      `Livraisons terminées,${stats.statistiquesGlobales.nombreLivraisonsTerminees}\n` +
      `Livraisons en cours,${stats.statistiquesGlobales.nombreLivraisonsEnCours}\n` +
      `Chiffre d'affaires,${stats.statistiquesGlobales.chiffreAffaire} FCFA\n` +
      `Taux de livraisons terminées,${stats.statistiquesGlobales.tauxLivraisonsTerminees}%\n` +
      `Taux de retard,${stats.statistiquesGlobales.tauxLivraisonsEnRetard}%\n\n` +
      `TOP COMMUNES\n` +
      `Rang,Commune,Nombre de livraisons,Montant total (FCFA),Délai moyen (min)\n` +
      stats.zones.parCommune
        .slice(0, 10)
        .map(
          (zone, index) =>
            `${index + 1},${zone.commune},${zone.nombreLivraisons},${zone.montantTotal},${zone.delaiMoyen}`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_livraisons_${period}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Aujourd'hui";
      case "week":
        return "Cette semaine";
      case "month":
        return "Ce mois";
      default:
        return "Aujourd'hui";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8" />
            Statistiques de Livraison
          </h1>
          <p className="text-sm opacity-70 mt-1">
            {getPeriodLabel()} · Analyse des délais et zones de livraison
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
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Button variant="outline" onClick={refresh}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Livraisons"
          value={stats.statistiquesGlobales.nombreTotalLivraisons}
          icon={<Truck className="h-6 w-6" />}
          subtitle={`${stats.statistiquesGlobales.nombreLivraisonsTerminees} terminées`}
        />

        <KPICard
          title="Délai Moyen"
          value={`${stats.delais.moyen} min`}
          icon={<Clock className="h-6 w-6" />}
          subtitle={`Médiane: ${stats.delais.mediane} min`}
        />

        <KPICard
          title="Chiffre d'Affaires"
          value={`${(stats.statistiquesGlobales.chiffreAffaire / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-6 w-6" />}
          subtitle="FCFA"
        />

        <KPICard
          title="Taux de Réussite"
          value={`${stats.statistiquesGlobales.tauxLivraisonsTerminees}%`}
          icon={<Package className="h-6 w-6" />}
          subtitle={`${stats.statistiquesGlobales.nombreLivraisonsEnCours} en cours`}
        />

        <KPICard
          title="Taux de Retard"
          value={`${stats.statistiquesGlobales.tauxLivraisonsEnRetard}%`}
          icon={<Clock className="h-6 w-6" />}
          subtitle="vs heure prévue"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Délais par tranche horaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Délais Moyens par Tranche Horaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            {delaisParTrancheData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={delaisParTrancheData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="heure"
                    stroke="#6b7280"
                    style={{ fontSize: "11px" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                    label={{ value: "Minutes", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="delai" fill="#3b82f6" name="Délai moyen (min)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 opacity-70">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution horaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribution Horaire (Commandes vs Livraisons)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {horairesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={horairesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="heure"
                    stroke="#6b7280"
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="commandes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Commandes reçues"
                  />
                  <Line
                    type="monotone"
                    dataKey="livraisons"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Livraisons effectuées"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 opacity-70">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Communes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Zones de Livraison par Commune
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
              <Input
                placeholder="Rechercher une commune..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCommunes.length > 0 ? (
              filteredCommunes.map((zone, index) => (
                <div
                  key={zone.commune}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/statistiques/livraisons/commune-${zone.commune.toLowerCase().replace(/\s+/g, '-')}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{zone.commune}</h3>
                        <Badge variant="secondary">
                          {zone.arrondissements.length} arrondissement
                          {zone.arrondissements.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-70 mt-1">
                        Top: {zone.arrondissements.slice(0, 3).map((a) => a.nom).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="opacity-70">Livraisons</p>
                      <p className="font-bold text-lg">{zone.nombreLivraisons}</p>
                    </div>
                    <div className="text-center">
                      <p className="opacity-70">CA (FCFA)</p>
                      <p className="font-bold text-lg">
                        {(zone.montantTotal / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="opacity-70">Délai moy.</p>
                      <p className="font-bold text-lg">{zone.delaiMoyen} min</p>
                    </div>
                    <Navigation className="h-5 w-5 opacity-50" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 opacity-70">
                {searchTerm
                  ? "Aucune commune trouvée"
                  : "Aucune donnée de livraison disponible"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Légende des indicateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📌 Légende des indicateurs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Délai moyen/médiane:</strong> Temps écoulé entre la prise de commande et la
            livraison effective
          </p>
          <p>
            <strong>Taux de réussite:</strong> Pourcentage de livraisons terminées sur le total des
            commandes à livrer
          </p>
          <p>
            <strong>Taux de retard:</strong> Pourcentage de livraisons effectuées après l'heure
            prévue
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopLivraisons;
