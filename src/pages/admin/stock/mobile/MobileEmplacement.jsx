/**
 * MobileEmplacement.jsx
 * Vue Mobile du détail d'un emplacement (À IMPLÉMENTER)
 */

import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const MobileEmplacement = () => {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">Mobile Emplacement</p>
          <p className="text-sm text-muted-foreground">
            Version mobile avec tabs pour les différentes sections
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileEmplacement;
