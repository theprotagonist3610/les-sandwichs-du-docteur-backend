/**
 * DesktopEmplacement.jsx
 * Vue Desktop du détail d'un emplacement avec édition et gestion
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmplacement } from "@/toolkits/admin/emplacementToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Store,
  Warehouse,
  ShoppingBag,
  User,
  Clock,
  ArrowLeft,
  RefreshCw,
  Edit,
  Package,
  Plus,
  Minus,
  ArrowRightLeft,
  Save,
  X,
  Phone,
  Mail,
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

const TYPE_COLORS = {
  ingredient: "bg-purple-50 text-purple-700 border-purple-200",
  consommable: "bg-orange-50 text-orange-700 border-orange-200",
  perissable: "bg-yellow-50 text-yellow-700 border-yellow-200",
  materiel: "bg-gray-50 text-gray-700 border-gray-200",
  emballage: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const DesktopEmplacement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !emplacement) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error || "Emplacement non trouvé"}
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => navigate("/admin/stock/emplacements")}>
                Retour
              </Button>
              <Button onClick={handleRefresh} variant="outline">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/stock/emplacements")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className={`p-3 rounded-lg ${
              EMPLACEMENT_COLORS[emplacement.type?.famille] || "bg-gray-50"
            }`}
          >
            <TypeIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{emplacement.denomination}</h1>
            <p className="text-muted-foreground">
              {emplacement.theme_central?.theme || "Sans thème"}
            </p>
          </div>
          <Badge variant={emplacement.status ? "default" : "secondary"}>
            {emplacement.status ? "Actif" : "Inactif"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Éditer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contenu principal en 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1: Informations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Position
              </label>
              <div className="mt-1 space-y-1">
                <p className="text-sm">
                  {emplacement.position?.actuelle?.commune || "Non défini"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {emplacement.position?.actuelle?.quartier || ""}
                </p>
                {emplacement.position?.actuelle?.adresse && (
                  <p className="text-xs text-muted-foreground">
                    {emplacement.position.actuelle.adresse}
                  </p>
                )}
              </div>
            </div>

            {/* Vendeur actuel */}
            {emplacement.vendeur_actuel && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Vendeur
                </label>
                <div className="mt-1">
                  <p className="text-sm font-medium">
                    {emplacement.vendeur_actuel.nom}{" "}
                    {emplacement.vendeur_actuel.prenoms?.[0]}
                  </p>
                  {emplacement.vendeur_actuel.telephone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Phone className="h-3 w-3" />
                      {emplacement.vendeur_actuel.telephone}
                    </div>
                  )}
                  {emplacement.vendeur_actuel.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {emplacement.vendeur_actuel.email}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Horaires */}
            {emplacement.horaires_actuels && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Horaires
                </label>
                <div className="mt-1 space-y-1">
                  {Object.entries(emplacement.horaires_actuels).map(
                    ([jour, horaire]) => (
                      <div
                        key={jour}
                        className="flex justify-between text-xs"
                      >
                        <span className="capitalize">{jour}:</span>
                        <span className="text-muted-foreground">
                          {horaire.ouverture} - {horaire.fermeture}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Type et catégorie */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <p className="text-sm mt-1">
                {emplacement.type?.famille || "Non défini"}
              </p>
              {emplacement.type?.categorie && (
                <p className="text-xs text-muted-foreground">
                  {emplacement.type.categorie}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colonne 2: Stock local */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Local
              </div>
              <Badge variant="outline">
                {statsStock.total} article{statsStock.total > 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Valeur totale */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-green-700">Valeur totale</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatMontant(statsStock.valeur)} FCFA
                </p>
              </CardContent>
            </Card>

            {/* Recherche */}
            <Input
              placeholder="Rechercher dans le stock..."
              value={searchStock}
              onChange={(e) => setSearchStock(e.target.value)}
              className="text-sm"
            />

            {/* Liste du stock */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stockFiltre.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchStock
                    ? "Aucun article trouvé"
                    : "Aucun stock dans cet emplacement"}
                </p>
              ) : (
                stockFiltre.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm line-clamp-1">
                            {item.denomination}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.type}
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.quantite_actuelle < (item.seuil_alerte || 0)
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {item.quantite_actuelle} {item.unite?.symbol}
                        </Badge>
                      </div>
                      {item.prix_unitaire > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatMontant(item.prix_unitaire)} FCFA / {item.unite?.symbol}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colonne 3: Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() =>
                navigate(`/admin/stock/operations/create?type=entree&emplacementId=${id}`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter du stock (Entrée)
            </Button>

            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() =>
                navigate(`/admin/stock/operations/create?type=sortie&emplacementId=${id}`)
              }
            >
              <Minus className="h-4 w-4 mr-2" />
              Retirer du stock (Sortie)
            </Button>

            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() =>
                navigate(`/admin/stock/operations/create?type=transfert&sourceId=${id}`)
              }
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transférer vers autre emplacement
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Gestion</p>

              <Button
                className="w-full justify-start mb-2"
                variant="outline"
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Changer le vendeur
              </Button>

              <Button
                className="w-full justify-start mb-2"
                variant="outline"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Modifier les horaires
              </Button>

              <Button
                className="w-full justify-start mb-2"
                variant="outline"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Relocaliser l'emplacement
              </Button>

              <Button
                className="w-full justify-start"
                variant={emplacement.status ? "destructive" : "default"}
                size="sm"
              >
                {emplacement.status ? "Désactiver" : "Activer"} l'emplacement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopEmplacement;
