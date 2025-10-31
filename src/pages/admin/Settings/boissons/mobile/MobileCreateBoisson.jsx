/**
 * MobileCreateBoisson.jsx
 * Création d'une nouvelle boisson (version mobile, vertical & aérée)
 */

import { useNavigate } from "react-router-dom";
import useCreateBoissonStore from "@/stores/admin/createBoissonStore.js";
import { createBoisson } from "@/toolkits/admin/boissonToolkit.jsx";
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
  GlassWater,
  ImageIcon,
  DollarSign,
  FileText,
  Plus,
} from "lucide-react";

const MobileCreateBoisson = () => {
  const navigate = useNavigate();

  // Store
  const denomination = useCreateBoissonStore((s) => s.denomination);
  const imgURL = useCreateBoissonStore((s) => s.imgURL);
  const prix = useCreateBoissonStore((s) => s.prix);
  const description = useCreateBoissonStore((s) => s.description);
  const isLoading = useCreateBoissonStore((s) => s.isLoading);
  const error = useCreateBoissonStore((s) => s.error);
  const success = useCreateBoissonStore((s) => s.success);

  const setDenomination = useCreateBoissonStore((s) => s.setDenomination);
  const setImgURL = useCreateBoissonStore((s) => s.setImgURL);
  const setPrix = useCreateBoissonStore((s) => s.setPrix);
  const setDescription = useCreateBoissonStore((s) => s.setDescription);
  const setIsLoading = useCreateBoissonStore((s) => s.setIsLoading);
  const setError = useCreateBoissonStore((s) => s.setError);
  const setSuccess = useCreateBoissonStore((s) => s.setSuccess);
  const resetForm = useCreateBoissonStore((s) => s.resetForm);

  // Validation
  const canSubmit =
    denomination.trim().length > 0 && prix > 0 && !isLoading && !success;

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
      const errorMessage =
        err?.message || "Erreur lors de la création de la boisson";
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
        <div className="flex-1">
          <h1 className="text-xl font-bold">Créer une boisson</h1>
          <p className="text-xs text-muted-foreground">
            Remplissez les informations de la nouvelle boisson
          </p>
        </div>
      </div>

      <Separator />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dénomination */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GlassWater className="h-4 w-4" />
              Dénomination
            </CardTitle>
            <CardDescription className="text-xs">
              Le nom de la boisson
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ex: Coca Cola"
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
              Image
            </CardTitle>
            <CardDescription className="text-xs">
              URL de l&apos;image (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imgURL}
              onChange={(e) => setImgURL(e.target.value)}
            />
            {/* Aperçu image */}
            {imgURL && (
              <div className="rounded-xl overflow-hidden border">
                <img
                  src={imgURL}
                  alt="Aperçu"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImage invalide%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            )}
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
                placeholder="1000"
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

        {/* Description */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </CardTitle>
            <CardDescription className="text-xs">
              Description de la boisson (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[80px] p-3 border rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Décrivez la boisson..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Erreur */}
        {error && (
          <Card className="rounded-2xl border-destructive">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-destructive">
                <X className="h-4 w-4 shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Succès */}
        {success && (
          <Card className="rounded-2xl border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="h-4 w-4 shrink-0" />
                <p className="text-xs">Boisson créée avec succès !</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boutons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" className="w-full h-11" disabled={!canSubmit}>
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

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={() => navigate("/admin/settings/boissons")}
            disabled={isLoading}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MobileCreateBoisson;