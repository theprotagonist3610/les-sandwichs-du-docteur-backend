import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePaymentMethodAnalysis } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";
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

const DesktopPaiementId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { methodStats, loading, error } = usePaymentMethodAnalysis(id, 7);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement de l'analyse...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <AlertDescription>Erreur: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!methodStats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  // Icône selon le mode de paiement
  const getMethodIcon = () => {
    if (id === "especes") return <Banknote className="h-6 w-6" />;
    if (id === "momo") return <Smartphone className="h-6 w-6" />;
    return <CreditCard className="h-6 w-6" />;
  };

  // Données pour le graphique en barres des jours
  const joursOrdre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const joursBarData = joursOrdre.map((jour) => ({
    jour: jour.charAt(0).toUpperCase() + jour.slice(1).slice(0, 3),
    montant: methodStats.jours_semaine[jour].montant,
    pourcentage: methodStats.jours_semaine[jour].pourcentage,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/admin/statistiques/paiement")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{methodStats.methodName}</h1>
            <div className="p-2 rounded-full border">
              {getMethodIcon()}
            </div>
            {methodStats.trend !== "stable" && (
              <Badge variant="outline" className="flex items-center gap-1">
                {methodStats.trend === "hausse" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3 rotate-180" />
                )}
                {methodStats.trend === "hausse" ? "En hausse" : "En baisse"}
              </Badge>
            )}
          </div>
          <p className="opacity-70 mt-1">Analyse détaillée sur 7 jours</p>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Encaissé"
          value={`${methodStats.totalMontant.toLocaleString()} FCFA`}
          trend={methodStats.trend}
          trendValue={methodStats.trendPercentage}
          icon={<Wallet className="h-6 w-6" />}
          subtitle="7 derniers jours"
        />

        <KPICard
          title="Pourcentage Total"
          value={`${methodStats.pourcentageTotal.toFixed(1)}%`}
          icon={<Target className="h-6 w-6" />}
          subtitle={`${methodStats.totalCommandes} commandes`}
        />

        <KPICard
          title="Meilleur Jour"
          value={methodStats.meilleur_jour.charAt(0).toUpperCase() + methodStats.meilleur_jour.slice(1)}
          icon={<Calendar className="h-6 w-6" />}
          subtitle={`${methodStats.jours_semaine[methodStats.meilleur_jour].montant.toLocaleString()} FCFA`}
        />

        <KPICard
          title="Pic"
          value={`${methodStats.pic.montant.toLocaleString()} FCFA`}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle={`Le ${methodStats.pic.date}`}
        />
      </div>

      {/* Insights AI */}
      {methodStats.trend !== "stable" && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Insight:</strong>{" "}
            {methodStats.trend === "hausse" ? (
              <>
                L'utilisation de <strong>{methodStats.methodName}</strong> est en{" "}
                <strong>hausse de {methodStats.trendPercentage.toFixed(1)}%</strong>.{" "}
                {id === "credit" && (
                  <>
                    Le crédit représente <strong>{methodStats.pourcentageTotal.toFixed(1)}%</strong> des paiements.
                    Assurez un suivi rigoureux des recouvrements pour maintenir la trésorerie.
                  </>
                )}
                {id === "especes" && (
                  <>
                    Une augmentation des paiements en espèces peut indiquer une préférence des clients.
                    Assurez la sécurité des fonds et les dépôts réguliers.
                  </>
                )}
                {id === "momo" && (
                  <>
                    L'adoption du mobile money progresse. Envisagez des promotions pour encourager ce mode de paiement.
                  </>
                )}
              </>
            ) : (
              <>
                L'utilisation de <strong>{methodStats.methodName}</strong> est en{" "}
                <strong>baisse de {Math.abs(methodStats.trendPercentage).toFixed(1)}%</strong>.{" "}
                {id === "especes" && (
                  <>
                    La baisse des paiements en espèces peut indiquer une adoption accrue des paiements électroniques.
                  </>
                )}
                {id === "momo" && (
                  <>
                    Vérifiez la disponibilité du service et la communication des options de paiement aux clients.
                  </>
                )}
                {id === "credit" && (
                  <>
                    La diminution du crédit est positive pour la trésorerie. Continuez à encourager les paiements comptants.
                  </>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution du montant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution du Montant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart
              data={methodStats.evolution}
              xKey="date"
              yKey="montant"
              height={280}
            />
          </CardContent>
        </Card>

        {/* Evolution du pourcentage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Évolution du Pourcentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart
              data={methodStats.evolution}
              xKey="date"
              yKey="pourcentage"
              height={280}
            />
            <p className="text-sm opacity-70 mt-3 text-center">
              Part du mode de paiement dans le CA quotidien
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance par jour de la semaine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Performance par Jour de la Semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesBarChart
            data={joursBarData}
            xKey="jour"
            yKey="montant"
            height={300}
          />

          <div className="grid grid-cols-7 gap-3 mt-6">
            {joursOrdre.map((jour) => {
              const stats = methodStats.jours_semaine[jour];
              const estMeilleur = jour === methodStats.meilleur_jour;
              return (
                <div
                  key={jour}
                  className={`text-center p-3 border rounded-lg ${
                    estMeilleur ? "font-bold" : ""
                  }`}
                >
                  {estMeilleur && (
                    <TrendingUp className="h-4 w-4 mx-auto mb-1" />
                  )}
                  <p className="text-sm font-medium">
                    {jour.charAt(0).toUpperCase() + jour.slice(1).slice(0, 3)}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    {(stats.montant / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs opacity-70">
                    {stats.pourcentage.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium opacity-70">Total Encaissé</p>
              <p className="text-2xl font-bold">
                {methodStats.totalMontant.toLocaleString()} FCFA
              </p>
              <p className="text-xs opacity-70">Sur 7 jours</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium opacity-70">Part du CA Total</p>
              <p className="text-2xl font-bold">
                {methodStats.pourcentageTotal.toFixed(1)}%
              </p>
              <p className="text-xs opacity-70">
                Sur {methodStats.totalCommandes} commandes
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium opacity-70">Montant Moyen/Jour</p>
              <p className="text-2xl font-bold">
                {(methodStats.totalMontant / 7).toFixed(0).toLocaleString()} FCFA
              </p>
              <p className="text-xs opacity-70">Moyenne quotidienne</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {id === "especes" && (
              <>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Sécurité des Fonds</p>
                  <p className="text-sm opacity-70 mt-1">
                    Effectuez des dépôts bancaires réguliers pour minimiser les risques de vol.
                    Le meilleur jour ({methodStats.meilleur_jour}) nécessite une attention particulière.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Gestion de Caisse</p>
                  <p className="text-sm opacity-70 mt-1">
                    Maintenez un fonds de roulement suffisant pour les rendus de monnaie,
                    surtout les jours de forte affluence.
                  </p>
                </div>
              </>
            )}

            {id === "momo" && (
              <>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Promotion Mobile Money</p>
                  <p className="text-sm opacity-70 mt-1">
                    Encouragez les clients à utiliser le mobile money pour accélérer les transactions
                    et réduire la manipulation d'espèces.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Réconciliation</p>
                  <p className="text-sm opacity-70 mt-1">
                    Effectuez des rapprochements quotidiens entre les transactions enregistrées
                    et les confirmations reçues.
                  </p>
                </div>
              </>
            )}

            {id === "credit" && (
              <>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Suivi des Recouvrements</p>
                  <p className="text-sm opacity-70 mt-1">
                    Les crédits représentent {methodStats.pourcentageTotal.toFixed(1)}% des paiements.
                    Mettez en place un système de relance pour les créances en souffrance.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Politique de Crédit</p>
                  <p className="text-sm opacity-70 mt-1">
                    Évaluez la politique de crédit actuelle. Envisagez des limites par client
                    pour contrôler le risque d'impayés.
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

export default DesktopPaiementId;
