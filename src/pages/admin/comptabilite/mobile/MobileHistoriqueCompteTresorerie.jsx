/**
 * MobileHistoriqueCompteTresorerie.jsx
 * Page d'historique détaillé d'un compte de trésorerie - Version Mobile
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { getAllComptesTresorerie } from "@/toolkits/admin/comptabiliteToolkit";
import { loadOperationsForDateRange } from "@/utils/comptabilite/loadOperationsForPeriod";

const MobileHistoriqueCompteTresorerie = () => {
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
      .slice(-10); // Garder les 10 derniers jours max pour mobile
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
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !compte) {
    return (
      <div className="container mx-auto p-4 pb-24">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Compte introuvable"}</AlertDescription>
        </Alert>
        <Button size="sm" onClick={() => navigate("/admin/comptabilite/tresorerie")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 space-y-4">
      {/* Header sticky */}
      <div className="sticky top-0 bg-background z-10 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/admin/comptabilite/tresorerie")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate flex items-center gap-2">
              <Wallet className="h-5 w-5 flex-shrink-0" />
              {compte.denomination}
            </h1>
            <Badge variant="outline" className="font-mono text-xs mt-1">
              {compte.code_ohada}
            </Badge>
          </div>
        </div>

        {/* Filtre de période */}
        <div className="space-y-1">
          <Label className="text-xs">Période:</Label>
          <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
            <SelectTrigger className="w-full">
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
      </div>

      <Separator />

      {/* Cards récapitulatives */}
      <div className="space-y-3">
        {/* Entrées */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Total Entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              +{formatMontant(totaux.entrees)}
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        {/* Sorties */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="h-3 w-3" />
              Total Sorties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              -{formatMontant(totaux.sorties)}
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totaux.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totaux.balance >= 0 ? "+" : ""}
              {formatMontant(totaux.balance)}
            </p>
            <p className="text-xs text-muted-foreground">Entrées - Sorties</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Évolution</CardTitle>
            <p className="text-xs text-muted-foreground">Balance cumulée sur la période</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [`${formatMontant(value)} FCFA`, ""]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="entrees"
                  stroke="#16a34a"
                  strokeWidth={2}
                  name="Entrées"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="sorties"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Sorties"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Balance"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Historique des opérations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historique</CardTitle>
          <p className="text-xs text-muted-foreground">
            {operations.length} opération(s)
          </p>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aucune opération</p>
            </div>
          ) : (
            <div className="space-y-2">
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="p-3 border rounded-lg space-y-2 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {formatDate(operation.date)}
                      </p>
                      <p className="text-sm mt-1 truncate">{operation.motif}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {operation.type_operation === "entree" ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <TrendingUp className="h-2 w-2 mr-1" />
                          Entrée
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          <TrendingDown className="h-2 w-2 mr-1" />
                          Sortie
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                    }`}>
                      {operation.type_operation === "entree" ? "+" : "-"}
                      {formatMontant(operation.montant)} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileHistoriqueCompteTresorerie;
