import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePaymentMethodAnalysis } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Calendar,
  Target,
  Lightbulb,
  Banknote,
  Smartphone,
  CreditCard,
} from "lucide-react";

const MobilePaiementId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { methodStats, loading, error } = usePaymentMethodAnalysis(id, 7);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive">
          <AlertDescription>Erreur: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!methodStats) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  // Icône selon le mode de paiement
  const getMethodIcon = () => {
    if (id === "especes") return <Banknote className="h-5 w-5" />;
    if (id === "momo") return <Smartphone className="h-5 w-5" />;
    return <CreditCard className="h-5 w-5" />;
  };

  // Données pour les jours de la semaine
  const joursOrdre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

  return (
    <div className="p-4 space-y-4">
      {/* Header avec retour */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/admin/statistiques/paiement")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{methodStats.methodName}</h1>
            <div className="p-1.5 rounded-full border">
              {getMethodIcon()}
            </div>
          </div>
          {methodStats.trend !== "stable" && (
            <Badge variant="outline" className="flex items-center gap-1 mt-2 w-fit text-xs">
              {methodStats.trend === "hausse" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3 rotate-180" />
              )}
              {methodStats.trend === "hausse" ? "En hausse" : "En baisse"}
            </Badge>
          )}
        </div>
      </div>

      {/* KPIs - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Total"
          value={`${(methodStats.totalMontant / 1000).toFixed(0)}k`}
          trend={methodStats.trend}
          trendValue={methodStats.trendPercentage}
          icon={<Wallet className="h-5 w-5" />}
          subtitle="FCFA"
        />

        <KPICard
          title="Part CA"
          value={`${methodStats.pourcentageTotal.toFixed(1)}%`}
          icon={<Target className="h-5 w-5" />}
          subtitle={`${methodStats.totalCommandes} cmd`}
        />

        <KPICard
          title="Meilleur Jour"
          value={methodStats.meilleur_jour.slice(0, 3).charAt(0).toUpperCase() + methodStats.meilleur_jour.slice(1, 3)}
          icon={<Calendar className="h-5 w-5" />}
          subtitle={`${(methodStats.jours_semaine[methodStats.meilleur_jour].montant / 1000).toFixed(0)}k`}
        />

        <KPICard
          title="Pic"
          value={`${(methodStats.pic.montant / 1000).toFixed(0)}k`}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle={methodStats.pic.date}
        />
      </div>

      {/* Insights AI */}
      {methodStats.trend !== "stable" && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="ml-2 text-sm">
            <strong>Insight:</strong>{" "}
            {methodStats.trend === "hausse" ? (
              <>
                <strong>{methodStats.methodName}</strong> en hausse de{" "}
                <strong>{methodStats.trendPercentage.toFixed(1)}%</strong>.{" "}
                {id === "credit" && (
                  <>Suivez les recouvrements ({methodStats.pourcentageTotal.toFixed(1)}%).</>
                )}
              </>
            ) : (
              <>
                <strong>{methodStats.methodName}</strong> en baisse de{" "}
                <strong>{Math.abs(methodStats.trendPercentage).toFixed(1)}%</strong>.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Evolution du montant */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Évolution du Montant
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SalesLineChart
            data={methodStats.evolution}
            xKey="date"
            yKey="montant"
            height={200}
          />
        </CardContent>
      </Card>

      {/* Evolution du pourcentage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Évolution du Pourcentage
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SalesLineChart
            data={methodStats.evolution}
            xKey="date"
            yKey="pourcentage"
            height={200}
          />
          <p className="text-xs opacity-70 mt-2 text-center">
            Part dans le CA quotidien
          </p>
        </CardContent>
      </Card>

      {/* Performance par jour */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Performance par Jour
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {joursOrdre.map((jour) => {
              const stats = methodStats.jours_semaine[jour];
              const estMeilleur = jour === methodStats.meilleur_jour;
              return (
                <div
                  key={jour}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    estMeilleur ? "font-bold" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {estMeilleur && <TrendingUp className="h-4 w-4" />}
                    <span className="text-sm">
                      {jour.charAt(0).toUpperCase() + jour.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {(stats.montant / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs opacity-70">
                      {stats.pourcentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Statistiques Détaillées</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-xs opacity-70">Total Encaissé</p>
                <p className="text-lg font-bold mt-1">
                  {methodStats.totalMontant.toLocaleString()} FCFA
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-xs opacity-70">Part du CA Total</p>
                <p className="text-lg font-bold mt-1">
                  {methodStats.pourcentageTotal.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70">Commandes</p>
                <p className="text-lg font-bold mt-1">
                  {methodStats.totalCommandes}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-xs opacity-70">Montant Moyen/Jour</p>
                <p className="text-lg font-bold mt-1">
                  {(methodStats.totalMontant / 7).toFixed(0).toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {id === "especes" && (
              <>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Sécurité des Fonds</p>
                  <p className="text-xs opacity-70 mt-1">
                    Dépôts bancaires réguliers, surtout le {methodStats.meilleur_jour}.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Gestion de Caisse</p>
                  <p className="text-xs opacity-70 mt-1">
                    Maintenez un fonds de roulement pour les rendus de monnaie.
                  </p>
                </div>
              </>
            )}

            {id === "momo" && (
              <>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Promotion</p>
                  <p className="text-xs opacity-70 mt-1">
                    Encouragez l'utilisation du mobile money pour accélérer les transactions.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Réconciliation</p>
                  <p className="text-xs opacity-70 mt-1">
                    Rapprochements quotidiens entre transactions et confirmations.
                  </p>
                </div>
              </>
            )}

            {id === "credit" && (
              <>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Recouvrements</p>
                  <p className="text-xs opacity-70 mt-1">
                    Crédit à {methodStats.pourcentageTotal.toFixed(1)}%. Système de relance nécessaire.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Politique de Crédit</p>
                  <p className="text-xs opacity-70 mt-1">
                    Envisagez des limites par client pour contrôler les impayés.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobilePaiementId;
