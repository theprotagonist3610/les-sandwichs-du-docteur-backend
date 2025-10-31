import { motion } from "framer-motion";
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
  Info,
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
import useCreateCompteStore, {
  selectCodeOhada,
  selectDenomination,
  selectDescription,
  selectType,
  selectIsSubmitting,
  selectError,
  selectSetCodeOhada,
  selectSetDenomination,
  selectSetDescription,
  selectSetType,
  selectSetIsSubmitting,
  selectSetError,
  selectReset,
} from "@/stores/admin/useCreateCompteStore";
import { createCompte } from "@/toolkits/admin/comptabiliteToolkit";
import { toast } from "sonner";
import { useState } from "react";

const DesktopCreateCompte = () => {
  const code_ohada = useCreateCompteStore(selectCodeOhada);
  const denomination = useCreateCompteStore(selectDenomination);
  const description = useCreateCompteStore(selectDescription);
  const type = useCreateCompteStore(selectType);
  const isSubmitting = useCreateCompteStore(selectIsSubmitting);
  const error = useCreateCompteStore(selectError);

  const setCodeOhada = useCreateCompteStore(selectSetCodeOhada);
  const setDenomination = useCreateCompteStore(selectSetDenomination);
  const setDescription = useCreateCompteStore(selectSetDescription);
  const setType = useCreateCompteStore(selectSetType);
  const setIsSubmitting = useCreateCompteStore(selectSetIsSubmitting);
  const setError = useCreateCompteStore(selectSetError);
  const reset = useCreateCompteStore(selectReset);

  const [success, setSuccess] = useState(false);

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
      await createCompte({
        code_ohada: code_ohada.trim(),
        denomination: denomination.trim(),
        description: description.trim() || undefined,
        type,
      });

      setSuccess(true);
      toast.success("Compte créé avec succès", {
        description: `${code_ohada} - ${denomination}`,
      });

      // Réinitialiser après un court délai
      setTimeout(() => {
        reset();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Erreur création compte:", err);
      const errorMessage = err.message || "Une erreur s'est produite";
      setError(errorMessage);
      toast.error("Erreur lors de la création", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (typeValue) => {
    switch (typeValue) {
      case "entree":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "sortie":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case "entree/sortie":
        return <ArrowLeftRight className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Créer un Compte Comptable
        </h1>
        <p className="text-muted-foreground">
          Ajouter un nouveau compte au plan comptable OHADA
        </p>
      </motion.div>

      {/* Info OHADA */}
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
                  Les comptes créés s'ajoutent au plan comptable OHADA existant.
                  Assurez-vous que le code OHADA respecte la nomenclature standard.
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Informations du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code OHADA & Dénomination en ligne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code OHADA */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Code OHADA <span className="text-destructive">*</span>
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Hash className="h-5 w-5" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="text"
                    placeholder="Ex: 701"
                    value={code_ohada}
                    onChange={(e) => setCodeOhada(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="text-base"
                  />
                </InputGroup>
                <p className="text-xs text-muted-foreground">
                  Code selon la nomenclature OHADA
                </p>
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
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="flex-1 border-0 shadow-none focus:ring-0 bg-transparent text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entree">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>Entrée (Recettes)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sortie">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span>Sortie (Dépenses)</span>
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
                <p className="text-xs text-muted-foreground">
                  Nature des opérations du compte
                </p>
              </div>
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
                  placeholder="Ex: Ventes de marchandises"
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="text-base"
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Nom complet du compte comptable
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description (optionnel)
              </label>
              <InputGroup>
                <InputGroupAddon align="block-start">
                  <InputGroupText>
                    <AlignLeft className="h-5 w-5" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupTextarea
                  placeholder="Description détaillée du compte, exemples d'utilisation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="text-base"
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Information complémentaire sur l'utilisation du compte
              </p>
            </div>
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
                        Le compte a été créé avec succès et ajouté au plan
                        comptable.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Bouton de soumission */}
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
                Compte créé
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Créer le compte
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
};

export default DesktopCreateCompte;
