import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  Target,
  Lightbulb,
  ChefHat,
  Wine,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecetteDetails } from "@/toolkits/admin/productionToolkit";
import KPICard from "@/components/statistics/cards/KPICard";
import SalesLineChart from "@/components/statistics/charts/SalesLineChart";

const DesktopProductionId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { recetteStats, loading, error } = useRecetteDetails(id, 7);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-lg">Chargement de l'analyse...</p>
      </div>
    );
  }

  if (error || !recetteStats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg opacity-70">
          {error || "Recette introuvable"}
        </p>
        <button
          onClick={() => navigate("/admin/statistiques/production")}
          className="mt-4 px-4 py-2 border rounded hover:opacity-80"
        >
          Retour au dashboard
        </button>
      </div>
    );
  }

  // Calculs pour les KPIs
  const avgDailyQuantite = recetteStats.avgQuantite;
  const prediction = Math.round(avgDailyQuantite * (recetteStats.trend === "hausse" ? 1.1 : recetteStats.trend === "baisse" ? 0.9 : 1));

  return (
    <div className="p-6 space-y-6">
      {/* Header avec retour */}
      <div>
        <button
          onClick={() => navigate("/admin/statistiques/production")}
          className="flex items-center gap-2 opacity-70 hover:opacity-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Retour au dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {recetteStats.type === "menu" ? (
                  <ChefHat className="h-8 w-8" />
                ) : (
                  <Wine className="h-8 w-8" />
                )}
                <h1 className="text-3xl font-bold">{recetteStats.denomination}</h1>
              </div>
              <Badge variant="outline">
                {recetteStats.trend === "hausse" && <TrendingUp className="h-3 w-3 mr-1" />}
                {recetteStats.trend === "baisse" && <TrendingDown className="h-3 w-3 mr-1" />}
                {recetteStats.trend}
              </Badge>
            </div>
            <p className="text-sm opacity-70 mt-1">
              Analyse détaillée sur {recetteStats.days} jours
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Recette */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Quantité Totale"
          value={`${recetteStats.totalQuantite} unités`}
          icon={<Package className="h-6 w-6" />}
          subtitle={`Sur ${recetteStats.days} jours`}
        />

        <KPICard
          title="Moyenne / Jour"
          value={avgDailyQuantite.toFixed(1)}
          icon={<Calendar className="h-6 w-6" />}
          subtitle="Unités par jour"
        />

        <KPICard
          title="Pic de Production"
          value={recetteStats.maxQuantite}
          icon={<TrendingUp className="h-6 w-6" />}
          subtitle={`Min: ${recetteStats.minQuantite}`}
        />

        <KPICard
          title="Prévision Demain"
          value={`~${prediction}`}
          icon={<Target className="h-6 w-6" />}
          subtitle="Basé sur tendance"
        />
      </div>

      {/* Insights IA */}
      {recetteStats.trend !== "stable" && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle className="font-bold">
            {recetteStats.trend === "hausse"
              ? "🎉 Tendance positive détectée !"
              : "⚠️ Baisse de production détectée"}
          </AlertTitle>
          <AlertDescription>
            {recetteStats.trend === "hausse" ? (
              <>
                La production de cette recette est en hausse de{" "}
                <strong>{Math.abs(recetteStats.trendPercentage).toFixed(1)}%</strong>.
                <br />
                💡 <strong>Recommandation :</strong> Augmenter le stock d'ingrédients principaux de 20% pour anticiper la demande.
                {recetteStats.maxQuantite > avgDailyQuantite * 1.5 && (
                  <span> Attention: pic de {recetteStats.maxQuantite} unités détecté.</span>
                )}
              </>
            ) : (
              <>
                La production de cette recette est en baisse de{" "}
                <strong>{Math.abs(recetteStats.trendPercentage).toFixed(1)}%</strong>.
                <br />
                💡 <strong>Recommandation :</strong> Analyser les causes possibles :
                <ul className="list-disc list-inside mt-2">
                  <li>Rupture de stock d'ingrédients</li>
                  <li>Baisse de demande client</li>
                  <li>Problème de qualité ou de goût</li>
                  <li>Concurrence d'autres recettes</li>
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Évolution de la Production (7 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart
            data={recetteStats.dailyProductions}
            xKey="date"
            yKey="quantite"
            height={350}
            lineColor="#a41624"
          />

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Moyenne / jour</p>
              <p className="text-2xl font-bold">
                {avgDailyQuantite.toFixed(1)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Maximum</p>
              <p className="text-2xl font-bold">{recetteStats.maxQuantite}</p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm opacity-70">Minimum</p>
              <p className="text-2xl font-bold">{recetteStats.minQuantite}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails Statistiques & Prévisions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistiques Détaillées */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Statistiques Détaillées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Total productions</span>
                  <span className="font-bold">{recetteStats.totalProductions}</span>
                </div>
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Quantité totale produite</span>
                  <span className="font-bold">{recetteStats.totalQuantite} unités</span>
                </div>
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Quantité moyenne / production</span>
                  <span className="font-bold">
                    {recetteStats.totalProductions > 0
                      ? (recetteStats.totalQuantite / recetteStats.totalProductions).toFixed(1)
                      : 0}{" "}
                    unités
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Tendance</span>
                  <Badge variant="outline">
                    {recetteStats.trend} ({recetteStats.trendPercentage > 0 ? "+" : ""}
                    {recetteStats.trendPercentage.toFixed(1)}%)
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prévisions & Recommandations */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Prévisions & Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Prévision demain</span>
                  <span className="font-bold">~{prediction} unités</span>
                </div>
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Prévision J+3</span>
                  <span className="font-bold">
                    ~{Math.round(prediction * 3)} unités
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded border">
                  <span className="opacity-70">Prévision semaine</span>
                  <span className="font-bold">
                    ~{Math.round(prediction * 7)} unités
                  </span>
                </div>
                <div className="p-3 rounded-lg border-l-4 border">
                  <p className="text-sm">
                    <strong>💡 Conseil de Gestion :</strong>{" "}
                    {recetteStats.trend === "hausse"
                      ? "Augmentez le stock d'ingrédients de 20% pour répondre à la demande croissante."
                      : recetteStats.trend === "baisse"
                      ? "Réduisez légèrement les commandes d'ingrédients et analysez les causes de la baisse."
                      : "Maintenez le niveau actuel de stock. La production est stable."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique Détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Historique des 7 Derniers Jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recetteStats.dailyProductions.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 opacity-70" />
                  <div>
                    <p className="font-medium">
                      {day.date?.length === 8
                        ? `${day.date.slice(0, 2)}/${day.date.slice(2, 4)}/${day.date.slice(4, 8)}`
                        : day.date}
                    </p>
                    <p className="text-xs opacity-70">
                      {day.productions} production{day.productions > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{day.quantite} unités</p>
                  <p className="text-xs opacity-70">
                    {((day.quantite / recetteStats.totalQuantite) * 100).toFixed(1)}% du total
                  </p>
                </div>
              </div>
            ))}

            {recetteStats.dailyProductions.length === 0 && (
              <div className="text-center py-8 opacity-70">
                Aucune production enregistrée
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopProductionId;
