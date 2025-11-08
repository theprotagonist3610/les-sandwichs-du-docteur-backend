/**
 * DesktopEmplacement.jsx
 * Vue Desktop du détail d'un emplacement (À IMPLÉMENTER)
 */

import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const DesktopEmplacement = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">Desktop Emplacement Detail</p>
          <p className="text-muted-foreground">
            Ce composant sera implémenté avec :
          </p>
          <ul className="text-sm text-left max-w-md mx-auto mt-4 space-y-1">
            <li>• Informations & Édition</li>
            <li>• Position et carte interactive</li>
            <li>• Gestion vendeur et horaires</li>
            <li>• Stock local de l'emplacement</li>
            <li>• Actions rapides (ajout/retrait/transfert)</li>
            <li>• Historique des opérations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopEmplacement;
