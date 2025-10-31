/**
 * MobileInitialiserIngredients.jsx
 * Initialisation des ingrédients (version mobile avec animations)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import ingredientsData from "../liste.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { createIngredient } from "@/toolkits/admin/menuToolkit.jsx";
import { toast } from "sonner";
import { Loader2, Check, X, Leaf } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const MobileInitialiserIngredients = () => {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Total d'ingrédients à créer
  const totalIngredients = ingredientsData.reduce(
    (acc, grp) => acc + (grp.liste?.length || 0),
    0
  );

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setInitialized(false);
      let currentIndex = 0;

      for (const groupe of ingredientsData) {
        for (const ingredient of groupe.liste) {
          currentIndex++;
          setProgress({ current: currentIndex, total: totalIngredients });

          await createIngredient({
            nom: `${ingredient.emoji} ${ingredient.denomination}`,
            quantite: "0",
            unite: ingredient.unite || { nom: "", symbol: "" },
            val_energetique: {
              cal_100: ingredient.calories || 0,
              kj_100: (ingredient.calories || 0) * 4.184,
            },
          });
        }
      }

      setInitialized(true);
      toast.success(`${totalIngredients} ingrédients initialisés avec succès !`);
    } catch (error) {
      console.error("❌ Erreur initialisation ingrédients:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setInitializing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-600" />
          Initialiser les Ingrédients
        </h1>
        <p className="text-sm text-muted-foreground">
          {totalIngredients} ingrédient{totalIngredients > 1 ? "s" : ""} prêt
          {totalIngredients > 1 ? "s" : ""} à être initialisé
          {totalIngredients > 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Bouton d'action principal */}
      <Button
        onClick={handleInitialize}
        disabled={initializing || initialized}
        className="w-full h-11"
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
          "Initialiser les ingrédients"
        )}
      </Button>

      <Separator />

      {/* Groupes & cartes (empilés) */}
      <div className="space-y-4">
        {ingredientsData.map((groupe, groupIdx) => (
          <Card key={groupIdx} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{groupe.groupe}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {groupe.liste?.length || 0} élément(s)
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {groupe.liste.map((ingredient, ingIdx) => (
                  <motion.div key={ingIdx} variants={itemVariants}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow rounded-xl">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{ingredient.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {ingredient.denomination}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {ingredient.unite && (
                                <span className="font-medium">
                                  {ingredient.unite.symbol}
                                </span>
                              )}
                              {ingredient.calories > 0 && (
                                <span>• {ingredient.calories} kcal/100g</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Avertissement / Succès */}
      {!initialized ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
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
                  {totalIngredients} nouveau{totalIngredients > 1 ? "x" : ""} ingrédient
                  {totalIngredients > 1 ? "s" : ""}
                </strong>{" "}
                dans la base de données. Assurez-vous qu&apos;ils n&apos;existent pas déjà avant
                de procéder.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="rounded-2xl border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                <Check className="h-4 w-4" />
                Initialisation réussie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                Les {totalIngredients} ingrédients ont été créés avec succès dans la base de
                données.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MobileInitialiserIngredients;