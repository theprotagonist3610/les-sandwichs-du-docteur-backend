/**
 * DesktopGererUneBoisson.jsx
 * Composant pour gérer/éditer une boisson existante
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGererUneBoissonStore from "@/stores/admin/gererUneBoissonStore.js";
import { getAllBoissons, updateBoisson, deleteBoisson } from "@/toolkits/admin/boissonToolkit.jsx";
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
  GlassWater,
  ImageIcon,
  DollarSign,
  FileText,
  ArrowLeft,
  Trash2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const DesktopGererUneBoisson = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Store
  const boissonId = useGererUneBoissonStore((state) => state.id);
  const denomination = useGererUneBoissonStore((state) => state.denomination);
  const imgURL = useGererUneBoissonStore((state) => state.imgURL);
  const prix = useGererUneBoissonStore((state) => state.prix);
  const description = useGererUneBoissonStore((state) => state.description);
  const status = useGererUneBoissonStore((state) => state.status);
  const createdAt = useGererUneBoissonStore((state) => state.createdAt);
  const isLoading = useGererUneBoissonStore((state) => state.isLoading);
  const isSaving = useGererUneBoissonStore((state) => state.isSaving);
  const error = useGererUneBoissonStore((state) => state.error);
  const success = useGererUneBoissonStore((state) => state.success);

  const setDenomination = useGererUneBoissonStore((state) => state.setDenomination);
  const setImgURL = useGererUneBoissonStore((state) => state.setImgURL);
  const setPrix = useGererUneBoissonStore((state) => state.setPrix);
  const setDescription = useGererUneBoissonStore((state) => state.setDescription);
  const setStatus = useGererUneBoissonStore((state) => state.setStatus);
  const setIsLoading = useGererUneBoissonStore((state) => state.setIsLoading);
  const setIsSaving = useGererUneBoissonStore((state) => state.setIsSaving);
  const setError = useGererUneBoissonStore((state) => state.setError);
  const setSuccess = useGererUneBoissonStore((state) => state.setSuccess);
  const loadBoisson = useGererUneBoissonStore((state) => state.loadBoisson);
  const resetForm = useGererUneBoissonStore((state) => state.resetForm);

  // États locaux
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger la boisson au montage
  useEffect(() => {
    const fetchBoisson = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const boissons = await getAllBoissons();
        const boisson = boissons.find((b) => b.id === id);

        if (!boisson) {
          setError("Boisson introuvable");
          toast.error("Boisson introuvable");
          setTimeout(() => navigate("/admin/settings/boissons/gerer"), 2000);
          return;
        }

        loadBoisson(boisson);
      } catch (err) {
        const errorMessage = err.message || "Erreur lors du chargement de la boisson";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoisson();
  }, [id, navigate, setIsLoading, setError, loadBoisson]);

  // Validation
  const canSubmit = denomination.trim().length > 0 && prix > 0 && !isSaving && !success;

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

      await updateBoisson(boissonId, {
        denomination,
        imgURL,
        prix,
        description,
        status,
      });

      setSuccess(true);
      toast.success("Boisson modifiée avec succès !");

      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/boissons/gerer");
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de la modification de la boisson";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer la boisson
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      await deleteBoisson(boissonId);

      toast.success("Boisson supprimée avec succès !");
      setShowDeleteDialog(false);

      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/boissons/gerer");
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de la suppression de la boisson";
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
          onClick={() => navigate("/admin/settings/boissons/gerer")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Gérer une boisson</h1>
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
              <GlassWater className="h-5 w-5" />
              Dénomination
            </CardTitle>
            <CardDescription>Le nom de la boisson</CardDescription>
          </CardHeader>
          <CardContent>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <GlassWater className="h-4 w-4" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Ex: Coca Cola"
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
              Image de la boisson
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
                placeholder="1000"
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
              {status ? "Cette boisson est active" : "Cette boisson est désactivée"}
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

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </CardTitle>
            <CardDescription>Description de la boisson (optionnel)</CardDescription>
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
                placeholder="Décrivez la boisson..."
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
                <p className="text-sm">Boisson modifiée avec succès !</p>
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
            onClick={() => navigate("/admin/settings/boissons/gerer")}
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
              Êtes-vous sûr de vouloir supprimer la boisson &quot;{denomination}&quot; ? Cette action est
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

export default DesktopGererUneBoisson;