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
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap,
  Target,
  Calendar,
  Activity,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { useInsightsMois } from "@/toolkits/admin/comptabiliteToolkit";
import { formatMonthKey } from "@/toolkits/admin/comptabilite/utils";
import { calculerScoreSante } from "@/toolkits/admin/comptabilite/insights";
import KPICard from "@/components/statistics/cards/KPICard";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

// Couleur du score (fonction pure, en dehors du composant)
const getScoreColor = (score) => {
  if (score >= 85) return "#10b981"; // green
  if (score >= 70) return "#3b82f6"; // blue
  if (score >= 50) return "#f59e0b"; // orange
  return "#ef4444"; // red
};

const ComptabiliteInsights = () => {
  // Générer les options de mois
  const moisOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = formatMonthKey(date);
      const label = date.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      options.push({ key, label });
    }
    return options;
  }, []);

  const [moisKey, setMoisKey] = useState(moisOptions[0].key);

  // Charger les insights
  const { insights, loading, error } = useInsightsMois(moisKey, {
    includeHistorique: true,
  });

  // Calculer le score de santé (AVANT les early returns pour respecter les règles des hooks)
  const scoreData = useMemo(() => {
    if (!insights || !insights.resume || !insights.ratios) {
      // Valeur par défaut si pas de données
      return {
        score: 0,
        appreciation: "Indisponible",
        details: [],
      };
    }

    const { resume, ratios } = insights;

    // On a besoin des stats complètes, on les reconstruit à partir du résumé et ratios
    const stats = {
      total_entrees:
        resume.solde >= 0
          ? resume.solde + (resume.solde * ratios.ratio_charges_ca) / 100
          : Math.abs(resume.solde),
      total_sorties:
        resume.solde >= 0
          ? (resume.solde * ratios.ratio_charges_ca) / 100
          : Math.abs(resume.solde) + resume.solde,
      nombre_operations: 100, // Estimation
      tresorerie: [{ montant_total: resume.tresorerie_totale }],
    };
    return calculerScoreSante(stats);
  }, [insights]);

  const getSeverityStyles = (severity) => {
    const styles = {
      urgente: {
        border: "border-red-300",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        messageColor: "text-red-700",
      },
      haute: {
        border: "border-red-200",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        messageColor: "text-red-700",
      },
      moyenne: {
        border: "border-orange-200",
        bg: "bg-orange-50",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        titleColor: "text-orange-900",
        messageColor: "text-orange-700",
      },
      basse: {
        border: "border-blue-200",
        bg: "bg-blue-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        titleColor: "text-blue-900",
        messageColor: "text-blue-700",
      },
    };

    return styles[severity] || styles.basse;
  };

  const getInsightTypeStyles = (type) => {
    const styles = {
      positif: {
        border: "border-green-200",
        bg: "bg-green-50",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        titleColor: "text-green-900",
        messageColor: "text-green-700",
        icon: <CheckCircle2 className="h-5 w-5" />,
      },
      attention: {
        border: "border-orange-200",
        bg: "bg-orange-50",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        titleColor: "text-orange-900",
        messageColor: "text-orange-700",
        icon: <AlertTriangle className="h-5 w-5" />,
      },
      negatif: {
        border: "border-red-200",
        bg: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        messageColor: "text-red-700",
        icon: <AlertCircle className="h-5 w-5" />,
      },
    };

    return styles[type] || styles.positif;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-lg opacity-70">Génération des insights...</p>
          <p className="text-sm opacity-50 mt-2">
            Analyse de vos données en cours
          </p>
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
                <p className="font-semibold text-red-900">
                  Erreur lors de la génération des insights
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center opacity-70">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun insight disponible</p>
              <p className="text-sm mt-2">
                Sélectionnez un mois avec des données
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    resume,
    ratios,
    insights: insightsList,
    alertes,
    recommandations,
    tendances,
    opportunites,
  } = insights;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Lightbulb className="h-8 w-8" />
            Insights Automatiques
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Analyses intelligentes et recommandations personnalisées
          </p>
        </div>

        <Select value={moisKey} onValueChange={setMoisKey}>
          <SelectTrigger className="w-56">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {moisOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Score de santé financière */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Score de Santé Financière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gauge circulaire */}
            <div className="flex flex-col items-center justify-center">
              <div style={{ width: 180, height: 180 }}>
                <CircularProgressbar
                  value={scoreData.score}
                  text={`${scoreData.score}/100`}
                  styles={buildStyles({
                    textSize: "16px",
                    pathColor: getScoreColor(scoreData.score),
                    textColor: getScoreColor(scoreData.score),
                    trailColor: "#e5e7eb",
                  })}
                />
              </div>
              <p
                className="text-2xl font-bold mt-4"
                style={{ color: getScoreColor(scoreData.score) }}>
                Santé {scoreData.appreciation}
              </p>
            </div>

            {/* Détails des critères */}
            <div className="space-y-3">
              {scoreData.details.map((detail, index) => {
                const pourcentage = (detail.note / detail.max) * 100;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {detail.critere}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {detail.note}/{detail.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pourcentage}%`,
                          backgroundColor:
                            pourcentage >= 80
                              ? "#10b981"
                              : pourcentage >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {detail.commentaire}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratios financiers clés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Marge Globale"
          value={`${ratios.marge_globale?.toFixed(1) || 0}%`}
          icon={
            ratios.marge_globale >= 0 ? (
              <TrendingUp className="h-6 w-6" />
            ) : (
              <TrendingDown className="h-6 w-6" />
            )
          }
          subtitle="Résultat / CA"
          trend={ratios.marge_globale >= 10 ? "up" : "down"}
          hint="Pourcentage du chiffre d'affaires qui reste après toutes les dépenses. Une marge >20% est excellente, >10% est bonne, <5% est préoccupante."
        />

        <KPICard
          title="Ratio Charges/CA"
          value={`${ratios.ratio_charges_ca?.toFixed(1) || 0}%`}
          icon={<Activity className="h-6 w-6" />}
          subtitle="Niveau de coûts"
          trend={ratios.ratio_charges_ca < 70 ? "up" : "down"}
          hint="Part du CA consacrée aux charges. Idéalement <70%. Si >80%, vos coûts sont trop élevés par rapport aux revenus."
        />

        <KPICard
          title="Jours de Trésorerie"
          value={
            ratios.jours_tresorerie >= 999
              ? "∞"
              : ratios.jours_tresorerie.toFixed(0)
          }
          icon={<Wallet className="h-6 w-6" />}
          subtitle="Coussin de sécurité"
          trend={ratios.jours_tresorerie >= 30 ? "up" : "down"}
          hint="Nombre de jours que vous pouvez tenir avec votre trésorerie actuelle. Minimum recommandé: 30 jours. <15 jours = risque élevé."
        />

        <KPICard
          title="Montant Moyen"
          value={`${((ratios.montant_moyen_operation || 0) / 1000).toFixed(0)}k FCFA`}
          icon={<Target className="h-6 w-6" />}
          subtitle="Par opération"
          hint="Montant moyen par transaction comptable. Permet de mesurer la taille typique de vos opérations financières."
        />
      </div>

      {/* Statistiques des insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Alertes</p>
                <p className="text-2xl font-bold text-red-600">
                  {alertes.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Recommandations</p>
                <p className="text-2xl font-bold text-orange-600">
                  {recommandations.length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Insights</p>
                <p className="text-2xl font-bold text-blue-600">
                  {insightsList.length}
                </p>
              </div>
              <Info className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Opportunités</p>
                <p className="text-2xl font-bold text-green-600">
                  {opportunites.length}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Alertes Prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertes.map((alerte, index) => {
                const styles = getSeverityStyles(alerte.severite);
                return (
                  <div
                    key={index}
                    className={`${styles.border} ${styles.bg} p-4 rounded-lg`}>
                    <div className="flex items-start gap-3">
                      <div
                        className={`${styles.iconBg} ${styles.iconColor} p-2 rounded-lg`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${styles.titleColor}`}>
                            {alerte.titre}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${styles.iconBg} ${styles.iconColor}`}>
                            {alerte.severite}
                          </span>
                        </div>
                        <p className={`text-sm ${styles.messageColor}`}>
                          {alerte.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      {recommandations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommandations.map((reco, index) => {
                const styles = getSeverityStyles(reco.priorite);
                return (
                  <div
                    key={index}
                    className={`${styles.border} ${styles.bg} p-4 rounded-lg`}>
                    <div className="flex items-start gap-3">
                      <div
                        className={`${styles.iconBg} ${styles.iconColor} p-2 rounded-lg flex-shrink-0`}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${styles.titleColor}`}>
                            {reco.titre}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${styles.iconBg} ${styles.iconColor}`}>
                            Priorité {reco.priorite}
                          </span>
                        </div>
                        <p className={`text-sm ${styles.messageColor} mb-3`}>
                          {reco.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold opacity-70">
                            Actions suggérées :
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {reco.actions.map((action, i) => (
                              <li
                                key={i}
                                className={`text-sm ${styles.messageColor}`}>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights positifs */}
      {insightsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Insights Détectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insightsList.map((insight, index) => {
                const styles = getInsightTypeStyles(insight.type);
                return (
                  <div
                    key={index}
                    className={`${styles.border} ${styles.bg} p-4 rounded-lg`}>
                    <div className="flex items-start gap-3">
                      <div
                        className={`${styles.iconBg} ${styles.iconColor} p-2 rounded-lg`}>
                        {styles.icon}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${styles.titleColor} mb-1`}>
                          {insight.titre}
                        </h3>
                        <p className={`text-sm ${styles.messageColor}`}>
                          {insight.message}
                        </p>
                        {insight.compte && (
                          <p className="text-xs opacity-70 mt-2">
                            Compte concerné: {insight.compte.denomination} (
                            {insight.compte.code_ohada})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tendances */}
      {tendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendances Identifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tendances.map((tendance, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {tendance.type === "positif" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold">{tendance.titre}</p>
                      <p className="text-sm opacity-70">{tendance.message}</p>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      tendance.type === "positif"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                    {tendance.valeur >= 0 ? "+" : ""}
                    {tendance.valeur.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunités */}
      {opportunites.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Lightbulb className="h-5 w-5" />
              Opportunités Détectées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunites.map((opp, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-1">
                    {opp.titre}
                  </h3>
                  <p className="text-sm text-green-700 mb-2">{opp.message}</p>
                  <p className="text-sm text-green-600 italic">
                    💡 {opp.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-purple-900 mb-1">
                Comment fonctionnent les insights ?
              </p>
              <p className="text-sm text-purple-700">
                Les insights sont générés automatiquement en analysant vos
                données comptables, vos tendances historiques, et vos ratios
                financiers. Le système détecte les anomalies, les opportunités
                d'optimisation, et vous propose des recommandations actionnables
                classées par priorité. Les insights se mettent à jour
                automatiquement à chaque nouvelle opération comptable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptabiliteInsights;
