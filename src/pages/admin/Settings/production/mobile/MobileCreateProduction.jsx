import { motion } from "framer-motion";
import {
  Save,
  Loader2,
  ChefHat,
  Type,
  Package,
  Hash,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useCreateProductionStore, {
  selectType,
  selectDenomination,
  selectIngredientPrincipalId,
  selectIngredientPrincipalQuantite,
  selectIngredientPrincipalUniteNom,
  selectIngredientPrincipalUniteSymbol,
  selectRecette,
  selectResultatId,
  selectResultatUniteNom,
  selectResultatUniteSymbol,
  selectIsSubmitting,
  selectError,
  selectSetType,
  selectSetDenomination,
  selectSetIngredientPrincipal,
  selectSetIngredientPrincipalQuantite,
  selectSetResultat,
  selectAddRecetteLine,
  selectRemoveRecetteLine,
  selectUpdateRecetteLine,
  selectSetIsSubmitting,
  selectSetError,
  selectReset,
} from "@/stores/admin/useCreateProductionStore";
import { createProductionDefinition } from "@/toolkits/admin/productionToolkit";
import { useStockElements } from "@/toolkits/admin/stockToolkit";
import { toast } from "sonner";
import { useState } from "react";

const MobileCreateProduction = () => {
  const type = useCreateProductionStore(selectType);
  const denomination = useCreateProductionStore(selectDenomination);
  const ingredientPrincipalId = useCreateProductionStore(
    selectIngredientPrincipalId
  );
  const ingredientPrincipalQuantite = useCreateProductionStore(
    selectIngredientPrincipalQuantite
  );
  const ingredientPrincipalUniteNom = useCreateProductionStore(
    selectIngredientPrincipalUniteNom
  );
  const ingredientPrincipalUniteSymbol = useCreateProductionStore(
    selectIngredientPrincipalUniteSymbol
  );
  const recette = useCreateProductionStore(selectRecette);
  const resultatId = useCreateProductionStore(selectResultatId);
  const resultatUniteNom = useCreateProductionStore(selectResultatUniteNom);
  const resultatUniteSymbol = useCreateProductionStore(
    selectResultatUniteSymbol
  );
  const isSubmitting = useCreateProductionStore(selectIsSubmitting);
  const error = useCreateProductionStore(selectError);

  const setType = useCreateProductionStore(selectSetType);
  const setDenomination = useCreateProductionStore(selectSetDenomination);
  const setIngredientPrincipal = useCreateProductionStore(
    selectSetIngredientPrincipal
  );
  const setIngredientPrincipalQuantite = useCreateProductionStore(
    selectSetIngredientPrincipalQuantite
  );
  const setResultat = useCreateProductionStore(selectSetResultat);
  const addRecetteLine = useCreateProductionStore(selectAddRecetteLine);
  const removeRecetteLine = useCreateProductionStore(selectRemoveRecetteLine);
  const updateRecetteLine = useCreateProductionStore(selectUpdateRecetteLine);
  const setIsSubmitting = useCreateProductionStore(selectSetIsSubmitting);
  const setError = useCreateProductionStore(selectSetError);
  const reset = useCreateProductionStore(selectReset);

  const [success, setSuccess] = useState(false);

  // Fetch stock elements - ingredients
  const {
    elements: ingredients,
    loading: loadingIngredients,
    error: errorIngredients,
  } = useStockElements({ type: "ingredient" });

  // Fetch stock elements - consommables (menus et boissons)
  const {
    elements: consommables,
    loading: loadingConsommables,
    error: errorConsommables,
  } = useStockElements({ type: "consommable" }); // Filtrer selon le type sélectionné

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!denomination.trim()) {
      setError("La dénomination est requise");
      return;
    }
    if (!ingredientPrincipalId) {
      setError("L'ingrédient principal est requis");
      return;
    }
    if (!ingredientPrincipalQuantite || ingredientPrincipalQuantite <= 0) {
      setError("La quantité par défaut doit être supérieure à 0");
      return;
    }
    if (!ingredientPrincipalUniteNom || !ingredientPrincipalUniteSymbol) {
      setError("L'unité de l'ingrédient principal est requise");
      return;
    }

    try {
      setIsSubmitting(true);
      await createProductionDefinition({
        type,
        denomination: denomination.trim(),
        ingredient_principal: {
          id: ingredientPrincipalId,
          denomination:
            ingredients.find((ing) => ing.id === ingredientPrincipalId)
              ?.denomination || "",
          quantite_par_defaut: ingredientPrincipalQuantite,
          unite: {
            nom: ingredientPrincipalUniteNom,
            symbol: ingredientPrincipalUniteSymbol,
          },
        },
        recette,
      });

      setSuccess(true);
      toast.success("Production créée avec succès", {
        description: denomination,
      });

      // Réinitialiser après un court délai
      setTimeout(() => {
        reset();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Erreur création production:", err);
      const errorMessage = err.message || "Une erreur s'est produite";
      setError(errorMessage);
      toast.error("Erreur lors de la création", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRecetteLine = () => {
    addRecetteLine({
      ingredient: "",
      quantite: 0,
      unite: { nom: "", symbol: "" },
    });
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          Créer une Production
        </h1>
        <p className="text-sm text-muted-foreground">
          Définir une nouvelle recette de production
        </p>
      </motion.div>

      {/* Formulaire */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-4">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <span className="text-destructive">*</span>
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <Package className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <Select
                  value={type}
                  onValueChange={setType}
                  disabled={isSubmitting}>
                  <SelectTrigger className="flex-1 border-0 shadow-none focus:ring-0 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="menu">Menu</SelectItem>
                    <SelectItem value="boisson">Boisson</SelectItem>
                  </SelectContent>
                </Select>
              </InputGroup>
            </div>

            {/* Dénomination */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Dénomination <span className="text-destructive">*</span>
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <Type className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Ex: Sandwich Jambon"
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </InputGroup>
            </div>
          </CardContent>
        </Card>

        {/* Ingrédient principal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingrédient Principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection ingrédient */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ingrédient <span className="text-destructive">*</span>
              </label>
              {loadingIngredients ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des ingrédients...
                </div>
              ) : errorIngredients ? (
                <div className="text-sm text-destructive">
                  {errorIngredients}
                </div>
              ) : (
                <Select
                  value={ingredientPrincipalId}
                  onValueChange={(id) => {
                    const ingredient = ingredients.find((ing) => ing.id === id);
                    if (ingredient) {
                      setIngredientPrincipal({
                        id: ingredient.id,
                        denomination: ingredient.denomination,
                        quantite_par_defaut: ingredient.quantite || 1,
                        unite: ingredient.unite || { nom: "", symbol: "" },
                      });
                    }
                  }}
                  disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un ingrédient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ingredient) => (
                      <SelectItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.denomination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Quantité par défaut */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Quantité par défaut <span className="text-destructive">*</span>
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <Hash className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 1"
                  value={ingredientPrincipalQuantite}
                  onChange={(e) =>
                    setIngredientPrincipalQuantite(
                      parseFloat(e.target.value) || 0
                    )
                  }
                  disabled={isSubmitting}
                  required
                />
              </InputGroup>
            </div>

            {/* Unité (lecture seule) */}
            {ingredientPrincipalId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Unité (nom)
                  </label>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      value={ingredientPrincipalUniteNom}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Symbole
                  </label>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      value={ingredientPrincipalUniteSymbol}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </InputGroup>
                </div>
              </div>
            )}
            {ingredientPrincipalId && (
              <p className="text-xs text-muted-foreground italic">
                L'unité de mesure est automatiquement définie par l'ingrédient
                sélectionné
              </p>
            )}
          </CardContent>
        </Card>

        {/* Produit Fini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produit Fini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection du consommable */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Consommable résultant{" "}
                <span className="text-destructive">*</span>
              </label>
              {loadingConsommables ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des consommables...
                </div>
              ) : errorConsommables ? (
                <div className="text-sm text-destructive">
                  {errorConsommables}
                </div>
              ) : (
                <Select
                  value={resultatId}
                  onValueChange={(id) => {
                    const consommable = consommables.find((c) => c.id === id);
                    if (consommable) {
                      setResultat({
                        id: consommable.id,
                        denomination: consommable.denomination,
                        type: consommable.type,
                        unite: consommable.unite || { nom: "", symbol: "" },
                      });
                    }
                  }}
                  disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un consommable" />
                  </SelectTrigger>
                  <SelectContent>
                    {consommables.map((consommable) => (
                      <SelectItem key={consommable.id} value={consommable.id}>
                        {consommable.denomination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Le produit fini qui sera ajouté au stock après production
              </p>
            </div>

            {/* Unité du produit fini (lecture seule) */}
            {resultatId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Unité (nom)
                  </label>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      value={resultatUniteNom}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Symbole
                  </label>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      value={resultatUniteSymbol}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </InputGroup>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recette */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recette (optionnel)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRecetteLine}
                disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recette.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun ingrédient dans la recette. Cliquez sur "Ajouter" pour en
                ajouter.
              </p>
            ) : (
              recette.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  {/* Ingrédient */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Ingrédient</label>
                    <Select
                      value={line.ingredient}
                      onValueChange={(value) => {
                        const ingredient = ingredients.find(
                          (ing) => ing.id === value
                        );
                        if (ingredient) {
                          updateRecetteLine(index, {
                            ingredient: value,
                            unite: ingredient.unite || { nom: "", symbol: "" },
                          });
                        }
                      }}
                      disabled={isSubmitting || loadingIngredients}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.denomination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantité et Unité */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Quantité</label>
                      <InputGroup>
                        <InputGroupInput
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          value={line.quantite}
                          onChange={(e) =>
                            updateRecetteLine(index, {
                              quantite: parseFloat(e.target.value) || 0,
                            })
                          }
                          disabled={isSubmitting}
                          className="h-9"
                        />
                      </InputGroup>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Unité
                      </label>
                      <InputGroup>
                        <InputGroupInput
                          type="text"
                          value={line.unite?.symbol || ""}
                          disabled
                          className="h-9 bg-muted/50 cursor-not-allowed"
                        />
                      </InputGroup>
                    </div>
                  </div>

                  {/* Bouton supprimer */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecetteLine(index)}
                    disabled={isSubmitting}
                    className="w-full">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Erreur</p>
                    <p className="text-sm text-destructive/80">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Message de succès */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Succès</p>
                    <p className="text-sm text-green-700">
                      La production a été créée avec succès
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bouton de soumission */}
        <Button
          type="submit"
          disabled={isSubmitting || success}
          className="w-full h-12"
          size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Création en cours...
            </>
          ) : success ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Production créée
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Créer la production
            </>
          )}
        </Button>
      </motion.form>
    </div>
  );
};

export default MobileCreateProduction;
