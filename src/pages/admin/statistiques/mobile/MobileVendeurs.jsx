import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useVendeursAnalytics } from "@/toolkits/admin/commandeToolkit";
import { useUsers } from "@/toolkits/admin/userToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Award,
  ChevronRight,
  DollarSign,
} from "lucide-react";

const MobileVendeurs = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");

  const daysCount = parseInt(period);
  const { vendeurs, summary, loading, error } = useVendeursAnalytics(daysCount);
  const { users, loading: loadingUsers } = useUsers();

  // Créer un mapping userId -> nom complet
  const userNamesMap = useMemo(() => {
    const map = new Map();
    users.forEach((user) => {
      const fullName = `${user.nom} ${user.prenoms?.join(" ") || ""}`.trim();
      map.set(user.id, fullName);
    });
    return map;
  }, [users]);

  // Fonction pour obtenir le nom d'un vendeur
  const getVendeurName = (userId) => {
    return userNamesMap.get(userId) || userId;
  };

  // Enrichir les vendeurs avec les noms réels
  const enrichedVendeurs = useMemo(() => {
    return vendeurs.map((vendeur) => ({
      ...vendeur,
      nom: getVendeurName(vendeur.userId),
    }));
  }, [vendeurs, userNamesMap]);

  // Enrichir le summary avec le nom réel du top vendeur
  const enrichedSummary = useMemo(() => {
    if (!summary || !summary.top_vendeur) return summary;
    return {
      ...summary,
      top_vendeur: {
        ...summary.top_vendeur,
        nom: getVendeurName(summary.top_vendeur.userId),
      },
    };
  }, [summary, userNamesMap]);

  if (loading || loadingUsers) {
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

  if (!enrichedSummary || enrichedVendeurs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center opacity-70">Aucune donnée disponible</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Performance Vendeurs</h1>
          <p className="text-sm opacity-70 mt-1">Classement et analyses</p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="14">14 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="60">60 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Vendeurs"
          value={enrichedSummary.total_vendeurs}
          icon={<Users className="h-5 w-5" />}
          trend="neutral"
          description={`${period}j`}
        />

        <KPICard
          title="CA Total"
          value={`${(enrichedSummary.total_ventes / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-5 w-5" />}
          trend="neutral"
          description="FCFA"
        />

        <KPICard
          title="Commandes"
          value={enrichedSummary.total_commandes}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend="neutral"
          description="Total"
        />

        <KPICard
          title="Panier Moy."
          value={`${(enrichedSummary.panier_moyen_global / 1000).toFixed(1)}k`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="neutral"
          description="FCFA"
        />
      </div>

      {/* Top Performer */}
      {enrichedSummary.top_vendeur && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-yellow-600" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-bold text-lg">{enrichedSummary.top_vendeur.nom}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="opacity-70">Ventes</p>
                <p className="font-bold text-green-600">
                  {(enrichedSummary.top_vendeur.total_ventes / 1000).toFixed(0)}k FCFA
                </p>
              </div>
              <div>
                <p className="opacity-70">Part CA</p>
                <p className="font-bold text-blue-600">
                  {enrichedSummary.top_vendeur.pourcentage_ca.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Classement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {enrichedVendeurs.map((vendeur, index) => (
              <div
                key={vendeur.userId}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors active:scale-[0.98]"
                onClick={() => navigate(`/admin/statistiques/vendeurs/${vendeur.userId}`)}
              >
                {/* Rang */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold text-primary text-sm">
                  {index + 1}
                </div>

                {/* Badge Top 3 */}
                {index < 3 && (
                  <Award
                    className={`h-4 w-4 ${
                      index === 0
                        ? "text-yellow-500"
                        : index === 1
                        ? "text-gray-400"
                        : "text-orange-400"
                    }`}
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{vendeur.nom}</p>
                    <Badge variant="outline" className="text-[10px] px-1">
                      {vendeur.pourcentage_ca.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs opacity-70 mt-0.5">
                    {vendeur.total_commandes} cmd • {(vendeur.panier_moyen / 1000).toFixed(1)}k moy.
                  </p>
                </div>

                {/* Ventes */}
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">
                    {(vendeur.total_ventes / 1000).toFixed(0)}k
                  </p>
                  <p className="text-[10px] opacity-70">FCFA</p>
                </div>

                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileVendeurs;
