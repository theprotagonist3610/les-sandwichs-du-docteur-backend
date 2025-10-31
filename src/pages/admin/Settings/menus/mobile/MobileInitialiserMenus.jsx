/**
 * MobileInitialiserMenus.jsx
 * Initialisation des menus (version mobile, vertical & aérée)
 */

import { useState } from "react";
import menusData from "../liste.js";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { createMenu } from "@/toolkits/admin/menuToolkit.jsx";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const MobileInitialiserMenus = () => {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Total de menus à créer
  const totalMenus = menusData.reduce(
    (acc, grp) => acc + (grp.liste?.length || 0),
    0
  );

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setInitialized(false);
      let currentIndex = 0;

      for (const groupe of menusData) {
        for (const menu of groupe.liste) {
          currentIndex++;
          setProgress({ current: currentIndex, total: totalMenus });

          await createMenu({
            denomination: menu.denomination,
            imgURL: menu.imgURL || "",
            prix: menu.prix || 2000,
            ingredients: menu.ingredients || [],
            description: menu.description || "",
          });

          // Optionnel: toast de progression granulaire (commenté pour éviter le spam)
          // toast.message(`Créé: ${menu.denomination} (${currentIndex}/${totalMenus})`);
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
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Initialiser les Menus</h1>
        <p className="text-sm text-muted-foreground">
          {totalMenus} menu{totalMenus > 1 ? "s" : ""} prêts à être initialisés
        </p>
      </div>

      {/* Bouton d’action principal */}
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
          "Initialiser les menus"
        )}
      </Button>

      {/* Séparateur visuel */}
      <Separator />

      {/* Groupes & cartes (empilés, aérés) */}
      <div className="space-y-4">
        {menusData.map((groupe, groupIdx) => (
          <Card key={groupIdx} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{groupe.groupe}</CardTitle>
              <CardDescription className="text-xs">
                {groupe.liste?.length || 0} élément(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupe.liste.map((menu, menuIdx) => (
                <Card
                  key={menuIdx}
                  className="overflow-hidden hover:shadow-md transition-shadow rounded-xl">
                  {/* Image */}
                  {menu.imgURL && (
                    <div className="h-40 overflow-hidden bg-muted">
                      <img
                        src={menu.imgURL}
                        alt={menu.denomination}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {menu.denomination}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {menu.recipient}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {menu.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {menu.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold text-primary">
                        {menu.prix} FCFA
                      </span>

                      {menu.calories > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {menu.calories} cal
                        </span>
                      )}
                    </div>

                    {menu.ingredients && menu.ingredients.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-[11px] text-muted-foreground">
                          {menu.ingredients.length} ingrédient(s)
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
                {totalMenus} nouveau{(x) => null}
              </strong>{" "}
              menus dans la base de données. Assurez-vous qu’ils n’existent pas
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
              Les {totalMenus} menus ont été créés avec succès dans la base de
              données.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileInitialiserMenus;
