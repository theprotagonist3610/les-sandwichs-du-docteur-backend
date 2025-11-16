import { motion } from "framer-motion";
import {
  FileText,
  Wallet,
  Plus,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Hash,
  Type,
  AlignLeft,
  TrendingUp,
  TrendingDown,
  Banknote,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import useCreateCompteStore, {
  selectTypeCompte,
  selectCodeOhada,
  selectDenomination,
  selectDescription,
  selectCategorie,
  selectNumero,
  selectIsSubmitting,
  selectSetTypeCompte,
  selectSetCodeOhada,
  selectSetDenomination,
  selectSetDescription,
  selectSetCategorie,
  selectSetNumero,
  selectSetIsSubmitting,
  selectReset,
} from "@/stores/admin/useCreateCompteStore";
import { creerCompte, creerCompteTresorerie } from "@/toolkits/admin/comptabiliteToolkit";

const DesktopCreateCompte = () => {
  const navigate = useNavigate();

  // Store state
  const typeCompte = useCreateCompteStore(selectTypeCompte);
  const code_ohada = useCreateCompteStore(selectCodeOhada);
  const denomination = useCreateCompteStore(selectDenomination);
  const description = useCreateCompteStore(selectDescription);
  const categorie = useCreateCompteStore(selectCategorie);
  const numero = useCreateCompteStore(selectNumero);
  const isSubmitting = useCreateCompteStore(selectIsSubmitting);

  // Store actions
  const setTypeCompte = useCreateCompteStore(selectSetTypeCompte);
  const setCodeOhada = useCreateCompteStore(selectSetCodeOhada);
  const setDenomination = useCreateCompteStore(selectSetDenomination);
  const setDescription = useCreateCompteStore(selectSetDescription);
  const setCategorie = useCreateCompteStore(selectSetCategorie);
  const setNumero = useCreateCompteStore(selectSetNumero);
  const setIsSubmitting = useCreateCompteStore(selectSetIsSubmitting);
  const reset = useCreateCompteStore(selectReset);

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

      const compteData = {
        code_ohada: code_ohada.trim(),
        denomination: denomination.trim(),
        description: description.trim(),
      };

      if (typeCompte === "comptable") {
        // Créer un compte comptable
        compteData.categorie = categorie;
        await creerCompte(compteData);
        toast.success("Compte comptable créé avec succès!", {
          description: `${denomination} (${code_ohada})`,
        });
      } else {
        // Créer un compte de trésorerie
        compteData.numero = numero.trim();
        await creerCompteTresorerie(compteData);
        toast.success("Compte de trésorerie créé avec succès!", {
          description: `${denomination} (${code_ohada})`,
        });
      }

      // Reset et redirection
      reset();
      setTimeout(() => {
        navigate("/admin/settings/comptabilite/gerer");
      }, 1500);
    } catch (error) {
      console.error("Erreur création compte:", error);
      toast.error("Erreur lors de la création", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Créer un Compte</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau compte comptable ou de trésorerie
          </p>
        </div>
      </div>

      <Separator />

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Tabs value={typeCompte} onValueChange={setTypeCompte}>
          {/* Type de compte */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comptable" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Compte Comptable
            </TabsTrigger>
            <TabsTrigger value="tresorerie" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Compte de Trésorerie
            </TabsTrigger>
          </TabsList>

          {/* Compte Comptable */}
          <TabsContent value="comptable" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Informations du Compte</CardTitle>
                    <CardDescription>
                      Compte pour les charges (sorties) ou produits (entrées)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Code OHADA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="code_ohada" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Code OHADA *
                  </Label>
                  <Input
                    id="code_ohada"
                    placeholder="Ex: 601, 701, 531..."
                    value={code_ohada}
                    onChange={(e) => setCodeOhada(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Code du plan comptable OHADA (Ex: 601 pour Achats, 701 pour Ventes)
                  </p>
                </motion.div>

                {/* Dénomination */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label htmlFor="denomination" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Dénomination *
                  </Label>
                  <Input
                    id="denomination"
                    placeholder="Ex: Achats de matières premières"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </motion.div>

                {/* Catégorie */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Catégorie *
                  </Label>
                  <RadioGroup
                    value={categorie}
                    onValueChange={setCategorie}
                    disabled={isSubmitting}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="entree" id="entree" />
                        <Label htmlFor="entree" className="flex items-center gap-2 cursor-pointer flex-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-semibold">Entrée</div>
                            <div className="text-xs text-muted-foreground">
                              Produits, ventes, recettes
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="sortie" id="sortie" />
                        <Label htmlFor="sortie" className="flex items-center gap-2 cursor-pointer flex-1">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="font-semibold">Sortie</div>
                            <div className="text-xs text-muted-foreground">
                              Charges, achats, dépenses
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <AlignLeft className="h-4 w-4" />
                    Description (optionnel)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Ex: Compte pour enregistrer tous les achats de matières premières..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                  />
                </motion.div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compte de Trésorerie */}
          <TabsContent value="tresorerie" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle>Informations du Compte</CardTitle>
                    <CardDescription>
                      Compte pour la gestion des liquidités (caisse, banque, mobile money)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Code OHADA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="code_ohada_treso" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Code OHADA *
                  </Label>
                  <Input
                    id="code_ohada_treso"
                    placeholder="Ex: 531, 5121, 511..."
                    value={code_ohada}
                    onChange={(e) => setCodeOhada(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Code du plan comptable (Ex: 531 pour Caisse, 5121 pour Mobile Money, 511 pour Banque)
                  </p>
                </motion.div>

                {/* Dénomination */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label htmlFor="denomination_treso" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Dénomination *
                  </Label>
                  <Input
                    id="denomination_treso"
                    placeholder="Ex: Mobile Money MTN"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </motion.div>

                {/* Numéro */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="numero" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Numéro de compte (optionnel)
                  </Label>
                  <Input
                    id="numero"
                    placeholder="Ex: 0123456789 (pour Mobile Money ou compte bancaire)"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Numéro de téléphone Mobile Money ou numéro de compte bancaire
                  </p>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="description_treso" className="flex items-center gap-2">
                    <AlignLeft className="h-4 w-4" />
                    Description (optionnel)
                  </Label>
                  <Textarea
                    id="description_treso"
                    placeholder="Ex: Compte Mobile Money pour les encaissements clients..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                  />
                </motion.div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 justify-end mt-6"
        >
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Créer le compte
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
};

export default DesktopCreateCompte;
