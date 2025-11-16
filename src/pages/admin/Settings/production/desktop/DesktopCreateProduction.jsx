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
  Info,
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

const DesktopCreateProduction = () => {
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
  const resultatUniteSymbol = useCreateProductionStore(selectResultatUniteSymbol);
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
  } = useStockElements({ type: type });

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
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ChefHat className="h-8 w-8" />
          Créer une Production
        </h1>
        <p className="text-muted-foreground">
          Définir une nouvelle recette de production pour les menus et boissons
        </p>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Information</p>
                <p className="text-blue-700">
                  La recette définit comment produire un menu ou une boisson à
                  partir d'ingrédients. L'ingrédient principal détermine la
                  quantité de base, et la recette détaille les ingrédients
                  supplémentaires nécessaires.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulaire */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Informations de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Type de production <span className="text-destructive">*</span>
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Package className="h-5 w-5" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Select
                    value={type}
                    onValueChange={setType}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="flex-1 border-0 shadow-none focus:ring-0 bg-transparent text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menu">Menu</SelectItem>
                      <SelectItem value="boisson">Boisson</SelectItem>
                    </SelectContent>
                  </Select>
                </InputGroup>
                <p className="text-xs text-muted-foreground">
                  Le type de produit à fabriquer
                </p>
              </div>

              {/* Dénomination */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Dénomination <span className="text-destructive">*</span>
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Type className="h-5 w-5" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="text"
                    placeholder="Ex: Sandwich Jambon"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="text-base"
                  />
                </InputGroup>
                <p className="text-xs text-muted-foreground">
                  Le nom du produit fini
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingrédient principal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ingrédient Principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection ingrédient */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ingrédient de base <span className="text-destructive">*</span>
              </label>
              {loadingIngredients ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Chargement des ingrédients...
                </div>
              ) : errorIngredients ? (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="pt-4">
                    <p className="text-sm text-destructive">{errorIngredients}</p>
                  </CardContent>
                </Card>
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
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="text-base">
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
              <p className="text-xs text-muted-foreground">
                L'ingrédient de base utilisé pour cette production
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quantité par défaut */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Quantité par défaut <span className="text-destructive">*</span>
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Hash className="h-5 w-5" />
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
                    className="text-base"
                  />
                </InputGroup>
                <p className="text-xs text-muted-foreground">
                  Quantité standard à utiliser
                </p>
              </div>

              {/* Unité nom (lecture seule) */}
              {ingredientPrincipalId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Unité (nom)
                  </label>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      value={ingredientPrincipalUniteNom}
                      disabled
                      className="text-base bg-muted/50 cursor-not-allowed"
                    />
                  </InputGroup>
                  <p className="text-xs text-muted-foreground">
                    Définie automatiquement par l'ingrédient
                  </p>
                </div>
              )}

              {/* Unité symbole (lecture seule) */}
              {ingredientPrincipalId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Symbole
                  </label>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      value={ingredientPrincipalUniteSymbol}
                      disabled
                      className="text-base bg-muted/50 cursor-not-allowed"
                    />
                  </InputGroup>
                  <p className="text-xs text-muted-foreground">
                    Définie automatiquement par l'ingrédient
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Produit Fini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Produit Fini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection du consommable */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Consommable résultant <span className="text-destructive">*</span>
              </label>
              {loadingConsommables ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Chargement des consommables...
                </div>
              ) : errorConsommables ? (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="pt-4">
                    <p className="text-sm text-destructive">{errorConsommables}</p>
                  </CardContent>
                </Card>
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
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="text-base">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Unité (nom)
                  </label>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      value={resultatUniteNom}
                      disabled
                      className="text-base bg-muted/50 cursor-not-allowed"
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
                      className="text-base bg-muted/50 cursor-not-allowed"
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
              <div>
                <CardTitle className="text-xl">
                  Recette (optionnel)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ingrédients supplémentaires nécessaires à la production
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleAddRecetteLine}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un ingrédient
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recette.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Aucun ingrédient dans la recette.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur "Ajouter un ingrédient" pour commencer.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recette.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-muted/30">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Ingrédient */}
                          <div className="md:col-span-6 space-y-2">
                            <label className="text-sm font-medium">
                              Ingrédient
                            </label>
                            <Select
                              value={line.ingredient}
                              onValueChange={(value) => {
                                const ingredient = ingredients.find((ing) => ing.id === value);
                                if (ingredient) {
                                  updateRecetteLine(index, {
                                    ingredient: value,
                                    unite: ingredient.unite || { nom: "", symbol: "" },
                                  });
                                }
                              }}
                              disabled={isSubmitting || loadingIngredients}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un ingrédient" />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((ingredient) => (
                                  <SelectItem
                                    key={ingredient.id}
                                    value={ingredient.id}
                                  >
                                    {ingredient.denomination}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quantité */}
                          <div className="md:col-span-3 space-y-2">
                            <label className="text-sm font-medium">
                              Quantité
                            </label>
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
                              />
                            </InputGroup>
                          </div>

                          {/* Unité (lecture seule) */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Unité
                            </label>
                            <InputGroup>
                              <InputGroupInput
                                type="text"
                                value={line.unite?.symbol || ""}
                                disabled
                                className="bg-muted/50 cursor-not-allowed"
                              />
                            </InputGroup>
                          </div>

                          {/* Bouton supprimer */}
                          <div className="md:col-span-1 flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRecetteLine(index)}
                              disabled={isSubmitting}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages d'état */}
        <div className="space-y-4">
          {/* Message d'erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-destructive text-lg">
                        Erreur
                      </p>
                      <p className="text-destructive/80 mt-1">{error}</p>
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
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 text-lg">
                        Succès
                      </p>
                      <p className="text-green-700 mt-1">
                        La production a été créée avec succès et est maintenant
                        disponible.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            disabled={isSubmitting || success}
            size="lg"
            className="h-11"
          >
            Réinitialiser
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || success}
            size="lg"
            className="h-11 min-w-[200px]"
          >
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
        </div>
      </motion.form>
    </div>
  );
};

export default DesktopCreateProduction;
