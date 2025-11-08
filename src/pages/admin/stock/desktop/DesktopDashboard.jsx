/**
 * DesktopDashboard.jsx
 * Dashboard global du stock et emplacements (À IMPLÉMENTER)
 */

import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

const DesktopDashboard = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <LayoutDashboard className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">Dashboard Stock</p>
          <p className="text-muted-foreground">
            Vue d'ensemble avec :
          </p>
          <ul className="text-sm text-left max-w-md mx-auto mt-4 space-y-1">
            <li>• KPIs principaux (Valeur, Emplacements, Alertes, Opérations)</li>
            <li>• Graphiques d'évolution et répartition</li>
            <li>• Articles à réapprovisionner</li>
            <li>• Dernières transactions</li>
            <li>• Aperçu emplacements</li>
            <li>• Queue d'opérations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopDashboard;
