import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ComptabiliteBudgetCreer = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/admin/statistiques/comptabilite/budget")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer un Budget</h1>
          <p className="text-sm opacity-70 mt-1">
            Définissez un nouveau budget prévisionnel
          </p>
        </div>
      </div>

      {/* Formulaire - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration du Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 opacity-70">
            <p className="text-lg font-medium mb-2">Formulaire en développement</p>
            <p className="text-sm mb-4">
              Bientôt disponible : Création de budgets prévisionnels par catégorie
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/statistiques/comptabilite/budget")}
        >
          Annuler
        </Button>
        <Button disabled>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default ComptabiliteBudgetCreer;
