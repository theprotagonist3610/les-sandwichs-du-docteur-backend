/**
 * MobileStockElements.jsx
 * Vue Mobile de la liste des éléments de stock
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStockElements, STOCK_TYPES } from "@/toolkits/admin/stockToolkit";
import { Card, CardContent } from "@/components/ui/card";
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
  Package,
  AlertTriangle,
  RefreshCw,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const TYPE_COLORS = {
  ingredient: "bg-purple-50 text-purple-700 border-purple-200",
  consommable: "bg-orange-50 text-orange-700 border-orange-200",
  perissable: "bg-yellow-50 text-yellow-700 border-yellow-200",
  materiel: "bg-gray-50 text-gray-700 border-gray-200",
  emballage: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const TYPE_LABELS = {
  ingredient: "Ingrédient",
  consommable: "Consommable",
  perissable: "Périssable",
  materiel: "Matériel",
  emballage: "Emballage",
};

const MobileStockElements = () => {
  const navigate = useNavigate();
  const [filtreType, setFiltreType] = useState("");
  const [filtreStatus, setFiltreStatus] = useState("true");
  const [recherche, setRecherche] = useState("");
  const [filtreAlerte, setFiltreAlerte] = useState(false);
  const [tri, setTri] = useState("nom");

  const { elements, loading, error, refetch } = useStockElements({
    type: filtreType || undefined,
    status: filtreStatus === "true" ? true : filtreStatus === "false" ? false : undefined,
    search: recherche || undefined,
  });

  // Appliquer filtre alerte et tri
  const elementsFiltres = useMemo(() => {
    let filtered = elements;

    if (filtreAlerte) {
      filtered = filtered.filter(
        (el) => el.quantite_actuelle < el.seuil_alerte
      );
    }

    switch (tri) {
      case "nom":
        return filtered.sort((a, b) =>
          a.denomination.localeCompare(b.denomination)
        );
      case "stock_desc":
        return filtered.sort(
          (a, b) => b.quantite_actuelle - a.quantite_actuelle
        );
      case "stock_asc":
        return filtered.sort(
          (a, b) => a.quantite_actuelle - b.quantite_actuelle
        );
      default:
        return filtered;
    }
  }, [elements, filtreAlerte, tri]);

  const stats = useMemo(() => {
    const actifs = elements.filter((e) => e.status);
    const enAlerte = elements.filter(
      (e) => e.quantite_actuelle < e.seuil_alerte
    );
    return {
      total: elements.length,
      actifs: actifs.length,
      enAlerte: enAlerte.length,
    };
  }, [elements]);

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
            <h1 className="text-xl font-bold">Éléments de Stock</h1>
            <p className="text-xs text-muted-foreground">
              {stats.total} éléments
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
            <Button size="icon" onClick={() => navigate("/admin/stock/elements/new")}>
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
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-red-700">En Alerte</p>
                  <p className="text-lg font-bold text-red-900">
                    {stats.enAlerte}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-600" />
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
            <SheetContent side="bottom" className="h-[500px]">
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
                      <SelectItem value="">Tous</SelectItem>
                      {Object.entries(STOCK_TYPES).map(([key, value]) => (
                        <SelectItem key={value} value={value}>
                          {TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
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
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="true">Actifs</SelectItem>
                      <SelectItem value="false">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Stock faible
                  </label>
                  <Button
                    variant={filtreAlerte ? "default" : "outline"}
                    onClick={() => setFiltreAlerte(!filtreAlerte)}
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {filtreAlerte ? "Activé" : "Désactivé"}
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tri</label>
                  <Select value={tri} onValueChange={setTri}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nom">Nom (A-Z)</SelectItem>
                      <SelectItem value="stock_desc">Stock (↓)</SelectItem>
                      <SelectItem value="stock_asc">Stock (↑)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Liste des éléments */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="h-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : elementsFiltres.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Aucun élément
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {elementsFiltres.map((element) => {
                const enAlerte = element.quantite_actuelle < element.seuil_alerte;

                return (
                  <motion.div
                    key={element.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`cursor-pointer active:scale-[0.98] transition-transform h-full ${
                        enAlerte ? "border-red-300" : ""
                      }`}
                      onClick={() =>
                        navigate(`/admin/stock/elements/${element.id}`)
                      }
                    >
                      <CardContent className="p-3 flex flex-col h-full">
                        {/* En-tête */}
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              TYPE_COLORS[element.type] || "bg-gray-50"
                            }`}
                          >
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge
                              variant={element.status ? "default" : "secondary"}
                              className="text-[10px] px-1 py-0"
                            >
                              {element.status ? "Actif" : "Inactif"}
                            </Badge>
                            {enAlerte && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                <AlertTriangle className="h-2 w-2 mr-0.5" />
                                Alerte
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Informations */}
                        <div className="flex-1 space-y-1.5">
                          <h3 className="font-semibold text-xs line-clamp-2 min-h-[2rem]">
                            {element.denomination}
                          </h3>
                          <p className="text-[10px] text-muted-foreground">
                            {TYPE_LABELS[element.type]}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="mt-2 pt-2 border-t space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">
                              Stock:
                            </span>
                            <span
                              className={`text-base font-bold ${
                                enAlerte ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {element.quantite_actuelle}{" "}
                              <span className="text-[10px] font-normal">
                                {element.unite?.symbol}
                              </span>
                            </span>
                          </div>
                          {element.prix_unitaire > 0 && (
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">Prix:</span>
                              <span className="font-semibold">
                                {formatMontant(element.prix_unitaire)}
                              </span>
                            </div>
                          )}
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

export default MobileStockElements;
