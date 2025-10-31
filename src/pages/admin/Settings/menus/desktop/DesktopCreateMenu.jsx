/**
 * DesktopCreateMenu.jsx
 * Composant pour créer un nouveau menu
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCreateMenuStore from "@/stores/admin/createMenuStore.js";
import { createMenu } from "@/toolkits/admin/menuToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
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

const DesktopCreateMenu = () => {
  const navigate = useNavigate();

  // Store
  const denomination = useCreateMenuStore((state) => state.denomination);
  const imgURL = useCreateMenuStore((state) => state.imgURL);
  const prix = useCreateMenuStore((state) => state.prix);
  const ingredients = useCreateMenuStore((state) => state.ingredients);
  const description = useCreateMenuStore((state) => state.description);
  const isLoading = useCreateMenuStore((state) => state.isLoading);
  const error = useCreateMenuStore((state) => state.error);
  const success = useCreateMenuStore((state) => state.success);

  const setDenomination = useCreateMenuStore((state) => state.setDenomination);
  const setImgURL = useCreateMenuStore((state) => state.setImgURL);
  const setPrix = useCreateMenuStore((state) => state.setPrix);
  const setIngredients = useCreateMenuStore((state) => state.setIngredients);
  const setDescription = useCreateMenuStore((state) => state.setDescription);
  const setIsLoading = useCreateMenuStore((state) => state.setIsLoading);
  const setError = useCreateMenuStore((state) => state.setError);
  const setSuccess = useCreateMenuStore((state) => state.setSuccess);
  const resetForm = useCreateMenuStore((state) => state.resetForm);

  // État local pour l'ingrédient en cours de saisie
  const [newIngredient, setNewIngredient] = useState("");

  // Validation
  const canSubmit =
    denomination.trim().length > 0 && prix > 0 && !isLoading && !success;

  // Ajouter un ingrédient
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  // Supprimer un ingrédient
  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Soumettre le formulaire
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
      const errorMessage = err.message || "Erreur lors de la création du menu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/settings/menus")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer un menu</h1>
          <p className="text-muted-foreground mt-1">
            Remplissez les informations du nouveau menu
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dénomination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Dénomination
            </CardTitle>
            <CardDescription>Le nom du menu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ex: Box viande"
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                className="pr-10"
              />
              {denomination.trim().length > 0 && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image du menu
            </CardTitle>
            <CardDescription>URL de l'image (optionnel)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imgURL}
              onChange={(e) => setImgURL(e.target.value)}
            />

            {/* Aperçu de l'image */}
            {imgURL && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={imgURL}
                  alt="Aperçu"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3EImage invalide%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Prix
            </CardTitle>
            <CardDescription>Prix en FCFA</CardDescription>
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
                className="pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                FCFA
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ingrédients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ingrédients
            </CardTitle>
            <CardDescription>
              Liste des ingrédients (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ajouter un ingrédient */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ex: Viande de boeuf"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => {
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
                disabled={!newIngredient.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Liste des ingrédients */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="text-sm">{ingredient}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIngredient(index)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </CardTitle>
            <CardDescription>Description du menu (optionnel)</CardDescription>
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

        {/* Message d'erreur */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message de succès */}
        {success && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="h-5 w-5" />
                <p className="text-sm">Menu créé avec succès !</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boutons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/admin/settings/menus")}
            disabled={isLoading}
          >
            Annuler
          </Button>

          <Button
            type="submit"
            className="flex-1"
            disabled={!canSubmit}
          >
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

export default DesktopCreateMenu;