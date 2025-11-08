/**
 * MobileDashboard.jsx
 * Version mobile du dashboard stock (À IMPLÉMENTER)
 */

import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

const MobileDashboard = () => {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">Mobile Dashboard</p>
          <p className="text-sm text-muted-foreground">
            Scroll vertical avec KPIs et graphiques compacts
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDashboard;
