import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFinanceAnalysis } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  CreditCard,
  Calendar,
  Lightbulb,
  Banknote,
  Smartphone,
  Receipt,
} from "lucide-react";

const MobilePaiement = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7");

  // Convertir period en nombre pour le hook
  const daysCount = period === "today" ? 1 : parseInt(period);
  const { financeStats, loading, error } = useFinanceAnalysis(daysCount);

  const periodLabel = period === "today" ? "Aujourd'hui" : `${period}j`;

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

  if (!financeStats) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  // Calculer le pourcentage de chaque mode de paiement
  const totalPaiements =
    financeStats.modes_paiement.especes +
    financeStats.modes_paiement.momo +
    financeStats.modes_paiement.credit;

  const pourcentageEspeces =
    totalPaiements > 0
      ? ((financeStats.modes_paiement.especes / totalPaiements) * 100).toFixed(1)
      : 0;
  const pourcentageMomo =
    totalPaiements > 0
      ? ((financeStats.modes_paiement.momo / totalPaiements) * 100).toFixed(1)
      : 0;
  const pourcentageCredit =
    totalPaiements > 0
      ? ((financeStats.modes_paiement.credit / totalPaiements) * 100).toFixed(1)
      : 0;

  // Données pour le graphique donut des modes de paiement
  const paiementDonutData = [
    { name: "Espèces", value: financeStats.modes_paiement.especes },
    { name: "Mobile Money", value: financeStats.modes_paiement.momo },
    { name: "Crédit", value: financeStats.modes_paiement.credit },
  ];

  // Données pour les jours de la semaine
  const joursOrdre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

  return (
    <div className="p-4 space-y-4">
      {/* Header avec filtre */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Statistiques Financières</h1>
          <p className="text-sm opacity-70 mt-1">Analyse des paiements et CA</p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs principaux - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="CA Total"
          value={`${(financeStats.totalCA / 1000).toFixed(0)}k`}
          trend={financeStats.trend}
          trendValue={financeStats.trendPercentage}
          icon={<Wallet className="h-5 w-5" />}
          subtitle={periodLabel}
        />

        <KPICard
          title="Tarif Moyen"
          value={`${financeStats.tarif_moyen.toFixed(0)}`}
          icon={<Receipt className="h-5 w-5" />}
          subtitle={`${financeStats.totalCommandes} cmd`}
        />

        <KPICard
          title="Total Crédit"
          value={`${(financeStats.modes_paiement.credit / 1000).toFixed(0)}k`}
          icon={<CreditCard className="h-5 w-5" />}
          subtitle={`${pourcentageCredit}%`}
        />

        <KPICard
          title="Meilleur Jour"
          value={financeStats.meilleur_jour.slice(0, 3).charAt(0).toUpperCase() + financeStats.meilleur_jour.slice(1, 3)}
          icon={<Calendar className="h-5 w-5" />}
          subtitle="Plus performant"
        />
      </div>

      {/* Insights AI */}
      {financeStats.trend !== "stable" && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="ml-2 text-sm">
            <strong>Insight:</strong>{" "}
            {financeStats.trend === "hausse" ? (
              <>
                CA en hausse de <strong>{financeStats.trendPercentage.toFixed(1)}%</strong>
                {financeStats.modes_paiement.credit > financeStats.totalCA * 0.2 && (
                  <>. Crédit élevé ({pourcentageCredit}%), suivez les recouvrements</>
                )}
              </>
            ) : (
              <>
                CA en baisse de <strong>{Math.abs(financeStats.trendPercentage).toFixed(1)}%</strong>.
                Analysez les causes.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Evolution du CA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Évolution du CA
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SalesLineChart
            data={financeStats.evolution_ca}
            xKey="date"
            yKey="ca"
            height={200}
          />
        </CardContent>
      </Card>

      {/* Répartition des modes de paiement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Modes de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SalesDonutChart data={paiementDonutData} height={200} />

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div
              className="text-center p-2 border rounded-lg cursor-pointer transition-all active:scale-95"
              onClick={() => navigate("/admin/statistiques/paiement/especes")}
            >
              <Banknote className="h-4 w-4 mx-auto mb-1 opacity-70" />
              <p className="text-xs font-medium opacity-70">Espèces</p>
              <p className="text-sm font-bold">
                {(financeStats.modes_paiement.especes / 1000).toFixed(0)}k
              </p>
              <p className="text-xs opacity-70">{pourcentageEspeces}%</p>
            </div>
            <div
              className="text-center p-2 border rounded-lg cursor-pointer transition-all active:scale-95"
              onClick={() => navigate("/admin/statistiques/paiement/momo")}
            >
              <Smartphone className="h-4 w-4 mx-auto mb-1 opacity-70" />
              <p className="text-xs font-medium opacity-70">MoMo</p>
              <p className="text-sm font-bold">
                {(financeStats.modes_paiement.momo / 1000).toFixed(0)}k
              </p>
              <p className="text-xs opacity-70">{pourcentageMomo}%</p>
            </div>
            <div
              className="text-center p-2 border rounded-lg cursor-pointer transition-all active:scale-95"
              onClick={() => navigate("/admin/statistiques/paiement/credit")}
            >
              <CreditCard className="h-4 w-4 mx-auto mb-1 opacity-70" />
              <p className="text-xs font-medium opacity-70">Crédit</p>
              <p className="text-sm font-bold">
                {(financeStats.modes_paiement.credit / 1000).toFixed(0)}k
              </p>
              <p className="text-xs opacity-70">{pourcentageCredit}%</p>
            </div>
          </div>
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
              const stats = financeStats.jours_semaine[jour];
              const estMeilleur = jour === financeStats.meilleur_jour;
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
                      {(stats.ca / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs opacity-70">{stats.commandes} cmd</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Evolution du Tarif Moyen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Évolution Tarif Moyen
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SalesLineChart
            data={financeStats.evolution_tarif_moyen}
            xKey="date"
            yKey="tarif_moyen"
            height={200}
          />
        </CardContent>
      </Card>

      {/* Pic de CA */}
      {financeStats.pic_ca.montant > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pic de CA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-xs opacity-70">Date</p>
                <p className="text-sm font-bold mt-1">{financeStats.pic_ca.date}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70">Montant</p>
                <p className="text-sm font-bold mt-1">
                  {(financeStats.pic_ca.montant / 1000).toFixed(0)}k FCFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobilePaiement;
