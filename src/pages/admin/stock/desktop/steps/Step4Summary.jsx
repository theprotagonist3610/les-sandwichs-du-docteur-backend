/**
 * Step4Summary.jsx
 * Étape 4: Récapitulatif et validation de l'opération
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  MapPin,
  Hash,
  DollarSign,
  FileText,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  useOperationStockStore,
  selectSummary,
  selectOperationType,
} from "@/stores/operationStockStore";
import { TRANSACTION_TYPES } from "@/toolkits/admin/stockToolkit";

const operationLabels = {
  [TRANSACTION_TYPES.ENTREE]: {
    title: "Entrée de Stock",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: TrendingUp,
  },
  [TRANSACTION_TYPES.SORTIE]: {
    title: "Sortie de Stock",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: TrendingDown,
  },
  [TRANSACTION_TYPES.TRANSFERT]: {
    title: "Transfert",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: ArrowRight,
  },
};

const Step4Summary = () => {
  const summary = useOperationStockStore(selectSummary);
  const operationType = useOperationStockStore(selectOperationType);
  const availableStock = useOperationStockStore((state) => state.availableStock);

  const opConfig = operationLabels[operationType];
  const OpIcon = opConfig?.icon;

  // Calculer le stock prévisionnel
  const currentStock = summary.element?.quantite_actuelle || 0;
  const quantite = parseFloat(summary.quantite) || 0;
  let newStock = currentStock;

  if (operationType === TRANSACTION_TYPES.ENTREE) {
    newStock = currentStock + quantite;
  } else if (operationType === TRANSACTION_TYPES.SORTIE) {
    newStock = currentStock - quantite;
  }
  // Pour transfert, le stock global ne change pas

  const seuil = summary.element?.seuil_alerte || 0;
  const willBeInAlert = seuil > 0 && newStock <= seuil && newStock > 0;
  const willBeInRupture = newStock === 0;

  // Calcul du coût total pour les entrées
  const coutTotal =
    operationType === TRANSACTION_TYPES.ENTREE && summary.prixUnitaire
      ? parseFloat(summary.quantite) * parseFloat(summary.prixUnitaire)
      : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Récapitulatif</h2>
        <p className="text-muted-foreground">
          Vérifiez les informations avant de valider l'opération
        </p>
      </div>

      {/* Type d'opération */}
      <Card className={`${opConfig.bgColor} ${opConfig.borderColor} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3">
            {OpIcon && <OpIcon className={`h-8 w-8 ${opConfig.color}`} />}
            <h3 className={`text-2xl font-bold ${opConfig.color}`}>
              {opConfig.title}
            </h3>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Article */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Article
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {summary.element?.imgURL ? (
                  <img
                    src={summary.element.imgURL}
                    alt={summary.element.denomination}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">
                  {summary.element?.denomination}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Stock actuel: {currentStock} {summary.element?.unite?.symbol}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quantité</span>
                <span className="font-semibold">
                  {quantite} {summary.element?.unite?.symbol}
                </span>
              </div>

              {operationType !== TRANSACTION_TYPES.TRANSFERT && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Stock après opération
                    </span>
                    <span className="font-semibold">
                      {newStock} {summary.element?.unite?.symbol}
                    </span>
                  </div>

                  {willBeInRupture && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Article en rupture après cette opération
                      </AlertDescription>
                    </Alert>
                  )}

                  {willBeInAlert && !willBeInRupture && (
                    <Alert
                      variant="warning"
                      className="bg-orange-50 border-orange-200"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Article en alerte après cette opération (seuil:{" "}
                        {seuil})
                      </AlertDescription>
                    </Alert>
                  )}

                  {operationType === TRANSACTION_TYPES.ENTREE &&
                    newStock > seuil && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Stock suffisant après cette opération
                        </AlertDescription>
                      </Alert>
                    )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emplacements et détails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Détails de l'opération
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Emplacement source */}
            {(operationType === TRANSACTION_TYPES.SORTIE ||
              operationType === TRANSACTION_TYPES.TRANSFERT) &&
              summary.source && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Source</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{summary.source.denomination}</p>
                  </div>
                  {availableStock > 0 && (
                    <p className="text-xs text-muted-foreground pl-6">
                      Stock disponible: {availableStock}{" "}
                      {summary.element?.unite?.symbol}
                    </p>
                  )}
                </div>
              )}

            {/* Flèche pour transfert */}
            {operationType === TRANSACTION_TYPES.TRANSFERT && (
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-blue-600" />
              </div>
            )}

            {/* Emplacement destination */}
            {(operationType === TRANSACTION_TYPES.ENTREE ||
              operationType === TRANSACTION_TYPES.TRANSFERT) &&
              summary.destination && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {summary.destination.denomination}
                    </p>
                  </div>
                </div>
              )}

            <Separator />

            {/* Prix unitaire et coût total (pour entrées) */}
            {operationType === TRANSACTION_TYPES.ENTREE &&
              summary.prixUnitaire && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Prix unitaire
                    </span>
                    <span className="font-medium">
                      {parseFloat(summary.prixUnitaire).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Coût total</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-600 text-lg">
                        {coutTotal.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {/* Motif */}
            {summary.motif && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Motif</span>
                  </div>
                  <p className="text-sm pl-6 italic">{summary.motif}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avertissement final */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Veuillez vérifier toutes les informations avant de valider.
          L'opération sera ajoutée à la file d'attente et exécutée
          automatiquement.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Step4Summary;
