import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Archive,
  Trash,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Activity,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useBudgetAvecRealisation, useBudgetAlertes } from "@/toolkits/admin/comptabiliteToolkit";
import { archiverBudget, deleteBudget } from "@/toolkits/admin/comptabilite/budgets";
import { toast } from "sonner";
import KPICard from "@/components/statistics/cards/KPICard";

const ComptabiliteBudgetId = () => {
  const navigate = useNavigate();
  const { budgetId } = useParams();
  const { budget, loading, error, refetch } = useBudgetAvecRealisation(budgetId);
  const { alertes } = useBudgetAlertes(budgetId);

  // Formater le mois
  const formatMois = (moisKey) => {
    const mois = parseInt(moisKey.substring(0, 2));
    const annee = moisKey.substring(2, 6);
    const moisNoms = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    return `${moisNoms[mois - 1]} ${annee}`;
  };

  // Données pour le graphique en barres
  const dataBarChart = useMemo(() => {
    if (!budget || !budget.lignes_budget_avec_realisation) return [];

    return budget.lignes_budget_avec_realisation.map((ligne) => ({
      nom: ligne.denomination.length > 20
        ? ligne.denomination.substring(0, 20) + "..."
        : ligne.denomination,
      previsionnel: ligne.montant_previsionnel,
      realise: ligne.montant_realise,
      code: ligne.code_ohada,
    }));
  }, [budget]);

  // Données pour le graphique circulaire
  const dataPieChart = useMemo(() => {
    if (!budget || !budget.lignes_budget_avec_realisation) return [];

    return budget.lignes_budget_avec_realisation
      .map((ligne) => ({
        name: `${ligne.code_ohada} - ${ligne.denomination}`,
        value: ligne.montant_previsionnel,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8
  }, [budget]);

  const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
  ];

  // Style du badge statut
  const getStatutBadge = (statut) => {
    const styles = {
      actif: { label: "Actif", className: "bg-green-500" },
      archive: { label: "Archivé", className: "bg-gray-500" },
      depasse: { label: "Dépassé", className: "bg-red-500" },
    };
    return styles[statut] || styles.actif;
  };

  // Style de la ligne selon le taux de réalisation
  const getLigneStyle = (ligne) => {
    if (ligne.taux_realisation < ligne.seuil_alerte) {
      return "bg-green-50 border-green-200";
    } else if (ligne.taux_realisation < 100) {
      return "bg-orange-50 border-orange-200";
    } else {
      return "bg-red-50 border-red-200";
    }
  };

  // Archiver le budget
  const handleArchive = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir archiver ce budget ?")) {
      return;
    }

    try {
      await archiverBudget(budgetId);
      toast.success("Budget archivé avec succès");
      refetch();
    } catch (error) {
      console.error("❌ Erreur archivage:", error);
      toast.error(error.message || "Erreur lors de l'archivage");
    }
  };

  // Supprimer le budget
  const handleDelete = async () => {
    if (!window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer définitivement ce budget ? Cette action est irréversible.")) {
      return;
    }

    try {
      await deleteBudget(budgetId);
      toast.success("Budget supprimé");
      navigate("/admin/statistiques/comptabilite/budget");
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin text-6xl">⏳</div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Erreur de chargement</p>
                <p className="text-sm text-red-700">
                  {error?.message || "Budget introuvable"}
                </p>
              </div>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() => navigate("/admin/statistiques/comptabilite/budget")}
              >
                Retour à la liste
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const badgeInfo = getStatutBadge(budget.statut);

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                {formatMois(budget.mois)}
              </h1>
              <Badge className={badgeInfo.className}>{badgeInfo.label}</Badge>
            </div>
            <p className="text-sm opacity-70 mt-1">{budget.nom}</p>
            {budget.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {budget.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {budget.statut === "actif" && (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {alertes && alertes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-2">
                  {alertes.length} alerte{alertes.length > 1 ? "s" : ""} active{alertes.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-1 text-sm">
                  {alertes.map((alerte, idx) => (
                    <div key={idx} className="text-red-700">
                      <strong>{alerte.denomination}</strong> :{" "}
                      {alerte.taux_realisation.toFixed(1)}% réalisé
                      {alerte.depassement && " (dépassé)"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Budget Total"
          value={`${(budget.montant_total_previsionnel / 1000).toFixed(0)}k FCFA`}
          icon={<Target className="h-6 w-6" />}
          subtitle="Montant prévisionnel"
        />

        <KPICard
          title="Réalisé"
          value={`${(budget.montant_total_realise / 1000).toFixed(0)}k FCFA`}
          icon={<Activity className="h-6 w-6" />}
          subtitle={`${budget.taux_realisation_global.toFixed(1)}% du budget`}
          trend={budget.taux_realisation_global < 100 ? "down" : "up"}
        />

        <KPICard
          title="Écart"
          value={`${((budget.montant_total_previsionnel - budget.montant_total_realise) / 1000).toFixed(0)}k FCFA`}
          icon={
            budget.montant_total_realise <= budget.montant_total_previsionnel
              ? <TrendingDown className="h-6 w-6" />
              : <TrendingUp className="h-6 w-6" />
          }
          subtitle={
            budget.montant_total_realise <= budget.montant_total_previsionnel
              ? "Sous le budget"
              : "Dépassement"
          }
          trend={
            budget.montant_total_realise <= budget.montant_total_previsionnel
              ? "down"
              : "up"
          }
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en barres */}
        <Card>
          <CardHeader>
            <CardTitle>Prévu vs Réalisé</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataBarChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="nom"
                  stroke="#6b7280"
                  style={{ fontSize: "11px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                />
                <Legend />
                <Bar dataKey="previsionnel" fill="#3b82f6" name="Prévisionnel" />
                <Bar dataKey="realise" fill="#10b981" name="Réalisé" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique circulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition Budgétaire (Top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataPieChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name.split(" - ")[0]}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataPieChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Lignes Budgétaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budget.lignes_budget_avec_realisation.map((ligne) => (
              <div
                key={ligne.compte_id}
                className={`p-4 border rounded-lg ${getLigneStyle(ligne)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">
                      {ligne.code_ohada} - {ligne.denomination}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ligne.nombre_operations} opération{ligne.nombre_operations > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {ligne.taux_realisation.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seuil: {ligne.seuil_alerte}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Prévisionnel</p>
                    <p className="font-semibold">
                      {ligne.montant_previsionnel.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Réalisé</p>
                    <p className="font-semibold">
                      {ligne.montant_realise.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Écart</p>
                    <p className={`font-semibold ${ligne.montant_realise > ligne.montant_previsionnel ? "text-red-600" : "text-green-600"}`}>
                      {ligne.montant_realise <= ligne.montant_previsionnel ? "-" : "+"}
                      {Math.abs(ligne.montant_previsionnel - ligne.montant_realise).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${ligne.taux_realisation >= 100
                          ? "bg-red-500"
                          : ligne.taux_realisation >= ligne.seuil_alerte
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                      style={{
                        width: `${Math.min(ligne.taux_realisation, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteBudgetId;
