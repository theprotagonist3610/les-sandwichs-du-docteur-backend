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
  Home,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStatistiquesLivraison, formatMonthKey } from "@/toolkits/admin/livraisonStatistiquesToolkit";
import { useCommandes } from "@/toolkits/admin/commandeToolkit";
import { useAdresses } from "@/toolkits/admin/adresseToolkit";

const MobileLivraisonId = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");

  // Parser l'ID pour extraire le type et la valeur
  const { type, value } = useMemo(() => {
    if (!id) return { type: null, value: null };

    const parts = id.split("-");
    const typeVal = parts[0];
    const valueVal = parts.slice(1).join("-");

    return {
      type: typeVal,
      value: valueVal.replace(/-/g, " "),
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

  // Filtrer les sous-zones
  const sousZones = useMemo(() => {
    if (!zoneData || type !== "commune") return [];
    return zoneData.arrondissements || [];
  }, [zoneData, type]);

  const filteredSousZones = useMemo(() => {
    return sousZones.filter((zone) =>
      zone.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sousZones, searchTerm]);

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
          Erreur: {error || "Données non disponibles"}
        </p>
        <Button onClick={refresh} className="mt-4" size="sm">
          Réessayer
        </Button>
      </div>
    );
  }

  if (!zoneData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <MapPin className="h-12 w-12 opacity-50 mb-4" />
        <p className="text-sm opacity-70">Zone introuvable</p>
        <Button
          onClick={() => navigate("/admin/statistiques/livraisons")}
          className="mt-4"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/statistiques/livraisons")}
          size="sm"
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          {type === "commune" ? zoneData.commune : zoneData.arrondissement}
        </h1>
        <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
          <Home className="h-3 w-3" />
          Livraisons &gt;{" "}
          {type === "commune" ? zoneData.commune : `${zoneData.commune} > ${zoneData.arrondissement}`}
        </p>
      </div>

      {/* Actions */}
      <Button variant="outline" onClick={refresh} size="sm" className="w-full">
        <TrendingUp className="h-4 w-4 mr-2" />
        Actualiser
      </Button>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Livraisons</p>
              <Truck className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">{zoneData.nombreLivraisons}</p>
            <p className="text-xs opacity-70">Total pour cette zone</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">CA</p>
              <DollarSign className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">
              {(zoneData.montantTotal / 1000).toFixed(0)}k
            </p>
            <p className="text-xs opacity-70">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Délai Moyen</p>
              <Clock className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">{zoneData.delaiMoyen} min</p>
            <p className="text-xs opacity-70">Temps de livraison</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Ticket Moy.</p>
              <Package className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-xl font-bold">
              {zoneData.nombreLivraisons > 0
                ? Math.round(zoneData.montantTotal / zoneData.nombreLivraisons)
                : 0}
            </p>
            <p className="text-xs opacity-70">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Arrondissements (seulement pour les communes) */}
      {type === "commune" && sousZones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Arrondissements de {zoneData.commune}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              {filteredSousZones.length > 0 ? (
                filteredSousZones.map((zone, index) => (
                  <div
                    key={zone.nom}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{zone.nom}</h3>
                        <p className="text-xs opacity-70">
                          {((zone.count / zoneData.nombreLivraisons) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{zone.count}</p>
                      <p className="text-xs opacity-70">livraisons</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 opacity-70 text-sm">
                  {searchTerm ? "Aucun résultat" : "Aucun arrondissement"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs">📍 À propos</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1.5">
          {type === "commune" && (
            <>
              <p>
                <strong>Commune:</strong> {zoneData.commune}
              </p>
              <p>
                <strong>Arrondissements:</strong> {sousZones.length}
              </p>
              <p>
                <strong>Part du total:</strong>{" "}
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
                <strong>Part du total:</strong>{" "}
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

export default MobileLivraisonId;
