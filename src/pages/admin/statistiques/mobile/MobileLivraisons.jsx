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
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStatistiquesLivraison, formatDayKey, formatMonthKey } from "@/toolkits/admin/livraisonStatistiquesToolkit";
import { useCommandes } from "@/toolkits/admin/commandeToolkit";
import { useAdresses } from "@/toolkits/admin/adresseToolkit";

const MobileLivraisons = () => {
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
        <Button onClick={refresh} className="mt-4" size="sm">
          Réessayer
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-sm opacity-70">Aucune donnée disponible</p>
      </div>
    );
  }

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

  // Export CSV
  const handleExportCSV = () => {
    if (!stats) return;

    const csvContent =
      `Statistiques Livraisons - ${period} - ${new Date().toLocaleDateString()}\n\n` +
      `DÉLAIS DE LIVRAISON\n` +
      `Délai moyen,${stats.delais.moyen} min\n` +
      `Délai médiane,${stats.delais.mediane} min\n\n` +
      `STATISTIQUES GLOBALES\n` +
      `Nombre total de livraisons,${stats.statistiquesGlobales.nombreTotalLivraisons}\n` +
      `Chiffre d'affaires,${stats.statistiquesGlobales.chiffreAffaire} FCFA\n` +
      `Taux de réussite,${stats.statistiquesGlobales.tauxLivraisonsTerminees}%\n\n` +
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

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="h-6 w-6" />
          Statistiques Livraison
        </h1>
        <p className="text-xs opacity-70 mt-1">{getPeriodLabel()}</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={refresh}>
          <TrendingUp className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Total</p>
              <Truck className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">
              {stats.statistiquesGlobales.nombreTotalLivraisons || 0}
            </p>
            <p className="text-xs opacity-70">
              {stats.statistiquesGlobales.nombreLivraisonsTerminees || 0} terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Délai Moyen</p>
              <Clock className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">{stats.delais.moyen || 0} min</p>
            <p className="text-xs opacity-70">Médiane: {stats.delais.mediane || 0} min</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Chiffre d'Affaires</p>
              <DollarSign className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">
              {((stats.statistiquesGlobales.chiffreAffaire || 0) / 1000).toFixed(0)}k
            </p>
            <p className="text-xs opacity-70">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Taux Réussite</p>
              <Package className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">
              {stats.statistiquesGlobales.tauxLivraisonsTerminees || 0}%
            </p>
            <p className="text-xs opacity-70">
              {stats.statistiquesGlobales.nombreLivraisonsEnCours || 0} en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI supplémentaire - Taux de retard */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 opacity-50" />
              <div>
                <p className="text-sm font-semibold">Taux de Retard</p>
                <p className="text-xs opacity-70">vs heure prévue</p>
              </div>
            </div>
            <p className="text-2xl font-bold">
              {stats.statistiquesGlobales.tauxLivraisonsEnRetard || 0}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Communes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Top Zones de Livraison
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
            <Input
              placeholder="Rechercher une commune..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            {filteredCommunes.length > 0 ? (
              filteredCommunes.map((zone, index) => (
                <div
                  key={zone.commune}
                  className="flex items-center justify-between p-3 border rounded-lg active:bg-accent"
                  onClick={() =>
                    navigate(
                      `/admin/statistiques/livraisons/commune-${zone.commune.toLowerCase().replace(/\s+/g, "-")}`
                    )
                  }
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{zone.commune}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {zone.arrondissements.length}
                        </Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs opacity-70">
                        <span>{zone.nombreLivraisons || 0} liv.</span>
                        <span>{((zone.montantTotal || 0) / 1000).toFixed(0)}k FCFA</span>
                        <span>{zone.delaiMoyen || 0} min</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0" />
                </div>
              ))
            ) : (
              <div className="text-center py-6 opacity-70 text-sm">
                {searchTerm ? "Aucune commune trouvée" : "Aucune donnée disponible"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs">📌 Légende</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1.5">
          <p>
            <strong>Délai moyen:</strong> Temps entre prise de commande et livraison
          </p>
          <p>
            <strong>Taux de réussite:</strong> % de livraisons terminées
          </p>
          <p>
            <strong>Taux de retard:</strong> % de livraisons après l'heure prévue
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileLivraisons;
