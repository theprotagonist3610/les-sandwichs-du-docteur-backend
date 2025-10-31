/**
 * DesktopCreateBoisson.jsx
 * Composant pour créer une nouvelle boisson
 */

import { useNavigate } from "react-router-dom";
import useCreateBoissonStore from "@/stores/admin/createBoissonStore.js";
import { createBoisson } from "@/toolkits/admin/boissonToolkit.jsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  X,
  GlassWater,
  ImageIcon,
  DollarSign,
  FileText,
  Plus,
  ArrowLeft,
} from "lucide-react";

const DesktopCreateBoisson = () => {
  const navigate = useNavigate();

  // Store
  const denomination = useCreateBoissonStore((state) => state.denomination);
  const imgURL = useCreateBoissonStore((state) => state.imgURL);
  const prix = useCreateBoissonStore((state) => state.prix);
  const description = useCreateBoissonStore((state) => state.description);
  const isLoading = useCreateBoissonStore((state) => state.isLoading);
  const error = useCreateBoissonStore((state) => state.error);
  const success = useCreateBoissonStore((state) => state.success);

  const setDenomination = useCreateBoissonStore((state) => state.setDenomination);
  const setImgURL = useCreateBoissonStore((state) => state.setImgURL);
  const setPrix = useCreateBoissonStore((state) => state.setPrix);
  const setDescription = useCreateBoissonStore((state) => state.setDescription);
  const setIsLoading = useCreateBoissonStore((state) => state.setIsLoading);
  const setError = useCreateBoissonStore((state) => state.setError);
  const setSuccess = useCreateBoissonStore((state) => state.setSuccess);
  const resetForm = useCreateBoissonStore((state) => state.resetForm);

  // Validation
  const canSubmit =
    denomination.trim().length > 0 && prix > 0 && !isLoading && !success;

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setIsLoading(true);
      setError(null);

      await createBoisson({
        denomination,
        imgURL,
        prix,
        description,
      });

      setSuccess(true);
      toast.success("Boisson créée avec succès !");

      setTimeout(() => {
        resetForm();
        navigate("/admin/settings/boissons");
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de la création de la boisson";
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
          onClick={() => navigate("/admin/settings/boissons")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer une boisson</h1>
          <p className="text-muted-foreground mt-1">
            Remplissez les informations de la nouvelle boisson
          </p>
        </div>
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
            <div className="relative">
              <Input
                type="text"
                placeholder="Ex: Coca Cola"
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
              Image de la boisson
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
                placeholder="1000"
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
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Décrivez la boisson..."
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
                <p className="text-sm">Boisson créée avec succès !</p>
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
            onClick={() => navigate("/admin/settings/boissons")}
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
                Créer la boisson
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DesktopCreateBoisson;