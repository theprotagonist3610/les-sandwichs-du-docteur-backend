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
  Calendar,
  FileText,
  DollarSign,
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

const DesktopCreateOperationComptable = () => {
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
    console.log("🟡 [DESKTOP] handleTypeOperationChange appelé avec:", newType);
    console.log("🟡 [DESKTOP] Type actuel avant changement:", type_operation);

    setTypeOperation(newType);

    console.log("🟡 [DESKTOP] setTypeOperation appelé");

    // Réinitialiser les comptes sélectionnés lors du changement de type
    if (newType === "transfert") {
      console.log("🔵 [DESKTOP] Changement vers transfert, reset des comptes");
      // Pour un transfert, on réinitialise tout
      selectCompte(null);
      selectCompteDestination(null);
    } else {
      console.log("🟢 [DESKTOP] Changement vers entree/sortie");
      // Pour entree/sortie, on vérifie la compatibilité
      if (compte_id) {
        const compteActuel = comptesDisponibles.find((c) => c.id === compte_id);
        if (compteActuel) {
          const isCompatible =
            compteActuel.categorie === "entree/sortie" ||
            compteActuel.categorie === newType;

          // Si le compte n'est pas compatible, réinitialiser la sélection
          if (!isCompatible) {
            console.log("🟠 [DESKTOP] Compte incompatible, reset");
            selectCompte(null);
            toast.info("Le compte sélectionné a été réinitialisé", {
              description: "Il n'est pas compatible avec le nouveau type d'opération",
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
          toast.error("Les comptes source et destination doivent être différents");
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
        toast.success("Transfert ajouté à la file d'attente", {
          description: "Le transfert sera traité dans quelques instants",
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
        toast.success("Opération ajoutée à la file d'attente", {
          description: "L'opération sera traitée dans quelques instants",
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
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
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
              onClick={() => navigate("/admin/comptabilite")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-3xl font-bold">Nouvelle Opération</h1>
          </div>
          <p className="text-muted-foreground ml-[120px]">
            Créer une opération comptable (entrée, sortie ou transfert)
          </p>
        </div>
      </div>

      <Separator />

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations de l'opération
            </CardTitle>
            <CardDescription>
              {type_operation === "transfert"
                ? "Transférer des fonds entre deux comptes de trésorerie"
                : "Sélectionnez d'abord le type d'opération, puis le compte correspondant"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type d'opération - Maintenant en premier */}
            <div className="space-y-2">
              <Label>
                Type d'opération <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div
                    className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      type_operation === "entree"
                        ? "border-green-500 bg-green-50"
                        : "border-border hover:border-green-300"
                    }`}
                    onClick={() => {
                      console.log("🟢 [CLICK] Bouton ENTREE cliqué");
                      handleTypeOperationChange("entree");
                    }}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      type_operation === "entree" ? "border-green-600" : "border-gray-300"
                    }`}>
                      {type_operation === "entree" && (
                        <div className="h-2 w-2 rounded-full bg-green-600"></div>
                      )}
                    </div>
                    <TrendingUp
                      className={`h-5 w-5 ${
                        type_operation === "entree" ? "text-green-600" : "text-muted-foreground"
                      }`}
                    />
                    <div className="text-left flex-1">
                      <p className="font-semibold">Entrée</p>
                      <p className="text-xs text-muted-foreground">
                        Recette
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div
                    className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      type_operation === "sortie"
                        ? "border-red-500 bg-red-50"
                        : "border-border hover:border-red-300"
                    }`}
                    onClick={() => {
                      console.log("🔴 [CLICK] Bouton SORTIE cliqué");
                      handleTypeOperationChange("sortie");
                    }}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      type_operation === "sortie" ? "border-red-600" : "border-gray-300"
                    }`}>
                      {type_operation === "sortie" && (
                        <div className="h-2 w-2 rounded-full bg-red-600"></div>
                      )}
                    </div>
                    <TrendingDown
                      className={`h-5 w-5 ${
                        type_operation === "sortie" ? "text-red-600" : "text-muted-foreground"
                      }`}
                    />
                    <div className="text-left flex-1">
                      <p className="font-semibold">Sortie</p>
                      <p className="text-xs text-muted-foreground">
                        Dépense
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div
                    className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      type_operation === "transfert"
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:border-blue-300"
                    }`}
                    onClick={() => {
                      console.log("🔵 [CLICK] Bouton TRANSFERT cliqué");
                      handleTypeOperationChange("transfert");
                    }}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      type_operation === "transfert" ? "border-blue-600" : "border-gray-300"
                    }`}>
                      {type_operation === "transfert" && (
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <ArrowLeftRight
                      className={`h-5 w-5 ${
                        type_operation === "transfert" ? "text-blue-600" : "text-muted-foreground"
                      }`}
                    />
                    <div className="text-left flex-1">
                      <p className="font-semibold">Transfert</p>
                      <p className="text-xs text-muted-foreground">
                        Entre comptes
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground">
                Sélectionnez d'abord le type pour filtrer les comptes disponibles
              </p>
            </div>

            {/* Sélection du compte - Adapté selon le type */}
            {type_operation === "transfert" ? (
              <>
                {/* Compte source pour transfert */}
                <div className="space-y-2">
                  <Label htmlFor="compte_source">
                    Compte source <span className="text-destructive">*</span>
                  </Label>
                  <Select value={compte_id} onValueChange={handleCompteChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le compte source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptesFiltres.length > 0 ? (
                        comptesFiltres.map((compte) => (
                          <SelectItem key={compte.id} value={compte.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {compte.code_ohada}
                              </Badge>
                              <span>{compte.denomination}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Aucun compte de trésorerie disponible
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
                  <Label htmlFor="compte_destination">
                    Compte destination <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={compte_destination_id}
                    onValueChange={handleCompteDestinationChange}
                    disabled={!compte_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le compte destination..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptesDestinationFiltres.length > 0 ? (
                        comptesDestinationFiltres.map((compte) => (
                          <SelectItem key={compte.id} value={compte.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {compte.code_ohada}
                              </Badge>
                              <span>{compte.denomination}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {compte_id ? "Aucun autre compte disponible" : "Sélectionnez d'abord un compte source"}
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
                <Label htmlFor="compte">
                  Compte <span className="text-destructive">*</span>
                </Label>
                <Select value={compte_id} onValueChange={handleCompteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte..." />
                  </SelectTrigger>
                  <SelectContent>
                    {comptesFiltres.length > 0 ? (
                      comptesFiltres.map((compte) => (
                        <SelectItem key={compte.id} value={compte.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {compte.code_ohada}
                            </Badge>
                            <span>{compte.denomination}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Aucun compte disponible pour ce type d'opération
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {compteSelectionne && (
                  <p className="text-xs text-muted-foreground">
                    Type: {compteSelectionne.categorie}
                    {compteSelectionne.description && ` - ${compteSelectionne.description}`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {comptesFiltres.length} compte(s) disponible(s) pour {type_operation === "entree" ? "les entrées" : "les sorties"}
                </p>
              </div>
            )}

            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="montant">
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
              <p className="text-xs text-muted-foreground">
                Montant de l'opération en francs CFA
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
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
              <p className="text-xs text-muted-foreground">
                Date de l'opération
              </p>
            </div>

            {/* Motif - Uniquement pour entrée/sortie */}
            {type_operation !== "transfert" && (
              <div className="space-y-2">
                <Label htmlFor="motif">
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
                <p className="text-xs text-muted-foreground">
                  Description détaillée de l'opération
                </p>
              </div>
            )}

            {/* Info pour transfert */}
            {type_operation === "transfert" && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Le transfert créera automatiquement 2 opérations :
                  une sortie du compte source et une entrée sur le compte destination.
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
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{error}</p>
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
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm">Opération créée avec succès !</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/comptabilite")}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting || success}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {type_operation === "transfert" ? "Création du transfert..." : "Création en cours..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {type_operation === "transfert" ? "Créer le transfert" : "Créer l'opération"}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default DesktopCreateOperationComptable;
