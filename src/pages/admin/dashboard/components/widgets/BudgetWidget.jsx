import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import { useBudgetByMois, formatMonthKey } from "@/toolkits/admin/comptabiliteToolkit";

/**
 * Widget de résumé budgétaire pour le dashboard
 * Affiche le budget du mois en cours avec statistiques clés
 */
const BudgetWidget = ({ onViewMore }) => {
  // Récupérer le budget du mois en cours
  const moisActuel = formatMonthKey();
  const { budget, loading, error } = useBudgetByMois(moisActuel);

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!budget) {
      return {
        montantTotal: 0,
        comptesActifs: 0,
        comptesInactifs: 0,
        topComptes: [],
      };
    }

    // Séparer comptes actifs et inactifs selon le seuil d'alerte
    const comptesActifs = budget.lignes_budget.filter(
      (ligne) => ligne.seuil_alerte < 100
    );
    const comptesInactifs = budget.lignes_budget.filter(
      (ligne) => ligne.seuil_alerte >= 100
    );

    // Top 3 comptes par montant
    const topComptes = [...budget.lignes_budget]
      .sort((a, b) => b.montant_previsionnel - a.montant_previsionnel)
      .slice(0, 3)
      .map((ligne) => ({
        ...ligne,
        pourcentage: (
          (ligne.montant_previsionnel / budget.montant_total_previsionnel) *
          100
        ).toFixed(1),
      }));

    return {
      montantTotal: budget.montant_total_previsionnel,
      comptesActifs: comptesActifs.length,
      comptesInactifs: comptesInactifs.length,
      topComptes,
    };
  }, [budget]);

  // Format du mois lisible
  const formatMoisReadable = (moisKey) => {
    const mm = parseInt(moisKey.substring(0, 2));
    const yyyy = moisKey.substring(2, 6);
    const moisNoms = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return `${moisNoms[mm - 1]} ${yyyy}`;
  };

  // État de chargement
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Budget Prévisionnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Erreur ou pas de budget
  if (error || !budget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Budget Prévisionnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground mb-1">
              Aucun budget actif pour {formatMoisReadable(moisActuel)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Créez un budget pour suivre vos dépenses
            </p>
            {onViewMore && (
              <Button variant="outline" size="sm" onClick={onViewMore}>
                Créer un budget
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Budget Prévisionnel
          </CardTitle>
          {onViewMore && (
            <Button variant="ghost" size="sm" onClick={onViewMore}>
              Voir détails
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {budget.nom}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Montant Total */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Montant Total</p>
          <p className="text-2xl font-bold text-blue-900">
            {stats.montantTotal.toLocaleString()} FCFA
          </p>
        </div>

        {/* Statistiques des comptes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 mb-1">Comptes suivis</p>
            <p className="text-xl font-bold text-green-900">
              {stats.comptesActifs}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-700 mb-1">Lignes totales</p>
            <p className="text-xl font-bold text-gray-900">
              {budget.lignes_budget.length}
            </p>
          </div>
        </div>

        {/* Top Comptes */}
        {stats.topComptes.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Top Comptes</h4>
            </div>
            <div className="space-y-2">
              {stats.topComptes.map((compte, index) => (
                <div key={compte.compte_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="truncate text-xs" title={compte.denomination}>
                      {compte.denomination}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs font-medium">
                      {(compte.montant_previsionnel / 1000).toFixed(0)}k
                    </span>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">
                      {compte.pourcentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badge de statut */}
        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Mois : {formatMoisReadable(budget.mois)}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            budget.statut === "actif"
              ? "bg-green-100 text-green-700"
              : budget.statut === "archive"
              ? "bg-gray-100 text-gray-700"
              : "bg-red-100 text-red-700"
          }`}>
            {budget.statut === "actif" ? "Actif" : 
             budget.statut === "archive" ? "Archivé" : "Dépassé"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetWidget;
