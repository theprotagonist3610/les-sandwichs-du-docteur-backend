/**
 * DesktopGererUnMenu.jsx
 * Composant pour gérer/éditer un menu existant
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGererUnMenuStore from "@/stores/admin/gererUnMenuStore.js";
import { getAllMenus, updateMenu, deleteMenu } from "@/toolkits/admin/menuToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
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
  Trash2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const DesktopGererUnMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Store
  const menuId = useGererUnMenuStore((state) => state.id);
  const denomination = useGererUnMenuStore((state) => state.denomination);
  const imgURL = useGererUnMenuStore((state) => state.imgURL);
  const prix = useGererUnMenuStore((state) => state.prix);
  const ingredients = useGererUnMenuStore((state) => state.ingredients);
  const description = useGererUnMenuStore((state) => state.description);
  const status = useGererUnMenuStore((state) => state.status);
  const createdAt = useGererUnMenuStore((state) => state.createdAt);
  const isLoading = useGererUnMenuStore((state) => state.isLoading);
  const isSaving = useGererUnMenuStore((state) => state.isSaving);
  const error = useGererUnMenuStore((state) => state.error);
  const success = useGererUnMenuStore((state) => state.success);

  const setDenomination = useGererUnMenuStore((state) => state.setDenomination);
  const setImgURL = useGererUnMenuStore((state) => state.setImgURL);
  const setPrix = useGererUnMenuStore((state) => state.setPrix);
  const setIngredients = useGererUnMenuStore((state) => state.setIngredients);
  const setDescription = useGererUnMenuStore((state) => state.setDescription);
  const setStatus = useGererUnMenuStore((state) => state.setStatus);
  const setIsLoading = useGererUnMenuStore((state) => state.setIsLoading);
  const setIsSaving = useGererUnMenuStore((state) => state.setIsSaving);
  const setError = useGererUnMenuStore((state) => state.setError);
  const setSuccess = useGererUnMenuStore((state) => state.setSuccess);
  const loadMenu = useGererUnMenuStore((state) => state.loadMenu);
  const resetForm = useGererUnMenuStore((state) => state.resetForm);

  // États locaux
  const [newIngredient, setNewIngredient] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger le menu au montage
  useEffect(() => {
    const fetchMenu = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const menus = await getAllMenus();
        const menu = menus.find((m) => m.id === id);

        if (!menu) {
          setError("Menu introuvable");
          toast.error("Menu introuvable");
          setTimeout(() => navigate("/admin/settings/menus/gerer"), 2000);
          return;
        }

        loadMenu(menu);
      } catch (err) {
        const errorMessage = err.message || "Erreur lors du chargement du menu";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [id, navigate, setIsLoading, setError, loadMenu]);

  // Validation
  const canSubmit = denomination.trim().length > 0 && prix > 0 && !isSaving && !success;

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

  // Basculer le statut
  const toggleStatus = () => {
    setStatus(!status);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setIsSaving(true);
      setError(null);

      await updateMenu(menuId, {
        denomination,
        imgURL,
        prix,
        ingredients,
        description,
        status,
      });

      setSuccess(true);
      toast.success("Menu modifié avec succès !");

      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/menus/gerer");
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de la modification du menu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer le menu
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      await deleteMenu(menuId);

      toast.success("Menu supprimé avec succès !");
      setShowDeleteDialog(false);

      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/menus/gerer");
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de la suppression du menu";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/settings/menus/gerer")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Gérer un menu</h1>
          <p className="text-muted-foreground mt-1">
            {createdAt && `Créé le ${new Date(createdAt).toLocaleDateString("fr-FR")}`}
          </p>
        </div>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
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
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <UtensilsCrossed className="h-4 w-4" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Ex: Box viande"
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
              />
              {denomination.trim().length > 0 && (
                <InputGroupAddon align="inline-end">
                  <InputGroupText>
                    <Check className="h-4 w-4 text-green-500" />
                  </InputGroupText>
                </InputGroupAddon>
              )}
            </InputGroup>
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
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <ImageIcon className="h-4 w-4" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imgURL}
                onChange={(e) => setImgURL(e.target.value)}
              />
            </InputGroup>

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
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <DollarSign className="h-4 w-4" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                min="0"
                step="100"
                placeholder="2000"
                value={prix}
                onChange={(e) => setPrix(Number(e.target.value))}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>FCFA</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </CardContent>
        </Card>

        {/* Statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              Statut
            </CardTitle>
            <CardDescription>
              {status ? "Ce menu est actif" : "Ce menu est désactivé"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={toggleStatus}>
              {status ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Activer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Ingrédients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ingrédients
            </CardTitle>
            <CardDescription>Liste des ingrédients (optionnel)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ajouter un ingrédient */}
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <Plus className="h-4 w-4" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
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
              <InputGroupAddon align="inline-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddIngredient}
                  disabled={!newIngredient.trim()}
                >
                  Ajouter
                </Button>
              </InputGroupAddon>
            </InputGroup>

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
            <InputGroup>
              <InputGroupAddon align="block-start">
                <InputGroupText>
                  <FileText className="h-4 w-4" />
                  Description
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupTextarea
                placeholder="Décrivez le menu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </InputGroup>
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
                <p className="text-sm">Menu modifié avec succès !</p>
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
            onClick={() => navigate("/admin/settings/menus/gerer")}
            disabled={isSaving}
          >
            Annuler
          </Button>

          <Button type="submit" className="flex-1" disabled={!canSubmit}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : success ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Enregistré
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le menu "{denomination}" ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopGererUnMenu;