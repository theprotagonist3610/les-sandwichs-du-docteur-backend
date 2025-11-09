/**
 * MobileOperationDeStock.jsx
 * Version mobile pour les opérations de stock (stepper)
 */

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";

const MobileOperationDeStock = () => {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">Mobile Opération</p>
          <p className="text-sm text-muted-foreground">
            Stepper vertical pour mobile
          </p>
          <ul className="text-xs text-left max-w-md mx-auto mt-4 space-y-1 text-muted-foreground">
            <li>• Sélection type d'opération</li>
            <li>• Sélection élément/emplacement</li>
            <li>• Saisie quantité et motif</li>
            <li>• Confirmation et validation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileOperationDeStock;
