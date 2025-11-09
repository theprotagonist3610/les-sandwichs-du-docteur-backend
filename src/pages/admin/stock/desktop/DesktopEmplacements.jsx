/**
 * DesktopEmplacements.jsx
 * Vue Desktop de la liste des emplacements avec statistiques
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
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
  MapPin,
  Store,
  Warehouse,
  ShoppingBag,
  User,
  Package,
  DollarSign,
  RefreshCw,
  Plus,
  PieChart as PieChartIcon,
  Search,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

const DesktopEmplacements = () => {
  const navigate = useNavigate();
  const [filtreType, setFiltreType] = useState("");
  const [filtreStatus, setFiltreStatus] = useState("true");
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState("nom");

  // Charger les emplacements avec cache
  const { emplacements, loading, error, refetch } = useEmplacements({
    type: filtreType || undefined,
    status: filtreStatus === "true" ? true : filtreStatus === "false" ? false : undefined,
    search: recherche || undefined,
  });

  // Statistiques globales
  const stats = useMemo(() => {
    const actifs = emplacements.filter((e) => e.status);
    const stockTotal = emplacements.reduce((sum, e) => {
      const nbArticles = Object.keys(e.stock_actuel || {}).length;
      return sum + nbArticles;
    }, 0);

    const valeurTotale = emplacements.reduce((sum, e) => {
      const stockActuel = e.stock_actuel || {};
      const valeur = Object.values(stockActuel).reduce((acc, item) => {
        return acc + (item.quantite_actuelle || 0) * (item.prix_unitaire || 0);
      }, 0);
      return sum + valeur;
    }, 0);

    const parType = emplacements.reduce((acc, e) => {
      const type = e.type?.famille || "autre";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: emplacements.length,
      actifs: actifs.length,
      stockTotal,
      valeurTotale,
      parType,
    };
  }, [emplacements]);

  // Tri des emplacements
  const emplacementsTries = useMemo(() => {
    const sorted = [...emplacements];
    switch (tri) {
      case "nom":
        return sorted.sort((a, b) =>
          a.denomination.localeCompare(b.denomination)
        );
      case "stock_asc":
        return sorted.sort(
          (a, b) =>
            Object.keys(a.stock_actuel || {}).length -
            Object.keys(b.stock_actuel || {}).length
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
      toast.success("Données actualisées - La liste des emplacements a été rechargée");
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
      {/* Header avec statistiques KPI */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emplacements</h1>
          <p className="text-muted-foreground">
            Gestion de tous les emplacements de stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => navigate("/admin/stock/emplacements/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel emplacement
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats.total}
                </p>
                <p className="text-xs text-blue-600">
                  {stats.actifs} actifs
                </p>
              </div>
              <MapPin className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">
                  Articles stockés
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats.stockTotal}
                </p>
                <p className="text-xs text-purple-600">différents</p>
              </div>
              <Package className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">
                  Valeur totale
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

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">
                  Répartition
                </p>
                <div className="space-y-1 mt-2">
                  {Object.entries(stats.parType).map(([type, count]) => (
                    <p key={type} className="text-xs text-orange-600">
                      {type}: {count}
                    </p>
                  ))}
                </div>
              </div>
              <PieChartIcon className="h-10 w-10 text-orange-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="entrepot">Entrepôt</SelectItem>
                <SelectItem value="point_de_vente">Point de vente</SelectItem>
                <SelectItem value="stand">Stand</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtreStatus} onValueChange={setFiltreStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="true">Actifs</SelectItem>
                <SelectItem value="false">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tri} onValueChange={setTri}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nom">Nom (A-Z)</SelectItem>
                <SelectItem value="stock_desc">Stock (décroissant)</SelectItem>
                <SelectItem value="stock_asc">Stock (croissant)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grille des emplacements */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : emplacementsTries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun emplacement trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emplacementsTries.map((emplacement) => {
            const TypeIcon =
              EMPLACEMENT_ICONS[emplacement.type?.famille] || MapPin;
            const stockInfo = getStockInfo(emplacement);

            return (
              <motion.div
                key={emplacement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all h-full"
                  onClick={() =>
                    navigate(`/admin/stock/emplacements/${emplacement.id}`)
                  }
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* En-tête */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`p-3 rounded-lg ${
                          EMPLACEMENT_COLORS[emplacement.type?.famille] ||
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      <Badge
                        variant={emplacement.status ? "default" : "secondary"}
                      >
                        {emplacement.status ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    {/* Informations */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {emplacement.denomination}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {emplacement.theme_central?.theme || "Sans thème"}
                        </p>
                      </div>

                      {/* Position */}
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {emplacement.position?.actuelle?.commune},{" "}
                          {emplacement.position?.actuelle?.quartier}
                        </span>
                      </div>

                      {/* Vendeur */}
                      {emplacement.vendeur_actuel && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-1">
                            {emplacement.vendeur_actuel.nom}{" "}
                            {emplacement.vendeur_actuel.prenoms?.[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Statistiques */}
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Articles:</span>
                        <span className="font-semibold">
                          {stockInfo.nbArticles}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Valeur:</span>
                        <span className="font-semibold text-green-600">
                          {formatMontant(stockInfo.valeur)} FCFA
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
  );
};

export default DesktopEmplacements;
