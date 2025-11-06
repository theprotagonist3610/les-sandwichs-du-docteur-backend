import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import useEditCompteStore, {
  selectId,
  selectTypeCompte,
  selectCodeOhada,
  selectDenomination,
  selectDescription,
  selectCategorie,
  selectNumero,
  selectIsSubmitting,
  selectIsDeleting,
  selectError,
  selectIsLoaded,
  selectSetCodeOhada,
  selectSetDenomination,
  selectSetDescription,
  selectSetCategorie,
  selectSetNumero,
  selectSetIsSubmitting,
  selectSetIsDeleting,
  selectSetError,
  selectSetFormData,
  selectReset,
} from "@/stores/admin/useEditCompteStore";
import {
  findCompteById,
  findCompteTresorerieById,
  updateCompte,
  updateCompteTresorerie,
  supprimerCompte,
  supprimerCompteTresorerie,
} from "@/toolkits/admin/comptabiliteToolkit";

const DesktopGererUnCompte = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Store state
  const compteId = useEditCompteStore(selectId);
  const typeCompte = useEditCompteStore(selectTypeCompte);
  const code_ohada = useEditCompteStore(selectCodeOhada);
  const denomination = useEditCompteStore(selectDenomination);
  const description = useEditCompteStore(selectDescription);
  const categorie = useEditCompteStore(selectCategorie);
  const numero = useEditCompteStore(selectNumero);
  const isSubmitting = useEditCompteStore(selectIsSubmitting);
  const isDeleting = useEditCompteStore(selectIsDeleting);
  const error = useEditCompteStore(selectError);
  const isLoaded = useEditCompteStore(selectIsLoaded);

  // Store actions
  const setCodeOhada = useEditCompteStore(selectSetCodeOhada);
  const setDenomination = useEditCompteStore(selectSetDenomination);
  const setDescription = useEditCompteStore(selectSetDescription);
  const setCategorie = useEditCompteStore(selectSetCategorie);
  const setNumero = useEditCompteStore(selectSetNumero);
  const setIsSubmitting = useEditCompteStore(selectSetIsSubmitting);
  const setIsDeleting = useEditCompteStore(selectSetIsDeleting);
  const setError = useEditCompteStore(selectSetError);
  const setFormData = useEditCompteStore(selectSetFormData);
  const reset = useEditCompteStore(selectReset);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Charger les données du compte
  useEffect(() => {
    const loadCompte = async () => {
      try {
        setIsLoadingData(true);
        setError(null);

        // Essayer de charger comme compte comptable
        let compte = await findCompteById(id);
        if (compte) {
          setFormData({
            id: compte.id,
            typeCompte: "comptable",
            code_ohada: compte.code_ohada,
            denomination: compte.denomination,
            description: compte.description || "",
            categorie: compte.categorie,
          });
        } else {
          // Essayer comme compte de trésorerie
          compte = await findCompteTresorerieById(id);
          if (compte) {
            setFormData({
              id: compte.id,
              typeCompte: "tresorerie",
              code_ohada: compte.code_ohada,
              denomination: compte.denomination,
              description: compte.description || "",
              numero: compte.numero || "",
            });
          } else {
            setError("Compte introuvable");
            toast.error("Compte introuvable");
          }
        }
      } catch (err) {
        console.error("Erreur chargement compte:", err);
        setError(err.message);
        toast.error("Erreur lors du chargement du compte");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      loadCompte();
    }

    return () => {
      reset();
    };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!code_ohada.trim()) {
      toast.error("Le code OHADA est requis");
      return;
    }
    if (!denomination.trim()) {
      toast.error("La dénomination est requise");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const compteData = {
        code_ohada: code_ohada.trim(),
        denomination: denomination.trim(),
        description: description.trim(),
      };

      if (typeCompte === "comptable") {
        compteData.categorie = categorie;
        await updateCompte(compteId, compteData);
        toast.success("Compte comptable mis à jour avec succès");
      } else {
        compteData.numero = numero.trim();
        await updateCompteTresorerie(compteId, compteData);
        toast.success("Compte de trésorerie mis à jour avec succès");
      }

      navigate("/admin/settings/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur modification:", err);
      setError(err.message);
      toast.error("Erreur lors de la modification", {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      if (typeCompte === "comptable") {
        await supprimerCompte(compteId);
        toast.success("Compte comptable supprimé");
      } else {
        await supprimerCompteTresorerie(compteId);
        toast.success("Compte de trésorerie supprimé");
      }

      navigate("/admin/settings/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur suppression:", err);
      setError(err.message);
      toast.error("Erreur lors de la suppression", {
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !isLoaded) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isComptable = typeCompte === "comptable";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto p-8 max-w-4xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/settings/comptabilite/gerer")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-3xl font-bold">Modifier le compte</h1>
          </div>
          <div className="flex items-center gap-2 ml-[120px]">
            <Badge variant="outline" className="font-mono">
              {code_ohada}
            </Badge>
            {isComptable ? (
              <Badge variant="secondary" className="gap-1">
                <Building2 className="h-3 w-3" />
                Comptable
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Wallet className="h-3 w-3" />
                Trésorerie
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isComptable ? (
                <>
                  <Building2 className="h-5 w-5" />
                  Compte Comptable
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  Compte de Trésorerie
                </>
              )}
            </CardTitle>
            <CardDescription>
              Modifiez les informations du compte{" "}
              {isComptable ? "comptable" : "de trésorerie"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code OHADA */}
            <div className="space-y-2">
              <Label htmlFor="code_ohada">
                Code OHADA <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="code_ohada"
                  placeholder="Ex: 701, 411, 531..."
                  value={code_ohada}
                  onChange={(e) => setCodeOhada(e.target.value)}
                  className="font-mono"
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Code du plan comptable OHADA
              </p>
            </div>

            {/* Dénomination */}
            <div className="space-y-2">
              <Label htmlFor="denomination">
                Dénomination <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="denomination"
                  placeholder="Ex: Ventes de marchandises, Capital social..."
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Nom du compte
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <InputGroup>
                <InputGroupTextarea
                  id="description"
                  placeholder="Description détaillée..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Description détaillée du compte (optionnelle)
              </p>
            </div>

            {/* Catégorie (uniquement pour comptable) */}
            {isComptable && (
              <div className="space-y-2">
                <Label>
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={categorie}
                  onValueChange={setCategorie}
                  className="grid grid-cols-2 gap-4"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Label
                      htmlFor="entree"
                      className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        categorie === "entree"
                          ? "border-green-500 bg-green-50"
                          : "border-border hover:border-green-300"
                      }`}
                    >
                      <RadioGroupItem value="entree" id="entree" />
                      <TrendingUp
                        className={`h-5 w-5 ${
                          categorie === "entree" ? "text-green-600" : "text-muted-foreground"
                        }`}
                      />
                      <div className="text-left flex-1">
                        <p className="font-semibold">Entrée</p>
                        <p className="text-xs text-muted-foreground">
                          Produits, ventes
                        </p>
                      </div>
                    </Label>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Label
                      htmlFor="sortie"
                      className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        categorie === "sortie"
                          ? "border-red-500 bg-red-50"
                          : "border-border hover:border-red-300"
                      }`}
                    >
                      <RadioGroupItem value="sortie" id="sortie" />
                      <TrendingDown
                        className={`h-5 w-5 ${
                          categorie === "sortie" ? "text-red-600" : "text-muted-foreground"
                        }`}
                      />
                      <div className="text-left flex-1">
                        <p className="font-semibold">Sortie</p>
                        <p className="text-xs text-muted-foreground">
                          Charges, dépenses
                        </p>
                      </div>
                    </Label>
                  </motion.div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Type d'opération pour ce compte
                </p>
              </div>
            )}

            {/* Numéro (uniquement pour trésorerie) */}
            {!isComptable && (
              <div className="space-y-2">
                <Label htmlFor="numero">Numéro de compte</Label>
                <InputGroup>
                  <InputGroupInput
                    id="numero"
                    placeholder="Ex: 0123456789, +237 6 XX XX XX XX..."
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </InputGroup>
                <p className="text-xs text-muted-foreground">
                  Numéro du compte bancaire ou mobile money (optionnel)
                </p>
              </div>
            )}

            {/* Message d'erreur */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting || isDeleting}
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

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/settings/comptabilite/gerer")}
              disabled={isSubmitting || isDeleting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte <strong>{denomination}</strong> (
              {code_ohada}) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default DesktopGererUnCompte;
