import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Plus, Trash2, Package, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import useCreateProductionStore, {
  selectType,
  selectDenomination,
  selectIngredientPrincipalDenomination,
  selectIngredientPrincipalQuantite,
  selectIngredientPrincipalUniteSymbol,
  selectRecette,
  selectResultatDenomination,
  selectResultatUniteSymbol,
  selectIsSubmitting,
  selectSetType,
  selectSetDenomination,
  selectSetIngredientPrincipal,
  selectSetIngredientPrincipalQuantite,
  selectAddRecetteLine,
  selectRemoveRecetteLine,
  selectUpdateRecetteLine,
  selectSetResultat,
  selectSetIsSubmitting,
  selectSetError,
  selectReset,
} from "@/stores/admin/useCreateProductionStore";
import { useFilteredStockElements } from "@/hooks/useFilteredStockElements";
import { createProductionDefinition } from "@/toolkits/admin/productionToolkit";

const DesktopCreateProduction = () => {
  // Store state
  const type = useCreateProductionStore(selectType);
  const denomination = useCreateProductionStore(selectDenomination);
  const ingredientPrincipalDenomination = useCreateProductionStore(selectIngredientPrincipalDenomination);
  const ingredientPrincipalQuantite = useCreateProductionStore(selectIngredientPrincipalQuantite);
  const ingredientPrincipalUniteSymbol = useCreateProductionStore(selectIngredientPrincipalUniteSymbol);
  const recette = useCreateProductionStore(selectRecette);
  const resultatDenomination = useCreateProductionStore(selectResultatDenomination);
  const resultatUniteSymbol = useCreateProductionStore(selectResultatUniteSymbol);
  const isSubmitting = useCreateProductionStore(selectIsSubmitting);

  // Store actions
  const setType = useCreateProductionStore(selectSetType);
  const setDenomination = useCreateProductionStore(selectSetDenomination);
  const setIngredientPrincipal = useCreateProductionStore(selectSetIngredientPrincipal);
  const setIngredientPrincipalQuantite = useCreateProductionStore(selectSetIngredientPrincipalQuantite);
  const addRecetteLine = useCreateProductionStore(selectAddRecetteLine);
  const removeRecetteLine = useCreateProductionStore(selectRemoveRecetteLine);
  const updateRecetteLine = useCreateProductionStore(selectUpdateRecetteLine);
  const setResultat = useCreateProductionStore(selectSetResultat);
  const setIsSubmitting = useCreateProductionStore(selectSetIsSubmitting);
  const setError = useCreateProductionStore(selectSetError);
  const reset = useCreateProductionStore(selectReset);

  // Récupérer les éléments du stock
  const { elements: stockElements, loading: loadingStock } = useFilteredStockElements();

  // Local state pour l'ajout d'une ligne de recette
  const [newRecetteIngredient, setNewRecetteIngredient] = useState("");
  const [newRecetteQuantite, setNewRecetteQuantite] = useState(0);

  // Filtrer les ingrédients (type = "ingredient")
  const ingredients = stockElements.filter((el) => el.type === "ingredient" && el.status);

  // Filtrer les consommables (type != "ingredient")
  const consommables = stockElements.filter((el) => el.type !== "ingredient" && el.status);

  // Gestion de l'ajout d'une ligne de recette
  const handleAddRecetteLine = () => {
    if (!newRecetteIngredient || newRecetteQuantite <= 0) {
      toast.error("Veuillez sélectionner un ingrédient et une quantité valide");
      return;
    }

    const selectedIngredient = ingredients.find((ing) => ing.id === newRecetteIngredient);
    if (!selectedIngredient) return;

    const newLine = {
      ingredient: selectedIngredient.denomination,
      quantite: newRecetteQuantite,
      unite: selectedIngredient.unite,
    };

    addRecetteLine(newLine);
    setNewRecetteIngredient("");
    setNewRecetteQuantite(0);
    toast.success("Ingrédient ajouté à la recette");
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    // Validation
    if (!denomination) {
      toast.error("Veuillez saisir une dénomination");
      return;
    }

    if (!ingredientPrincipalDenomination) {
      toast.error("Veuillez sélectionner l'ingrédient principal");
      return;
    }

    if (ingredientPrincipalQuantite <= 0) {
      toast.error("La quantité de l'ingrédient principal doit être supérieure à 0");
      return;
    }

    if (!resultatDenomination) {
      toast.error("Veuillez sélectionner le produit fini");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Construire l'objet ingredient_principal
      const ingredientPrincipal = useCreateProductionStore.getState().ingredientPrincipalId
        ? {
            id: useCreateProductionStore.getState().ingredientPrincipalId,
            denomination: ingredientPrincipalDenomination,
            quantite_par_defaut: ingredientPrincipalQuantite,
            unite: {
              nom: useCreateProductionStore.getState().ingredientPrincipalUniteNom,
              symbol: ingredientPrincipalUniteSymbol,
            },
          }
        : null;

      if (!ingredientPrincipal) {
        toast.error("Ingrédient principal invalide");
        return;
      }

      // Construire l'objet produit_fini
      const produitFini = useCreateProductionStore.getState().resultatId
        ? {
            type,
            denomination: resultatDenomination,
            unite: {
              nom: useCreateProductionStore.getState().resultatUniteNom,
              symbol: resultatUniteSymbol,
            },
          }
        : null;

      if (!produitFini) {
        toast.error("Produit fini invalide");
        return;
      }

      // Créer la définition de production
      const defPayload = {
        type,
        denomination,
        ingredient_principal: ingredientPrincipal,
        recette,
        produit_fini: produitFini,
      };

      await createProductionDefinition(defPayload);

      toast.success("Définition de production créée avec succès");
      reset();
    } catch (error) {
      console.error("❌ Erreur création production:", error);
      toast.error(`Erreur: ${error.message}`);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columnVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const isFormValid = denomination && ingredientPrincipalDenomination && resultatDenomination;

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Nouvelle Production</h1>
            <p className="text-sm text-muted-foreground">
              Créez une définition de production pour votre cuisine
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid}
          className="min-w-[200px]"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          {isSubmitting ? "Création..." : "Créer"}
        </Button>
      </motion.div>

      {/* Type et Dénomination */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="space-y-2">
          <Label htmlFor="type">Type de production</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="menu">Menu</SelectItem>
              <SelectItem value="boisson">Boisson</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="denomination">Dénomination</Label>
          <Input
            id="denomination"
            placeholder="Ex: Sandwich Poulet"
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
          />
        </div>
      </motion.div>

      <Separator />

      {/* 3 Colonnes */}
      <div className="grid grid-cols-3 gap-6 flex-1">
        {/* Colonne 1: Ingrédient Principal */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={columnVariants}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                Ingrédient Principal
              </CardTitle>
              <CardDescription>Base de la production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingredient-principal">Ingrédient</Label>
                {loadingStock ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    Chargement...
                  </div>
                ) : (
                  <Select
                    value={useCreateProductionStore.getState().ingredientPrincipalId}
                    onValueChange={(value) => {
                      const ingredient = ingredients.find((ing) => ing.id === value);
                      if (ingredient) {
                        setIngredientPrincipal(ingredient);
                      }
                    }}
                  >
                    <SelectTrigger id="ingredient-principal">
                      <SelectValue placeholder="Sélectionnez un ingrédient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.denomination} ({ing.unite.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <AnimatePresence>
                {ingredientPrincipalDenomination && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="quantite-principale">Quantité par défaut</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="quantite-principale"
                          type="number"
                          min="0"
                          step="0.1"
                          value={ingredientPrincipalQuantite}
                          onChange={(e) =>
                            setIngredientPrincipalQuantite(parseFloat(e.target.value) || 0)
                          }
                          className="flex-1"
                        />
                        <span className="text-lg font-bold text-primary min-w-[60px] text-center">
                          {ingredientPrincipalUniteSymbol}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {ingredientPrincipalDenomination}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Ingrédient de base
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Colonne 2: Recette */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={columnVariants}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                Recette
              </CardTitle>
              <CardDescription>Ingrédients secondaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              {/* Liste des lignes */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                <AnimatePresence>
                  {recette.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun ingrédient ajouté</p>
                    </motion.div>
                  )}

                  {recette.map((line, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{line.ingredient}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={line.quantite}
                            onChange={(e) =>
                              updateRecetteLine(index, {
                                quantite: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 h-8"
                          />
                          <span className="text-xs text-muted-foreground">
                            {line.unite.symbol}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          removeRecetteLine(index);
                          toast.success("Ligne supprimée");
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Ajouter une ligne */}
              <div className="border-t pt-4 space-y-3 mt-auto">
                <Label className="text-xs text-muted-foreground">Ajouter un ingrédient</Label>
                <div className="space-y-2">
                  <Select value={newRecetteIngredient} onValueChange={setNewRecetteIngredient}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients
                        .filter(
                          (ing) =>
                            !recette.find((r) => r.ingredient === ing.denomination) &&
                            ing.id !== useCreateProductionStore.getState().ingredientPrincipalId
                        )
                        .map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.denomination} ({ing.unite.symbol})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <AnimatePresence>
                    {newRecetteIngredient && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Quantité"
                          value={newRecetteQuantite || ""}
                          onChange={(e) => setNewRecetteQuantite(parseFloat(e.target.value) || 0)}
                          className="flex-1 h-9"
                        />
                        <Button size="sm" onClick={handleAddRecetteLine} className="h-9">
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Colonne 3: Résultat */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={columnVariants}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                Produit Fini
              </CardTitle>
              <CardDescription>Résultat de la production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resultat">Consommable</Label>
                {loadingStock ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    Chargement...
                  </div>
                ) : (
                  <Select
                    value={useCreateProductionStore.getState().resultatId}
                    onValueChange={(value) => {
                      const consommable = consommables.find((c) => c.id === value);
                      if (consommable) {
                        setResultat(consommable);
                      }
                    }}
                  >
                    <SelectTrigger id="resultat">
                      <SelectValue placeholder="Sélectionnez un consommable" />
                    </SelectTrigger>
                    <SelectContent>
                      {consommables.map((cons) => (
                        <SelectItem key={cons.id} value={cons.id}>
                          {cons.denomination} ({cons.unite.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <AnimatePresence>
                {resultatDenomination && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <Separator />

                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {resultatDenomination}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Unité: {resultatUniteSymbol}
                      </p>
                    </div>

                    <div className="p-3 bg-secondary rounded-lg text-sm space-y-1">
                      <p className="font-medium">📦 Ajouté au stock</p>
                      <p className="text-xs text-muted-foreground">
                        Le résultat sera automatiquement ajouté au stock lors de la finalisation de
                        la production
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer avec indicateur de statut */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
      >
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                ingredientPrincipalDenomination ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-muted-foreground">Ingrédient principal</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${recette.length > 0 ? "bg-green-500" : "bg-gray-300"}`}
            />
            <span className="text-muted-foreground">Recette ({recette.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                resultatDenomination ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-muted-foreground">Produit fini</span>
          </div>
        </div>

        {isFormValid && (
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium text-green-600"
          >
            ✓ Formulaire complet
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default DesktopCreateProduction;
