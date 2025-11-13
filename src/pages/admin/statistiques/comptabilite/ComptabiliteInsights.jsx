import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap,
} from "lucide-react";

const ComptabiliteInsights = () => {
  // Insights de démonstration
  const insights = [
    {
      type: "alerte",
      severity: "critical",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "red",
      titre: "Trésorerie critique",
      message:
        "Votre projection indique une rupture de trésorerie potentielle dans 12 jours. Envisagez de réduire les dépenses non essentielles.",
      actions: ["Voir prévisions", "Créer plan d'action"],
    },
    {
      type: "tendance",
      severity: "warning",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "orange",
      titre: "Augmentation des dépenses",
      message:
        'Vos sorties sur le compte "Achats ingrédients" ont augmenté de 23% par rapport au mois dernier (+45,000 FCFA).',
      actions: ["Analyser compte", "Ajuster budget"],
    },
    {
      type: "opportunite",
      severity: "info",
      icon: <Zap className="h-5 w-5" />,
      color: "blue",
      titre: "Économies possibles",
      message:
        'Le compte "Transport" montre 15,000 FCFA de plus que la moyenne mensuelle. Une optimisation pourrait être envisagée.',
      actions: ["Voir détails", "Comparer"],
    },
    {
      type: "insight",
      severity: "success",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "green",
      titre: "Performance positive",
      message:
        "Vos entrées sont en hausse de 18% sur les 30 derniers jours. Excellente dynamique commerciale !",
      actions: ["Voir analyse"],
    },
    {
      type: "pattern",
      severity: "info",
      icon: <Info className="h-5 w-5" />,
      color: "purple",
      titre: "Pattern identifié",
      message:
        "Vos dépenses sont systématiquement plus élevées les jeudis (+12% en moyenne). Analyse des causes recommandée.",
      actions: ["Analyser pattern", "Planifier"],
    },
  ];

  const getSeverityStyles = (severity) => {
    const styles = {
      critical: {
        border: "border-red-200",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        messageColor: "text-red-700",
      },
      warning: {
        border: "border-orange-200",
        bg: "bg-orange-50",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        titleColor: "text-orange-900",
        messageColor: "text-orange-700",
      },
      info: {
        border: "border-blue-200",
        bg: "bg-blue-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        titleColor: "text-blue-900",
        messageColor: "text-blue-700",
      },
      success: {
        border: "border-green-200",
        bg: "bg-green-50",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        titleColor: "text-green-900",
        messageColor: "text-green-700",
      },
    };

    return styles[severity] || styles.info;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Lightbulb className="h-8 w-8" />
          Insights Automatiques
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Analyses intelligentes et recommandations personnalisées
        </p>
      </div>

      {/* Statistiques des insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Critiques</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Avertissements</p>
                <p className="text-2xl font-bold text-orange-600">1</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Informations</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
              <Info className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Positifs</p>
                <p className="text-2xl font-bold text-green-600">1</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des insights */}
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const styles = getSeverityStyles(insight.severity);

          return (
            <Card key={index} className={`${styles.border} ${styles.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`${styles.iconBg} ${styles.iconColor} p-3 rounded-lg`}>
                    {insight.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className={`font-semibold ${styles.titleColor} mb-1`}>
                      {insight.titre}
                    </h3>
                    <p className={`text-sm ${styles.messageColor} mb-3`}>
                      {insight.message}
                    </p>

                    <div className="flex items-center gap-2">
                      {insight.actions.map((action, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-900 mb-1">
                Intelligence Artificielle
              </p>
              <p className="text-sm text-purple-700">
                Les insights sont générés automatiquement en analysant vos données
                comptables. Ils identifient des tendances, des anomalies et des
                opportunités d'optimisation. De nouveaux insights apparaissent dès
                que des patterns significatifs sont détectés.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteInsights;
