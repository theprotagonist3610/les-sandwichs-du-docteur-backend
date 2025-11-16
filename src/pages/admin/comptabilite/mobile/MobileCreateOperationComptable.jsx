import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import useCreateOperationStore, {
  selectCompteId,
  selectMontant,
  selectMotif,
  selectTypeOperation,
  selectDate,
  selectCompteDestinationId,
  selectComptesDisponibles,
  selectComptesTresorerie,
  selectIsSubmitting,
  selectIsLoadingComptes,
  selectError,
  selectSuccess,
  selectSetMontant,
  selectSetMotif,
  selectSetTypeOperation,
  selectSetDate,
  selectSetComptesDisponibles,
  selectSetComptesTresorerie,
  selectSetIsSubmitting,
  selectSetIsLoadingComptes,
  selectSetError,
  selectSetSuccess,
  selectSelectCompte,
  selectSelectCompteDestination,
  selectReset,
} from "@/stores/admin/useCreateOperationStore";
import {
  getAllComptes,
  getAllComptesTresorerie,
  createOperationWithQueue,
  createTransfertWithQueue,
} from "@/toolkits/admin/comptabiliteToolkit";
import { auth } from "@/firebase";

const MobileCreateOperationComptable = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Store state
  const compte_id = useCreateOperationStore(selectCompteId);
  const montant = useCreateOperationStore(selectMontant);
  const motif = useCreateOperationStore(selectMotif);
  const type_operation = useCreateOperationStore(selectTypeOperation);
  const date = useCreateOperationStore(selectDate);
  const compte_destination_id = useCreateOperationStore(selectCompteDestinationId);
  const comptesDisponibles = useCreateOperationStore(selectComptesDisponibles);
  const comptesTresorerie = useCreateOperationStore(selectComptesTresorerie);
  const isSubmitting = useCreateOperationStore(selectIsSubmitting);
  const isLoadingComptes = useCreateOperationStore(selectIsLoadingComptes);
  const error = useCreateOperationStore(selectError);
  const success = useCreateOperationStore(selectSuccess);

  // Store actions
  const setMontant = useCreateOperationStore(selectSetMontant);
  const setMotif = useCreateOperationStore(selectSetMotif);
  const setTypeOperation = useCreateOperationStore(selectSetTypeOperation);
  const setDate = useCreateOperationStore(selectSetDate);
  const setComptesDisponibles = useCreateOperationStore(selectSetComptesDisponibles);
  const setComptesTresorerie = useCreateOperationStore(selectSetComptesTresorerie);
  const setIsSubmitting = useCreateOperationStore(selectSetIsSubmitting);
  const setIsLoadingComptes = useCreateOperationStore(selectSetIsLoadingComptes);
  const setError = useCreateOperationStore(selectSetError);
  const setSuccess = useCreateOperationStore(selectSetSuccess);
  const selectCompte = useCreateOperationStore(selectSelectCompte);
  const selectCompteDestination = useCreateOperationStore(selectSelectCompteDestination);
  const reset = useCreateOperationStore(selectReset);

  // Charger les comptes disponibles et initialiser le type depuis l'URL
  useEffect(() => {
    const loadComptes = async () => {
      try {
        setIsLoadingComptes(true);
        setError(null);

        // Récupérer les comptes comptables et de trésorerie
        const [comptesData, tresorerieData] = await Promise.all([
          getAllComptes(),
          getAllComptesTresorerie(),
        ]);

        // Fusionner les deux listes
        const allComptes = [
          ...comptesData.comptes,
          ...tresorerieData.comptes,
        ];

        setComptesDisponibles(allComptes);
        setComptesTresorerie(tresorerieData.comptes);
        console.log(`✅ ${allComptes.length} comptes chargés`);

        // Initialiser le type d'opération depuis l'URL
        const typeParam = searchParams.get("type");
        if (typeParam && ["entree", "sortie", "transfert"].includes(typeParam)) {
          setTypeOperation(typeParam);
        }
      } catch (err) {
        console.error("❌ Erreur chargement comptes:", err);
        setError(err.message);
        toast.error("Erreur lors du chargement des comptes");
      } finally {
        setIsLoadingComptes(false);
      }
    };

    loadComptes();

    return () => {
      reset();
    };
  }, [searchParams]);

  const handleCompteChange = (compteId) => {
    const liste = type_operation === "transfert" ? comptesTresorerie : comptesDisponibles;
    const compte = liste.find((c) => c.id === compteId);
    selectCompte(compte);
  };

  const handleCompteDestinationChange = (compteId) => {
    const compte = comptesTresorerie.find((c) => c.id === compteId);
    selectCompteDestination(compte);
  };

  const handleTypeOperationChange = (newType) => {
    setTypeOperation(newType);

    // Réinitialiser les comptes sélectionnés lors du changement de type
    if (newType === "transfert") {
      // Pour un transfert, on réinitialise tout
      selectCompte(null);
      selectCompteDestination(null);
    } else {
      // Pour entree/sortie, on vérifie la compatibilité
      if (compte_id) {
        const compteActuel = comptesDisponibles.find((c) => c.id === compte_id);
        if (compteActuel) {
          const isCompatible =
            compteActuel.categorie === "entree/sortie" ||
            compteActuel.categorie === newType;

          // Si le compte n'est pas compatible, réinitialiser la sélection
          if (!isCompatible) {
            selectCompte(null);
            toast.info("Compte réinitialisé", {
              description: "Non compatible avec le nouveau type",
            });
          }
        }
      }
      // Réinitialiser le compte destination (uniquement pour transfert)
      selectCompteDestination(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation commune
    if (!montant || parseFloat(montant) <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : "system";

      if (type_operation === "transfert") {
        // Validation spécifique pour transfert
        if (!compte_id || !compte_destination_id) {
          toast.error("Veuillez sélectionner les comptes source et destination");
          return;
        }
        if (compte_id === compte_destination_id) {
          toast.error("Les comptes doivent être différents");
          return;
        }

        const compteSource = comptesTresorerie.find((c) => c.id === compte_id);
        const compteDestination = comptesTresorerie.find((c) => c.id === compte_destination_id);

        const transfertData = {
          compte_source_id: compte_id,
          compte_source_ohada: compteSource.code_ohada,
          compte_source_denomination: compteSource.denomination,
          compte_destination_id,
          compte_destination_ohada: compteDestination.code_ohada,
          compte_destination_denomination: compteDestination.denomination,
          montant: parseFloat(montant),
          date,
        };

        // Créer le transfert (2 opérations)
        await createTransfertWithQueue(transfertData, userId);

        setSuccess(true);
        toast.success("Transfert ajouté", {
          description: "Traitement en cours...",
        });
      } else {
        // Validation pour entree/sortie
        if (!compte_id) {
          toast.error("Veuillez sélectionner un compte");
          return;
        }
        if (!motif.trim()) {
          toast.error("Le motif est requis");
          return;
        }

        const compte = comptesDisponibles.find((c) => c.id === compte_id);

        const operationData = {
          compte_id,
          compte_ohada: compte.code_ohada,
          compte_denomination: compte.denomination,
          montant: parseFloat(montant),
          motif: motif.trim(),
          type_operation,
          date,
        };

        // Utiliser le système de queue pour éviter les collisions
        await createOperationWithQueue(operationData, userId);

        setSuccess(true);
        toast.success("Opération ajoutée", {
          description: "Traitement en cours...",
        });
      }

      // Réinitialiser le formulaire après un court délai
      setTimeout(() => {
        reset();
        navigate("/admin/comptabilite");
      }, 2000);
    } catch (err) {
      console.error("❌ Erreur création opération:", err);
      setError(err.message);
      toast.error("Erreur lors de la création", {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingComptes) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const compteSelectionne = type_operation === "transfert"
    ? comptesTresorerie.find((c) => c.id === compte_id)
    : comptesDisponibles.find((c) => c.id === compte_id);

  const compteDestinationSelectionne = comptesTresorerie.find((c) => c.id === compte_destination_id);

  // Filtrer les comptes selon le type d'opération sélectionné
  const comptesFiltres = type_operation === "transfert"
    ? comptesTresorerie
    : comptesDisponibles.filter((compte) => {
        if (type_operation === "entree") {
          return compte.categorie === "entree" || compte.categorie === "entree/sortie";
        } else {
          return compte.categorie === "sortie" || compte.categorie === "entree/sortie";
        }
      });

  // Pour le compte destination, filtrer pour exclure le compte source
  const comptesDestinationFiltres = comptesTresorerie.filter(
    (compte) => compte.id !== compte_id
  );

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
            onClick={() => navigate("/admin/comptabilite")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Nouvelle Opération</h1>
          <p className="text-sm text-muted-foreground">
            {type_operation === "transfert"
              ? "Transférer entre comptes de trésorerie"
              : "Créer une opération comptable"}
          </p>
        </div>
      </div>

      <Separator />

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Informations
            </CardTitle>
            <CardDescription className="text-xs">
              {type_operation === "transfert"
                ? "Sélectionnez les comptes source et destination"
                : "Type puis compte correspondant"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type d'opération - En premier */}
            <div className="space-y-2">
              <Label className="text-sm">
                Type d'opération <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                <div
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    type_operation === "entree"
                      ? "border-green-500 bg-green-50"
                      : "border-border"
                  }`}
                  onClick={() => handleTypeOperationChange("entree")}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    type_operation === "entree" ? "border-green-600" : "border-gray-300"
                  }`}>
                    {type_operation === "entree" && (
                      <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    )}
                  </div>
                  <TrendingUp
                    className={`h-4 w-4 ${
                      type_operation === "entree" ? "text-green-600" : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Entrée</p>
                    <p className="text-xs text-muted-foreground">Recette</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    type_operation === "sortie"
                      ? "border-red-500 bg-red-50"
                      : "border-border"
                  }`}
                  onClick={() => handleTypeOperationChange("sortie")}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    type_operation === "sortie" ? "border-red-600" : "border-gray-300"
                  }`}>
                    {type_operation === "sortie" && (
                      <div className="h-2 w-2 rounded-full bg-red-600"></div>
                    )}
                  </div>
                  <TrendingDown
                    className={`h-4 w-4 ${
                      type_operation === "sortie" ? "text-red-600" : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Sortie</p>
                    <p className="text-xs text-muted-foreground">Dépense</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    type_operation === "transfert"
                      ? "border-blue-500 bg-blue-50"
                      : "border-border"
                  }`}
                  onClick={() => handleTypeOperationChange("transfert")}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    type_operation === "transfert" ? "border-blue-600" : "border-gray-300"
                  }`}>
                    {type_operation === "transfert" && (
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <ArrowLeftRight
                    className={`h-4 w-4 ${
                      type_operation === "transfert" ? "text-blue-600" : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Transfert</p>
                    <p className="text-xs text-muted-foreground">Entre comptes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sélection du compte - Adapté selon le type */}
            {type_operation === "transfert" ? (
              <>
                {/* Compte source pour transfert */}
                <div className="space-y-2">
                  <Label htmlFor="compte_source" className="text-sm">
                    Compte source <span className="text-destructive">*</span>
                  </Label>
                  <Select value={compte_id} onValueChange={handleCompteChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Compte source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptesFiltres.length > 0 ? (
                        comptesFiltres.map((compte) => (
                          <SelectItem key={compte.id} value={compte.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {compte.code_ohada}
                              </Badge>
                              <span className="text-sm">{compte.denomination}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          Aucun compte de trésorerie
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {compteSelectionne && (
                    <p className="text-xs text-muted-foreground">
                      {compteSelectionne.description}
                    </p>
                  )}
                </div>

                {/* Compte destination pour transfert */}
                <div className="space-y-2">
                  <Label htmlFor="compte_destination" className="text-sm">
                    Compte destination <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={compte_destination_id}
                    onValueChange={handleCompteDestinationChange}
                    disabled={!compte_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Compte destination..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptesDestinationFiltres.length > 0 ? (
                        comptesDestinationFiltres.map((compte) => (
                          <SelectItem key={compte.id} value={compte.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {compte.code_ohada}
                              </Badge>
                              <span className="text-sm">{compte.denomination}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          {compte_id ? "Aucun autre compte" : "Sélectionnez d'abord un compte source"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {compteDestinationSelectionne && (
                    <p className="text-xs text-muted-foreground">
                      {compteDestinationSelectionne.description}
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Sélection simple pour entrée/sortie */
              <div className="space-y-2">
                <Label htmlFor="compte" className="text-sm">
                  Compte <span className="text-destructive">*</span>
                </Label>
                <Select value={compte_id} onValueChange={handleCompteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {comptesFiltres.length > 0 ? (
                      comptesFiltres.map((compte) => (
                        <SelectItem key={compte.id} value={compte.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {compte.code_ohada}
                            </Badge>
                            <span className="text-sm">{compte.denomination}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Aucun compte pour ce type
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {compteSelectionne && (
                  <p className="text-xs text-muted-foreground">
                    {compteSelectionne.categorie}
                    {compteSelectionne.description && ` - ${compteSelectionne.description}`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {comptesFiltres.length} compte(s) disponible(s)
                </p>
              </div>
            )}

            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="montant" className="text-sm">
                Montant (FCFA) <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="montant"
                  type="number"
                  placeholder="Ex: 50000"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  min="0"
                  step="1"
                />
              </InputGroup>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">
                Date <span className="text-destructive">*</span>
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="date"
                  type="date"
                  value={new Date(date).toISOString().split("T")[0]}
                  onChange={(e) => setDate(new Date(e.target.value).getTime())}
                />
              </InputGroup>
            </div>

            {/* Motif - Uniquement pour entrée/sortie */}
            {type_operation !== "transfert" && (
              <div className="space-y-2">
                <Label htmlFor="motif" className="text-sm">
                  Motif <span className="text-destructive">*</span>
                </Label>
                <InputGroup>
                  <InputGroupTextarea
                    id="motif"
                    placeholder="Décrivez l'opération..."
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    rows={3}
                  />
                </InputGroup>
              </div>
            )}

            {/* Info pour transfert */}
            {type_operation === "transfert" && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Le transfert créera 2 opérations automatiquement.
                  Le motif sera généré automatiquement.
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

            {/* Message de succès */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-xs">
                      {type_operation === "transfert" ? "Transfert créé !" : "Opération créée !"}
                    </p>
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
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {type_operation === "transfert" ? "Création transfert..." : "Création..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {type_operation === "transfert" ? "Créer le transfert" : "Créer l'opération"}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/admin/comptabilite")}
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

export default MobileCreateOperationComptable;
