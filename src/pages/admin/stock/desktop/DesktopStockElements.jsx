/**
 * DesktopStockElements.jsx
 * Vue Desktop de la liste des éléments de stock
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStockElements, STOCK_TYPES } from "@/toolkits/admin/stockToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

const DesktopStockElements = () => {
  const navigate = useNavigate();
  const [filtreType, setFiltreType] = useState("all");
  const [filtreStatus, setFiltreStatus] = useState("true");
  const [recherche, setRecherche] = useState("");
  const [filtreAlerte, setFiltreAlerte] = useState(false);
  const [tri, setTri] = useState("nom");

  // Charger les éléments avec cache
  const { elements, loading, error, refetch } = useStockElements({
    type: filtreType !== "all" ? filtreType : undefined,
    status: filtreStatus === "true" ? true : filtreStatus === "false" ? false : undefined,
    search: recherche || undefined,
  });

  // Appliquer filtre recherche, alerte et tri
  const elementsFiltres = useMemo(() => {
    let filtered = elements;

    // Filtre recherche locale
    if (recherche && recherche.trim() !== "") {
      const searchLower = recherche.toLowerCase().trim();
      filtered = filtered.filter((el) =>
        el.denomination.toLowerCase().includes(searchLower) ||
        el.id.toLowerCase().includes(searchLower)
      );
    }

    // Filtre alerte stock faible
    if (filtreAlerte) {
      filtered = filtered.filter(
        (el) => el.quantite_actuelle < el.seuil_alerte
      );
    }

    // Tri
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
      case "prix_desc":
        return filtered.sort(
          (a, b) => (b.prix_unitaire || 0) - (a.prix_unitaire || 0)
        );
      default:
        return filtered;
    }
  }, [elements, recherche, filtreAlerte, tri]);

  // Statistiques globales
  const stats = useMemo(() => {
    const actifs = elements.filter((e) => e.status);
    const enAlerte = elements.filter(
      (e) => e.quantite_actuelle < e.seuil_alerte
    );
    const valeurTotale = elements.reduce(
      (sum, e) => sum + e.quantite_actuelle * (e.prix_unitaire || 0),
      0
    );

    const parType = elements.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: elements.length,
      actifs: actifs.length,
      enAlerte: enAlerte.length,
      valeurTotale,
      parType,
    };
  }, [elements]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Données actualisées - La liste des éléments a été rechargée");
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
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Erreur: {error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Éléments de Stock</h1>
          <p className="text-muted-foreground">
            Gestion de tous les éléments en stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button onClick={() => navigate("/admin/stock/elements/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel élément
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  Total Éléments
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats.total}
                </p>
                <p className="text-xs text-blue-600">{stats.actifs} actifs</p>
              </div>
              <Package className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">En Alerte</p>
                <p className="text-3xl font-bold text-red-900">
                  {stats.enAlerte}
                </p>
                <p className="text-xs text-red-600">Stock faible</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">
                  Valeur Totale
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatMontant(stats.valeurTotale)}
                </p>
                <p className="text-xs text-green-600">FCFA</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Par Type</p>
                <div className="space-y-1 mt-2">
                  {Object.entries(stats.parType).slice(0, 3).map(([type, count]) => (
                    <p key={type} className="text-xs text-purple-600">
                      {TYPE_LABELS[type]}: {count}
                    </p>
                  ))}
                </div>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtreType} onValueChange={setFiltreType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(STOCK_TYPES).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtreStatus} onValueChange={setFiltreStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="true">Actifs</SelectItem>
                <SelectItem value="false">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={filtreAlerte ? "default" : "outline"}
              onClick={() => setFiltreAlerte(!filtreAlerte)}
              className="w-full"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Stock faible
            </Button>
            <Select value={tri} onValueChange={setTri}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nom">Nom (A-Z)</SelectItem>
                <SelectItem value="stock_desc">Stock (↓)</SelectItem>
                <SelectItem value="stock_asc">Stock (↑)</SelectItem>
                <SelectItem value="prix_desc">Prix (↓)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grille des éléments */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : elementsFiltres.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun élément trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {elementsFiltres.map((element) => {
            const enAlerte = element.quantite_actuelle < element.seuil_alerte;

            return (
              <motion.div
                key={element.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer hover:shadow-lg transition-all h-full ${
                    enAlerte ? "border-red-300" : ""
                  }`}
                  onClick={() =>
                    navigate(`/admin/stock/elements/${element.id}`)
                  }
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    {/* En-tête */}
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2 rounded-lg ${
                          TYPE_COLORS[element.type] || "bg-gray-50"
                        }`}
                      >
                        <Package className="h-5 w-5" />
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
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            Alerte
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                          {element.denomination}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {TYPE_LABELS[element.type]}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                        {element.description || "Pas de description"}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Stock:
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            enAlerte ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {element.quantite_actuelle}{" "}
                          <span className="text-xs font-normal">
                            {element.unite?.symbol}
                          </span>
                        </span>
                      </div>
                      {element.seuil_alerte > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Seuil:</span>
                          <span>
                            {element.seuil_alerte} {element.unite?.symbol}
                          </span>
                        </div>
                      )}
                      {element.prix_unitaire > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Prix unit.:
                          </span>
                          <span className="font-semibold">
                            {formatMontant(element.prix_unitaire)} FCFA
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
  );
};

export default DesktopStockElements;
