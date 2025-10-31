import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Loader2,
  FileText,
  Hash,
  Type,
  AlignLeft,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useEditCompteStore, {
  selectId,
  selectCodeOhada,
  selectDenomination,
  selectDescription,
  selectType,
  selectIsSubmitting,
  selectIsDeleting,
  selectError,
  selectIsLoaded,
  selectSetCodeOhada,
  selectSetDenomination,
  selectSetDescription,
  selectSetType,
  selectSetIsSubmitting,
  selectSetIsDeleting,
  selectSetError,
  selectReset,
  selectSetFormData,
} from "@/stores/admin/useEditCompteStore";
import {
  getCompteById,
  updateCompte,
  deleteCompte,
} from "@/toolkits/admin/comptabiliteToolkit";
import { toast } from "sonner";

const MobileGererUnCompte = () => {
  const { id: compteId } = useParams();
  const navigate = useNavigate();

  const id = useEditCompteStore(selectId);
  const code_ohada = useEditCompteStore(selectCodeOhada);
  const denomination = useEditCompteStore(selectDenomination);
  const description = useEditCompteStore(selectDescription);
  const type = useEditCompteStore(selectType);
  const isSubmitting = useEditCompteStore(selectIsSubmitting);
  const isDeleting = useEditCompteStore(selectIsDeleting);
  const error = useEditCompteStore(selectError);
  const isLoaded = useEditCompteStore(selectIsLoaded);

  const setCodeOhada = useEditCompteStore(selectSetCodeOhada);
  const setDenomination = useEditCompteStore(selectSetDenomination);
  const setDescription = useEditCompteStore(selectSetDescription);
  const setType = useEditCompteStore(selectSetType);
  const setIsSubmitting = useEditCompteStore(selectSetIsSubmitting);
  const setIsDeleting = useEditCompteStore(selectSetIsDeleting);
  const setError = useEditCompteStore(selectSetError);
  const reset = useEditCompteStore(selectReset);
  const setFormData = useEditCompteStore(selectSetFormData);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Charger les données du compte
  useEffect(() => {
    const loadCompte = async () => {
      try {
        setLoading(true);
        const compte = await getCompteById(compteId);
        if (compte) {
          setFormData(compte);
        } else {
          setError("Compte non trouvé");
        }
      } catch (err) {
        console.error("Erreur chargement compte:", err);
        setError(err.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    if (compteId) {
      loadCompte();
    }

    return () => {
      reset();
    };
  }, [compteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!code_ohada.trim()) {
      setError("Le code OHADA est requis");
      return;
    }
    if (!denomination.trim()) {
      setError("La dénomination est requise");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCompte(id, {
        code_ohada: code_ohada.trim(),
        denomination: denomination.trim(),
        description: description.trim() || undefined,
        type,
      });

      setSuccess(true);
      toast.success("Compte mis à jour avec succès", {
        description: `${code_ohada} - ${denomination}`,
      });

      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Erreur mise à jour compte:", err);
      const errorMessage = err.message || "Une erreur s'est produite";
      setError(errorMessage);
      toast.error("Erreur lors de la mise à jour", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCompte(id);

      toast.success("Compte supprimé avec succès");
      navigate("/admin/settings/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur suppression compte:", err);
      const errorMessage = err.message || "Erreur lors de la suppression";
      setError(errorMessage);
      toast.error("Erreur lors de la suppression", {
        description: errorMessage,
      });
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeIcon = (typeValue) => {
    switch (typeValue) {
      case "entree":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "sortie":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "entree/sortie":
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">
            Chargement du compte...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded && !loading) {
    return (
      <div className="p-4">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Compte introuvable</p>
                <p className="text-sm text-destructive/80">
                  Le compte demandé n'existe pas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => navigate("/admin/settings/comptabilite/gerer")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* En-tête avec bouton retour */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/settings/comptabilite/gerer")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Modifier le Compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Code: {code_ohada}
        </p>
      </motion.div>

      {/* Formulaire */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Code OHADA */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Code OHADA <span className="text-destructive">*</span>
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <Hash className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Ex: 701"
                  value={code_ohada}
                  onChange={(e) => setCodeOhada(e.target.value)}
                  disabled={isSubmitting || isDeleting}
                  required
                />
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
                  placeholder="Ex: Ventes de marchandises"
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                  disabled={isSubmitting || isDeleting}
                  required
                />
              </InputGroup>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type de compte <span className="text-destructive">*</span>
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{getTypeIcon(type)}</InputGroupText>
                </InputGroupAddon>
                <Select
                  value={type}
                  onValueChange={setType}
                  disabled={isSubmitting || isDeleting}
                >
                  <SelectTrigger className="flex-1 border-0 shadow-none focus:ring-0 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entree">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Entrée</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sortie">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span>Sortie</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="entree/sortie">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                        <span>Mixte (Entrée/Sortie)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </InputGroup>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optionnel)</label>
              <InputGroup>
                <InputGroupAddon align="block-start">
                  <InputGroupText>
                    <AlignLeft className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupTextarea
                  placeholder="Description détaillée du compte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting || isDeleting}
                  rows={3}
                />
              </InputGroup>
            </div>
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
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
        </AnimatePresence>

        {/* Message de succès */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">Succès</p>
                      <p className="text-sm text-green-700">
                        Le compte a été mis à jour avec succès
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons d'action */}
        <div className="space-y-2">
          <Button
            type="submit"
            disabled={isSubmitting || isDeleting || success}
            className="w-full h-12"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mise à jour en cours...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Compte mis à jour
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Enregistrer les modifications
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="w-full h-12"
            size="lg"
            disabled={isSubmitting || isDeleting}
            onClick={() => setShowDeleteDialog(true)}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-5 w-5" />
                Supprimer le compte
              </>
            )}
          </Button>
        </div>
      </motion.form>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte "{denomination}" (
              {code_ohada}) ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
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

export default MobileGererUnCompte;
