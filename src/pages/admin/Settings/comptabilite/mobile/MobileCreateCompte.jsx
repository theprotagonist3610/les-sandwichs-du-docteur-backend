import { motion } from "framer-motion";
import {
  FileText,
  Wallet,
  Plus,
  Loader2,
  ArrowLeft,
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

const MobileCreateCompte = () => {
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
        toast.success("Compte créé!");
      } else {
        // Créer un compte de trésorerie
        compteData.numero = numero.trim();
        await creerCompteTresorerie(compteData);
        toast.success("Compte créé!");
      }

      // Reset et redirection
      reset();
      setTimeout(() => {
        navigate("/admin/settings/comptabilite/gerer");
      }, 1500);
    } catch (error) {
      console.error("Erreur création compte:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Créer un Compte</h1>
          <p className="text-sm text-muted-foreground">Nouveau compte</p>
        </div>
      </div>

      <Separator />

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs value={typeCompte} onValueChange={setTypeCompte}>
          {/* Type de compte */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comptable" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Comptable
            </TabsTrigger>
            <TabsTrigger value="tresorerie" className="text-xs">
              <Wallet className="h-3 w-3 mr-1" />
              Trésorerie
            </TabsTrigger>
          </TabsList>

          {/* Compte Comptable */}
          <TabsContent value="comptable" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Compte Comptable</CardTitle>
                    <CardDescription className="text-xs">
                      Charges ou produits
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Code OHADA */}
                <div className="space-y-2">
                  <Label htmlFor="code_ohada" className="text-sm flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    Code OHADA *
                  </Label>
                  <Input
                    id="code_ohada"
                    placeholder="Ex: 601, 701..."
                    value={code_ohada}
                    onChange={(e) => setCodeOhada(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="text-sm"
                  />
                </div>

                {/* Dénomination */}
                <div className="space-y-2">
                  <Label htmlFor="denomination" className="text-sm flex items-center gap-1.5">
                    <Type className="h-3 w-3" />
                    Dénomination *
                  </Label>
                  <Input
                    id="denomination"
                    placeholder="Ex: Achats matières premières"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="text-sm"
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5">
                    <Banknote className="h-3 w-3" />
                    Catégorie *
                  </Label>
                  <RadioGroup
                    value={categorie}
                    onValueChange={setCategorie}
                    disabled={isSubmitting}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="entree" id="entree-mobile" />
                        <Label htmlFor="entree-mobile" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold">Entrée</div>
                            <div className="text-xs text-muted-foreground">
                              Produits, ventes
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="sortie" id="sortie-mobile" />
                        <Label htmlFor="sortie-mobile" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold">Sortie</div>
                            <div className="text-xs text-muted-foreground">
                              Charges, achats
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm flex items-center gap-1.5">
                    <AlignLeft className="h-3 w-3" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Description du compte..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compte de Trésorerie */}
          <TabsContent value="tresorerie" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Trésorerie</CardTitle>
                    <CardDescription className="text-xs">
                      Caisse, banque, mobile money
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Code OHADA */}
                <div className="space-y-2">
                  <Label htmlFor="code_ohada_treso" className="text-sm flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    Code OHADA *
                  </Label>
                  <Input
                    id="code_ohada_treso"
                    placeholder="Ex: 531, 5121..."
                    value={code_ohada}
                    onChange={(e) => setCodeOhada(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    531: Caisse, 5121: Mobile Money, 511: Banque
                  </p>
                </div>

                {/* Dénomination */}
                <div className="space-y-2">
                  <Label htmlFor="denomination_treso" className="text-sm flex items-center gap-1.5">
                    <Type className="h-3 w-3" />
                    Dénomination *
                  </Label>
                  <Input
                    id="denomination_treso"
                    placeholder="Ex: Mobile Money MTN"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="text-sm"
                  />
                </div>

                {/* Numéro */}
                <div className="space-y-2">
                  <Label htmlFor="numero" className="text-sm flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    Numéro
                  </Label>
                  <Input
                    id="numero"
                    placeholder="Ex: 0123456789"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    disabled={isSubmitting}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Numéro Mobile Money ou compte bancaire
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description_treso" className="text-sm flex items-center gap-1.5">
                    <AlignLeft className="h-3 w-3" />
                    Description
                  </Label>
                  <Textarea
                    id="description_treso"
                    placeholder="Description du compte..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MobileCreateCompte;
