/**
 * MobileInitialiserBoissons.jsx
 * Initialisation des boissons (version mobile, vertical & aérée)
 */

import { useState } from "react";
import boissonsData from "../liste.js";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { createBoisson } from "@/toolkits/admin/boissonToolkit.jsx";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const MobileInitialiserBoissons = () => {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Total de boissons à créer
  const totalBoissons = boissonsData.reduce(
    (acc, grp) => acc + (grp.liste?.length || 0),
    0
  );

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setInitialized(false);
      let currentIndex = 0;

      for (const groupe of boissonsData) {
        for (const boisson of groupe.liste) {
          currentIndex++;
          setProgress({ current: currentIndex, total: totalBoissons });

          await createBoisson({
            denomination: boisson.denomination,
            imgURL: boisson.imgURL || "",
            prix: boisson.prix || 1000,
            description: boisson.recipient || "",
          });
        }
      }

      setInitialized(true);
      toast.success(`${totalBoissons} boissons initialisées avec succès !`);
    } catch (error) {
      console.error("❌ Erreur initialisation boissons:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setInitializing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Initialiser les Boissons</h1>
        <p className="text-sm text-muted-foreground">
          {totalBoissons} boisson{totalBoissons > 1 ? "s" : ""} prêtes à être initialisées
        </p>
      </div>

      {/* Bouton d'action principal */}
      <Button
        onClick={handleInitialize}
        disabled={initializing || initialized}
        className="w-full h-11">
        {initializing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress.current}/{progress.total}
          </>
        ) : initialized ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Initialisé
          </>
        ) : (
          "Initialiser les boissons"
        )}
      </Button>

      {/* Séparateur visuel */}
      <Separator />

      {/* Groupes & cartes (empilés, aérés) */}
      <div className="space-y-4">
        {boissonsData.map((groupe, groupIdx) => (
          <Card key={groupIdx} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{groupe.groupe}</CardTitle>
              <CardDescription className="text-xs">
                {groupe.liste?.length || 0} élément(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupe.liste.map((boisson, boissonIdx) => (
                <Card
                  key={boissonIdx}
                  className="overflow-hidden hover:shadow-md transition-shadow rounded-xl">
                  {/* Image */}
                  {boisson.imgURL && (
                    <div className="h-40 overflow-hidden bg-muted">
                      <img
                        src={boisson.imgURL}
                        alt={boisson.denomination}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {boisson.denomination}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {boisson.recipient}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold text-primary">
                        {boisson.prix} FCFA
                      </span>

                      {boisson.volume > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {boisson.volume} {boisson.unite?.symbole || "ml"}
                        </span>
                      )}
                    </div>

                    {boisson.calories > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-[11px] text-muted-foreground">
                          {boisson.calories} calories
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Avertissement / Succès */}
      {!initialized ? (
        <Card className="rounded-2xl border-amber-500 bg-amber-50 dark:bg-amber-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
              <X className="h-4 w-4" />
              Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Cette opération va créer{" "}
              <strong>
                {totalBoissons} nouvelle{totalBoissons > 1 ? "s" : ""} boisson{totalBoissons > 1 ? "s" : ""}
              </strong>{" "}
              dans la base de données. Assurez-vous qu'elles n'existent pas
              déjà avant de procéder.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              Initialisation réussie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
              Les {totalBoissons} boissons ont été créées avec succès dans la base de
              données.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileInitialiserBoissons;
