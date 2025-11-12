/**
 * Step3ConfigureOperation.jsx
 * Étape 3: Configuration de l'opération (quantité, emplacements, prix, motif)
 */

import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Package,
  DollarSign,
  AlertTriangle,
  Info,
  TrendingUp,
} from "lucide-react";
import {
  useOperationStockStore,
  selectOperationType,
  selectSelectedElement,
  selectSourceEmplacement,
  selectDestEmplacement,
  selectQuantite,
  selectCoutTotal,
  selectMotif,
  selectErrors,
  selectAvailableStock,
} from "@/stores/operationStockStore";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { useStockByEmplacement, TRANSACTION_TYPES } from "@/toolkits/admin/stockToolkit";
import { cn } from "@/lib/utils";

const Step3ConfigureOperation = () => {
  const operationType = useOperationStockStore(selectOperationType);
  const selectedElement = useOperationStockStore(selectSelectedElement);
  const sourceEmplacement = useOperationStockStore(selectSourceEmplacement);
  const destEmplacement = useOperationStockStore(selectDestEmplacement);
  const quantite = useOperationStockStore(selectQuantite);
  const coutTotal = useOperationStockStore(selectCoutTotal);
  const motif = useOperationStockStore(selectMotif);
  const errors = useOperationStockStore(selectErrors);
  const availableStock = useOperationStockStore(selectAvailableStock);

  const setSourceEmplacement = useOperationStockStore((state) => state.setSourceEmplacement);
  const setDestEmplacement = useOperationStockStore((state) => state.setDestEmplacement);
  const setQuantite = useOperationStockStore((state) => state.setQuantite);
  const setCoutTotal = useOperationStockStore((state) => state.setCoutTotal);
  const setMotif = useOperationStockStore((state) => state.setMotif);
  const clearError = useOperationStockStore((state) => state.clearError);

  // Calcul automatique du prix unitaire
  const prixUnitaire = useMemo(() => {
    if (!quantite || quantite <= 0 || !coutTotal) return 0;
    return coutTotal / quantite;
  }, [quantite, coutTotal]);

  // Récupérer les emplacements
  const { emplacements, loading: loadingEmplacements } = useEmplacements({ status: true });

  // Récupérer le stock par emplacement pour l'élément sélectionné
  const { stockByEmplacement, loading: loadingStock } = useStockByEmplacement(
    selectedElement?.id
  );

  // Emplacements disponibles pour la source (uniquement ceux avec stock > 0)
  const sourceEmplacements = useMemo(() => {
    if (operationType === TRANSACTION_TYPES.ENTREE) {
      return emplacements;
    }
    // Pour sortie et transfert, uniquement les emplacements avec stock
    return stockByEmplacement.map((stock) => ({
      id: stock.emplacementId,
      denomination: stock.emplacementNom,
      type: stock.type,
      quantite_disponible: stock.quantite,
    }));
  }, [operationType, emplacements, stockByEmplacement]);

  // Emplacements disponibles pour la destination
  const destEmplacements = useMemo(() => {
    if (operationType === TRANSACTION_TYPES.TRANSFERT && sourceEmplacement) {
      // Exclure l'emplacement source
      return emplacements.filter((emp) => emp.id !== sourceEmplacement.id);
    }
    return emplacements;
  }, [operationType, emplacements, sourceEmplacement]);

  // Mettre à jour le stock disponible quand on change d'emplacement source
  useEffect(() => {
    if (sourceEmplacement && (operationType === TRANSACTION_TYPES.SORTIE || operationType === TRANSACTION_TYPES.TRANSFERT)) {
      const stockInfo = stockByEmplacement.find(
        (s) => s.emplacementId === sourceEmplacement.id
      );
      if (stockInfo) {
        setSourceEmplacement(sourceEmplacement, stockInfo.quantite);
      }
    }
  }, [sourceEmplacement, stockByEmplacement, operationType, setSourceEmplacement]);

  const handleSourceChange = (emplacementId) => {
    const emplacement = sourceEmplacements.find((emp) => emp.id === emplacementId);
    if (emplacement) {
      const stockInfo = stockByEmplacement.find((s) => s.emplacementId === emplacementId);
      setSourceEmplacement(emplacement, stockInfo?.quantite || 0);
      clearError("sourceEmplacement");
    }
  };

  const handleDestChange = (emplacementId) => {
    const emplacement = destEmplacements.find((emp) => emp.id === emplacementId);
    if (emplacement) {
      setDestEmplacement(emplacement);
      clearError("destEmplacement");
    }
  };

  const handleQuantiteChange = (e) => {
    setQuantite(e.target.value);
    clearError("quantite");
  };

  const handleCoutTotalChange = (e) => {
    setCoutTotal(e.target.value);
    clearError("coutTotal");
  };

  const handleMotifChange = (e) => {
    setMotif(e.target.value);
  };

  if (loadingEmplacements || loadingStock) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Configuration de l'opération</h2>
        <p className="text-muted-foreground">
          Renseignez les détails de l'opération
        </p>
      </div>

      {/* Info article */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center overflow-hidden">
              {selectedElement?.imgURL ? (
                <img
                  src={selectedElement.imgURL}
                  alt={selectedElement.denomination}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{selectedElement?.denomination}</h3>
              <p className="text-sm text-muted-foreground">
                Stock total: {selectedElement?.quantite_actuelle || 0}{" "}
                {selectedElement?.unite?.symbol}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche - Emplacements */}
        <div className="space-y-4">
          {/* Emplacement source (pour sortie et transfert) */}
          {(operationType === TRANSACTION_TYPES.SORTIE ||
            operationType === TRANSACTION_TYPES.TRANSFERT) && (
            <div className="space-y-2">
              <Label htmlFor="source-emplacement">
                <MapPin className="h-4 w-4 inline mr-2" />
                Emplacement source
              </Label>
              <Select
                value={sourceEmplacement?.id || ""}
                onValueChange={handleSourceChange}
              >
                <SelectTrigger
                  id="source-emplacement"
                  className={cn(errors.sourceEmplacement && "border-red-500")}
                >
                  <SelectValue placeholder="Sélectionner l'emplacement source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceEmplacements.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{emp.denomination}</span>
                        {emp.quantite_disponible !== undefined && (
                          <Badge variant="outline" className="ml-2">
                            {emp.quantite_disponible} {selectedElement?.unite?.symbol}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sourceEmplacement && (
                <p className="text-sm text-red-500">{errors.sourceEmplacement}</p>
              )}

              {sourceEmplacement && availableStock > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Stock disponible: <strong>{availableStock}</strong>{" "}
                    {selectedElement?.unite?.symbol}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Emplacement destination (pour entrée et transfert) */}
          {(operationType === TRANSACTION_TYPES.ENTREE ||
            operationType === TRANSACTION_TYPES.TRANSFERT) && (
            <div className="space-y-2">
              <Label htmlFor="dest-emplacement">
                <MapPin className="h-4 w-4 inline mr-2" />
                Emplacement destination
              </Label>
              <Select
                value={destEmplacement?.id || ""}
                onValueChange={handleDestChange}
              >
                <SelectTrigger
                  id="dest-emplacement"
                  className={cn(errors.destEmplacement && "border-red-500")}
                >
                  <SelectValue placeholder="Sélectionner l'emplacement destination" />
                </SelectTrigger>
                <SelectContent>
                  {destEmplacements.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.denomination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destEmplacement && (
                <p className="text-sm text-red-500">{errors.destEmplacement}</p>
              )}
            </div>
          )}
        </div>

        {/* Colonne droite - Quantité et Prix */}
        <div className="space-y-4">
          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="quantite">
              <Package className="h-4 w-4 inline mr-2" />
              Quantité ({selectedElement?.unite?.symbol})
            </Label>
            <Input
              id="quantite"
              type="number"
              min="0"
              step="0.01"
              value={quantite}
              onChange={handleQuantiteChange}
              placeholder="Entrez la quantité"
              className={cn(errors.quantite && "border-red-500")}
            />
            {errors.quantite && (
              <p className="text-sm text-red-500">{errors.quantite}</p>
            )}

            {/* Alerte si quantité proche du stock disponible */}
            {operationType !== TRANSACTION_TYPES.ENTREE &&
              quantite > 0 &&
              availableStock > 0 &&
              quantite > availableStock * 0.8 &&
              quantite <= availableStock && (
                <Alert variant="warning" className="bg-orange-50 border-orange-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Attention: vous utilisez plus de 80% du stock disponible
                  </AlertDescription>
                </Alert>
              )}
          </div>

          {/* Coût total (uniquement pour les entrées) */}
          {operationType === TRANSACTION_TYPES.ENTREE && (
            <div className="space-y-2">
              <Label htmlFor="cout-total">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Coût total d'achat (FCFA)
              </Label>
              <Input
                id="cout-total"
                type="number"
                min="0"
                step="1"
                value={coutTotal}
                onChange={handleCoutTotalChange}
                placeholder="Entrez le coût total d'achat"
                className={cn(errors.coutTotal && "border-red-500")}
              />
              {errors.coutTotal && (
                <p className="text-sm text-red-500">{errors.coutTotal}</p>
              )}

              {/* Calcul automatique du prix unitaire */}
              {quantite > 0 && coutTotal > 0 && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Prix unitaire calculé:{" "}
                    <strong>
                      {prixUnitaire.toLocaleString()}{" "}
                      FCFA/{selectedElement?.unite?.symbol || "unité"}
                    </strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Motif */}
      <div className="space-y-2">
        <Label htmlFor="motif">
          Motif{" "}
          {operationType === TRANSACTION_TYPES.SORTIE && (
            <span className="text-red-500">*</span>
          )}
        </Label>
        <Textarea
          id="motif"
          value={motif}
          onChange={handleMotifChange}
          placeholder={
            operationType === TRANSACTION_TYPES.ENTREE
              ? "Ex: Réapprovisionnement fournisseur XYZ"
              : operationType === TRANSACTION_TYPES.SORTIE
              ? "Ex: Utilisation pour production, perte, casse..."
              : "Ex: Réorganisation des stocks, transfert vers point de vente..."
          }
          rows={3}
          className={cn(
            operationType === TRANSACTION_TYPES.SORTIE &&
              !motif &&
              "border-orange-300"
          )}
        />
        {operationType === TRANSACTION_TYPES.SORTIE && !motif && (
          <p className="text-sm text-orange-600">
            Le motif est fortement recommandé pour les sorties de stock
          </p>
        )}
      </div>
    </div>
  );
};

export default Step3ConfigureOperation;
