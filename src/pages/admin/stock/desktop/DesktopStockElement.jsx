/**
 * DesktopStockElement.jsx
 * Vue Desktop du détail d'un élément de stock avec historique
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStockElement } from "@/toolkits/admin/stockToolkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Edit,
  Save,
  AlertTriangle,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Plus,
  Minus,
} from "lucide-react";
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

const TRANSACTION_ICONS = {
  entree: { icon: Plus, color: "text-green-600", bg: "bg-green-50" },
  sortie: { icon: Minus, color: "text-red-600", bg: "bg-red-50" },
  transfert: { icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50" },
};

const DesktopStockElement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [periodeHistorique, setPeriodeHistorique] = useState("30");

  // days pour historique basé sur période sélectionnée
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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Calculer la répartition par emplacement
  const repartitionStock = useMemo(() => {
    if (!element?.repartition_stock) return [];
    return Object.entries(element.repartition_stock).map(([emplacementId, data]) => ({
      emplacementId,
      ...data,
    }));
  }, [element?.repartition_stock]);

  // Statistiques du stock
  const statsStock = useMemo(() => {
    if (!element) return { valeurTotale: 0, enAlerte: false };
    const valeurTotale = element.quantite_actuelle * (element.prix_unitaire || 0);
    const enAlerte = element.quantite_actuelle < element.seuil_alerte;
    return { valeurTotale, enAlerte };
  }, [element]);

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

  if (error || !element) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error || "Élément non trouvé"}
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => navigate("/admin/stock/elements")}>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/stock/elements")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className={`p-3 rounded-lg ${
              TYPE_COLORS[element.type] || "bg-gray-50"
            }`}
          >
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{element.denomination}</h1>
            <p className="text-muted-foreground">
              {TYPE_LABELS[element.type] || element.type}
            </p>
          </div>
          <Badge variant={element.status ? "default" : "secondary"}>
            {element.status ? "Actif" : "Inactif"}
          </Badge>
          {statsStock.enAlerte && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Stock faible
            </Badge>
          )}
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
              <Package className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stock actuel */}
            <Card
              className={`${
                statsStock.enAlerte
                  ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                  : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <p
                  className={`text-sm ${
                    statsStock.enAlerte ? "text-red-700" : "text-green-700"
                  }`}
                >
                  Stock actuel
                </p>
                <p
                  className={`text-3xl font-bold ${
                    statsStock.enAlerte ? "text-red-900" : "text-green-900"
                  }`}
                >
                  {element.quantite_actuelle}{" "}
                  <span className="text-lg">{element.unite?.symbol}</span>
                </p>
                {element.seuil_alerte > 0 && (
                  <p
                    className={`text-xs ${
                      statsStock.enAlerte ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    Seuil: {element.seuil_alerte} {element.unite?.symbol}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <p className="text-sm mt-1">
                {element.description || "Pas de description"}
              </p>
            </div>

            {/* Prix unitaire */}
            {element.prix_unitaire > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Prix unitaire
                </label>
                <p className="text-lg font-bold mt-1">
                  {formatMontant(element.prix_unitaire)} FCFA / {element.unite?.symbol}
                </p>
              </div>
            )}

            {/* Valeur totale */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-blue-700">Valeur totale</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatMontant(statsStock.valeurTotale)} FCFA
                </p>
              </CardContent>
            </Card>

            {/* Unité */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Unité de mesure
              </label>
              <p className="text-sm mt-1">
                {element.unite?.nom} ({element.unite?.symbol})
              </p>
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <p className="text-sm mt-1">{TYPE_LABELS[element.type]}</p>
            </div>
          </CardContent>
        </Card>

        {/* Colonne 2: Répartition par emplacement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Répartition
              </div>
              <Badge variant="outline">
                {repartitionStock.length} emplacement{repartitionStock.length > 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {repartitionStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun stock dans les emplacements
              </p>
            ) : (
              repartitionStock.map((item) => (
                <Card
                  key={item.emplacementId}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    navigate(`/admin/stock/emplacements/${item.emplacementId}`)
                  }
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-1">
                          {item.denomination_emplacement || `Emplacement ${item.emplacementId.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.type_emplacement || ""}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.quantite < element.seuil_alerte
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {item.quantite} {element.unite?.symbol}
                      </Badge>
                    </div>
                    {element.prix_unitaire > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Valeur: {formatMontant(item.quantite * element.prix_unitaire)} FCFA
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Colonne 3: Historique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>Historique</div>
              <Select
                value={periodeHistorique}
                onValueChange={setPeriodeHistorique}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {!historique || historique.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune transaction
              </p>
            ) : (
              historique.map((transaction) => {
                const transactionConfig =
                  TRANSACTION_ICONS[transaction.type] ||
                  TRANSACTION_ICONS.entree;
                const TransactionIcon = transactionConfig.icon;

                return (
                  <Card key={transaction.id} className={transactionConfig.bg}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${transactionConfig.color} bg-white`}
                        >
                          <TransactionIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold capitalize">
                                {transaction.type}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {transaction.motif || "Sans motif"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${transactionConfig.color} shrink-0`}
                            >
                              {transaction.type === "sortie" ? "-" : "+"}
                              {transaction.quantite} {element.unite?.symbol}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDate(transaction.timestamp)}
                          </p>
                          {transaction.emplacement_destination && (
                            <p className="text-[10px] text-muted-foreground">
                              Vers: {transaction.emplacement_destination}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides en bas */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/admin/stock/operations/create?type=entree&elementId=${id}`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter du stock
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/admin/stock/operations/create?type=sortie&elementId=${id}`)
              }
            >
              <Minus className="h-4 w-4 mr-2" />
              Retirer du stock
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/admin/stock/operations/create?type=transfert&elementId=${id}`)
              }
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transférer entre emplacements
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopStockElement;
