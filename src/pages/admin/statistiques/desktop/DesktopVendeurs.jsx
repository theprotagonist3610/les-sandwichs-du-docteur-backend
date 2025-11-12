import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVendeursAnalytics } from "@/toolkits/admin/commandeToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  ShoppingCart,
  Download,
  Award,
  ChevronRight,
  Package,
  DollarSign,
} from "lucide-react";

const DesktopVendeurs = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");

  const daysCount = parseInt(period);
  const { vendeurs, summary, loading, error } = useVendeursAnalytics(daysCount);

  // Export CSV
  const exportCSV = () => {
    if (!vendeurs || vendeurs.length === 0) return;

    const rows = [
      ["Statistiques Vendeurs", `Période: ${period} derniers jours`],
      [],
      ["Résumé Global"],
      ["Total Vendeurs", summary?.total_vendeurs || 0],
      ["Total Ventes", `${(summary?.total_ventes || 0).toLocaleString()} FCFA`],
      ["Total Commandes", summary?.total_commandes || 0],
      ["Panier Moyen Global", `${(summary?.panier_moyen_global || 0).toFixed(0)} FCFA`],
      [],
      ["Classement des Vendeurs"],
      ["Rang", "Vendeur", "Ventes (FCFA)", "Commandes", "Panier Moyen", "% CA"],
    ];

    vendeurs.forEach((vendeur, index) => {
      rows.push([
        index + 1,
        vendeur.nom,
        vendeur.total_ventes.toFixed(0),
        vendeur.total_commandes,
        vendeur.panier_moyen.toFixed(0),
        vendeur.pourcentage_ca.toFixed(1) + "%",
      ]);
    });

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_vendeurs_${period}j.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement des statistiques vendeurs...</div>
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

  if (!summary || vendeurs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header avec filtre */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance des Vendeurs</h1>
          <p className="opacity-70 mt-1">
            Analyse des ventes et classement par vendeur
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="14">14 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="60">60 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Vendeurs"
          value={summary.total_vendeurs}
          icon={<Users className="h-5 w-5" />}
          trend="neutral"
          description={`${period} derniers jours`}
        />

        <KPICard
          title="Chiffre d'Affaires Total"
          value={`${summary.total_ventes.toLocaleString()} FCFA`}
          icon={<DollarSign className="h-5 w-5" />}
          trend="neutral"
          description="Toutes ventes cumulées"
        />

        <KPICard
          title="Total Commandes"
          value={summary.total_commandes}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend="neutral"
          description="Toutes commandes"
        />

        <KPICard
          title="Panier Moyen Global"
          value={`${summary.panier_moyen_global.toFixed(0)} FCFA`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="neutral"
          description="Moyenne générale"
        />
      </div>

      {/* Top Performer */}
      {summary.top_vendeur && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Performer - {period} derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-70">Vendeur</p>
                <p className="text-xl font-bold">{summary.top_vendeur.nom}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Ventes</p>
                <p className="text-xl font-bold text-green-600">
                  {summary.top_vendeur.total_ventes.toLocaleString()} FCFA
                </p>
              </div>
              <div>
                <p className="text-sm opacity-70">Commandes</p>
                <p className="text-xl font-bold">
                  {summary.top_vendeur.total_commandes}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-70">Part du CA</p>
                <p className="text-xl font-bold text-blue-600">
                  {summary.top_vendeur.pourcentage_ca.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classement des Vendeurs */}
      <Card>
        <CardHeader>
          <CardTitle>Classement par Chiffre d'Affaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vendeurs.map((vendeur, index) => (
              <div
                key={vendeur.userId}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/statistiques/vendeurs/${vendeur.userId}`)}
              >
                {/* Rang */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                  {index + 1}
                </div>

                {/* Badge Top 3 */}
                {index < 3 && (
                  <Award
                    className={`h-5 w-5 ${
                      index === 0
                        ? "text-yellow-500"
                        : index === 1
                        ? "text-gray-400"
                        : "text-orange-400"
                    }`}
                  />
                )}

                {/* Info Vendeur */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{vendeur.nom}</p>
                    <Badge variant="outline" className="text-xs">
                      {vendeur.pourcentage_ca.toFixed(1)}% du CA
                    </Badge>
                  </div>
                  <p className="text-sm opacity-70 mt-1">
                    {vendeur.total_commandes} commande(s) • Panier moyen:{" "}
                    {vendeur.panier_moyen.toFixed(0)} FCFA
                  </p>
                </div>

                {/* Ventes */}
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {vendeur.total_ventes.toLocaleString()} FCFA
                  </p>
                  {vendeur.articles_vendus.length > 0 && (
                    <p className="text-xs opacity-70 mt-1">
                      {vendeur.articles_vendus.length} articles différents
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 opacity-50" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Articles par Vendeur (Top 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {vendeurs.slice(0, 3).map((vendeur, index) => (
          <Card key={vendeur.userId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Top Articles - {vendeur.nom}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vendeur.articles_vendus.slice(0, 5).map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{article.denomination}</p>
                      <p className="text-xs opacity-70">Qté: {article.quantite}</p>
                    </div>
                    <p className="text-sm font-semibold text-green-600">
                      {article.total_ventes.toLocaleString()}
                    </p>
                  </div>
                ))}
                {vendeur.articles_vendus.length === 0 && (
                  <p className="text-sm opacity-70 text-center py-4">
                    Aucun article vendu
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DesktopVendeurs;
