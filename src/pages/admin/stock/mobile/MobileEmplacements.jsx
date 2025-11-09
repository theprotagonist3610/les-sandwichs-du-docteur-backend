/**
 * MobileEmplacements.jsx
 * Vue Mobile de la liste des emplacements
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Store,
  Warehouse,
  ShoppingBag,
  User,
  Package,
  DollarSign,
  RefreshCw,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const EMPLACEMENT_ICONS = {
  entrepot: Warehouse,
  point_de_vente: Store,
  stand: ShoppingBag,
};

const EMPLACEMENT_COLORS = {
  entrepot: "bg-gray-50 text-gray-700 border-gray-200",
  point_de_vente: "bg-blue-50 text-blue-700 border-blue-200",
  stand: "bg-purple-50 text-purple-700 border-purple-200",
};

const MobileEmplacements = () => {
  const navigate = useNavigate();
  const [filtreType, setFiltreType] = useState("all");
  const [filtreStatus, setFiltreStatus] = useState("true");
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState("nom");

  const { emplacements, loading, error, refetch } = useEmplacements({
    type: filtreType === "all" ? undefined : filtreType,
    status: filtreStatus === "all" ? undefined : filtreStatus === "true" ? true : false,
    search: recherche || undefined,
  });

  const stats = useMemo(() => {
    const actifs = emplacements.filter((e) => e.status);
    const stockTotal = emplacements.reduce((sum, e) => {
      return sum + Object.keys(e.stock_actuel || {}).length;
    }, 0);

    const valeurTotale = emplacements.reduce((sum, e) => {
      const stockActuel = e.stock_actuel || {};
      const valeur = Object.values(stockActuel).reduce((acc, item) => {
        return acc + (item.quantite_actuelle || 0) * (item.prix_unitaire || 0);
      }, 0);
      return sum + valeur;
    }, 0);

    return {
      total: emplacements.length,
      actifs: actifs.length,
      stockTotal,
      valeurTotale,
    };
  }, [emplacements]);

  const emplacementsTries = useMemo(() => {
    const sorted = [...emplacements];
    switch (tri) {
      case "nom":
        return sorted.sort((a, b) =>
          a.denomination.localeCompare(b.denomination)
        );
      case "stock_desc":
        return sorted.sort(
          (a, b) =>
            Object.keys(b.stock_actuel || {}).length -
            Object.keys(a.stock_actuel || {}).length
        );
      default:
        return sorted;
    }
  }, [emplacements, tri]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Données rechargées");
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

  const getStockInfo = (emplacement) => {
    const stockActuel = emplacement.stock_actuel || {};
    const nbArticles = Object.keys(stockActuel).length;
    const valeur = Object.values(stockActuel).reduce((acc, item) => {
      return acc + (item.quantite_actuelle || 0) * (item.prix_unitaire || 0);
    }, 0);
    return { nbArticles, valeur };
  };

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">Erreur: {error}</p>
            <Button onClick={handleRefresh} size="sm" className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Emplacements</h1>
            <p className="text-xs text-muted-foreground">
              {stats.total} emplacements
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="icon" onClick={() => navigate("/admin/stock/emplacements/new")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-blue-700">Actifs</p>
                  <p className="text-lg font-bold text-blue-900">
                    {stats.actifs}
                  </p>
                </div>
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-purple-700">Articles</p>
                  <p className="text-lg font-bold text-purple-900">
                    {stats.stockTotal}
                  </p>
                </div>
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recherche et Filtres */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[400px]">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Type
                  </label>
                  <Select value={filtreType} onValueChange={setFiltreType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="entrepot">Entrepôt</SelectItem>
                      <SelectItem value="point_de_vente">
                        Point de vente
                      </SelectItem>
                      <SelectItem value="stand">Stand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Statut
                  </label>
                  <Select value={filtreStatus} onValueChange={setFiltreStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="true">Actifs</SelectItem>
                      <SelectItem value="false">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tri</label>
                  <Select value={tri} onValueChange={setTri}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nom">Nom (A-Z)</SelectItem>
                      <SelectItem value="stock_desc">
                        Stock (décroissant)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Liste des emplacements */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="h-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : emplacementsTries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Aucun emplacement
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {emplacementsTries.map((emplacement) => {
                const TypeIcon =
                  EMPLACEMENT_ICONS[emplacement.type?.famille] || MapPin;
                const stockInfo = getStockInfo(emplacement);

                return (
                  <motion.div
                    key={emplacement.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="cursor-pointer active:scale-[0.98] transition-transform h-full"
                      onClick={() =>
                        navigate(`/admin/stock/emplacements/${emplacement.id}`)
                      }
                    >
                      <CardContent className="p-3 flex flex-col h-full">
                        {/* En-tête */}
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              EMPLACEMENT_COLORS[emplacement.type?.famille] ||
                              "bg-gray-50"
                            }`}
                          >
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <Badge
                            variant={
                              emplacement.status ? "default" : "secondary"
                            }
                            className="text-[10px] px-1 py-0"
                          >
                            {emplacement.status ? "Actif" : "Inactif"}
                          </Badge>
                        </div>

                        {/* Informations */}
                        <div className="flex-1 space-y-1.5">
                          <h3 className="font-semibold text-xs line-clamp-2 min-h-[2rem]">
                            {emplacement.denomination}
                          </h3>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {emplacement.position?.actuelle?.commune}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="mt-2 pt-2 border-t space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">
                              Articles:
                            </span>
                            <span className="font-semibold">
                              {stockInfo.nbArticles}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Valeur:</span>
                            <span className="font-semibold text-green-600">
                              {formatMontant(stockInfo.valeur)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobileEmplacements;
