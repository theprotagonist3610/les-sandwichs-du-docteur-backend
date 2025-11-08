/**
 * DesktopCloture.jsx
 * Page de clôture journalière - Version Desktop
 * Liste les opérations du jour avec totaux et bouton de clôture
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Archive,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDayKey } from "@/toolkits/admin/comptabilite/utils";
import { getOperationsToday } from "@/toolkits/admin/comptabilite/operations";
import { archiverOperationsVeille } from "@/toolkits/admin/comptabilite/archivage";
import { useClotureNotification } from "@/hooks/useClotureNotification";

/**
 * Formatage monétaire
 */
const formatMoney = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatage date/heure
 */
const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DesktopCloture() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clotureLoading, setClotureLoading] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);

  const { markClotureAsDone } = useClotureNotification();

  // Charger les opérations du jour
  const loadOperations = useCallback(async () => {
    try {
      setLoading(true);
      const { operations: ops } = await getOperationsToday();
      setOperations(ops);
    } catch (error) {
      console.error("Erreur chargement opérations:", error);
      toast.error("Erreur lors du chargement des opérations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

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

  // Gérer la clôture
  const handleCloture = async () => {
    if (operations.length === 0) {
      toast.warning("Aucune opération à clôturer");
      return;
    }

    try {
      setClotureLoading(true);

      // Archiver les opérations d'hier
      const result = await archiverOperationsVeille();

      // Marquer comme fait
      markClotureAsDone();

      toast.success(
        `Clôture effectuée ! ${result.archived} opérations archivées, ${result.kept} conservées`
      );

      // Recharger les opérations
      await loadOperations();
    } catch (error) {
      console.error("Erreur clôture:", error);
      toast.error("Erreur lors de la clôture");
    } finally {
      setClotureLoading(false);
    }
  };

  const dayKey = formatDayKey();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Clôture journalière
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <Button
          onClick={handleCloture}
          disabled={clotureLoading || operations.length === 0}
          size="lg"
          className="gap-2"
        >
          {clotureLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Archive className="h-5 w-5" />
              </motion.div>
              Clôture en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Clôturer la journée
            </>
          )}
        </Button>
      </div>

      {/* Cartes de résumé */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entrées</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(totaux.entrees)} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {operations.filter((op) => op.type_operation === "entree").length} opérations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sorties</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatMoney(totaux.sorties)} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {operations.filter((op) => op.type_operation === "sortie").length} opérations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totaux.balance > 0
                  ? "text-green-600"
                  : totaux.balance < 0
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {formatMoney(totaux.balance)} FCFA
            </div>
            <p className="text-xs text-muted-foreground">{operations.length} opérations total</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert si aucune opération */}
      {operations.length === 0 && !loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune opération</AlertTitle>
          <AlertDescription>
            Il n'y a aucune opération enregistrée pour aujourd'hui. La clôture n'est pas nécessaire.
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des opérations */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opérations du jour</CardTitle>
            <CardDescription>
              Cliquez sur une opération pour la modifier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operations.map((operation, index) => (
                <motion.div
                  key={operation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedOperation(operation)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge
                      variant={operation.type_operation === "entree" ? "default" : "destructive"}
                    >
                      {operation.type_operation === "entree" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {operation.type_operation}
                    </Badge>

                    <div className="flex-1">
                      <div className="font-medium">{operation.motif}</div>
                      <div className="text-sm text-muted-foreground">
                        {operation.compte_denomination} ({operation.compte_ohada})
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {operation.type_operation === "entree" ? "+" : "-"}
                        {formatMoney(operation.montant)} FCFA
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(operation.date)}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Separator */}
      <Separator />

      {/* Résumé final */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de la journée</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Jour</div>
              <div className="text-2xl font-bold">{dayKey}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Nombre d'opérations</div>
              <div className="text-2xl font-bold">{operations.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Entrées totales</div>
              <div className="text-2xl font-bold text-green-600">
                {formatMoney(totaux.entrees)} FCFA
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Sorties totales</div>
              <div className="text-2xl font-bold text-red-600">
                {formatMoney(totaux.sorties)} FCFA
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Balance de la journée</div>
            <div
              className={`text-3xl font-bold ${
                totaux.balance > 0
                  ? "text-green-600"
                  : totaux.balance < 0
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {totaux.balance > 0 ? "+" : ""}
              {formatMoney(totaux.balance)} FCFA
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
