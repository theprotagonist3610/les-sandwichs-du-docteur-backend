import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  AlertCircle,
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { usePrevisions } from "@/toolkits/admin/comptabiliteToolkit";
import KPICard from "@/components/statistics/cards/KPICard";

const ComptabilitePrevisions = () => {
  const [periodeAnalyse, setPeriodeAnalyse] = useState("3"); // 1, 3, ou 6 mois
  const [scenario, setScenario] = useState("realiste");

  // Charger les prévisions
  const { previsions, loading, error, refetch } = usePrevisions(
    parseInt(periodeAnalyse),
    parseInt(periodeAnalyse) === 6 ? 12 : 6
  );

  // Données pour les graphiques de tendances
  const dataTendances = useMemo(() => {
    if (!previsions || !previsions.previsions_par_mois) return [];

    return previsions.previsions_par_mois.map((mois) => {
      let entrees, sorties, solde;

      if (scenario === "pessimiste") {
        entrees = mois.total_entrees_pessimiste;
        sorties = mois.total_sorties_pessimiste;
        solde = mois.solde_pessimiste;
      } else if (scenario === "optimiste") {
        entrees = mois.total_entrees_optimiste;
        sorties = mois.total_sorties_optimiste;
        solde = mois.solde_optimiste;
      } else {
        entrees = mois.total_entrees_prevu;
        sorties = mois.total_sorties_prevu;
        solde = mois.solde_prevu;
      }

      return {
        mois: mois.mois,
        entrees,
        sorties,
        solde,
      };
    });
  }, [previsions, scenario]);

  // Données comparatives (historique vs prévisions)
  const dataComparatif = useMemo(() => {
    if (!previsions || !previsions.historique) return [];

    const historique = previsions.historique.slice(-3).map((h) => ({
      periode: h.mois,
      type: "Historique",
      entrees: h.stats.total_entrees,
      sorties: h.stats.total_sorties,
      solde: h.stats.total_entrees - h.stats.total_sorties,
    }));

    const previsionsData = previsions.previsions_par_mois.map((p) => ({
      periode: p.mois,
      type: "Prévision",
      entrees: p.total_entrees_prevu,
      sorties: p.total_sorties_prevu,
      solde: p.solde_prevu,
    }));

    return [...historique, ...previsionsData];
  }, [previsions]);

  // Top comptes par prévisions
  const topComptesEntrees = useMemo(() => {
    if (!previsions || !previsions.previsions_par_mois || previsions.previsions_par_mois.length === 0) return [];

    const premierMois = previsions.previsions_par_mois[0];
    return premierMois.comptes
      .filter((c) => c.categorie === "entree")
      .sort((a, b) => b.montant_prevu - a.montant_prevu)
      .slice(0, 5);
  }, [previsions]);

  const topComptesSorties = useMemo(() => {
    if (!previsions || !previsions.previsions_par_mois || previsions.previsions_par_mois.length === 0) return [];

    const premierMois = previsions.previsions_par_mois[0];
    return premierMois.comptes
      .filter((c) => c.categorie === "sortie")
      .sort((a, b) => b.montant_prevu - a.montant_prevu)
      .slice(0, 5);
  }, [previsions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-lg opacity-70">Génération des prévisions en cours...</p>
          <p className="text-sm opacity-50 mt-2">Analyse de l'historique et détection des tendances</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Erreur lors de la génération des prévisions</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Assurez-vous d'avoir au moins 3 mois d'historique comptable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!previsions) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center opacity-70">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucune prévision disponible</p>
              <p className="text-sm mt-2">Historique insuffisant pour générer des prévisions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8" />
            Prévisions Intelligentes
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Analyse de tendances et projections financières
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={periodeAnalyse} onValueChange={setPeriodeAnalyse}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mois</SelectItem>
              <SelectItem value="3">3 mois</SelectItem>
              <SelectItem value="6">6 mois</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger className="w-40">
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pessimiste">Pessimiste (-10%)</SelectItem>
              <SelectItem value="realiste">Réaliste</SelectItem>
              <SelectItem value="optimiste">Optimiste (+10%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Comment fonctionnent les prévisions ?</p>
              <p className="opacity-80">
                Les prévisions sont calculées en analysant {previsions.periode_analyse.nb_mois} mois d'historique.
                Le système détecte automatiquement les tendances de croissance/décroissance et la saisonnalité
                de votre activité pour projeter les {periodeAnalyse} prochains mois.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Indicateurs Clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Taux de Croissance"
          value={`${(previsions.indicateurs_cles.taux_croissance_moyen * 100).toFixed(1)}%`}
          icon={previsions.indicateurs_cles.taux_croissance_moyen >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          subtitle="Croissance moyenne mensuelle"
          trend={previsions.indicateurs_cles.taux_croissance_moyen >= 0 ? "up" : "down"}
          hint="Indique si votre activité est en croissance (positif) ou en décroissance (négatif). Calculé sur la base des derniers mois."
        />

        <KPICard
          title="Marge Prévisionnelle"
          value={`${previsions.indicateurs_cles.marge_previsionnelle.toFixed(1)}%`}
          icon={<Activity className="h-6 w-6" />}
          subtitle="Ratio solde/entrées prévu"
          trend={previsions.indicateurs_cles.marge_previsionnelle >= 0 ? "up" : "down"}
          hint="Pourcentage du chiffre d'affaires qui reste après déduction des dépenses. Une marge positive indique une rentabilité."
        />

        <KPICard
          title="Comptes Analysés"
          value={previsions.indicateurs_cles.nombre_comptes_analyses}
          icon={<Target className="h-6 w-6" />}
          subtitle="Postes budgétaires"
          hint="Nombre total de comptes comptables analysés pour générer ces prévisions."
        />
      </div>

      {/* Graphique Comparatif Historique vs Prévisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            Historique vs Prévisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={dataComparatif}>
              <defs>
                <linearGradient id="colorEntreesComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSortiesComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="periode"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
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
              <Area
                type="monotone"
                dataKey="entrees"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEntreesComp)"
                name="Entrées (FCFA)"
              />
              <Area
                type="monotone"
                dataKey="sorties"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSortiesComp)"
                name="Sorties (FCFA)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique Prévisions par Mois */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Prévisions Détaillées - Scénario {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataTendances}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mois"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
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
              <Bar dataKey="entrees" fill="#22c55e" name="Entrées Prévues" radius={[8, 8, 0, 0]} />
              <Bar dataKey="sorties" fill="#ef4444" name="Sorties Prévues" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs pour détails par catégorie */}
      <Tabs defaultValue="entrees" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entrees">
            <TrendingUp className="h-4 w-4 mr-2" />
            Prévisions Entrées
          </TabsTrigger>
          <TabsTrigger value="sorties">
            <TrendingDown className="h-4 w-4 mr-2" />
            Prévisions Sorties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrees" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 5 Comptes Entrées - Prévisions Mois Prochain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topComptesEntrees.map((compte, index) => {
                  const tauxCroissance = compte.taux_croissance * 100;
                  const montantScenario = scenario === "pessimiste"
                    ? compte.scenario_pessimiste
                    : scenario === "optimiste"
                    ? compte.scenario_optimiste
                    : compte.montant_prevu;

                  return (
                    <div
                      key={compte.compte_id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{compte.denomination}</p>
                            <p className="text-xs text-muted-foreground">{compte.code_ohada}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            {(montantScenario / 1000).toFixed(0)}k FCFA
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {tauxCroissance >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            {tauxCroissance >= 0 ? "+" : ""}{tauxCroissance.toFixed(1)}% /mois
                          </p>
                        </div>
                      </div>

                      {/* Indicateur de saisonnalité */}
                      {compte.facteur_saisonnalite !== 1 && (
                        <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          Facteur saisonnalité: {compte.facteur_saisonnalite.toFixed(2)}x
                          {compte.facteur_saisonnalite > 1 ? " (mois fort)" : " (mois faible)"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sorties" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 5 Comptes Sorties - Prévisions Mois Prochain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topComptesSorties.map((compte, index) => {
                  const tauxCroissance = compte.taux_croissance * 100;
                  const montantScenario = scenario === "pessimiste"
                    ? compte.scenario_pessimiste
                    : scenario === "optimiste"
                    ? compte.scenario_optimiste
                    : compte.montant_prevu;

                  return (
                    <div
                      key={compte.compte_id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{compte.denomination}</p>
                            <p className="text-xs text-muted-foreground">{compte.code_ohada}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-red-600">
                            {(montantScenario / 1000).toFixed(0)}k FCFA
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {tauxCroissance >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            {tauxCroissance >= 0 ? "+" : ""}{tauxCroissance.toFixed(1)}% /mois
                          </p>
                        </div>
                      </div>

                      {/* Indicateur de saisonnalité */}
                      {compte.facteur_saisonnalite !== 1 && (
                        <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          Facteur saisonnalité: {compte.facteur_saisonnalite.toFixed(2)}x
                          {compte.facteur_saisonnalite > 1 ? " (mois fort)" : " (mois faible)"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tableau récapitulatif tous les mois */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Récapitulatif Mensuel - Scénario {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Mois</th>
                  <th className="text-right p-3 font-semibold text-green-600">Entrées Prévues</th>
                  <th className="text-right p-3 font-semibold text-red-600">Sorties Prévues</th>
                  <th className="text-right p-3 font-semibold">Solde Prévu</th>
                  <th className="text-right p-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {dataTendances.map((mois, index) => {
                  const soldeStatus = mois.solde >= 0 ? "Excédent" : "Déficit";
                  return (
                    <tr key={index} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="p-3 font-medium">{mois.mois}</td>
                      <td className="p-3 text-right text-green-600 font-semibold">
                        +{(mois.entrees / 1000).toFixed(0)}k FCFA
                      </td>
                      <td className="p-3 text-right text-red-600 font-semibold">
                        -{(mois.sorties / 1000).toFixed(0)}k FCFA
                      </td>
                      <td className={`p-3 text-right font-bold ${mois.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {mois.solde >= 0 ? "+" : ""}{(mois.solde / 1000).toFixed(0)}k FCFA
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          mois.solde >= 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {soldeStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabilitePrevisions;
