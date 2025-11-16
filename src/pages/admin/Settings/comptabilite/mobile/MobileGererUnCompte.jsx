import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
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
import { toast } from "sonner";
import {
  InputGroup,
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
  selectError,
  selectIsLoaded,
  selectSetCodeOhada,
  selectSetDenomination,
  selectSetDescription,
  selectSetCategorie,
  selectSetNumero,
  selectSetIsSubmitting,
  selectSetError,
  selectSetFormData,
  selectReset,
} from "@/stores/admin/useEditCompteStore";
import {
  findCompteById,
  findCompteTresorerieById,
  updateCompte,
  updateCompteTresorerie,
} from "@/toolkits/admin/comptabiliteToolkit";

const MobileGererUnCompte = () => {
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
  const error = useEditCompteStore(selectError);
  const isLoaded = useEditCompteStore(selectIsLoaded);

  // Store actions
  const setCodeOhada = useEditCompteStore(selectSetCodeOhada);
  const setDenomination = useEditCompteStore(selectSetDenomination);
  const setDescription = useEditCompteStore(selectSetDescription);
  const setCategorie = useEditCompteStore(selectSetCategorie);
  const setNumero = useEditCompteStore(selectSetNumero);
  const setIsSubmitting = useEditCompteStore(selectSetIsSubmitting);
  const setError = useEditCompteStore(selectSetError);
  const setFormData = useEditCompteStore(selectSetFormData);
  const reset = useEditCompteStore(selectReset);

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
        toast.success("Compte mis à jour");
      } else {
        compteData.numero = numero.trim();
        await updateCompteTresorerie(compteId, compteData);
        toast.success("Compte mis à jour");
      }

      navigate("/admin/settings/comptabilite/gerer");
    } catch (err) {
      console.error("Erreur modification:", err);
      setError(err.message);
      toast.error("Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoadingData) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !isLoaded) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isComptable = typeCompte === "comptable";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="container mx-auto p-4 space-y-4 pb-24"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/settings/comptabilite/gerer")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Modifier le compte</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {code_ohada}
            </Badge>
            {isComptable ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Building2 className="h-3 w-3" />
                Comptable
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Wallet className="h-3 w-3" />
                Trésorerie
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {isComptable ? (
                <>
                  <Building2 className="h-4 w-4" />
                  Compte Comptable
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Compte de Trésorerie
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Modifiez les informations du compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Code OHADA */}
            <div className="space-y-2">
              <Label htmlFor="code_ohada" className="text-sm">
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
              <Label htmlFor="denomination" className="text-sm">
                Dénomination <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="denomination"
                  placeholder="Ex: Ventes de marchandises..."
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">Nom du compte</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                Description
              </Label>
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
                Description détaillée (optionnelle)
              </p>
            </div>

            {/* Catégorie (uniquement pour comptable) */}
            {isComptable && (
              <div className="space-y-2">
                <Label className="text-sm">
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={categorie}
                  onValueChange={setCategorie}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="entree-mobile"
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                      categorie === "entree"
                        ? "border-green-500 bg-green-50"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem value="entree" id="entree-mobile" />
                    <TrendingUp
                      className={`h-4 w-4 ${
                        categorie === "entree" ? "text-green-600" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Entrée</p>
                      <p className="text-xs text-muted-foreground">Produits, ventes</p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="sortie-mobile"
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                      categorie === "sortie"
                        ? "border-red-500 bg-red-50"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem value="sortie" id="sortie-mobile" />
                    <TrendingDown
                      className={`h-4 w-4 ${
                        categorie === "sortie" ? "text-red-600" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Sortie</p>
                      <p className="text-xs text-muted-foreground">Charges, dépenses</p>
                    </div>
                  </Label>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">Type d'opération</p>
              </div>
            )}

            {/* Numéro (uniquement pour trésorerie) */}
            {!isComptable && (
              <div className="space-y-2">
                <Label htmlFor="numero" className="text-sm">
                  Numéro de compte
                </Label>
                <InputGroup>
                  <InputGroupInput
                    id="numero"
                    placeholder="Ex: 0123456789..."
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </InputGroup>
                <p className="text-xs text-muted-foreground">
                  Numéro bancaire ou mobile money (optionnel)
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
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-xs">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Actions sticky en bas */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t space-y-2">
          <div className="container mx-auto space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
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

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/admin/settings/comptabilite/gerer")}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default MobileGererUnCompte;
