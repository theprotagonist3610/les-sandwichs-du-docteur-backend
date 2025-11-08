/**
 * MobileCloture.jsx
 * Page de clôture journalière - Version Mobile
 * Version optimisée pour petits écrans
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
 * Formatage monétaire compact
 */
const formatMoney = (amount) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
};

/**
 * Formatage monétaire complet
 */
const formatMoneyFull = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatage date/heure compact
 */
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MobileCloture() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clotureLoading, setClotureLoading] = useState(false);

  const { markClotureAsDone } = useClotureNotification();

  // Charger les opérations du jour
  const loadOperations = useCallback(async () => {
    try {
      setLoading(true);
      const { operations: ops } = await getOperationsToday();
      setOperations(ops);
    } catch (error) {
      console.error("Erreur chargement opérations:", error);
      toast.error("Erreur chargement");
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

      const result = await archiverOperationsVeille();
      markClotureAsDone();

      toast.success(`✅ Clôture effectuée ! ${result.archived} archivées`);

      await loadOperations();
    } catch (error) {
      console.error("Erreur clôture:", error);
      toast.error("Erreur clôture");
    } finally {
      setClotureLoading(false);
    }
  };

  const dayKey = formatDayKey();

  return (
    <div className="pb-20">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Clôture
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>

        <Button
          onClick={handleCloture}
          disabled={clotureLoading || operations.length === 0}
          className="w-full gap-2"
        >
          {clotureLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Archive className="h-5 w-5" />
              </motion.div>
              Clôture...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Clôturer la journée
            </>
          )}
        </Button>
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-4">
        {/* Cartes de résumé */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-green-600">Entrées</span>
              </div>
              <div className="text-lg font-bold text-green-700">
                {formatMoney(totaux.entrees)}
              </div>
              <div className="text-xs text-green-600">
                {operations.filter((op) => op.type_operation === "entree").length} ops
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-xs font-medium text-red-600">Sorties</span>
              </div>
              <div className="text-lg font-bold text-red-700">{formatMoney(totaux.sorties)}</div>
              <div className="text-xs text-red-600">
                {operations.filter((op) => op.type_operation === "sortie").length} ops
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Balance</span>
              </div>
              <div
                className={`text-lg font-bold ${
                  totaux.balance > 0
                    ? "text-green-700"
                    : totaux.balance < 0
                      ? "text-red-700"
                      : "text-gray-700"
                }`}
              >
                {formatMoney(totaux.balance)}
              </div>
              <div className="text-xs text-blue-600">{operations.length} total</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert si aucune opération */}
        {operations.length === 0 && !loading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aucune opération</AlertTitle>
            <AlertDescription>Pas d'opération aujourd'hui.</AlertDescription>
          </Alert>
        )}

        {/* Liste des opérations */}
        {operations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground px-1">
              Opérations ({operations.length})
            </div>

            {operations.map((operation, index) => (
              <motion.div
                key={operation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="hover:bg-accent cursor-pointer active:scale-98 transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              operation.type_operation === "entree" ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {operation.type_operation === "entree" ? "↑" : "↓"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(operation.date)}
                          </span>
                        </div>

                        <div className="font-medium text-sm truncate">{operation.motif}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {operation.compte_denomination}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div
                          className={`text-base font-bold ${
                            operation.type_operation === "entree"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {operation.type_operation === "entree" ? "+" : "-"}
                          {formatMoney(operation.montant)}
                        </div>
                        <div className="text-xs text-muted-foreground">FCFA</div>
                      </div>

                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Résumé final */}
        {operations.length > 0 && (
          <>
            <Separator className="my-4" />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Résumé du jour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entrées</span>
                  <span className="text-sm font-bold text-green-600">
                    +{formatMoneyFull(totaux.entrees)} FCFA
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sorties</span>
                  <span className="text-sm font-bold text-red-600">
                    -{formatMoneyFull(totaux.sorties)} FCFA
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">Balance</span>
                  <span
                    className={`text-lg font-bold ${
                      totaux.balance > 0
                        ? "text-green-600"
                        : totaux.balance < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {totaux.balance > 0 ? "+" : ""}
                    {formatMoneyFull(totaux.balance)} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
