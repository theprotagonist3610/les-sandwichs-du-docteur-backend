/**
 * MobileStockElement.jsx
 * Vue Mobile du détail d'un élément de stock (À IMPLÉMENTER)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

const MobileStockElement = () => {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">Mobile StockElement</p>
          <p className="text-sm text-muted-foreground">
            Version mobile avec tabs
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileStockElement;
