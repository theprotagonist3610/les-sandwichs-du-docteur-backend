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
  GitBranch,
  TrendingUp,
  TrendingDown,
  Activity,
  Wallet,
  Calendar,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useStatistiquesByDay, useStatistiquesByWeek } from "@/toolkits/admin/comptabiliteToolkit";
import { formatDayKey, formatWeekKey, formatMonthKey } from "@/toolkits/admin/comptabilite/utils";
import { getStatistiquesByMonth } from "@/toolkits/admin/comptabilite/statistiques";
import KPICard from "@/components/statistics/cards/KPICard";

const ComptabiliteAnalyseFlux = () => {
  const [periode, setPeriode] = useState("today");

  // Récupérer les clés de période
  const dayKey = useMemo(() => formatDayKey(), []);
  const weekKey = useMemo(() => formatWeekKey(), []);
  const monthKey = useMemo(() => formatMonthKey(), []);

  // Hooks pour récupérer les données
  const { statistiques: statsToday, loading: loadingToday } = useStatistiquesByDay(dayKey);
  const { statistiques: statsWeek, loading: loadingWeek } = useStatistiquesByWeek(weekKey);

  // État pour les stats du mois
  const [statsMonth, setStatsMonth] = React.useState(null);
  const [loadingMonth, setLoadingMonth] = React.useState(false);

  // Charger les stats du mois si nécessaire
  React.useEffect(() => {
    if (periode === "month") {
      setLoadingMonth(true);
      getStatistiquesByMonth(monthKey)
        .then(setStatsMonth)
        .catch(console.error)
        .finally(() => setLoadingMonth(false));
    }
  }, [periode, monthKey]);

  // Sélectionner les bonnes stats selon la période
  const stats = useMemo(() => {
    if (periode === "today") return statsToday;
    if (periode === "week") return statsWeek;
    return statsMonth;
  }, [periode, statsToday, statsWeek, statsMonth]);

  const loading = periode === "today" ? loadingToday : periode === "week" ? loadingWeek : loadingMonth;

  // Données pour les graphiques circulaires
  const dataEntrees = useMemo(() => {
    if (!stats || !stats.comptes) return [];

    return stats.comptes
      .filter(c => c.categorie === "entree")
      .sort((a, b) => b.montant_total - a.montant_total)
      .slice(0, 8)
      .map(compte => ({
        name: compte.denomination.length > 25
          ? compte.denomination.substring(0, 25) + "..."
          : compte.denomination,
        value: compte.montant_total,
        code: compte.code_ohada,
        operations: compte.nombre_operations,
      }));
  }, [stats]);

  const dataSorties = useMemo(() => {
    if (!stats || !stats.comptes) return [];

    return stats.comptes
      .filter(c => c.categorie === "sortie")
      .sort((a, b) => b.montant_total - a.montant_total)
      .slice(0, 8)
      .map(compte => ({
        name: compte.denomination.length > 25
          ? compte.denomination.substring(0, 25) + "..."
          : compte.denomination,
        value: compte.montant_total,
        code: compte.code_ohada,
        operations: compte.nombre_operations,
      }));
  }, [stats]);

  // Données pour le diagramme de flux (barres horizontales)
  const dataFlux = useMemo(() => {
    if (!stats) return [];

    const entrees = stats.total_entrees || 0;
    const sorties = stats.total_sorties || 0;
    const solde = entrees - sorties;

    return [
      { categorie: "Entrées", montant: entrees, type: "entree" },
      { categorie: "Sorties", montant: sorties, type: "sortie" },
      { categorie: "Solde Net", montant: Math.abs(solde), type: solde >= 0 ? "entree" : "sortie" },
    ];
  }, [stats]);

  // Données de trésorerie
  const dataTresorerie = useMemo(() => {
    if (!stats || !stats.tresorerie) return [];

    return stats.tresorerie
      .sort((a, b) => b.montant_total - a.montant_total)
      .map(compte => ({
        name: compte.denomination,
        value: compte.montant_total,
        operations: compte.nombre_operations,
      }));
  }, [stats]);

  const COLORS_ENTREES = ["#10b981", "#059669", "#047857", "#065f46", "#064e3b"];
  const COLORS_SORTIES = ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"];
  const COLORS_TRESORERIE = ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin text-6xl">⏳</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center opacity-70">
              <GitBranch className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucune donnée disponible pour cette période</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const solde = stats.total_entrees - stats.total_sorties;
  const soldeStatus = solde >= 0 ? "positif" : "negatif";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GitBranch className="h-8 w-8" />
            Analyse de Flux
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Visualisation détaillée des flux financiers
          </p>
        </div>

        <Select value={periode} onValueChange={setPeriode}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Flux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Entrées"
          value={`${(stats.total_entrees / 1000).toFixed(0)}k FCFA`}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle={`${stats.comptes?.filter(c => c.categorie === "entree").length || 0} comptes`}
          trend="up"
        />

        <KPICard
          title="Total Sorties"
          value={`${(stats.total_sorties / 1000).toFixed(0)}k FCFA`}
          icon={<TrendingDown className="h-6 w-6" />}
          subtitle={`${stats.comptes?.filter(c => c.categorie === "sortie").length || 0} comptes`}
          trend="down"
        />

        <KPICard
          title="Solde Net"
          value={`${(Math.abs(solde) / 1000).toFixed(0)}k FCFA`}
          icon={<Activity className="h-6 w-6" />}
          subtitle={soldeStatus === "positif" ? "Excédent" : "Déficit"}
          trend={soldeStatus === "positif" ? "up" : "down"}
        />
      </div>

      {/* Diagramme de Flux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Vue d'ensemble des Flux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataFlux} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="categorie"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                }}
                formatter={(value) => `${value.toLocaleString()} FCFA`}
              />
              <Bar
                dataKey="montant"
                fill="#3b82f6"
                radius={[0, 8, 8, 0]}
              >
                {dataFlux.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.type === "entree" ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Répartition par catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entrées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <ArrowUpRight className="h-5 w-5" />
              Répartition des Entrées (Top 8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataEntrees.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataEntrees}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ code, percent }) =>
                        `${code}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataEntrees.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_ENTREES[index % COLORS_ENTREES.length]}
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

                {/* Légende personnalisée */}
                <div className="mt-4 space-y-2">
                  {dataEntrees.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS_ENTREES[index % COLORS_ENTREES.length] }}
                        />
                        <span className="font-medium">{entry.code}</span>
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">
                          {(entry.value / 1000).toFixed(0)}k
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({entry.operations} ops)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 opacity-70">
                <p>Aucune entrée pour cette période</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sorties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <ArrowDownRight className="h-5 w-5" />
              Répartition des Sorties (Top 8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataSorties.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataSorties}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ code, percent }) =>
                        `${code}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataSorties.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_SORTIES[index % COLORS_SORTIES.length]}
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

                {/* Légende personnalisée */}
                <div className="mt-4 space-y-2">
                  {dataSorties.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS_SORTIES[index % COLORS_SORTIES.length] }}
                        />
                        <span className="font-medium">{entry.code}</span>
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-600">
                          {(entry.value / 1000).toFixed(0)}k
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({entry.operations} ops)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 opacity-70">
                <p>Aucune sortie pour cette période</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analyse Trésorerie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Mouvements de Trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataTresorerie.length > 0 ? (
            <div className="space-y-3">
              {dataTresorerie.map((compte, index) => {
                const total = dataTresorerie.reduce((sum, c) => sum + c.value, 0);
                const percentage = total > 0 ? (compte.value / total * 100).toFixed(1) : 0;

                return (
                  <div key={index} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS_TRESORERIE[index % COLORS_TRESORERIE.length] }}
                        />
                        <div>
                          <p className="font-semibold">{compte.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {compte.operations} opération{compte.operations > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {(compte.value / 1000).toFixed(0)}k FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">{percentage}% du total</p>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS_TRESORERIE[index % COLORS_TRESORERIE.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 opacity-70">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Aucun mouvement de trésorerie pour cette période</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicateurs de performance */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-blue-700 mb-1">Taux de Conversion</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.total_entrees > 0
                  ? ((stats.total_sorties / stats.total_entrees) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-blue-600">Sorties / Entrées</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-blue-700 mb-1">Opérations Totales</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.nombre_operations || 0}
              </p>
              <p className="text-xs text-blue-600">Pour la période</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-blue-700 mb-1">Montant Moyen</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.nombre_operations > 0
                  ? ((stats.total_entrees + stats.total_sorties) / stats.nombre_operations / 1000).toFixed(0)
                  : 0}k
              </p>
              <p className="text-xs text-blue-600">FCFA par opération</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteAnalyseFlux;
