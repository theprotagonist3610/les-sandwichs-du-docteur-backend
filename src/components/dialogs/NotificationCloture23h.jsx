/**
 * NotificationCloture23h.jsx
 * Notification rappel à 23h pour la clôture (dismissable, admin uniquement)
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
import { Clock } from "lucide-react";

const NotificationCloture23h = ({ open, onDismiss, onFaireCloture }) => {
  return (
    <Dialog open={open} onOpenChange={onDismiss}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Rappel : Clôture Quotidienne
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-base">
          Il est 23h00, pensez à effectuer la clôture de la journée avant minuit.
          <br />
          <br />
          <span className="text-orange-600 font-medium">
            Après minuit, la clôture sera obligatoire et bloquera l'accès à l'application.
          </span>
        </DialogDescription>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={onDismiss} className="w-full sm:w-auto">
            Me rappeler plus tard
          </Button>
          <Button onClick={onFaireCloture} className="w-full sm:w-auto">
            Faire la clôture maintenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCloture23h;
