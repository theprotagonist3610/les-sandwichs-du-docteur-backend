/**
 * MobileStockElements.jsx
 * Vue Mobile de la liste des éléments de stock (À IMPLÉMENTER)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

const MobileStockElements = () => {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">Mobile StockElements</p>
          <p className="text-sm text-muted-foreground">
            Ce composant sera implémenté prochainement
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileStockElements;
