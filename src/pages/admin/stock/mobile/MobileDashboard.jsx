/**
 * MobileDashboard.jsx
 * Version mobile du dashboard stock
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStockElements } from "@/toolkits/admin/stockToolkit";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  MapPin,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { elements, loading: loadingElements, refetch: refetchElements } = useStockElements({});
  const { emplacements, loading: loadingEmplacements, refetch: refetchEmplacements } = useEmplacements({});

  const loading = loadingElements || loadingEmplacements;

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
      <div className="p-4 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard Stock</h1>
            <p className="text-xs text-muted-foreground">Vue d'ensemble</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => navigate("/admin/stock/operations/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle opération
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <Package className="h-6 w-6 text-blue-600 mb-2" />
                <p className="text-[10px] text-blue-700">Éléments</p>
                <p className="text-xl font-bold text-blue-900">{kpis.totalElements}</p>
                <p className="text-[10px] text-blue-600">{kpis.elementsActifs} actifs</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4 pb-4">
                <MapPin className="h-6 w-6 text-purple-600 mb-2" />
                <p className="text-[10px] text-purple-700">Emplacements</p>
                <p className="text-xl font-bold text-purple-900">{kpis.totalEmplacements}</p>
                <p className="text-[10px] text-purple-600">{kpis.emplacementsActifs} actifs</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4 pb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
                <p className="text-[10px] text-red-700">Alertes</p>
                <p className="text-xl font-bold text-red-900">{kpis.elementsEnAlerte}</p>
                <p className="text-[10px] text-red-600">À réapprovisionner</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4 pb-4">
                <DollarSign className="h-6 w-6 text-green-600 mb-2" />
                <p className="text-[10px] text-green-700">Valeur</p>
                <p className="text-base font-bold text-green-900">
                  {formatMontant(kpis.valeurTotale)}
                </p>
                <p className="text-[10px] text-green-600">FCFA</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertes */}
          {kpis.elementsEnAlerte > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  À réapprovisionner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {elements
                  .filter((e) => e.quantite_actuelle < e.seuil_alerte)
                  .slice(0, 3)
                  .map((element) => (
                    <Card
                      key={element.id}
                      className="border-red-200 cursor-pointer"
                      onClick={() => navigate(`/admin/stock/elements/${element.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-xs line-clamp-1 flex-1">
                            {element.denomination}
                          </p>
                          <Badge variant="destructive" className="text-[10px]">
                            Alerte
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-1">{element.type}</p>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Stock:</span>
                          <span className="font-bold text-red-600">
                            {element.quantite_actuelle} / {element.seuil_alerte}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Accès rapides */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Accès rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/stock/elements")}
              >
                <Package className="h-4 w-4 mr-2" />
                Éléments de Stock
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/stock/emplacements")}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Emplacements
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobileDashboard;
