/**
 * DesktopOperationDeStock.jsx
 * Création/édition d'opérations de stock (wizard)
 */

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";

const DesktopOperationDeStock = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <ArrowRightLeft className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">Opération de Stock</p>
          <p className="text-muted-foreground">
            Wizard multi-étapes pour :
          </p>
          <ul className="text-sm text-left max-w-md mx-auto mt-4 space-y-1">
            <li>• ENTREE - Ajouter du stock</li>
            <li>• SORTIE - Retirer du stock</li>
            <li>• TRANSFERT - Déplacer entre emplacements</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Ce composant utilisera les fonctions du stockToolkit :
          </p>
          <ul className="text-xs text-left max-w-md mx-auto mt-2 space-y-1 text-muted-foreground">
            <li>• enqueueOperation() pour ajouter à la queue</li>
            <li>• makeTransaction() pour entrées/sorties</li>
            <li>• makeTransfert() pour les transferts</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopOperationDeStock;
