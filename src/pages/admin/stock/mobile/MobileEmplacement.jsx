/**
 * MobileEmplacement.jsx
 * Vue Mobile du détail d'un emplacement avec tabs
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmplacement } from "@/toolkits/admin/emplacementToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Store,
  Warehouse,
  ShoppingBag,
  User,
  Clock,
  ArrowLeft,
  RefreshCw,
  Package,
  Plus,
  Minus,
  ArrowRightLeft,
  Phone,
  Mail,
  Info,
} from "lucide-react";
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

const MobileEmplacement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchStock, setSearchStock] = useState("");

  const { emplacement, loading, error, refetch } = useEmplacement(id);

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

  // Filtrer le stock local
  const stockFiltre = useMemo(() => {
    if (!emplacement?.stock_actuel) return [];
    const stockArray = Object.entries(emplacement.stock_actuel).map(
      ([id, item]) => ({ id, ...item })
    );
    if (!searchStock) return stockArray;
    return stockArray.filter((item) =>
      item.denomination?.toLowerCase().includes(searchStock.toLowerCase())
    );
  }, [emplacement?.stock_actuel, searchStock]);

  // Calculer statistiques du stock local
  const statsStock = useMemo(() => {
    if (!emplacement?.stock_actuel) return { total: 0, valeur: 0 };
    const items = Object.values(emplacement.stock_actuel);
    const valeur = items.reduce(
      (sum, item) =>
        sum + (item.quantite_actuelle || 0) * (item.prix_unitaire || 0),
      0
    );
    return { total: items.length, valeur };
  }, [emplacement?.stock_actuel]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !emplacement) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              {error || "Emplacement non trouvé"}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => navigate("/admin/stock/emplacements")}
              >
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

  const TypeIcon = EMPLACEMENT_ICONS[emplacement.type?.famille] || MapPin;

  return (
    <div className="pb-20">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/stock/emplacements")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className={`p-2 rounded-lg ${
              EMPLACEMENT_COLORS[emplacement.type?.famille] || "bg-gray-50"
            }`}
          >
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold line-clamp-1">
              {emplacement.denomination}
            </h1>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {emplacement.theme_central?.theme || "Sans thème"}
            </p>
          </div>
          <Badge
            variant={emplacement.status ? "default" : "secondary"}
            className="text-[10px]"
          >
            {emplacement.status ? "Actif" : "Inactif"}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
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
          <TabsTrigger value="stock" className="text-xs">
            <Package className="h-3 w-3 mr-1" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Actions
          </TabsTrigger>
        </TabsList>

        {/* Tab Informations */}
        <TabsContent value="info" className="space-y-3 mt-4">
          {/* Position */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Position
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p className="font-medium">
                {emplacement.position?.actuelle?.commune || "Non défini"}
              </p>
              <p className="text-muted-foreground">
                {emplacement.position?.actuelle?.quartier || ""}
              </p>
              {emplacement.position?.actuelle?.adresse && (
                <p className="text-muted-foreground text-[10px]">
                  {emplacement.position.actuelle.adresse}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vendeur */}
          {emplacement.vendeur_actuel && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Vendeur
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p className="font-medium">
                  {emplacement.vendeur_actuel.nom}{" "}
                  {emplacement.vendeur_actuel.prenoms?.[0]}
                </p>
                {emplacement.vendeur_actuel.telephone && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {emplacement.vendeur_actuel.telephone}
                  </div>
                )}
                {emplacement.vendeur_actuel.email && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {emplacement.vendeur_actuel.email}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Horaires */}
          {emplacement.horaires_actuels && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                {Object.entries(emplacement.horaires_actuels).map(
                  ([jour, horaire]) => (
                    <div key={jour} className="flex justify-between">
                      <span className="capitalize text-muted-foreground">
                        {jour}:
                      </span>
                      <span className="font-medium">
                        {horaire.ouverture} - {horaire.fermeture}
                      </span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {/* Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Type</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <p className="font-medium">
                {emplacement.type?.famille || "Non défini"}
              </p>
              {emplacement.type?.categorie && (
                <p className="text-muted-foreground">
                  {emplacement.type.categorie}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Stock */}
        <TabsContent value="stock" className="space-y-3 mt-4">
          {/* KPI Valeur */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-green-700">Valeur totale du stock</p>
              <p className="text-xl font-bold text-green-900">
                {formatMontant(statsStock.valeur)} FCFA
              </p>
              <p className="text-[10px] text-green-600">
                {statsStock.total} article{statsStock.total > 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Recherche */}
          <Input
            placeholder="Rechercher..."
            value={searchStock}
            onChange={(e) => setSearchStock(e.target.value)}
            className="text-sm h-9"
          />

          {/* Liste stock */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {stockFiltre.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {searchStock
                        ? "Aucun article trouvé"
                        : "Aucun stock"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                stockFiltre.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-xs line-clamp-1">
                            {item.denomination}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.type}
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.quantite_actuelle < (item.seuil_alerte || 0)
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {item.quantite_actuelle} {item.unite?.symbol}
                        </Badge>
                      </div>
                      {item.prix_unitaire > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatMontant(item.prix_unitaire)} FCFA / {item.unite?.symbol}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tab Actions */}
        <TabsContent value="actions" className="space-y-3 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Opérations de stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/admin/stock/operations/create?type=entree&emplacementId=${id}`
                  )
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter du stock
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/admin/stock/operations/create?type=sortie&emplacementId=${id}`
                  )
                }
              >
                <Minus className="h-4 w-4 mr-2" />
                Retirer du stock
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/admin/stock/operations/create?type=transfert&sourceId=${id}`
                  )
                }
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transférer du stock
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Gestion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Changer le vendeur
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Modifier les horaires
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Relocaliser
              </Button>

              <Button
                className="w-full justify-start"
                variant={emplacement.status ? "destructive" : "default"}
                size="sm"
              >
                {emplacement.status ? "Désactiver" : "Activer"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileEmplacement;
