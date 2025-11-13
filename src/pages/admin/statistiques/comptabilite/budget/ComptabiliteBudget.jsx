import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ComptabiliteBudget = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8" />
            Budgets Prévisionnels
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Gestion et suivi de vos budgets mensuels
          </p>
        </div>

        <Button
          onClick={() => navigate("/admin/statistiques/comptabilite/budget/creer")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un budget
        </Button>
      </div>

      {/* Liste des budgets - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Budgets en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 opacity-70">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun budget créé</p>
            <p className="text-sm mb-4">
              Commencez par créer votre premier budget prévisionnel
            </p>
            <Button
              variant="outline"
              onClick={() =>
                navigate("/admin/statistiques/comptabilite/budget/creer")
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un budget
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">
                Fonctionnalité en développement
              </p>
              <p className="text-sm text-blue-700">
                Le module de budget prévisionnel permettra de définir des objectifs
                financiers mensuels et de suivre leur réalisation en temps réel.
                Vous pourrez créer des budgets par catégorie de compte et recevoir
                des alertes lorsque vous approchez des limites.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteBudget;
