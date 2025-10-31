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

const MobileCreateCompte = () => {
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
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "sortie":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "entree/sortie":
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Créer un Compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajouter un nouveau compte comptable au plan OHADA
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                <Select value={type} onValueChange={setType} disabled={isSubmitting}>
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
                  disabled={isSubmitting}
                  rows={3}
                />
              </InputGroup>
            </div>
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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

        {/* Message de succès */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Succès</p>
                    <p className="text-sm text-green-700">
                      Le compte a été créé avec succès
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bouton de soumission */}
        <Button
          type="submit"
          disabled={isSubmitting || success}
          className="w-full h-12"
          size="lg"
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
      </motion.form>
    </div>
  );
};

export default MobileCreateCompte;
