/**
 * DesktopDashboard - Tableau de bord Comptabilité (Version Desktop)
 * Dashboard riche avec KPIs, graphiques, actions rapides et alertes
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Lock,
  RefreshCw,
  Calendar,
  FileText,
  BarChart3,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  DollarSign,
  PieChart,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import useDashboardData from "@/hooks/useDashboardData";

const DesktopDashboard = () => {
  const navigate = useNavigate();
  const [periodeFiltre, setPeriodeFiltre] = useState("7jours");

  const {
    isLoading,
    error,
    soldeTotal,
    entreesJour,
    sortiesJour,
    balanceJour,
    variationPourcentage,
    dernieresOperations,
    topComptes,
    statistiques,
    etatCloture,
    alertes,
    evolutionTresorerie,
    entreesVsSorties,
    repartitionParType,
    refresh,
  } = useDashboardData(periodeFiltre);

  // Format montant
  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant);
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Refresh avec feedback
  const handleRefresh = async () => {
    toast.info("Actualisation des données...");
    await refresh();
    toast.success("Données actualisées");
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Tableau de Bord Comptabilité
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble et monitoring en temps réel
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtre période */}
          <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7jours">7 derniers jours</SelectItem>
              <SelectItem value="30jours">30 derniers jours</SelectItem>
              <SelectItem value="moisActuel">Mois actuel</SelectItem>
              <SelectItem value="annee">Année</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* ===== PHASE 1: KPIs PRINCIPAUX ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Solde Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
                <Wallet className="h-4 w-4" />
                Solde Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900">
                {formatMontant(soldeTotal)}
              </p>
              <p className="text-xs text-blue-600 mt-1">FCFA</p>
              <div className="flex items-center gap-1 mt-2">
                {parseFloat(variationPourcentage) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    parseFloat(variationPourcentage) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {variationPourcentage >= 0 ? "+" : ""}
                  {variationPourcentage}% vs hier
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Entrées du Jour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
                <ArrowDownCircle className="h-4 w-4" />
                Entrées du Jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900">
                +{formatMontant(entreesJour.montant)}
              </p>
              <p className="text-xs text-green-600 mt-1">FCFA</p>
              <p className="text-xs text-muted-foreground mt-2">
                {entreesJour.nombre} opération(s)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sorties du Jour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
                <ArrowUpCircle className="h-4 w-4" />
                Sorties du Jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-900">
                -{formatMontant(sortiesJour.montant)}
              </p>
              <p className="text-xs text-red-600 mt-1">FCFA</p>
              <p className="text-xs text-muted-foreground mt-2">
                {sortiesJour.nombre} opération(s)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance du Jour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card
            className={`bg-gradient-to-br ${
              balanceJour >= 0
                ? "from-emerald-50 to-emerald-100 border-emerald-200"
                : "from-orange-50 to-orange-100 border-orange-200"
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle
                className={`text-sm font-medium flex items-center gap-2 ${
                  balanceJour >= 0 ? "text-emerald-700" : "text-orange-700"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Balance du Jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-3xl font-bold ${
                  balanceJour >= 0 ? "text-emerald-900" : "text-orange-900"
                }`}
              >
                {balanceJour >= 0 ? "+" : ""}
                {formatMontant(balanceJour)}
              </p>
              <p className={`text-xs mt-1 ${balanceJour >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                FCFA
              </p>
              <div className="flex items-center gap-1 mt-2">
                {balanceJour >= 0 ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-orange-600" />
                )}
                <span className="text-xs text-muted-foreground">
                  {balanceJour >= 0 ? "Positif" : "Négatif"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== PHASE 1: ACTIONS RAPIDES ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
          <CardDescription>Gérez vos opérations en un clic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-green-500 hover:bg-green-50"
              onClick={() => navigate("/admin/comptabilite/create?type=entree")}
            >
              <div className="p-2 rounded-full bg-green-50">
                <ArrowDownCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-semibold">Nouvelle Entrée</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-red-500 hover:bg-red-50"
              onClick={() => navigate("/admin/comptabilite/create?type=sortie")}
            >
              <div className="p-2 rounded-full bg-red-50">
                <ArrowUpCircle className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-semibold">Nouvelle Sortie</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => navigate("/admin/comptabilite/transfert")}
            >
              <div className="p-2 rounded-full bg-blue-50">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-semibold">Transfert</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-purple-500 hover:bg-purple-50"
              onClick={() => navigate("/admin/comptabilite/cloture")}
            >
              <div className="p-2 rounded-full bg-purple-50">
                <Lock className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-semibold">Clôturer</span>
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => navigate("/admin/comptabilite/gerer")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Voir opérations
            </Button>

            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => navigate("/admin/comptabilite/tresorerie")}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Comptes Trésorerie
            </Button>

            <Button variant="ghost" className="justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== PHASE 2: ALERTES ===== */}
      {alertes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
                Alertes & Notifications ({alertes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertes.map((alerte, index) => (
                  <Alert
                    key={index}
                    variant={alerte.severity === "error" ? "destructive" : "default"}
                    className="py-2"
                  >
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{alerte.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== PHASE 1: DERNIÈRES OPÉRATIONS ===== */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Dernières Opérations
            </CardTitle>
            <CardDescription>Les 5 opérations les plus récentes</CardDescription>
          </CardHeader>
          <CardContent>
            {dernieresOperations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucune opération aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dernieresOperations.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/comptabilite/gerer/${op.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg ${
                          op.type_operation === "entree" ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        {op.type_operation === "entree" ? (
                          <ArrowDownCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{op.motif}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(op.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          op.type_operation === "entree" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {op.type_operation === "entree" ? "+" : "-"}
                        {formatMontant(op.montant)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {op.type_operation === "entree" ? "Entrée" : "Sortie"}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/admin/comptabilite/gerer")}
                >
                  Voir toutes les opérations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== PHASE 2: ÉTAT DE CLÔTURE ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Clôture du Jour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              {etatCloture.cloture ? (
                <>
                  <div className="p-3 rounded-full bg-green-50 inline-block mb-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-green-700">Journée clôturée</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toutes les opérations sont validées
                  </p>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-orange-50 inline-block mb-3">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-sm font-semibold text-orange-700">Non clôturé</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {etatCloture.nbOperations} opération(s) en attente
                  </p>
                </>
              )}
            </div>

            <Button
              className="w-full"
              variant={etatCloture.cloture ? "outline" : "default"}
              onClick={() => navigate("/admin/comptabilite/cloture")}
            >
              <Lock className="h-4 w-4 mr-2" />
              {etatCloture.cloture ? "Voir la clôture" : "Clôturer maintenant"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ===== PHASE 2: STATISTIQUES RAPIDES ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Opérations</p>
              <p className="text-2xl font-bold mt-1">{statistiques.nbOperations}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Comptes TR</p>
              <p className="text-2xl font-bold mt-1">{statistiques.nbComptes}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Moy. Entrée</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {formatMontant(Math.round(statistiques.moyEntree))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Moy. Sortie</p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {formatMontant(Math.round(statistiques.moySortie))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== PHASE 1 & 3: GRAPHIQUES ANALYTIQUES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1: Évolution Trésorerie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution Trésorerie
            </CardTitle>
            <CardDescription>
              Évolution du solde sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionTresorerie}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${formatMontant(value)} FCFA`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="solde"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Solde"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique 2: Top 5 Comptes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Top 5 Comptes
            </CardTitle>
            <CardDescription>Les comptes avec les soldes les plus élevés</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topComptes.map((c) => ({
                  nom: c.denomination.substring(0, 15),
                  solde: c.solde || 0,
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="nom" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(value) => `${formatMontant(value)} FCFA`} />
                <Bar dataKey="solde" fill="#8884d8" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique 3: Entrées vs Sorties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Entrées vs Sorties
            </CardTitle>
            <CardDescription>Comparaison par semaine du mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entreesVsSorties}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semaine" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${formatMontant(value)} FCFA`} />
                <Legend />
                <Bar dataKey="entrees" fill="#16a34a" name="Entrées" radius={[8, 8, 0, 0]} />
                <Bar dataKey="sorties" fill="#dc2626" name="Sorties" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique 4: Répartition par Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition par Type
            </CardTitle>
            <CardDescription>Distribution entrées/sorties sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={repartitionParType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {repartitionParType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${formatMontant(value)} FCFA`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopDashboard;
