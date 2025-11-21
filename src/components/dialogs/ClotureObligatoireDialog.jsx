/**
 * ClotureObligatoireDialog.jsx
 * Dialog bloquant pour la clôture quotidienne obligatoire
 * - Admin : peut lancer la clôture
 * - Non-Admin : affichage readonly, message "Contactez un admin"
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle, Loader2 } from "lucide-react";

const ClotureObligatoireDialog = ({
  open,
  donneesJournee,
  onLancerCloture,
  loading,
  clotureEnCours,
  isAdmin,
  userId,
  userName,
}) => {
  const handleLancer = () => {
    if (onLancerCloture && userId && userName) {
      onLancerCloture(userId, userName);
    }
  };

  if (!donneesJournee) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl" hideClose>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} disableEscapeKeyDown>
      <DialogContent className="max-w-2xl sm:max-w-3xl" hideClose>
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Lock className="h-6 w-6" />
            Clôture Quotidienne Obligatoire
          </DialogTitle>
          <DialogDescription className="text-base">
            La clôture du <span className="font-semibold">{donneesJournee.dateReadable}</span> n'a pas encore été effectuée.
            {!isAdmin && (
              <span className="block mt-1 text-orange-600 font-medium">
                Cette opération est réservée aux administrateurs.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-3 gap-3 py-4">
          {/* Opérations */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 mb-1">Opérations à archiver</p>
            <p className="text-2xl font-bold text-blue-900">{donneesJournee.operations.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {donneesJournee.operations.entrees}E · {donneesJournee.operations.sorties}S
            </p>
          </div>

          {/* Entrées */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 mb-1">Total Entrées</p>
            <p className="text-xl font-bold text-green-900">
              {(donneesJournee.montants.totalEntrees / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </div>

          {/* Sorties */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 mb-1">Total Sorties</p>
            <p className="text-xl font-bold text-red-900">
              {(donneesJournee.montants.totalSorties / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground mt-1">FCFA</p>
          </div>
        </div>

        {/* État Trésorerie */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 text-sm">État des Comptes de Trésorerie</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {donneesJournee.tresorerie.map((compte) => (
              <div
                key={compte.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <span className="text-sm">
                  {compte.code_ohada} - {compte.denomination}
                </span>
                <span className="font-semibold text-sm">
                  {(compte.solde || 0).toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert irréversible */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Cette action est irréversible et archivera définitivement les opérations du jour.
          </AlertDescription>
        </Alert>

        {/* Non-Admin Message */}
        {!isAdmin && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900 font-medium">
              Contactez un administrateur pour clôturer la journée
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <DialogFooter className="flex-col gap-2">
            {clotureEnCours && (
              <div className="text-center text-sm text-orange-600 font-medium mb-2">
                ⏳ Une clôture est déjà en cours par un autre administrateur...
              </div>
            )}

            <Button
              onClick={handleLancer}
              disabled={loading || clotureEnCours}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clôture en cours...
                </>
              ) : (
                "Lancer la Clôture"
              )}
            </Button>
          </DialogFooter>
        )}

        {/* Non-Admin: Aucune action */}
        {!isAdmin && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Vous ne pouvez pas effectuer cette action
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClotureObligatoireDialog;
