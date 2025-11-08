/**
 * DesktopHistoriqueCompteTresorerie.jsx
 * Page d'historique détaillé d'un compte de trésorerie - Version Desktop
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Filter,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { getAllComptesTresorerie } from "@/toolkits/admin/comptabiliteToolkit";
import { loadOperationsForDateRange } from "@/utils/comptabilite/loadOperationsForPeriod";

const DesktopHistoriqueCompteTresorerie = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compte, setCompte] = useState(null);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres de période
  const [periodeFiltre, setPeriodeFiltre] = useState("7jours");
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);

  // Charger le compte et les opérations
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger le compte
        const { comptes } = await getAllComptesTresorerie();
        const compteFound = comptes.find((c) => c.id === id);

        if (!compteFound) {
          setError("Compte introuvable");
          return;
        }

        setCompte(compteFound);

        // Calculer la période selon le filtre
        let debut, fin;
        const now = new Date();

        switch (periodeFiltre) {
          case "aujourdhui":
            debut = new Date().setHours(0, 0, 0, 0);
            fin = new Date().setHours(23, 59, 59, 999);
            break;
          case "7jours":
            debut = new Date(now);
            debut.setDate(debut.getDate() - 7);
            debut.setHours(0, 0, 0, 0);
            fin = new Date().setHours(23, 59, 59, 999);
            break;
          case "30jours":
            debut = new Date(now);
            debut.setDate(debut.getDate() - 30);
            debut.setHours(0, 0, 0, 0);
            fin = new Date().setHours(23, 59, 59, 999);
            break;
          case "moisActuel":
            debut = new Date(now.getFullYear(), now.getMonth(), 1);
            debut.setHours(0, 0, 0, 0);
            fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            fin.setHours(23, 59, 59, 999);
            break;
          default:
            debut = new Date().setHours(0, 0, 0, 0);
            fin = new Date().setHours(23, 59, 59, 999);
        }

        setDateDebut(debut);
        setDateFin(fin);

        // Charger les opérations de la période
        const { operations: ops } = await loadOperationsForDateRange(debut, fin);

        // Filtrer les opérations pour ce compte uniquement
        const operationsCompte = ops.filter((op) => op.compte_id === id);

        setOperations(operationsCompte);

        console.log(`✅ ${operationsCompte.length} opérations chargées pour le compte ${compteFound.denomination}`);
      } catch (err) {
        console.error("❌ Erreur chargement:", err);
        setError(err.message);
        toast.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, periodeFiltre]);

  // Calculer les totaux
  const totaux = useMemo(() => {
    const entrees = operations
      .filter((op) => op.type_operation === "entree")
      .reduce((sum, op) => sum + op.montant, 0);

    const sorties = operations
      .filter((op) => op.type_operation === "sortie")
      .reduce((sum, op) => sum + op.montant, 0);

    const balance = entrees - sorties;

    return { entrees, sorties, balance };
  }, [operations]);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    if (operations.length === 0) return [];

    // Grouper par jour
    const operationsParJour = {};

    operations.forEach((op) => {
      const dateObj = new Date(op.date);
      const dateKey = dateObj.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });

      if (!operationsParJour[dateKey]) {
        operationsParJour[dateKey] = { entrees: 0, sorties: 0, balance: 0 };
      }

      if (op.type_operation === "entree") {
        operationsParJour[dateKey].entrees += op.montant;
      } else {
        operationsParJour[dateKey].sorties += op.montant;
      }
    });

    // Convertir en tableau et calculer la balance cumulée
    let balanceCumulee = 0;
    return Object.entries(operationsParJour)
      .map(([date, data]) => {
        balanceCumulee += data.entrees - data.sorties;
        return {
          date,
          entrees: data.entrees,
          sorties: data.sorties,
          balance: balanceCumulee,
        };
      })
      .slice(-14); // Garder les 14 derniers jours max
  }, [operations]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !compte) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Compte introuvable"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/admin/comptabilite/tresorerie")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/comptabilite/tresorerie")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8" />
              {compte.denomination}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono">
                {compte.code_ohada}
              </Badge>
              {compte.numero && (
                <span className="text-sm text-muted-foreground">
                  N° {compte.numero}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtre de période */}
          <div className="flex items-center gap-2">
            <Label>Période:</Label>
            <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aujourdhui">Aujourd'hui</SelectItem>
                <SelectItem value="7jours">7 derniers jours</SelectItem>
                <SelectItem value="30jours">30 derniers jours</SelectItem>
                <SelectItem value="moisActuel">Mois actuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Separator />

      {/* Cards récapitulatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entrées */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Total Entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              +{formatMontant(totaux.entrees)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </CardContent>
        </Card>

        {/* Sorties */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              Total Sorties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              -{formatMontant(totaux.sorties)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totaux.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totaux.balance >= 0 ? "+" : ""}
              {formatMontant(totaux.balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Entrées - Sorties</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution</CardTitle>
            <CardDescription>Balance cumulée sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  label={{ value: "Montant (FCFA)", angle: -90, position: "insideLeft" }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${formatMontant(value)} FCFA`, ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="entrees"
                  stroke="#16a34a"
                  strokeWidth={2}
                  name="Entrées"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="sorties"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Sorties"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Balance"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tableau d'historique */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des opérations</CardTitle>
          <CardDescription>
            {operations.length} opération(s) sur la période sélectionnée
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune opération sur cette période</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((operation) => (
                  <TableRow key={operation.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {formatDate(operation.date)}
                    </TableCell>
                    <TableCell>
                      {operation.type_operation === "entree" ? (
                        <Badge className="bg-green-100 text-green-700">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Entrée
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Sortie
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {operation.motif}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${
                      operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                    }`}>
                      {operation.type_operation === "entree" ? "+" : "-"}
                      {formatMontant(operation.montant)} FCFA
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopHistoriqueCompteTresorerie;
