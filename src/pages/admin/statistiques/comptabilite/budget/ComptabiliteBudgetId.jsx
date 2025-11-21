import React, { useMemo, useState, useCallback, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  FileText,
  Coins,
  TrendingUpIcon,
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
import { analyserMotifsLigneBudget } from "@/toolkits/admin/comptabilite/budgetAnalysis";
import { toast } from "sonner";
import KPICard from "@/components/statistics/cards/KPICard";

const ComptabiliteBudgetId = () => {
  const navigate = useNavigate();
  const { budgetId } = useParams();
  const { budget, loading, error, refetch } = useBudgetAvecRealisation(budgetId);
  const { alertes } = useBudgetAlertes(budgetId);

  // État pour l'expansion des lignes et analyse des motifs
  const [expandedLignes, setExpandedLignes] = useState(new Set());
  const [analysesMotifs, setAnalysesMotifs] = useState(new Map());
  const [loadingAnalyses, setLoadingAnalyses] = useState(new Set());

  // Charger l'analyse des motifs pour une ligne
  const chargerAnalyseMotifs = useCallback(async (ligne) => {
    if (!budget || analysesMotifs.has(ligne.compte_id)) return;

    setLoadingAnalyses((prev) => new Set(prev).add(ligne.compte_id));

    try {
      const analyse = await analyserMotifsLigneBudget(ligne, budget.mois);
      setAnalysesMotifs((prev) => new Map(prev).set(ligne.compte_id, analyse));
    } catch (error) {
      console.error("Erreur analyse motifs:", error);
      toast.error("Erreur lors de l'analyse des motifs");
    } finally {
      setLoadingAnalyses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ligne.compte_id);
        return newSet;
      });
    }
  }, [budget, analysesMotifs]);

  // Toggle expansion d'une ligne
  const toggleExpansion = (ligne) => {
    const newExpanded = new Set(expandedLignes);
    
    if (newExpanded.has(ligne.compte_id)) {
      newExpanded.delete(ligne.compte_id);
    } else {
      newExpanded.add(ligne.compte_id);
      // Charger l'analyse si pas déjà fait
      chargerAnalyseMotifs(ligne);
    }
    
    setExpandedLignes(newExpanded);
  };

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
          hint="Montant total planifié pour ce budget. Somme de toutes les lignes budgétaires définies pour la période."
        />

        <KPICard
          title="Réalisé"
          value={`${(budget.montant_total_realise / 1000).toFixed(0)}k FCFA`}
          icon={<Activity className="h-6 w-6" />}
          subtitle={`${budget.taux_realisation_global.toFixed(1)}% du budget`}
          trend={budget.taux_realisation_global < 100 ? "down" : "up"}
          hint="Montant effectivement dépensé à ce jour. Le taux de réalisation indique le pourcentage du budget consommé."
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
          hint="Différence entre le budget prévu et le réalisé. Un écart positif indique que vous êtes sous le budget, un écart négatif signale un dépassement."
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
            {budget.lignes_budget_avec_realisation.map((ligne) => {
              const isExpanded = expandedLignes.has(ligne.compte_id);
              const analyse = analysesMotifs.get(ligne.compte_id);
              const isLoadingAnalyse = loadingAnalyses.has(ligne.compte_id);

              return (
                <div
                  key={ligne.compte_id}
                  className={`border rounded-lg ${getLigneStyle(ligne)}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {ligne.code_ohada} - {ligne.denomination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ligne.nombre_operations} opération{ligne.nombre_operations > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-2xl font-bold">
                            {ligne.taux_realisation.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Seuil: {ligne.seuil_alerte}%
                          </p>
                        </div>
                        {ligne.nombre_operations > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpansion(ligne)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
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

                  {/* Section expandable: Analyse des motifs */}
                  {isExpanded && (
                    <div className="border-t bg-white/50 p-4">
                      {isLoadingAnalyse ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin text-4xl">⏳</div>
                          <span className="ml-3 text-muted-foreground">Analyse en cours...</span>
                        </div>
                      ) : analyse && analyse.disponible ? (
                        <div className="space-y-4">
                          {/* En-tête analyse */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Analyse des Motifs
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              {analyse.nombreMotifsUniques} motif{analyse.nombreMotifsUniques > 1 ? "s" : ""} unique{analyse.nombreMotifsUniques > 1 ? "s" : ""}
                            </div>
                          </div>

                          {/* Motif dominant */}
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 mb-1">Motif Dominant</p>
                            <p className="font-semibold text-blue-900 truncate" title={analyse.motifDominant.motif}>
                              {analyse.motifDominant.motif}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-blue-700">
                                {analyse.motifDominant.montantTotal.toLocaleString()} FCFA
                              </span>
                              <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                                {analyse.motifDominant.pourcentage.toFixed(1)}% du budget
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {analyse.motifDominant.nombreOperations} op.
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Top 5 Plus Courants */}
                            <div>
                              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <TrendingUpIcon className="h-4 w-4 text-green-600" />
                                Top 5 Plus Fréquents
                              </h5>
                              <div className="space-y-2">
                                {analyse.top5Courants.map((motif, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium truncate flex-1 pr-2" title={motif.motif}>
                                        {idx + 1}. {motif.motif}
                                      </span>
                                      <span className="text-green-600 font-semibold whitespace-nowrap">
                                        {motif.nombreOperations} fois
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground">
                                      <span>{motif.montantTotal.toLocaleString()} FCFA</span>
                                      <span>{motif.pourcentageOccurrences.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Top 5 Plus Gourmands */}
                            <div>
                              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Coins className="h-4 w-4 text-orange-600" />
                                Top 5 Plus Gourmands
                              </h5>
                              <div className="space-y-2">
                                {analyse.top5Gourmands.map((motif, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium truncate flex-1 pr-2" title={motif.motif}>
                                        {idx + 1}. {motif.motif}
                                      </span>
                                      <span className="text-orange-600 font-semibold whitespace-nowrap">
                                        {(motif.montantTotal / 1000).toFixed(0)}k FCFA
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground">
                                      <span>{motif.nombreOperations} op. × {motif.montantMoyen.toLocaleString()}</span>
                                      <span>{motif.pourcentageMontant.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          {analyse?.raison || "Aucune analyse disponible"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteBudgetId;
