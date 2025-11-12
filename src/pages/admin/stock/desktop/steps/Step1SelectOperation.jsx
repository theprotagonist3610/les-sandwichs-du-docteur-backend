/**
 * Step1SelectOperation.jsx
 * Étape 1: Sélection du type d'opération (ENTREE, SORTIE, TRANSFERT)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PackagePlus,
  PackageMinus,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { useOperationStockStore, selectOperationType } from "@/stores/operationStockStore";
import { TRANSACTION_TYPES } from "@/toolkits/admin/stockToolkit";
import { cn } from "@/lib/utils";

const operationTypes = [
  {
    type: TRANSACTION_TYPES.ENTREE,
    title: "Entrée de Stock",
    description: "Ajouter du stock depuis un fournisseur ou une production",
    icon: PackagePlus,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    hoverColor: "hover:bg-green-100",
  },
  {
    type: TRANSACTION_TYPES.SORTIE,
    title: "Sortie de Stock",
    description: "Retirer du stock pour utilisation, perte ou vente",
    icon: PackageMinus,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    hoverColor: "hover:bg-orange-100",
  },
  {
    type: TRANSACTION_TYPES.TRANSFERT,
    title: "Transfert",
    description: "Déplacer du stock entre deux emplacements",
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverColor: "hover:bg-blue-100",
  },
];

const Step1SelectOperation = () => {
  const operationType = useOperationStockStore(selectOperationType);
  const setOperationType = useOperationStockStore((state) => state.setOperationType);

  const handleSelectOperation = (type) => {
    setOperationType(type);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Type d'opération</h2>
        <p className="text-muted-foreground">
          Sélectionnez le type d'opération de stock que vous souhaitez effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {operationTypes.map((op) => {
          const Icon = op.icon;
          const isSelected = operationType === op.type;

          return (
            <Card
              key={op.type}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                isSelected
                  ? `ring-2 ring-offset-2 ${op.borderColor.replace("border", "ring")}`
                  : "hover:border-primary",
                op.borderColor
              )}
              onClick={() => handleSelectOperation(op.type)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={cn(
                      "relative p-4 rounded-full",
                      op.bgColor,
                      op.hoverColor
                    )}
                  >
                    <Icon className={cn("h-12 w-12", op.color)} />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1">
                        <CheckCircle2 className="h-6 w-6 text-green-600 fill-white" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">{op.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {op.description}
                    </p>
                  </div>

                  {isSelected && (
                    <Badge variant="default" className="mt-2">
                      Sélectionné
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {operationType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-center text-blue-800">
            ✓ Opération{" "}
            <strong>
              {operationTypes.find((op) => op.type === operationType)?.title}
            </strong>{" "}
            sélectionnée. Cliquez sur Suivant pour continuer.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step1SelectOperation;
