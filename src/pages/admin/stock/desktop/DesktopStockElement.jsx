/**
 * DesktopStockElement.jsx
 * Vue Desktop du détail d'un élément de stock (À IMPLÉMENTER)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

const DesktopStockElement = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">Desktop StockElement Detail</p>
          <p className="text-muted-foreground">
            Ce composant sera implémenté avec :
          </p>
          <ul className="text-sm text-left max-w-md mx-auto mt-4 space-y-1">
            <li>• Informations et statistiques de l'élément</li>
            <li>• Répartition par emplacement</li>
            <li>• Historique des transactions</li>
            <li>• Actions rapides (ajout/retrait/transfert)</li>
            <li>• Graphiques d'évolution</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopStockElement;
