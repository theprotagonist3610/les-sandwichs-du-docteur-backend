import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Smartphone,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  PieChart as PieChartIcon,
  TrendingUpDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import useTresorerieStore, {
  selectComptesTresorerie,
  selectSoldeTotal,
  selectVariationPourcentage,
  selectIsLoading,
  selectError,
  selectSetComptesTresorerie,
  selectSetIsLoading,
  selectSetError,
  selectSetVariationPourcentage,
  selectOuvrirCreationCompte,
  selectReset,
} from "@/stores/admin/useTresorerieStore";
import {
  getAllComptesTresorerie,
} from "@/toolkits/admin/comptabiliteToolkit";

// Mapping des icônes et couleurs par code OHADA
const COMPTE_CONFIG = {
  "511": {
    icon: Building2,
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
  },
  "5121": {
    icon: Smartphone,
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    borderColor: "border-green-200",
  },
  "531": {
    icon: Wallet,
    color: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
  },
};

const DesktopTresorerie = () => {
  const navigate = useNavigate();

  // Store state
  const comptesTresorerie = useTresorerieStore(selectComptesTresorerie);
  const soldeTotal = useTresorerieStore(selectSoldeTotal);
  const variationPourcentage = useTresorerieStore(selectVariationPourcentage);
  const isLoading = useTresorerieStore(selectIsLoading);
  const error = useTresorerieStore(selectError);

  // Store actions
  const setComptesTresorerie = useTresorerieStore(selectSetComptesTresorerie);
  const setIsLoading = useTresorerieStore(selectSetIsLoading);
  const setError = useTresorerieStore(selectSetError);
  const setVariationPourcentage = useTresorerieStore(selectSetVariationPourcentage);
  const ouvrirCreationCompte = useTresorerieStore(selectOuvrirCreationCompte);
  const reset = useTresorerieStore(selectReset);

  // State local pour les charts
  const [dataRepartition, setDataRepartition] = useState([]);
  const [dataEvolution, setDataEvolution] = useState([]);

  // Charger les comptes de trésorerie
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { comptes } = await getAllComptesTresorerie();

        // Ajouter un solde fictif pour la démo (à remplacer par les vraies données)
        const comptesAvecSolde = comptes.map(compte => ({
          ...compte,
          solde: 0, // TODO: Calculer le solde réel depuis les opérations
        }));

        setComptesTresorerie(comptesAvecSolde);

        // TODO: Calculer la vraie variation
        setVariationPourcentage(1.2);

        console.log(`✅ ${comptes.length} comptes de trésorerie chargés`);
      } catch (err) {
        console.error("❌ Erreur chargement trésorerie:", err);
        setError(err.message);
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      reset();
    };
  }, []);

  // Calculer les données pour les charts quand les comptes changent
  useEffect(() => {
    if (comptesTresorerie.length > 0) {
      // Données de répartition (BarChart)
      const repartition = comptesTresorerie.map((compte) => {
        const config = getCompteConfig(compte.code_ohada);
        const pourcentage = soldeTotal > 0 ? ((compte.solde || 0) / soldeTotal) * 100 : 0;

        return {
          nom: compte.denomination,
          solde: compte.solde || 0,
          pourcentage: parseFloat(pourcentage.toFixed(1)),
          color: config.color,
        };
      });
      setDataRepartition(repartition);

      // Données d'évolution (LineChart) - 7 derniers jours simulés
      // TODO: Remplacer par les vraies données historiques
      const today = new Date();
      const evolutionData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

        const dataPoint = {
          date: dateStr,
        };

        comptesTresorerie.forEach((compte) => {
          // Simulation de variation aléatoire pour la démo
          const variation = Math.random() * 0.2 - 0.1; // ±10%
          dataPoint[compte.denomination] = Math.max(0, (compte.solde || 0) * (1 + variation * (6 - i) / 6));
        });

        evolutionData.push(dataPoint);
      }

      setDataEvolution(evolutionData);
    }
  }, [comptesTresorerie, soldeTotal]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant);
  };

  const getCompteConfig = (codeOhada) => {
    return COMPTE_CONFIG[codeOhada] || {
      icon: CreditCard,
      color: "gray",
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
      borderColor: "border-gray-200",
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="h-8 w-8" />
            Comptes de Trésorerie
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble et gestion de vos comptes
          </p>
        </div>
        <Button onClick={ouvrirCreationCompte}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau compte
        </Button>
      </div>

      <Separator />

      {/* Résumé global */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Solde total</p>
              <h2 className="text-4xl font-bold">
                {formatMontant(soldeTotal)} <span className="text-2xl">FCFA</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {variationPourcentage >= 0 ? (
                <>
                  <div className="p-3 rounded-full bg-green-50">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      +{variationPourcentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs hier</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-red-50">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">
                      {variationPourcentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs hier</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpDown className="h-5 w-5" />
            Actions rapides
          </CardTitle>
          <CardDescription>
            Gérez rapidement vos opérations de trésorerie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-auto py-4 flex-col gap-2 hover:border-green-500 hover:bg-green-50"
              onClick={() => navigate("/admin/comptabilite/create?type=entree")}
            >
              <div className="p-2 rounded-full bg-green-50">
                <ArrowDownCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Ajouter une entrée</p>
                <p className="text-xs text-muted-foreground">Encaissement</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-auto py-4 flex-col gap-2 hover:border-red-500 hover:bg-red-50"
              onClick={() => navigate("/admin/comptabilite/create?type=sortie")}
            >
              <div className="p-2 rounded-full bg-red-50">
                <ArrowUpCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Ajouter une sortie</p>
                <p className="text-xs text-muted-foreground">Paiement</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-auto py-4 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => navigate("/admin/comptabilite/transfert")}
            >
              <div className="p-2 rounded-full bg-blue-50">
                <ArrowLeftRight className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Transférer</p>
                <p className="text-xs text-muted-foreground">Entre comptes</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts de visualisation */}
      {comptesTresorerie.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BarChart - Répartition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Répartition de la trésorerie
              </CardTitle>
              <CardDescription>
                Distribution en pourcentage par compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataRepartition}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nom"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: "Pourcentage (%)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "pourcentage") return [`${value}%`, "Pourcentage"];
                      if (name === "solde") return [`${formatMontant(value)} FCFA`, "Solde"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="pourcentage"
                    fill="#8884d8"
                    name="Pourcentage"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* LineChart - Évolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution des comptes
              </CardTitle>
              <CardDescription>
                Tendance sur les 7 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    label={{ value: "Solde (FCFA)", angle: -90, position: "insideLeft" }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${formatMontant(value)} FCFA`, ""]}
                  />
                  <Legend />
                  {comptesTresorerie.map((compte) => {
                    const config = getCompteConfig(compte.code_ohada);
                    const strokeColor =
                      config.color === "blue"
                        ? "#3b82f6"
                        : config.color === "green"
                        ? "#10b981"
                        : "#f97316";

                    return (
                      <Line
                        key={compte.id}
                        type="monotone"
                        dataKey={compte.denomination}
                        stroke={strokeColor}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grille des comptes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comptesTresorerie.map((compte) => {
          const config = getCompteConfig(compte.code_ohada);
          const Icon = config.icon;

          return (
            <motion.div
              key={compte.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${config.borderColor}`}
                onClick={() => navigate(`/admin/comptabilite/tresorerie/${compte.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-6 w-6 ${config.textColor}`} />
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {compte.code_ohada}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{compte.denomination}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {compte.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Numéro de compte */}
                  {compte.numero && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Numéro de compte</p>
                      <p className="font-mono text-sm">{compte.numero}</p>
                    </div>
                  )}

                  {/* Solde */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Solde actuel</p>
                    <p className={`text-2xl font-bold ${config.textColor}`}>
                      {formatMontant(compte.solde || 0)} FCFA
                    </p>
                  </div>

                  <Separator />

                  {/* Bouton détails */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/comptabilite/tresorerie/${compte.id}`);
                    }}
                  >
                    Voir détails
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Carte d'ajout rapide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card
            className="cursor-pointer transition-all hover:shadow-lg border-2 border-dashed hover:border-primary/50 bg-muted/30 h-full min-h-[300px] flex items-center justify-center"
            onClick={ouvrirCreationCompte}
          >
            <CardContent className="text-center space-y-3">
              <div className="p-4 rounded-full bg-primary/10 inline-block">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Ajouter un compte</p>
                <p className="text-sm text-muted-foreground">
                  Créer un nouveau compte de trésorerie
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Message si aucun compte */}
      {comptesTresorerie.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun compte de trésorerie</p>
              <p className="text-sm mb-4">
                Créez votre premier compte pour commencer
              </p>
              <Button onClick={ouvrirCreationCompte}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un compte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopTresorerie;
