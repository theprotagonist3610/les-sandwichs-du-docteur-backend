/**
 * MobileCreateMenu.jsx
 * Création d'un nouveau menu (version mobile, vertical & aérée)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCreateMenuStore from "@/stores/admin/createMenuStore.js";
import { createMenu } from "@/toolkits/admin/menuToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  X,
  UtensilsCrossed,
  ImageIcon,
  DollarSign,
  FileText,
  Plus,
  ArrowLeft,
} from "lucide-react";

const MobileCreateMenu = () => {
  const navigate = useNavigate();

  // Store
  const denomination = useCreateMenuStore((s) => s.denomination);
  const imgURL = useCreateMenuStore((s) => s.imgURL);
  const prix = useCreateMenuStore((s) => s.prix);
  const ingredients = useCreateMenuStore((s) => s.ingredients);
  const description = useCreateMenuStore((s) => s.description);
  const isLoading = useCreateMenuStore((s) => s.isLoading);
  const error = useCreateMenuStore((s) => s.error);
  const success = useCreateMenuStore((s) => s.success);

  const setDenomination = useCreateMenuStore((s) => s.setDenomination);
  const setImgURL = useCreateMenuStore((s) => s.setImgURL);
  const setPrix = useCreateMenuStore((s) => s.setPrix);
  const setIngredients = useCreateMenuStore((s) => s.setIngredients);
  const setDescription = useCreateMenuStore((s) => s.setDescription);
  const setIsLoading = useCreateMenuStore((s) => s.setIsLoading);
  const setError = useCreateMenuStore((s) => s.setError);
  const setSuccess = useCreateMenuStore((s) => s.setSuccess);
  const resetForm = useCreateMenuStore((s) => s.resetForm);

  // État local pour la saisie d'un ingrédient
  const [newIngredient, setNewIngredient] = useState("");

  // Validation
  const canSubmit =
    denomination.trim().length > 0 && prix > 0 && !isLoading && !success;

  // Handlers
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...(ingredients || []), newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsLoading(true);
      setError(null);

      await createMenu({
        denomination,
        imgURL,
        prix,
        ingredients,
        description,
      });

      setSuccess(true);
      toast.success("Menu créé avec succès !");
      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/menus");
      }, 1500);
    } catch (err) {
      const errorMessage = err?.message || "Erreur lors de la création du menu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Header compact */}
      <div className="flex items-center gap-3">
        {/* <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/settings/menus")}
          className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button> */}
        <div className="flex-1">
          <h1 className="text-xl font-bold">Créer un menu</h1>
          <p className="text-xs text-muted-foreground">
            Remplissez les informations du nouveau menu
          </p>
        </div>
      </div>

      <Separator />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dénomination */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Dénomination
            </CardTitle>
            <CardDescription className="text-xs">
              Le nom du menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ex: Box viande"
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                className="pr-8"
              />
              {denomination.trim().length > 0 && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image URL */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image du menu
            </CardTitle>
            <CardDescription className="text-xs">
              URL de l'image (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imgURL}
              onChange={(e) => setImgURL(e.target.value)}
            />

            {imgURL ? (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={imgURL}
                  alt="Aperçu"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Crect fill='%23ddd' width='160' height='120'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImage invalide%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Prix */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Prix
            </CardTitle>
            <CardDescription className="text-xs">Prix en FCFA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="100"
                placeholder="2000"
                value={prix}
                onChange={(e) => setPrix(Number(e.target.value))}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                FCFA
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ingrédients */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ingrédients
            </CardTitle>
            <CardDescription className="text-xs">
              Liste des ingrédients (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ex: Viande de boeuf"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddIngredient();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddIngredient}
                disabled={!newIngredient.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {ingredients?.length > 0 && (
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={`${ingredient}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">{ingredient}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIngredient(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </CardTitle>
            <CardDescription className="text-xs">
              Description du menu (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Décrivez le menu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <Card className="rounded-2xl border-destructive">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="rounded-2xl border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="h-5 w-5" />
                <p className="text-sm">Menu créé avec succès !</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/admin/settings/menus")}
            disabled={isLoading}>
            Annuler
          </Button>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : success ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Créé
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Créer le menu
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MobileCreateMenu;
