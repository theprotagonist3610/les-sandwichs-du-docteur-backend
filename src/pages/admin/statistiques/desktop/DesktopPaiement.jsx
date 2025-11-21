import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFinanceAnalysis } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";
import SalesDonutChart from "@/components/statistics/charts/SalesDonutChart";
import SalesBarChart from "@/components/statistics/charts/SalesBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Download,
  Lightbulb,
  Banknote,
  Smartphone,
  Receipt,
} from "lucide-react";

const DesktopPaiement = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7");

  // Convertir period en nombre pour le hook
  const daysCount = period === "today" ? 1 : parseInt(period);
  const { financeStats, loading, error } = useFinanceAnalysis(daysCount);

  // Formater les données pour l'export CSV
  const exportCSV = () => {
    if (!financeStats) return;

    const rows = [
      ["Statistiques Financières", `Période: ${periodLabel}`],
      [],
      ["Indicateurs Généraux"],
      ["Chiffre d'Affaires Total", `${financeStats.totalCA.toLocaleString()} FCFA`],
      ["Nombre de Commandes", financeStats.totalCommandes],
      ["Tarif Moyen", `${financeStats.tarif_moyen.toFixed(0)} FCFA`],
      ["Total Crédit", `${financeStats.modes_paiement.credit.toLocaleString()} FCFA`],
      ["Meilleur Jour", financeStats.meilleur_jour],
      [],
      ["Modes de Paiement"],
      ["Espèces", `${financeStats.modes_paiement.especes.toLocaleString()} FCFA`],
      ["Mobile Money", `${financeStats.modes_paiement.momo.toLocaleString()} FCFA`],
      ["Crédit", `${financeStats.modes_paiement.credit.toLocaleString()} FCFA`],
      [],
      ["Performance par Jour de la Semaine"],
      ["Jour", "CA (FCFA)", "Commandes", "Tarif Moyen (FCFA)"],
    ];

    const joursOrdre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    joursOrdre.forEach((jour) => {
      const stats = financeStats.jours_semaine[jour];
      rows.push([
        jour.charAt(0).toUpperCase() + jour.slice(1),
        stats.ca.toFixed(0),
        stats.commandes,
        stats.tarif_moyen.toFixed(0),
      ]);
    });

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_financieres_${period}j.csv`;
    link.click();
  };

  const periodLabel = period === "today" ? "Aujourd'hui" : `${period} derniers jours`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement des statistiques financières...</div>
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

  if (!financeStats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg opacity-70">Aucune donnée disponible</div>
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

  // Données pour le graphique en barres des jours de la semaine
  const joursOrdre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const joursBarData = joursOrdre.map((jour) => ({
    jour: jour.charAt(0).toUpperCase() + jour.slice(1).slice(0, 3),
    ca: financeStats.jours_semaine[jour].ca,
    commandes: financeStats.jours_semaine[jour].commandes,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header avec filtre */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistiques Financières</h1>
          <p className="opacity-70 mt-1">
            Analyse des flux de paiement et du chiffre d'affaires
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Chiffre d'Affaires"
          value={`${financeStats.totalCA.toLocaleString()} FCFA`}
          trend={financeStats.trend}
          trendValue={financeStats.trendPercentage}
          icon={<Wallet className="h-6 w-6" />}
          subtitle={periodLabel}
        />

        <KPICard
          title="Tarif Moyen"
          value={`${financeStats.tarif_moyen.toFixed(0)} FCFA`}
          icon={<Receipt className="h-6 w-6" />}
          subtitle={`${financeStats.totalCommandes} commandes`}
        />

        <KPICard
          title="Total Crédit"
          value={`${financeStats.modes_paiement.credit.toLocaleString()} FCFA`}
          icon={<CreditCard className="h-6 w-6" />}
          subtitle={`${pourcentageCredit}% des paiements`}
        />

        <KPICard
          title="Meilleur Jour"
          value={financeStats.meilleur_jour.charAt(0).toUpperCase() + financeStats.meilleur_jour.slice(1)}
          icon={<Calendar className="h-6 w-6" />}
          subtitle="Jour le plus performant"
        />
      </div>

      {/* Insights AI */}
      {financeStats.trend !== "stable" && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Insight:</strong>{" "}
            {financeStats.trend === "hausse" ? (
              <>
                Le chiffre d'affaires est en hausse de{" "}
                <strong>{financeStats.trendPercentage.toFixed(1)}%</strong>.
                {financeStats.modes_paiement.credit > financeStats.totalCA * 0.2 && (
                  <> Les ventes à crédit représentent {pourcentageCredit}% des paiements, envisagez un suivi rigoureux des recouvrements.</>
                )}
              </>
            ) : (
              <>
                Le chiffre d'affaires est en baisse de{" "}
                <strong>{Math.abs(financeStats.trendPercentage).toFixed(1)}%</strong>.
                Analysez les causes possibles: diminution du traffic, augmentation de la concurrence, ou problèmes de qualité.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Graphiques d'évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution du CA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution du Chiffre d'Affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart
              data={financeStats.evolution_ca}
              xKey="date"
              yKey="ca"
              height={280}
              lineColor="#10b981"
            />
          </CardContent>
        </Card>

        {/* Evolution du Tarif Moyen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Évolution du Tarif Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart
              data={financeStats.evolution_tarif_moyen}
              xKey="date"
              yKey="tarif_moyen"
              height={280}
              lineColor="#3b82f6"
            />
          </CardContent>
        </Card>
      </div>

      {/* Répartition des modes de paiement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Répartition des Modes de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesDonutChart
              data={paiementDonutData}
              height={280}
            />
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div
                className="text-center p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate("/admin/statistiques/paiement/especes")}
              >
                <Banknote className="h-5 w-5 mx-auto mb-2 opacity-70" />
                <p className="text-sm font-medium opacity-70">Espèces</p>
                <p className="text-lg font-bold">
                  {financeStats.modes_paiement.especes.toLocaleString()}
                </p>
                <p className="text-xs opacity-70">{pourcentageEspeces}%</p>
              </div>
              <div
                className="text-center p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate("/admin/statistiques/paiement/momo")}
              >
                <Smartphone className="h-5 w-5 mx-auto mb-2 opacity-70" />
                <p className="text-sm font-medium opacity-70">Mobile Money</p>
                <p className="text-lg font-bold">
                  {financeStats.modes_paiement.momo.toLocaleString()}
                </p>
                <p className="text-xs opacity-70">{pourcentageMomo}%</p>
              </div>
              <div
                className="text-center p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate("/admin/statistiques/paiement/credit")}
              >
                <CreditCard className="h-5 w-5 mx-auto mb-2 opacity-70" />
                <p className="text-sm font-medium opacity-70">Crédit</p>
                <p className="text-lg font-bold">
                  {financeStats.modes_paiement.credit.toLocaleString()}
                </p>
                <p className="text-xs opacity-70">{pourcentageCredit}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance par jour */}
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
              yKey="ca"
              height={280}
            />
            <div className="mt-4 p-3 border rounded-lg">
              <p className="text-sm opacity-70">
                <strong>Meilleur jour:</strong>{" "}
                {financeStats.meilleur_jour.charAt(0).toUpperCase() + financeStats.meilleur_jour.slice(1)} avec{" "}
                <strong>
                  {financeStats.jours_semaine[financeStats.meilleur_jour].ca.toLocaleString()} FCFA
                </strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pic de CA */}
      {financeStats.pic_ca.montant > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pic de Chiffre d'Affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Date du pic</p>
                <p className="text-2xl font-bold mt-1">{financeStats.pic_ca.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-70">Montant</p>
                <p className="text-2xl font-bold mt-1">
                  {financeStats.pic_ca.montant.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopPaiement;
