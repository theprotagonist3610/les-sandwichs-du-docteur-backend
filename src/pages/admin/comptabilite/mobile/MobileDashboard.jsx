/**
 * MobileDashboard - Tableau de bord Comptabilité (Version Mobile)
 * Dashboard optimisé mobile avec toutes les fonctionnalités
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
  DollarSign,
  ChevronRight,
  Menu,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import useDashboardData from "@/hooks/useDashboardData";

const MobileDashboard = () => {
  const navigate = useNavigate();
  const [periodeFiltre, setPeriodeFiltre] = useState("7jours");
  const [actionsSheet, setActionsSheet] = useState(false);

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
    toast.info("Actualisation...");
    await refresh();
    toast.success("Actualisé");
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ===== STICKY HEADER ===== */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7jours">7 jours</SelectItem>
                <SelectItem value="30jours">30 jours</SelectItem>
                <SelectItem value="moisActuel">Mois</SelectItem>
                <SelectItem value="annee">Année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-4">
          {/* ===== PHASE 1: KPIs ===== */}
          <div className="space-y-3">
            {/* Solde Total */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        Solde Total
                      </p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {formatMontant(soldeTotal)}
                      </p>
                      <p className="text-xs text-blue-600">FCFA</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {parseFloat(variationPourcentage) >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-bold ${
                            parseFloat(variationPourcentage) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {variationPourcentage >= 0 ? "+" : ""}
                          {variationPourcentage}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">vs hier</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Grid 2 colonnes: Entrées / Sorties */}
            <div className="grid grid-cols-2 gap-3">
              {/* Entrées */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                      <ArrowDownCircle className="h-3 w-3" />
                      Entrées
                    </p>
                    <p className="text-xl font-bold text-green-900 mt-1">
                      +{formatMontant(entreesJour.montant)}
                    </p>
                    <p className="text-xs text-muted-foreground">{entreesJour.nombre} ops</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sorties */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                      <ArrowUpCircle className="h-3 w-3" />
                      Sorties
                    </p>
                    <p className="text-xl font-bold text-red-900 mt-1">
                      -{formatMontant(sortiesJour.montant)}
                    </p>
                    <p className="text-xs text-muted-foreground">{sortiesJour.nombre} ops</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Balance */}
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
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-xs font-medium flex items-center gap-1 ${
                          balanceJour >= 0 ? "text-emerald-700" : "text-orange-700"
                        }`}
                      >
                        <DollarSign className="h-3 w-3" />
                        Balance du Jour
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${
                          balanceJour >= 0 ? "text-emerald-900" : "text-orange-900"
                        }`}
                      >
                        {balanceJour >= 0 ? "+" : ""}
                        {formatMontant(balanceJour)}
                      </p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
                    </div>
                    <div>
                      {balanceJour >= 0 ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ===== PHASE 1: ACTIONS RAPIDES ===== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-2 hover:border-green-500 hover:bg-green-50"
                  onClick={() => navigate("/admin/comptabilite/create?type=entree")}
                >
                  <div className="p-2 rounded-full bg-green-50">
                    <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold">Entrée</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-2 hover:border-red-500 hover:bg-red-50"
                  onClick={() => navigate("/admin/comptabilite/create?type=sortie")}
                >
                  <div className="p-2 rounded-full bg-red-50">
                    <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-xs font-semibold">Sortie</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50"
                  onClick={() => navigate("/admin/comptabilite/transfert")}
                >
                  <div className="p-2 rounded-full bg-blue-50">
                    <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold">Transfert</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-2 hover:border-purple-500 hover:bg-purple-50"
                  onClick={() => navigate("/admin/comptabilite/cloture")}
                >
                  <div className="p-2 rounded-full bg-purple-50">
                    <Lock className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-xs font-semibold">Clôturer</span>
                </Button>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => navigate("/admin/comptabilite/gerer")}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Opérations
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => navigate("/admin/comptabilite/tresorerie")}
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Trésorerie
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ===== PHASE 2: ALERTES ===== */}
          {alertes.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  Alertes ({alertes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertes.map((alerte, index) => (
                    <Alert key={index} variant="default" className="py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">{alerte.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== PHASE 2: STATISTIQUES RAPIDES ===== */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Opérations</p>
                <p className="text-xl font-bold mt-1">{statistiques.nbOperations}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Comptes</p>
                <p className="text-xl font-bold mt-1">{statistiques.nbComptes}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Moy. Entrée</p>
                <p className="text-lg font-bold mt-1 text-green-600">
                  {formatMontant(Math.round(statistiques.moyEntree))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Moy. Sortie</p>
                <p className="text-lg font-bold mt-1 text-red-600">
                  {formatMontant(Math.round(statistiques.moySortie))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ===== PHASE 2: CLÔTURE ===== */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Clôture du Jour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-2">
                {etatCloture.cloture ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 mx-auto text-green-600 mb-2" />
                    <p className="text-sm font-semibold text-green-700">Clôturé</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-10 w-10 mx-auto text-orange-600 mb-2" />
                    <p className="text-sm font-semibold text-orange-700">Non clôturé</p>
                    <p className="text-xs text-muted-foreground">
                      {etatCloture.nbOperations} opération(s)
                    </p>
                  </>
                )}
              </div>
              <Button
                className="w-full"
                size="sm"
                variant={etatCloture.cloture ? "outline" : "default"}
                onClick={() => navigate("/admin/comptabilite/cloture")}
              >
                {etatCloture.cloture ? "Voir" : "Clôturer"}
              </Button>
            </CardContent>
          </Card>

          {/* ===== PHASE 1: DERNIÈRES OPÉRATIONS ===== */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Dernières Opérations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dernieresOperations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Aucune opération</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dernieresOperations.map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                      onClick={() => navigate(`/admin/comptabilite/gerer/${op.id}`)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`p-1 rounded ${
                            op.type_operation === "entree" ? "bg-green-50" : "bg-red-50"
                          }`}
                        >
                          {op.type_operation === "entree" ? (
                            <ArrowDownCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowUpCircle className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{op.motif}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(op.date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-xs font-bold ${
                          op.type_operation === "entree" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {op.type_operation === "entree" ? "+" : "-"}
                        {formatMontant(op.montant)}
                      </p>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/admin/comptabilite/gerer")}
                  >
                    Voir tout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== PHASE 3: GRAPHIQUES ===== */}
          {/* Évolution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Évolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={evolutionTresorerie}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => `${formatMontant(value)} FCFA`}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="solde"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Entrées vs Sorties */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Entrées vs Sorties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={entreesVsSorties}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semaine" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => `${formatMontant(value)} FCFA`}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="entrees" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sorties" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Répartition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={repartitionParType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {repartitionParType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${formatMontant(value)} FCFA`}
                    contentStyle={{ fontSize: 11 }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobileDashboard;
