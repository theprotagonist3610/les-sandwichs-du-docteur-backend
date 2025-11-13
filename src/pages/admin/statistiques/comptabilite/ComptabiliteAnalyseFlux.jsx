import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, PieChart, Info } from "lucide-react";

const ComptabiliteAnalyseFlux = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GitBranch className="h-8 w-8" />
          Analyse de Flux
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Visualisation des flux de trésorerie
        </p>
      </div>

      {/* Sankey Diagram - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Diagramme de Sankey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 opacity-70">
            <GitBranch className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">
              Diagramme de flux en développement
            </p>
            <p className="text-sm max-w-md mx-auto">
              Le diagramme de Sankey visualisera les flux entre vos comptes de
              trésorerie et vos catégories de dépenses/revenus
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Répartition par catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entrées par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 opacity-70">
              <p>Graphique circulaire en développement</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sorties par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 opacity-70">
              <p>Graphique circulaire en développement</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-900 mb-1">
                Analyse de Flux Interactive
              </p>
              <p className="text-sm text-purple-700">
                Cette page permettra d'explorer visuellement vos flux financiers.
                Cliquez sur une catégorie pour voir le détail de toutes les
                opérations associées. Exportez les données en PDF ou Excel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteAnalyseFlux;
