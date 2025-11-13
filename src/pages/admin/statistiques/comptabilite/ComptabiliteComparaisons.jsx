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
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useComparaisonMoisActuel, useComparaisonMois, useComparaisonAnnees, formatMonthKeyReadable } from "@/toolkits/admin/comptabiliteToolkit";
import { formatMonthKey } from "@/toolkits/admin/comptabilite/utils";
import KPICard from "@/components/statistics/cards/KPICard";

const ComptabiliteComparaisons = () => {
  const [modeComparaison, setModeComparaison] = useState("mois"); // mois, mois_custom, annees

  // Pour comparaison mois custom
  const [mois1, setMois1] = useState("");
  const [mois2, setMois2] = useState("");

  // Pour comparaison annuelle
  const currentYear = new Date().getFullYear();
  const [annee1, setAnnee1] = useState(currentYear - 1);
  const [annee2, setAnnee2] = useState(currentYear);

  // Hooks de comparaison
  const { comparaison: compMoisActuel, loading: loadingMoisActuel } = useComparaisonMoisActuel();
  const { comparaison: compMoisCustom, loading: loadingMoisCustom } = useComparaisonMois(mois1, mois2);
  const { comparaison: compAnnees, loading: loadingAnnees } = useComparaisonAnnees(annee1, annee2);

  // Sélectionner les données selon le mode
  const comparaison = modeComparaison === "mois"
    ? compMoisActuel
    : modeComparaison === "mois_custom"
    ? compMoisCustom
    : compAnnees;

  const loading = modeComparaison === "mois"
    ? loadingMoisActuel
    : modeComparaison === "mois_custom"
    ? loadingMoisCustom
    : loadingAnnees;

  // Générer les options de mois pour les sélecteurs
  const moisOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = formatMonthKey(date);
      const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      options.push({ key, label });
    }
    return options;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-lg opacity-70">Chargement de la comparaison...</p>
        </div>
      </div>
    );
  }

  if (!comparaison) {
    return (
      <div className="p-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">Comparaison non disponible</p>
                <p className="text-sm text-orange-700 mt-1">
                  Sélectionnez deux périodes à comparer ou attendez que les données soient chargées.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rendu pour comparaison mensuelle
  if (modeComparaison === "mois" || modeComparaison === "mois_custom") {
    const { periode1, periode2, variations, comptes, top_hausses, top_baisses } = comparaison;

    const variationEntreesPourcent = variations.entrees.pourcentage;
    const variationSortiesPourcent = variations.sorties.pourcentage;
    const variationSolde = variations.solde.absolue;

    // Données pour le graphique de comparaison
    const dataComparaison = [
      {
        categorie: "Entrées",
        [periode1.mois]: periode1.stats.total_entrees,
        [periode2.mois]: periode2.stats.total_entrees,
      },
      {
        categorie: "Sorties",
        [periode1.mois]: periode1.stats.total_sorties,
        [periode2.mois]: periode2.stats.total_sorties,
      },
    ];

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              Comparaisons Multi-Périodes
            </h1>
            <p className="text-sm opacity-70 mt-1">
              Analysez l'évolution de votre activité
            </p>
          </div>

          <Select value={modeComparaison} onValueChange={setModeComparaison}>
            <SelectTrigger className="w-56">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Mois vs Mois Précédent</SelectItem>
              <SelectItem value="mois_custom">Choisir 2 Mois</SelectItem>
              <SelectItem value="annees">Année vs Année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sélecteurs personnalisés pour mois */}
        {modeComparaison === "mois_custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Premier Mois</p>
                <Select value={mois1} onValueChange={setMois1}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {moisOptions.map(opt => (
                      <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Deuxième Mois</p>
                <Select value={mois2} onValueChange={setMois2}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {moisOptions.map(opt => (
                      <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPIs de variation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Variation Entrées"
            value={`${variationEntreesPourcent >= 0 ? "+" : ""}${variationEntreesPourcent.toFixed(1)}%`}
            icon={variationEntreesPourcent >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            subtitle={`${(variations.entrees.absolue / 1000).toFixed(0)}k FCFA`}
            trend={variationEntreesPourcent >= 0 ? "up" : "down"}
            hint={`Les recettes ont ${variationEntreesPourcent >= 0 ? "augmenté" : "diminué"} de ${Math.abs(variationEntreesPourcent).toFixed(1)}% par rapport à la période précédente.`}
          />

          <KPICard
            title="Variation Sorties"
            value={`${variationSortiesPourcent >= 0 ? "+" : ""}${variationSortiesPourcent.toFixed(1)}%`}
            icon={variationSortiesPourcent >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            subtitle={`${(variations.sorties.absolue / 1000).toFixed(0)}k FCFA`}
            trend={variationSortiesPourcent < 0 ? "up" : "down"}
            hint={`Les dépenses ont ${variationSortiesPourcent >= 0 ? "augmenté" : "diminué"} de ${Math.abs(variationSortiesPourcent).toFixed(1)}%. Une baisse des sorties est positive pour votre trésorerie.`}
          />

          <KPICard
            title="Variation Solde"
            value={`${variationSolde >= 0 ? "+" : ""}${(variationSolde / 1000).toFixed(0)}k FCFA`}
            icon={variationSolde >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            subtitle={variationSolde >= 0 ? "Amélioration" : "Détérioration"}
            trend={variationSolde >= 0 ? "up" : "down"}
            hint={`Votre résultat net s'est ${variationSolde >= 0 ? "amélioré" : "détérioré"} de ${Math.abs(variationSolde).toLocaleString()} FCFA. Ceci reflète la performance globale.`}
          />
        </div>

        {/* Graphique de comparaison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparaison Visuelle - {formatMonthKeyReadable(periode1.mois)} vs {formatMonthKeyReadable(periode2.mois)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataComparaison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="categorie" stroke="#6b7280" style={{ fontSize: "12px" }} />
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
                <Bar dataKey={periode1.mois} fill="#3b82f6" name={`Période 1 (${formatMonthKeyReadable(periode1.mois)})`} radius={[8, 8, 0, 0]} />
                <Bar dataKey={periode2.mois} fill="#10b981" name={`Période 2 (${formatMonthKeyReadable(periode2.mois)})`} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top variations */}
        <Tabs defaultValue="hausses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hausses">
              <TrendingUp className="h-4 w-4 mr-2" />
              Top Hausses
            </TabsTrigger>
            <TabsTrigger value="baisses">
              <TrendingDown className="h-4 w-4 mr-2" />
              Top Baisses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hausses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comptes en Hausse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {top_hausses.length > 0 ? (
                    top_hausses.map((compte, index) => (
                      <div
                        key={compte.compte_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
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
                          <p className="text-lg font-bold text-green-600">
                            +{(compte.variation_absolue / 1000).toFixed(0)}k FCFA
                          </p>
                          <p className="text-xs text-muted-foreground">
                            +{compte.variation_pourcentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 opacity-70">Aucune hausse significative</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="baisses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comptes en Baisse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {top_baisses.length > 0 ? (
                    top_baisses.map((compte, index) => (
                      <div
                        key={compte.compte_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
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
                          <p className="text-lg font-bold text-red-600">
                            {(compte.variation_absolue / 1000).toFixed(0)}k FCFA
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {compte.variation_pourcentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 opacity-70">Aucune baisse significative</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Rendu pour comparaison annuelle
  if (modeComparaison === "annees") {
    const { annee1: a1, annee2: a2, variations, comparaison_mensuelle } = comparaison;

    // Données pour le graphique annuel
    const dataAnnuel = comparaison_mensuelle.map(m => ({
      mois: m.mois_nom,
      [a1.annee]: m.annee1.solde,
      [a2.annee]: m.annee2.solde,
    }));

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              Comparaison Annuelle
            </h1>
            <p className="text-sm opacity-70 mt-1">
              {a1.annee} vs {a2.annee}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={modeComparaison} onValueChange={setModeComparaison}>
              <SelectTrigger className="w-56">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois">Mois vs Mois Précédent</SelectItem>
                <SelectItem value="mois_custom">Choisir 2 Mois</SelectItem>
                <SelectItem value="annees">Année vs Année</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={annee1.toString()} onValueChange={(v) => setAnnee1(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={annee2.toString()} onValueChange={(v) => setAnnee2(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* KPIs annuels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Variation CA Annuel"
            value={`${variations.entrees.pourcentage >= 0 ? "+" : ""}${variations.entrees.pourcentage.toFixed(1)}%`}
            icon={variations.entrees.pourcentage >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            subtitle={`${(variations.entrees.absolue / 1000).toFixed(0)}k FCFA`}
            trend={variations.entrees.pourcentage >= 0 ? "up" : "down"}
            hint={`Votre chiffre d'affaires ${variations.entrees.pourcentage >= 0 ? "a progressé" : "a reculé"} de ${Math.abs(variations.entrees.pourcentage).toFixed(1)}% sur l'année.`}
          />

          <KPICard
            title="Variation Charges"
            value={`${variations.sorties.pourcentage >= 0 ? "+" : ""}${variations.sorties.pourcentage.toFixed(1)}%`}
            icon={variations.sorties.pourcentage >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            subtitle={`${(variations.sorties.absolue / 1000).toFixed(0)}k FCFA`}
            trend={variations.sorties.pourcentage < 0 ? "up" : "down"}
            hint={`Vos charges annuelles ont ${variations.sorties.pourcentage >= 0 ? "augmenté" : "diminué"} de ${Math.abs(variations.sorties.pourcentage).toFixed(1)}%.`}
          />

          <KPICard
            title="Variation Résultat"
            value={`${variations.solde.absolue >= 0 ? "+" : ""}${(variations.solde.absolue / 1000).toFixed(0)}k FCFA`}
            icon={variations.solde.absolue >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            subtitle={variations.solde.absolue >= 0 ? "Progression" : "Régression"}
            trend={variations.solde.absolue >= 0 ? "up" : "down"}
            hint={`Votre résultat net annuel s'est ${variations.solde.absolue >= 0 ? "amélioré" : "dégradé"} de ${Math.abs(variations.solde.absolue).toLocaleString()} FCFA.`}
          />
        </div>

        {/* Graphique évolution mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution Mensuelle du Solde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dataAnnuel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" stroke="#6b7280" style={{ fontSize: "12px" }} />
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
                <Line
                  type="monotone"
                  dataKey={a1.annee}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={`Année ${a1.annee}`}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey={a2.annee}
                  stroke="#10b981"
                  strokeWidth={2}
                  name={`Année ${a2.annee}`}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tableau comparatif mensuel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Détail Mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Mois</th>
                    <th className="text-right p-3 font-semibold">{a1.annee}</th>
                    <th className="text-right p-3 font-semibold">{a2.annee}</th>
                    <th className="text-right p-3 font-semibold">Variation</th>
                  </tr>
                </thead>
                <tbody>
                  {comparaison_mensuelle.map((mois, index) => {
                    const variation = mois.annee2.solde - mois.annee1.solde;
                    return (
                      <tr key={index} className="border-b hover:bg-accent/50 transition-colors">
                        <td className="p-3 font-medium">{mois.mois_nom}</td>
                        <td className={`p-3 text-right font-semibold ${mois.annee1.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {(mois.annee1.solde / 1000).toFixed(0)}k
                        </td>
                        <td className={`p-3 text-right font-semibold ${mois.annee2.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {(mois.annee2.solde / 1000).toFixed(0)}k
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {variation > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : variation < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={variation >= 0 ? "text-green-600" : "text-red-600"}>
                              {variation >= 0 ? "+" : ""}{(variation / 1000).toFixed(0)}k
                            </span>
                          </div>
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
  }

  return null;
};

export default ComptabiliteComparaisons;
