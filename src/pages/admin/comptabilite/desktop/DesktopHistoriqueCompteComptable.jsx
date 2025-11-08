/**
 * DesktopHistoriqueCompteComptable.jsx
 * Page d'historique détaillé d'un compte comptable - Version Desktop
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
  History,
  RefreshCw,
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
import { getAllComptes } from "@/toolkits/admin/comptabiliteToolkit";
import { loadOperationsForDateRange } from "@/utils/comptabilite/loadOperationsForPeriod";

const DesktopHistoriqueCompteComptable = () => {
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
        const { comptes } = await getAllComptes();
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
    const total = operations.reduce((sum, op) => sum + op.montant, 0);
    const nombre = operations.length;
    const moyenne = nombre > 0 ? total / nombre : 0;

    return { total, nombre, moyenne };
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
        operationsParJour[dateKey] = { montant: 0, count: 0 };
      }

      operationsParJour[dateKey].montant += op.montant;
      operationsParJour[dateKey].count += 1;
    });

    // Convertir en tableau et calculer le cumul
    let cumul = 0;
    return Object.entries(operationsParJour)
      .map(([date, data]) => {
        cumul += data.montant;
        return {
          date,
          montant: data.montant,
          cumul: cumul,
          count: data.count,
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
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !compte) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Compte introuvable"}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/admin/comptabilite/comptes")}>
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/comptabilite/comptes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              {compte.denomination}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {compte.code_ohada}
              </Badge>
              <Badge variant={compte.categorie === "entree" ? "default" : "destructive"}>
                {compte.categorie === "entree" ? "Entrée" : "Sortie"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Filtre de période */}
        <div className="flex items-center gap-3">
          <Label>Période:</Label>
          <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
            <SelectTrigger className="w-40">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Total des Opérations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatMontant(totaux.total)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
            <p className="text-xs text-muted-foreground mt-2">
              {totaux.nombre} opération(s)
            </p>
          </CardContent>
        </Card>

        {/* Moyenne */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Montant Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatMontant(Math.round(totaux.moyenne))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </CardContent>
        </Card>

        {/* Solde Compte */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              Solde du Compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatMontant(compte.solde || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution du Compte</CardTitle>
            <p className="text-sm text-muted-foreground">Montant et cumul sur la période</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${formatMontant(value)} FCFA`, ""]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="montant"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Montant"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumul"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Cumul"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Historique des opérations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des Opérations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {operations.length} opération(s)
          </p>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aucune opération sur cette période</p>
            </div>
          ) : (
            <div className="space-y-3">
              {operations.map((operation) => (
                <motion.div
                  key={operation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{operation.motif}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(operation.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={operation.type_operation === "entree" ? "default" : "destructive"}>
                      {operation.type_operation === "entree" ? "Entrée" : "Sortie"}
                    </Badge>
                    <p className={`text-lg font-bold ${
                      operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                    }`}>
                      {operation.type_operation === "entree" ? "+" : ""}
                      {formatMontant(operation.montant)} FCFA
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopHistoriqueCompteComptable;
