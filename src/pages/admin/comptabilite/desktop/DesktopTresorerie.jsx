import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  PieChart as PieChartIcon,
  TrendingUpDown,
  AlertCircle,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useTresorerieData from "@/hooks/useTresorerieData";
import {
  formatMontant,
  getCompteConfig,
} from "@/utils/comptabilite/tresorerieFormatters";
import TresorerieSkeleton from "../components/TresorerieSkeleton";

const DesktopTresorerie = () => {
  const navigate = useNavigate();

  // Utiliser le hook personnalisé qui gère toute la logique de données
  // + écoute RTDB pour mises à jour temps réel
  const {
    comptesTresorerie,
    soldeTotal,
    variationPourcentage,
    isLoading,
    error,
    dataRepartition,
    dataEvolution,
    ouvrirCreationCompte,
  } = useTresorerieData();

  // Mémoriser la fonction de navigation vers un compte
  const naviguerVersCompte = useCallback(
    (compteId) => {
      navigate(`/admin/comptabilite/tresorerie/${compteId}`);
    },
    [navigate]
  );

  // Mémoriser les fonctions de navigation vers les actions
  const naviguerVersEntree = useCallback(() => {
    navigate("/admin/comptabilite/create?type=entree");
  }, [navigate]);

  const naviguerVersSortie = useCallback(() => {
    navigate("/admin/comptabilite/create?type=sortie");
  }, [navigate]);

  const naviguerVersTransfert = useCallback(() => {
    navigate("/admin/comptabilite/create?type=transfert");
  }, [navigate]);

  // Afficher le skeleton pendant le chargement
  if (isLoading) {
    return <TresorerieSkeleton />;
  }

  // Afficher l'erreur si elle existe
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="h-8 w-8" aria-hidden="true" />
            Comptes de Trésorerie
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble et gestion de vos comptes
          </p>
        </div>
        {/* <Button
          onClick={ouvrirCreationCompte}
          aria-label="Créer un nouveau compte de trésorerie">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Nouveau compte
        </Button> */}
      </div>

      <Separator />

      {/* Résumé global */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Solde total</p>
              <h2
                className="text-4xl font-bold"
                aria-label={`Solde total de ${formatMontant(
                  soldeTotal
                )} francs CFA`}>
                {formatMontant(soldeTotal)}{" "}
                <span className="text-2xl">FCFA</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {variationPourcentage >= 0 ? (
                <>
                  <div
                    className="p-3 rounded-full bg-green-50"
                    aria-hidden="true">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-bold text-green-600"
                      aria-label={`Variation positive de ${variationPourcentage.toFixed(
                        1
                      )} pourcent`}>
                      +{variationPourcentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs hier</p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="p-3 rounded-full bg-red-50"
                    aria-hidden="true">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-bold text-red-600"
                      aria-label={`Variation négative de ${variationPourcentage.toFixed(
                        1
                      )} pourcent`}>
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
            <TrendingUpDown className="h-5 w-5" aria-hidden="true" />
            Actions rapides
          </CardTitle>
          <CardDescription>
            Gérez rapidement vos opérations de trésorerie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
            role="group"
            aria-label="Actions de trésorerie">
            <Button
              variant="outline"
              size="lg"
              className="h-auto py-4 flex-col gap-2 hover:border-green-500 hover:bg-green-50"
              onClick={naviguerVersEntree}
              aria-label="Ajouter une entrée d'encaissement">
              <div className="p-2 rounded-full bg-green-50" aria-hidden="true">
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
              onClick={naviguerVersSortie}
              aria-label="Ajouter une sortie de paiement">
              <div className="p-2 rounded-full bg-red-50" aria-hidden="true">
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
              onClick={naviguerVersTransfert}
              aria-label="Transférer entre comptes">
              <div className="p-2 rounded-full bg-blue-50" aria-hidden="true">
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
                <PieChartIcon className="h-5 w-5" aria-hidden="true" />
                Répartition de la trésorerie
              </CardTitle>
              <CardDescription>
                Distribution en pourcentage par compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dataRepartition}
                  aria-label="Graphique de répartition de la trésorerie">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nom"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{
                      value: "Pourcentage (%)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "pourcentage")
                        return [`${value}%`, "Pourcentage"];
                      if (name === "solde")
                        return [`${formatMontant(value)} FCFA`, "Solde"];
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
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
                Évolution des comptes
              </CardTitle>
              <CardDescription>
                Tendance sur les 7 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={dataEvolution}
                  aria-label="Graphique d'évolution des comptes">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    label={{
                      value: "Solde (FCFA)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${formatMontant(value)} FCFA`, ""]}
                  />
                  <Legend />
                  {comptesTresorerie.map((compte) => {
                    const config = getCompteConfig(compte.code_ohada);

                    return (
                      <Line
                        key={compte.id}
                        type="monotone"
                        dataKey={compte.denomination}
                        stroke={config.strokeColor}
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="list"
        aria-label="Liste des comptes de trésorerie">
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
              role="listitem">
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${config.borderColor}`}
                onClick={() => naviguerVersCompte(compte.id)}
                role="button"
                tabIndex={0}
                aria-label={`Compte ${compte.denomination}, code ${
                  compte.code_ohada
                }, solde ${formatMontant(compte.solde || 0)} francs CFA`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    naviguerVersCompte(compte.id);
                  }
                }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-lg ${config.bgColor}`}
                      aria-hidden="true">
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
                      <p className="text-xs text-muted-foreground">
                        Numéro de compte
                      </p>
                      <p className="font-mono text-sm">{compte.numero}</p>
                    </div>
                  )}

                  {/* Solde */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Solde actuel
                    </p>
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
                      naviguerVersCompte(compte.id);
                    }}
                    aria-label={`Voir les détails du compte ${compte.denomination}`}>
                    Voir détails
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Carte d'ajout rapide */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}>
          <Card
            className="cursor-pointer transition-all hover:shadow-lg border-2 border-dashed hover:border-primary/50 bg-muted/30 h-full min-h-[300px] flex items-center justify-center"
            onClick={ouvrirCreationCompte}
            role="button"
            tabIndex={0}
            aria-label="Ajouter un nouveau compte de trésorerie"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                ouvrirCreationCompte();
              }
            }}>
            <CardContent className="text-center space-y-3">
              <div
                className="p-4 rounded-full bg-primary/10 inline-block"
                aria-hidden="true">
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
        </motion.div> */}
      </div>

      {/* Message si aucun compte */}
      {comptesTresorerie.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Wallet
                className="h-12 w-12 mx-auto mb-4 opacity-50"
                aria-hidden="true"
              />
              <p className="text-lg font-medium">Aucun compte de trésorerie</p>
              <p className="text-sm mb-4">
                Créez votre premier compte pour commencer
              </p>
              <Button
                onClick={ouvrirCreationCompte}
                aria-label="Créer votre premier compte de trésorerie">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
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
