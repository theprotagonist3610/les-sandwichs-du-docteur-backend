/**
 * MobileHistoriqueCompteComptable.jsx
 * Page d'historique détaillé d'un compte comptable - Version Mobile
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
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

const MobileHistoriqueCompteComptable = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compte, setCompte] = useState(null);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres de période
  const [periodeFiltre, setPeriodeFiltre] = useState("7jours");

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

        // Charger les opérations de la période
        const { operations: ops } = await loadOperationsForDateRange(debut, fin);

        // Filtrer les opérations pour ce compte uniquement
        const operationsCompte = ops.filter((op) => op.compte_id === id);

        setOperations(operationsCompte);
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
        operationsParJour[dateKey] = { montant: 0 };
      }

      operationsParJour[dateKey].montant += op.montant;
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
        };
      })
      .slice(-10); // Garder les 10 derniers jours pour mobile
  }, [operations]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
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
        <Button size="sm" onClick={() => navigate("/admin/comptabilite/comptes")}>
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
            onClick={() => navigate("/admin/comptabilite/comptes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate flex items-center gap-2">
              <Wallet className="h-5 w-5 flex-shrink-0" />
              {compte.denomination}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {compte.code_ohada}
              </Badge>
              <Badge variant={compte.categorie === "entree" ? "default" : "destructive"} className="text-xs">
                {compte.categorie === "entree" ? "Entrée" : "Sortie"}
              </Badge>
            </div>
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
        {/* Total */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Total des Opérations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatMontant(totaux.total)}
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totaux.nombre} opération(s)
            </p>
          </CardContent>
        </Card>

        {/* Moyenne */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Montant Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatMontant(Math.round(totaux.moyenne))}
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        {/* Solde Compte */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              Solde du Compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatMontant(compte.solde || 0)}
            </p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Évolution</CardTitle>
            <p className="text-xs text-muted-foreground">Cumul sur la période</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [`${formatMontant(value)} FCFA`, ""]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumul"
                  stroke="#3b82f6"
                  strokeWidth={2}
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
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{operation.motif}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(operation.date)}
                      </p>
                    </div>
                    <Badge
                      variant={operation.type_operation === "entree" ? "default" : "destructive"}
                      className="text-xs flex-shrink-0"
                    >
                      {operation.type_operation === "entree" ? "Entrée" : "Sortie"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                    }`}>
                      {operation.type_operation === "entree" ? "+" : ""}
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

export default MobileHistoriqueCompteComptable;
