/**
 * DesktopInitialiserIngredients.jsx
 * Composant pour initialiser les ingrédients depuis une liste prédéfinie
 */

import { useState } from "react";
import { motion } from "framer-motion";
import ingredientsData from "../liste.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { createIngredient } from "@/toolkits/admin/menuToolkit.jsx";
import { toast } from "sonner";
import { Loader2, Check, X, Leaf } from "lucide-react";

const DesktopInitialiserIngredients = () => {
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Compter le nombre total d'ingrédients
  const totalIngredients = ingredientsData.reduce((acc, groupe) => acc + groupe.liste.length, 0);

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setInitialized(false);
      let currentIndex = 0;

      // Parcourir tous les groupes et leurs ingrédients
      for (const groupe of ingredientsData) {
        for (const ingredient of groupe.liste) {
          currentIndex++;
          setProgress({ current: currentIndex, total: totalIngredients });

          // Créer l'ingrédient avec emoji + nom
          await createIngredient({
            nom: `${ingredient.emoji} ${ingredient.denomination}`,
            quantite: "0",
            unite: ingredient.unite || { nom: "", symbol: "" },
            val_energetique: {
              cal_100: ingredient.calories || 0,
              kj_100: (ingredient.calories || 0) * 4.184, // Conversion approximative
            },
          });

          console.log(`✅ Ingrédient créé: ${ingredient.emoji} ${ingredient.denomination}`);
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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            Initialiser les Ingrédients
          </h1>
          <p className="text-muted-foreground mt-2">
            {totalIngredients} ingrédients prêts à être initialisés
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
            "Initialiser les ingrédients"
          )}
        </Button>
      </motion.div>

      {/* Grille des ingrédients */}
      {ingredientsData.map((groupe, groupeIndex) => (
        <motion.div
          key={groupeIndex}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* Titre du groupe */}
          <h2 className="text-2xl font-semibold border-b pb-2 flex items-center gap-2">
            {groupe.groupe}
          </h2>

          {/* Cards des ingrédients */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupe.liste.map((ingredient, ingredientIndex) => (
              <motion.div key={ingredientIndex} variants={itemVariants}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-4xl">{ingredient.emoji}</span>
                      <span className="flex-1">{ingredient.denomination}</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {ingredient.unite && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Unité</span>
                        <span className="font-semibold text-primary">
                          {ingredient.unite.nom} ({ingredient.unite.symbol})
                        </span>
                      </div>
                    )}
                    {ingredient.calories > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Calories</span>
                        <span className="font-semibold text-primary">
                          {ingredient.calories} kcal/100g
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Message d'avertissement */}
      {!initialized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <X className="h-5 w-5" />
                Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Cette opération va créer <strong>{totalIngredients} nouveaux ingrédients</strong>{" "}
                dans la base de données. Assurez-vous que ces ingrédients n&apos;existent pas déjà
                avant de procéder.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Message de succès */}
      {initialized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Initialisation réussie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 dark:text-green-400">
                Les {totalIngredients} ingrédients ont été créés avec succès dans la base de données.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DesktopInitialiserIngredients;
