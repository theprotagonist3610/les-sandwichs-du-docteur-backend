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
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Target,
  Activity,
  AlertTriangle,
  Zap,
  GitBranch,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { useStatistiquesByDay, useStatistiquesByWeek } from "@/toolkits/admin/comptabiliteToolkit";
import { formatDayKey, formatWeekKey } from "@/toolkits/admin/comptabilite/utils";
import KPICard from "@/components/statistics/cards/KPICard";

const DesktopComptabiliteDashboard = () => {
  const navigate = useNavigate();
  const [periode, setPeriode] = useState("today");

  // Récupérer les statistiques
  const dayKey = useMemo(() => formatDayKey(), []);
  const weekKey = useMemo(() => formatWeekKey(), []);

  const { statistiques: statsToday, loading: loadingToday } = useStatistiquesByDay(dayKey);
  const { statistiques: statsWeek, loading: loadingWeek } = useStatistiquesByWeek(weekKey);

  const stats = periode === "today" ? statsToday : statsWeek;
  const loading = periode === "today" ? loadingToday : loadingWeek;

  // Quick Links pour navigation rapide
  const quickLinks = [
    {
      nom: "Budget",
      path: "/admin/statistiques/comptabilite/budget",
      icon: <Target className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      nom: "Prévisions",
      path: "/admin/statistiques/comptabilite/previsions",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      nom: "Analyse Flux",
      path: "/admin/statistiques/comptabilite/analyse-flux",
      icon: <GitBranch className="w-5 h-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      nom: "Comparaisons",
      path: "/admin/statistiques/comptabilite/comparaisons",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      nom: "Insights",
      path: "/admin/statistiques/comptabilite/insights",
      icon: <Lightbulb className="w-5 h-5" />,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
  ];

  // Données de démonstration pour le graphique (à remplacer par vraies données)
  const trendData = useMemo(() => {
    if (!stats || !stats.jours) return [];

    return stats.jours.map((jour) => ({
      date: jour.id,
      entrees: jour.total_entrees,
      sorties: jour.total_sorties,
      solde: jour.solde_journalier,
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
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg opacity-70">Aucune donnée disponible</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8" />
            Dashboard Comptabilité
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Vue d'ensemble de votre santé financière
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
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Trésorerie Totale"
          value={`${(tresorerieTotale / 1000).toFixed(0)}k FCFA`}
          icon={<Wallet className="h-6 w-6" />}
          subtitle="Solde global"
        />

        <KPICard
          title="Entrées"
          value={`${(stats.total_entrees / 1000).toFixed(0)}k FCFA`}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle={`${stats.nombre_operations || 0} opérations`}
          trend="up"
        />

        <KPICard
          title="Sorties"
          value={`${(stats.total_sorties / 1000).toFixed(0)}k FCFA`}
          icon={<TrendingDown className="h-6 w-6" />}
          subtitle={`${stats.nombre_operations || 0} opérations`}
          trend="down"
        />

        <KPICard
          title="Solde"
          value={`${(solde / 1000).toFixed(0)}k FCFA`}
          icon={<Activity className="h-6 w-6" />}
          subtitle={soldeStatus === "positif" ? "Excédent" : "Déficit"}
          trend={soldeStatus === "positif" ? "up" : "down"}
        />
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Accès Rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:shadow-md transition-all hover:scale-105"
              >
                <div className={`${link.bg} ${link.color} p-3 rounded-lg`}>
                  {link.icon}
                </div>
                <span className="text-sm font-medium">{link.nom}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Graphique Flux de Trésorerie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Évolution du Flux de Trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: "11px" }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="entrees"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorEntrees)"
                  name="Entrées (FCFA)"
                />
                <Area
                  type="monotone"
                  dataKey="sorties"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorSorties)"
                  name="Sorties (FCFA)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 opacity-70">
              Aucune donnée disponible pour cette période
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Comptes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Entrées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <ArrowUpRight className="h-5 w-5" />
              Top Comptes Entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.comptes
                ?.filter((c) => c.categorie === "entree")
                .sort((a, b) => b.montant_total - a.montant_total)
                .slice(0, 5)
                .map((compte) => (
                  <div
                    key={compte.compte_id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/admin/statistiques/comptabilite/comptes/${compte.compte_id}`
                      )
                    }
                  >
                    <div>
                      <p className="font-medium">{compte.denomination}</p>
                      <p className="text-xs text-muted-foreground">
                        {compte.code_ohada}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +{(compte.montant_total / 1000).toFixed(0)}k FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {compte.nombre_operations} opérations
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Sorties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <ArrowDownRight className="h-5 w-5" />
              Top Comptes Sorties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.comptes
                ?.filter((c) => c.categorie === "sortie")
                .sort((a, b) => b.montant_total - a.montant_total)
                .slice(0, 5)
                .map((compte) => (
                  <div
                    key={compte.compte_id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/admin/statistiques/comptabilite/comptes/${compte.compte_id}`
                      )
                    }
                  >
                    <div>
                      <p className="font-medium">{compte.denomination}</p>
                      <p className="text-xs text-muted-foreground">
                        {compte.code_ohada}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        -{(compte.montant_total / 1000).toFixed(0)}k FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {compte.nombre_operations} opérations
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {soldeStatus === "negatif" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">
                  Attention : Solde négatif
                </p>
                <p className="text-sm text-red-700">
                  Vos sorties dépassent vos entrées de{" "}
                  {Math.abs(solde).toLocaleString()} FCFA. Consultez vos prévisions
                  pour anticiper.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate("/admin/statistiques/comptabilite/previsions")
                }
                className="ml-auto"
              >
                Voir Prévisions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopComptabiliteDashboard;
