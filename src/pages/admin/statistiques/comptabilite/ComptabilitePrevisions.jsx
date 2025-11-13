import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, AlertTriangle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ComptabilitePrevisions = () => {
  const [horizon, setHorizon] = useState("30");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8" />
            Prévisions Financières
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Projections et anticipation de trésorerie
          </p>
        </div>

        <Select value={horizon} onValueChange={setHorizon}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 jours</SelectItem>
            <SelectItem value="60">60 jours</SelectItem>
            <SelectItem value="90">90 jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prévisions - Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <p className="text-sm opacity-70 mb-2">Projection Entrées</p>
            <p className="text-3xl font-bold text-blue-600">+1.5M FCFA</p>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur tendance {horizon} jours
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-sm opacity-70 mb-2">Projection Sorties</p>
            <p className="text-3xl font-bold text-red-600">-1.2M FCFA</p>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur tendance {horizon} jours
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-6">
            <p className="text-sm opacity-70 mb-2">Solde Prévu</p>
            <p className="text-3xl font-bold text-green-600">+300k FCFA</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dans {horizon} jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique de projection - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution Prévue de la Trésorerie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 opacity-70">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">
              Graphique de projection en développement
            </p>
            <p className="text-sm">
              Visualisation des tendances avec zones d'incertitude (min/max)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">
                Comment sont calculées les prévisions ?
              </p>
              <p className="text-sm text-blue-700">
                Les prévisions sont basées sur une moyenne mobile des 4 dernières
                semaines. L'algorithme analyse vos entrées et sorties récurrentes
                pour projeter votre trésorerie future. Les zones d'incertitude
                (min/max) sont calculées à partir de la variance historique.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes potentielles */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900 mb-1">
                Alerte : Projection en développement
              </p>
              <p className="text-sm text-orange-700">
                Le système d'alertes prévisionnelles vous notifiera automatiquement
                si une rupture de trésorerie est anticipée dans les prochains
                jours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabilitePrevisions;
