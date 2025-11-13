import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const ComptabiliteBudgetId = () => {
  const navigate = useNavigate();
  const { budgetId } = useParams();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/statistiques/comptabilite/budget")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Détails Budget #{budgetId}</h1>
            <p className="text-sm opacity-70 mt-1">Suivi détaillé du budget</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Trash className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Contenu - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 opacity-70">
            <p className="text-lg font-medium mb-2">
              Page de détails en développement
            </p>
            <p className="text-sm">
              Suivi du budget avec indicateurs de progression et alertes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteBudgetId;
