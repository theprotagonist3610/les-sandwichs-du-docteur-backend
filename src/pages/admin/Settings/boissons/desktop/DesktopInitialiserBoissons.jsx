/**
 * DesktopInitialiserBoissons.jsx
 * Composant pour initialiser les boissons depuis une liste prédéfinie
 * Affiche chaque boisson sous forme de card et permet l'enregistrement après validation
 */

import { useState } from "react";
import boissonsData from "../liste.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { createBoisson } from "@/toolkits/admin/boissonToolkit.jsx";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";

const DesktopInitialiserBoissons = () => {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Compter le nombre total de boissons
  const totalBoissons = boissonsData.reduce((acc, groupe) => acc + groupe.liste.length, 0);

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setInitialized(false);
      let currentIndex = 0;

      // Parcourir tous les groupes et leurs boissons
      for (const groupe of boissonsData) {
        for (const boisson of groupe.liste) {
          currentIndex++;
          setProgress({ current: currentIndex, total: totalBoissons });

          // Créer la boisson
          await createBoisson({
            denomination: boisson.denomination,
            imgURL: boisson.imgURL || "",
            prix: boisson.prix || 1000,
            description: boisson.recipient || "",
          });

          console.log(`✅ Boisson créée: ${boisson.denomination}`);
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
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Initialiser les Boissons</h1>
          <p className="text-muted-foreground mt-2">
            {totalBoissons} boissons prêtes à être initialisées
          </p>
        </div>

        <Button
          onClick={handleInitialize}
          disabled={initializing || initialized}
          size="lg"
          className="min-w-[200px]"
        >
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
      </div>

      {/* Grille des boissons */}
      {boissonsData.map((groupe, groupeIndex) => (
        <div key={groupeIndex} className="space-y-4">
          {/* Titre du groupe */}
          <h2 className="text-2xl font-semibold border-b pb-2">{groupe.groupe}</h2>

          {/* Cards des boissons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupe.liste.map((boisson, boissonIndex) => (
              <Card key={boissonIndex} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                {boisson.imgURL && (
                  <div className="h-48 overflow-hidden bg-muted">
                    <img
                      src={boisson.imgURL}
                      alt={boisson.denomination}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">{boisson.denomination}</CardTitle>
                  <CardDescription className="text-sm">
                    {boisson.recipient}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-primary">
                      {boisson.prix} FCFA
                    </span>

                    {boisson.volume > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {boisson.volume} {boisson.unite?.symbole || "ml"}
                      </span>
                    )}
                  </div>

                  {boisson.calories > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {boisson.calories} calories
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Message d'avertissement */}
      {!initialized && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <X className="h-5 w-5" />
              Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Cette opération va créer <strong>{totalBoissons} nouvelles boissons</strong> dans la
              base de données. Assurez-vous que ces boissons n'existent pas déjà avant de
              procéder.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Message de succès */}
      {initialized && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Initialisation réussie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 dark:text-green-400">
              Les {totalBoissons} boissons ont été créées avec succès dans la base de données.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopInitialiserBoissons;