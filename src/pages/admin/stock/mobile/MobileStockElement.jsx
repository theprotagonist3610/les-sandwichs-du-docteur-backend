/**
 * MobileStockElement.jsx
 * Vue Mobile du détail d'un élément de stock avec tabs
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStockElement } from "@/toolkits/admin/stockToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  ArrowLeft,
  RefreshCw,
  Info,
  MapPin,
  History,
  AlertTriangle,
  Plus,
  Minus,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_LABELS = {
  ingredient: "Ingrédient",
  consommable: "Consommable",
  perissable: "Périssable",
  materiel: "Matériel",
  emballage: "Emballage",
};

const TRANSACTION_ICONS = {
  entree: { icon: Plus, color: "text-green-600", bg: "bg-green-50" },
  sortie: { icon: Minus, color: "text-red-600", bg: "bg-red-50" },
  transfert: { icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50" },
};

const MobileStockElement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [periodeHistorique, setPeriodeHistorique] = useState("30");

  const days = parseInt(periodeHistorique, 10);
  const { element, historique, loading, error, refetch } = useStockElement(id, days);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Données actualisées");
    } catch (err) {
      toast.error(`Erreur: ${err.message}`);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const repartitionStock = useMemo(() => {
    if (!element?.repartition_stock) return [];
    return Object.entries(element.repartition_stock).map(([emplacementId, data]) => ({
      emplacementId,
      ...data,
    }));
  }, [element?.repartition_stock]);

  const enAlerte = element && element.quantite_actuelle < element.seuil_alerte;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !element) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error || "Élément non trouvé"}</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => navigate("/admin/stock/elements")}>
                Retour
              </Button>
              <Button size="sm" onClick={handleRefresh} variant="outline">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/stock/elements")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Package className="h-6 w-6" />
          <div className="flex-1">
            <h1 className="text-lg font-bold line-clamp-1">{element.denomination}</h1>
            <p className="text-xs text-muted-foreground">
              {TYPE_LABELS[element.type]}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge
              variant={element.status ? "default" : "secondary"}
              className="text-[10px]"
            >
              {element.status ? "Actif" : "Inactif"}
            </Badge>
            {enAlerte && (
              <Badge variant="destructive" className="text-[10px]">
                Alerte
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Contenu avec Tabs */}
      <Tabs defaultValue="info" className="p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="text-xs">
            <Info className="h-3 w-3 mr-1" />
            Infos
          </TabsTrigger>
          <TabsTrigger value="repartition" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="historique" className="text-xs">
            <History className="h-3 w-3 mr-1" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Tab Informations */}
        <TabsContent value="info" className="space-y-3 mt-4">
          <Card className={enAlerte ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
            <CardContent className="pt-4 pb-4">
              <p className={`text-xs ${enAlerte ? "text-red-700" : "text-green-700"}`}>
                Stock actuel
              </p>
              <p className={`text-2xl font-bold ${enAlerte ? "text-red-900" : "text-green-900"}`}>
                {element.quantite_actuelle} {element.unite?.symbol}
              </p>
              {element.seuil_alerte > 0 && (
                <p className={`text-[10px] ${enAlerte ? "text-red-600" : "text-green-600"}`}>
                  Seuil: {element.seuil_alerte} {element.unite?.symbol}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              {element.description || "Pas de description"}
            </CardContent>
          </Card>

          {element.prix_unitaire > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Prix</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-bold">
                  {formatMontant(element.prix_unitaire)} FCFA
                </p>
                <p className="text-[10px] text-muted-foreground">
                  par {element.unite?.symbol}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-blue-700">Valeur totale</p>
              <p className="text-xl font-bold text-blue-900">
                {formatMontant(element.quantite_actuelle * (element.prix_unitaire || 0))} FCFA
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Répartition */}
        <TabsContent value="repartition" className="space-y-3 mt-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">{repartitionStock.length} emplacement(s)</p>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {repartitionStock.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucun stock</p>
                  </CardContent>
                </Card>
              ) : (
                repartitionStock.map((item) => (
                  <Card
                    key={item.emplacementId}
                    onClick={() => navigate(`/admin/stock/emplacements/${item.emplacementId}`)}
                    className="cursor-pointer"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-xs line-clamp-1 flex-1">
                          {item.denomination_emplacement || "Emplacement"}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.quantite} {element.unite?.symbol}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {formatMontant(item.quantite * (element.prix_unitaire || 0))} FCFA
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tab Historique */}
        <TabsContent value="historique" className="space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-xs">Période:</label>
            <Select value={periodeHistorique} onValueChange={setPeriodeHistorique}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {!historique || historique.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucune transaction</p>
                  </CardContent>
                </Card>
              ) : (
                historique.map((transaction) => {
                  const config = TRANSACTION_ICONS[transaction.type] || TRANSACTION_ICONS.entree;
                  const TransactionIcon = config.icon;

                  return (
                    <Card key={transaction.id} className={config.bg}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded ${config.color} bg-white`}>
                            <TransactionIcon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-xs font-semibold capitalize">{transaction.type}</p>
                              <Badge variant="outline" className={`${config.color} text-[10px]`}>
                                {transaction.type === "sortie" ? "-" : "+"}
                                {transaction.quantite}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {transaction.motif || "Sans motif"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(transaction.timestamp)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileStockElement;
