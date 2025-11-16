/**
 * DesktopInitialiserMenus.jsx
 * Composant pour initialiser les menus depuis une liste prédéfinie
 * Affiche chaque menu sous forme de card et permet l'enregistrement après validation
 */

import { useState } from "react";
import menusData from "../liste.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { createMenu } from "@/toolkits/admin/menuToolkit.jsx";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";

const DesktopInitialiserMenus = () => {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Compter le nombre total de menus
  const totalMenus = menusData.reduce((acc, groupe) => acc + groupe.liste.length, 0);

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setInitialized(false);
      let currentIndex = 0;

      // Parcourir tous les groupes et leurs menus
      for (const groupe of menusData) {
        for (const menu of groupe.liste) {
          currentIndex++;
          setProgress({ current: currentIndex, total: totalMenus });

          // Créer le menu
          await createMenu({
            denomination: menu.denomination,
            imgURL: menu.imgURL || "",
            prix: menu.prix || 2000,
            ingredients: menu.ingredients || [],
            description: menu.description || "",
          });

          console.log(`✅ Menu créé: ${menu.denomination}`);
        }
      }

      setInitialized(true);
      toast.success(`${totalMenus} menus initialisés avec succès !`);
    } catch (error) {
      console.error("❌ Erreur initialisation menus:", error);
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
          <h1 className="text-3xl font-bold">Initialiser les Menus</h1>
          <p className="text-muted-foreground mt-2">
            {totalMenus} menus prêts à être initialisés
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
            "Initialiser les menus"
          )}
        </Button>
      </div>

      {/* Grille des menus */}
      {menusData.map((groupe, groupeIndex) => (
        <div key={groupeIndex} className="space-y-4">
          {/* Titre du groupe */}
          <h2 className="text-2xl font-semibold border-b pb-2">{groupe.groupe}</h2>

          {/* Cards des menus */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupe.liste.map((menu, menuIndex) => (
              <Card key={menuIndex} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                {menu.imgURL && (
                  <div className="h-48 overflow-hidden bg-muted">
                    <img
                      src={menu.imgURL}
                      alt={menu.denomination}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">{menu.denomination}</CardTitle>
                  <CardDescription className="text-sm">
                    {menu.recipient}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {menu.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-primary">
                      {menu.prix} FCFA
                    </span>

                    {menu.calories > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {menu.calories} cal
                      </span>
                    )}
                  </div>

                  {menu.ingredients && menu.ingredients.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {menu.ingredients.length} ingrédient(s)
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
              Cette opération va créer <strong>{totalMenus} nouveaux menus</strong> dans la
              base de données. Assurez-vous que ces menus n'existent pas déjà avant de
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
              Les {totalMenus} menus ont été créés avec succès dans la base de données.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopInitialiserMenus;