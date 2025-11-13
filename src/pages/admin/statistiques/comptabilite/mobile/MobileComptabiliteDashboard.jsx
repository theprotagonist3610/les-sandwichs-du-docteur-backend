import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  GitBranch,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStatistiquesByDay, useStatistiquesByWeek } from "@/toolkits/admin/comptabiliteToolkit";
import { formatDayKey, formatWeekKey } from "@/toolkits/admin/comptabilite/utils";

const MobileComptabiliteDashboard = () => {
  const navigate = useNavigate();
  const [periode, setPeriode] = useState("today");

  // Récupérer les statistiques
  const dayKey = useMemo(() => formatDayKey(), []);
  const weekKey = useMemo(() => formatWeekKey(), []);

  const { statistiques: statsToday, loading: loadingToday } = useStatistiquesByDay(dayKey);
  const { statistiques: statsWeek, loading: loadingWeek } = useStatistiquesByWeek(weekKey);

  const stats = periode === "today" ? statsToday : statsWeek;
  const loading = periode === "today" ? loadingToday : loadingWeek;

  const quickLinks = [
    {
      nom: "Budget",
      path: "/admin/statistiques/comptabilite/budget",
      icon: <Target className="w-5 h-5" />,
    },
    {
      nom: "Prévisions",
      path: "/admin/statistiques/comptabilite/previsions",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      nom: "Analyse Flux",
      path: "/admin/statistiques/comptabilite/analyse-flux",
      icon: <GitBranch className="w-5 h-5" />,
    },
    {
      nom: "Comparaisons",
      path: "/admin/statistiques/comptabilite/comparaisons",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      nom: "Insights",
      path: "/admin/statistiques/comptabilite/insights",
      icon: <Lightbulb className="w-5 h-5" />,
    },
  ];

  // Données pour le graphique
  const trendData = useMemo(() => {
    if (!stats || !stats.jours) return [];

    return stats.jours.slice(-7).map((jour) => ({
      date: jour.id.slice(0, 5), // Raccourcir pour mobile
      entrees: jour.total_entrees,
      sorties: jour.total_sorties,
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin text-6xl">⏳</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <p className="text-center opacity-70">Aucune donnée disponible</p>
      </div>
    );
  }

  const solde = stats.total_entrees - stats.total_sorties;
  const soldeStatus = solde >= 0 ? "positif" : "negatif";
  const tresorerieTotale = stats.tresorerie?.reduce(
    (sum, t) => sum + t.montant_total,
    0
  ) || 0;

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header avec filtre période */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Dashboard Comptabilité</h1>

        <Select value={periode} onValueChange={setPeriode}>
          <SelectTrigger className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerte si solde négatif */}
      {soldeStatus === "negatif" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 text-sm">Solde négatif</p>
                <p className="text-xs text-red-700 mt-1">
                  Déficit de {Math.abs(solde).toLocaleString()} FCFA
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/statistiques/comptabilite/previsions")}
                  className="mt-2 h-8 text-xs"
                >
                  Voir Prévisions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <Wallet className="h-5 w-5 mb-2 opacity-70" />
            <p className="text-xs opacity-70">Trésorerie</p>
            <p className="text-xl font-bold">
              {(tresorerieTotale / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 mb-2 opacity-70 text-green-600" />
            <p className="text-xs opacity-70">Entrées</p>
            <p className="text-xl font-bold text-green-600">
              +{(stats.total_entrees / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <TrendingDown className="h-5 w-5 mb-2 opacity-70 text-red-600" />
            <p className="text-xs opacity-70">Sorties</p>
            <p className="text-xl font-bold text-red-600">
              -{(stats.total_sorties / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Activity className="h-5 w-5 mb-2 opacity-70" />
            <p className="text-xs opacity-70">Solde</p>
            <p className={`text-xl font-bold ${soldeStatus === "positif" ? "text-green-600" : "text-red-600"}`}>
              {solde >= 0 ? "+" : ""}{(solde / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Flux */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Flux de Trésorerie</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEntreesMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSortiesMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: "10px" }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: "10px" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                />
                <Area
                  type="monotone"
                  dataKey="entrees"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorEntreesMobile)"
                  name="Entrées"
                />
                <Area
                  type="monotone"
                  dataKey="sorties"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorSortiesMobile)"
                  name="Sorties"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Comptes - Version compacte */}
      <div className="space-y-3">
        {/* Top Entrées */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              Top Entrées
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {stats.comptes
                ?.filter((c) => c.categorie === "entree")
                .sort((a, b) => b.montant_total - a.montant_total)
                .slice(0, 3)
                .map((compte) => (
                  <div
                    key={compte.compte_id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    onClick={() =>
                      navigate(
                        `/admin/statistiques/comptabilite/comptes/${compte.compte_id}`
                      )
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {compte.denomination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {compte.code_ohada}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold text-green-600">
                        +{(compte.montant_total / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {compte.nombre_operations} ops
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Sorties */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <ArrowDownRight className="h-4 w-4" />
              Top Sorties
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {stats.comptes
                ?.filter((c) => c.categorie === "sortie")
                .sort((a, b) => b.montant_total - a.montant_total)
                .slice(0, 3)
                .map((compte) => (
                  <div
                    key={compte.compte_id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    onClick={() =>
                      navigate(
                        `/admin/statistiques/comptabilite/comptes/${compte.compte_id}`
                      )
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {compte.denomination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {compte.code_ohada}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold text-red-600">
                        -{(compte.montant_total / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {compte.nombre_operations} ops
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-3">
          <p className="text-sm font-semibold mb-3">Accès Rapide</p>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3">
                  {link.icon}
                  <span className="text-sm font-medium">{link.nom}</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileComptabiliteDashboard;
