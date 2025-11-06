import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Plus, Trash2, Package, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const MobileCreateProduction = () => {
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2"
      >
        <ChefHat className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Nouvelle Production</h1>
      </motion.div>

      {/* Type et Dénomination */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Type et dénomination de la production</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Card 1: Ingrédient Principal */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Ingrédient Principal
            </CardTitle>
            <CardDescription>
              Sélectionnez l'ingrédient principal et sa quantité par défaut
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ingredient-principal">Ingrédient</Label>
              {loadingStock ? (
                <p className="text-sm text-muted-foreground">Chargement des ingrédients...</p>
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

            {ingredientPrincipalDenomination && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="quantite-principale">Quantité par défaut</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="quantite-principale"
                    type="number"
                    min="0"
                    step="0.1"
                    value={ingredientPrincipalQuantite}
                    onChange={(e) => setIngredientPrincipalQuantite(parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {ingredientPrincipalUniteSymbol}
                  </span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Card 2: Recette */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Recette
            </CardTitle>
            <CardDescription>
              Ingrédients secondaires (proportionnels à l'ingrédient principal)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Liste des lignes de recette */}
            <AnimatePresence>
              {recette.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{line.ingredient}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={line.quantite}
                        onChange={(e) =>
                          updateRecetteLine(index, { quantite: parseFloat(e.target.value) || 0 })
                        }
                        className="w-24 h-8"
                      />
                      <span className="text-sm text-muted-foreground">{line.unite.symbol}</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
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

            {/* Ajouter une ligne */}
            <div className="border-t pt-4 space-y-3">
              <Label>Ajouter un ingrédient</Label>
              <div className="space-y-2">
                <Select value={newRecetteIngredient} onValueChange={setNewRecetteIngredient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un ingrédient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients
                      .filter((ing) => !recette.find((r) => r.ingredient === ing.denomination))
                      .map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.denomination} ({ing.unite.symbol})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {newRecetteIngredient && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Quantité"
                      value={newRecetteQuantite || ""}
                      onChange={(e) => setNewRecetteQuantite(parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddRecetteLine}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Card 3: Produit Fini (Résultat) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produit Fini
            </CardTitle>
            <CardDescription>
              Consommable résultant de cette production (sera ajouté au stock)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resultat">Consommable</Label>
              {loadingStock ? (
                <p className="text-sm text-muted-foreground">Chargement des consommables...</p>
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

            {resultatDenomination && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-primary/10 rounded-lg"
              >
                <p className="text-sm font-medium">Produit sélectionné :</p>
                <p className="text-lg font-bold">
                  {resultatDenomination} ({resultatUniteSymbol})
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bouton de soumission */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="sticky bottom-4"
      >
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !denomination || !ingredientPrincipalDenomination || !resultatDenomination}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          {isSubmitting ? "Création en cours..." : "Créer la Production"}
        </Button>
      </motion.div>
    </div>
  );
};

export default MobileCreateProduction;
