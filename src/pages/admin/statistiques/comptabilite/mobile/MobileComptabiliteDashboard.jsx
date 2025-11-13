import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MobileComptabiliteDashboard = () => {
  const navigate = useNavigate();

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

  return (
    <div className="p-4 space-y-4 pb-20">
      <h1 className="text-2xl font-bold">Dashboard Comptabilité</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <Wallet className="h-5 w-5 mb-2 opacity-70" />
            <p className="text-xs opacity-70">Trésorerie</p>
            <p className="text-xl font-bold">125k</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 mb-2 opacity-70 text-green-600" />
            <p className="text-xs opacity-70">Entrées</p>
            <p className="text-xl font-bold text-green-600">+50k</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <TrendingDown className="h-5 w-5 mb-2 opacity-70 text-red-600" />
            <p className="text-xs opacity-70">Sorties</p>
            <p className="text-xl font-bold text-red-600">-35k</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Activity className="h-5 w-5 mb-2 opacity-70" />
            <p className="text-xs opacity-70">Solde</p>
            <p className="text-xl font-bold">+15k</p>
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
