/**
 * DesktopDashboard.jsx
 * Dashboard global du stock et emplacements
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStockElements } from "@/toolkits/admin/stockToolkit";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  MapPin,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DesktopDashboard = () => {
  const navigate = useNavigate();
  const { elements, loading: loadingElements, refetch: refetchElements } = useStockElements({});
  const { emplacements, loading: loadingEmplacements, refetch: refetchEmplacements } = useEmplacements({});

  const loading = loadingElements || loadingEmplacements;

  // Calculer les KPIs
  const kpis = useMemo(() => {
    const elementsActifs = elements.filter((e) => e.status);
    const emplacementsActifs = emplacements.filter((e) => e.status);
    const elementsEnAlerte = elements.filter((e) => e.quantite_actuelle < e.seuil_alerte);

    const valeurTotale = elements.reduce(
      (sum, e) => sum + e.quantite_actuelle * (e.prix_unitaire || 0),
      0
    );

    return {
      totalElements: elements.length,
      elementsActifs: elementsActifs.length,
      totalEmplacements: emplacements.length,
      emplacementsActifs: emplacementsActifs.length,
      elementsEnAlerte: elementsEnAlerte.length,
      valeurTotale,
    };
  }, [elements, emplacements]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  const handleRefresh = async () => {
    await Promise.all([refetchElements(), refetchEmplacements()]);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Stock</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la gestion de stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => navigate("/admin/stock/operations/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle opération
          </Button>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Éléments de Stock</p>
                <p className="text-3xl font-bold text-blue-900">{kpis.totalElements}</p>
                <p className="text-xs text-blue-600">{kpis.elementsActifs} actifs</p>
              </div>
              <Package className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Emplacements</p>
                <p className="text-3xl font-bold text-purple-900">{kpis.totalEmplacements}</p>
                <p className="text-xs text-purple-600">{kpis.emplacementsActifs} actifs</p>
              </div>
              <MapPin className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Alertes Stock</p>
                <p className="text-3xl font-bold text-red-900">{kpis.elementsEnAlerte}</p>
                <p className="text-xs text-red-600">Articles à réapprovisionner</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Valeur Totale</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatMontant(kpis.valeurTotale)}
                </p>
                <p className="text-xs text-green-600">FCFA</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles à réapprovisionner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Articles à réapprovisionner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kpis.elementsEnAlerte === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tous les articles sont correctement approvisionnés
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elements
                .filter((e) => e.quantite_actuelle < e.seuil_alerte)
                .slice(0, 6)
                .map((element) => (
                  <Card
                    key={element.id}
                    className="border-red-300 cursor-pointer hover:shadow-md"
                    onClick={() => navigate(`/admin/stock/elements/${element.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-sm line-clamp-1 flex-1">
                          {element.denomination}
                        </p>
                        <Badge variant="destructive" className="text-[10px]">
                          Alerte
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{element.type}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Stock:</span>
                        <span className="text-base font-bold text-red-600">
                          {element.quantite_actuelle} {element.unite?.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-muted-foreground">Seuil:</span>
                        <span>
                          {element.seuil_alerte} {element.unite?.symbol}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/stock/elements")}>
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-blue-600" />
            <p className="font-semibold mb-1">Éléments de Stock</p>
            <p className="text-sm text-muted-foreground">Gérer les articles</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/stock/emplacements")}>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-purple-600" />
            <p className="font-semibold mb-1">Emplacements</p>
            <p className="text-sm text-muted-foreground">Gérer les lieux de stockage</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/stock/operations/create")}>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <p className="font-semibold mb-1">Opérations</p>
            <p className="text-sm text-muted-foreground">Entrées, sorties, transferts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopDashboard;
