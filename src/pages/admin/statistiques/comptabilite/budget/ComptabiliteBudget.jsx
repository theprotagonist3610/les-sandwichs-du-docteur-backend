import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Plus, Calendar, TrendingUp, AlertCircle, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBudgetsList } from "@/toolkits/admin/comptabiliteToolkit";

const ComptabiliteBudget = () => {
  const navigate = useNavigate();
  const { budgets, loading, error } = useBudgetsList();
  const [filtreStatut, setFiltreStatut] = useState("tous");

  // Filtrer les budgets
  const budgetsFiltres = useMemo(() => {
    if (filtreStatut === "tous") return budgets;
    return budgets.filter((b) => b.statut === filtreStatut);
  }, [budgets, filtreStatut]);

  // Formater le mois (MMYYYY -> "Janvier 2025")
  const formatMois = (moisKey) => {
    const mois = parseInt(moisKey.substring(0, 2));
    const annee = moisKey.substring(2, 6);
    const moisNoms = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${moisNoms[mois - 1]} ${annee}`;
  };

  // Style du badge statut
  const getStatutBadge = (statut) => {
    const styles = {
      actif: { variant: "default", label: "Actif", className: "bg-green-500" },
      archive: { variant: "secondary", label: "Archivé", className: "bg-gray-500" },
      depasse: { variant: "destructive", label: "Dépassé", className: "bg-red-500" },
    };
    return styles[statut] || styles.actif;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin text-6xl">⏳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Erreur de chargement</p>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 font-bold flex items-center gap-3">
            <Target className="h-8 w-8" />
            Budgets Prévisionnels
          </h1>
        </div>
        <Button
          onClick={() => navigate("/admin/statistiques/comptabilite/budget/creer")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un budget
        </Button>
      </div>
      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Statut :</label>
            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
                <SelectItem value="depasse">Dépassé</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 text-right text-sm opacity-70">
              {budgetsFiltres.length} budget{budgetsFiltres.length > 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des budgets */}
      {budgetsFiltres.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center opacity-70">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {filtreStatut === "tous"
                  ? "Aucun budget créé"
                  : `Aucun budget ${filtreStatut}`}
              </p>
              <p className="text-sm mb-4">
                {filtreStatut === "tous"
                  ? "Commencez par créer votre premier budget prévisionnel"
                  : "Changez le filtre pour voir d'autres budgets"}
              </p>
              {filtreStatut === "tous" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate("/admin/statistiques/comptabilite/budget/creer")
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un budget
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetsFiltres.map((budget) => {
            const badgeInfo = getStatutBadge(budget.statut);

            return (
              <Card
                key={budget.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  navigate(`/admin/statistiques/comptabilite/budget/${budget.id}`)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {formatMois(budget.mois)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {budget.nom}
                      </p>
                    </div>
                    <Badge className={badgeInfo.className}>
                      {badgeInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Montant prévisionnel */}
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Budget prévisionnel
                      </p>
                      <p className="text-2xl font-bold">
                        {(budget.montant_total_previsionnel / 1000).toFixed(0)}k FCFA
                      </p>
                    </div>

                    {/* Nombre de lignes */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="opacity-70">Lignes budgétaires</span>
                      <span className="font-medium">
                        {budget.lignes_budget.length}
                      </span>
                    </div>

                    {/* Description */}
                    {budget.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {budget.description}
                      </p>
                    )}

                    {/* Bouton voir détails */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/statistiques/comptabilite/budget/${budget.id}`);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Voir le suivi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      {budgets.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">
                  Budgets prévisionnels mensuels
                </p>
                <p className="text-sm text-blue-700">
                  Le module de budget prévisionnel permet de définir des objectifs
                  financiers mensuels par catégorie de compte et de suivre leur
                  réalisation en temps réel. Vous recevrez des alertes visuelles
                  lorsque vous approchez ou dépassez les limites définies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComptabiliteBudget;
