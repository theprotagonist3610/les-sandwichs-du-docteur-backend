import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ComptabiliteComparaisons = () => {
  const [periodeA, setPeriodeA] = useState("semaine-actuelle");
  const [periodeB, setPeriodeB] = useState("semaine-precedente");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Comparaisons Multi-Périodes
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Comparez vos performances financières
          </p>
        </div>

        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Sélecteurs de périodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Période A</p>
            <Select value={periodeA} onValueChange={setPeriodeA}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semaine-actuelle">Semaine actuelle</SelectItem>
                <SelectItem value="mois-actuel">Mois actuel</SelectItem>
                <SelectItem value="trimestre-actuel">Trimestre actuel</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Période B</p>
            <Select value={periodeB} onValueChange={setPeriodeB}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semaine-precedente">
                  Semaine précédente
                </SelectItem>
                <SelectItem value="mois-precedent">Mois précédent</SelectItem>
                <SelectItem value="trimestre-precedent">
                  Trimestre précédent
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Comparaison KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Vue Comparative</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Entrées */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="text-sm opacity-70">Entrées</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-bold">250k FCFA</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-2xl font-bold">217k FCFA</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-lg font-bold">+15%</span>
              </div>
            </div>

            {/* Sorties */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="text-sm opacity-70">Sorties</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-bold">180k FCFA</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-2xl font-bold">196k FCFA</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <ArrowDownRight className="h-5 w-5" />
                <span className="text-lg font-bold">-8%</span>
              </div>
            </div>

            {/* Solde */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="text-sm opacity-70">Solde</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-bold">+70k FCFA</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-2xl font-bold">+21k FCFA</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-lg font-bold">+233%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique comparatif - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Graphique Comparatif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 opacity-70">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Graphique en développement</p>
            <p className="text-sm">
              Visualisation superposée des deux périodes sélectionnées
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Variations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Variations par Compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 opacity-70">
            <p>Tableau des variations en développement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteComparaisons;
