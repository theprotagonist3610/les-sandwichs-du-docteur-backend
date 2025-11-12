/**
 * DesktopOperationDeStock.jsx
 * Wizard multi-étapes pour les opérations de stock (Desktop)
 * Avec détection intelligente du contexte depuis les query params
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
} from "lucide-react";
import {
  useOperationStockStore,
  selectCurrentStep,
  selectInitialStep,
  selectSkippedSteps,
  selectCanProceed,
} from "@/stores/operationStockStore";
import { makeTransaction, TRANSACTION_TYPES, getElement } from "@/toolkits/admin/stockToolkit";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Import des étapes
import Step1SelectOperation from "./steps/Step1SelectOperation";
import Step2SelectElement from "./steps/Step2SelectElement";
import Step3ConfigureOperation from "./steps/Step3ConfigureOperation";
import Step4Summary from "./steps/Step4Summary";

const allSteps = [
  {
    number: 1,
    title: "Type d'opération",
    description: "Choisir le type",
  },
  {
    number: 2,
    title: "Article",
    description: "Sélectionner l'article",
  },
  {
    number: 3,
    title: "Configuration",
    description: "Détails de l'opération",
  },
  {
    number: 4,
    title: "Confirmation",
    description: "Récapitulatif",
  },
];

const DesktopOperationDeStock = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentStep = useOperationStockStore(selectCurrentStep);
  const initialStep = useOperationStockStore(selectInitialStep);
  const skippedSteps = useOperationStockStore(selectSkippedSteps);
  const canProceed = useOperationStockStore(selectCanProceed);

  const setStep = useOperationStockStore((state) => state.setStep);
  const nextStep = useOperationStockStore((state) => state.nextStep);
  const prevStep = useOperationStockStore((state) => state.prevStep);
  const validateStep = useOperationStockStore((state) => state.validateStep);
  const reset = useOperationStockStore((state) => state.reset);
  const resetForNewOperation = useOperationStockStore((state) => state.resetForNewOperation);
  const initializeFromContext = useOperationStockStore((state) => state.initializeFromContext);

  const operationType = useOperationStockStore((state) => state.operationType);
  const selectedElement = useOperationStockStore((state) => state.selectedElement);
  const sourceEmplacement = useOperationStockStore((state) => state.sourceEmplacement);
  const destEmplacement = useOperationStockStore((state) => state.destEmplacement);
  const quantite = useOperationStockStore((state) => state.quantite);
  const prixUnitaire = useOperationStockStore((state) => state.prixUnitaire);
  const motif = useOperationStockStore((state) => state.motif);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [operationId, setOperationId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialisation intelligente depuis les query params
  useEffect(() => {
    const initializeWizard = async () => {
      setIsInitializing(true);

      const type = searchParams.get('type');
      const elementId = searchParams.get('elementId');
      const emplacementId = searchParams.get('emplacementId');

      try {
        let element = null;

        // Charger l'élément si l'ID est fourni
        if (elementId) {
          element = await getElement(elementId);
          if (!element) {
            toast.error("L'article spécifié n'existe pas", {
              description: "Article introuvable",
            });
          }
        }

        // Initialiser le wizard avec le contexte
        initializeFromContext({
          type,
          element,
          emplacementId,
        });
      } catch (error) {
        console.error("Erreur initialisation wizard:", error);
        toast.error(error.message, {
          description: "Erreur d'initialisation",
        });
        // Fallback: wizard complet
        reset();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeWizard();
  }, [searchParams, reset, initializeFromContext]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
    } else {
      toast.error("Veuillez remplir tous les champs requis", {
        description: "Validation échouée",
      });
    }
  };

  const handlePrev = () => {
    prevStep();
  };

  const handleStepClick = (stepNumber) => {
    // Permettre de naviguer uniquement vers les étapes déjà visitées (non skippées)
    if (stepNumber < currentStep && !skippedSteps.includes(stepNumber)) {
      setStep(stepNumber);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error("Les données de l'opération sont incomplètes", {
        description: "Validation échouée",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        element_id: selectedElement.id,
        quantite: parseFloat(quantite),
        motif: motif || "",
        user_id: "current_user",
      };

      if (operationType === TRANSACTION_TYPES.ENTREE) {
        payload.emplacement_id = destEmplacement.id;
        payload.prix_unitaire = parseFloat(prixUnitaire) || 0;
      } else if (operationType === TRANSACTION_TYPES.SORTIE) {
        payload.emplacement_id = sourceEmplacement.id;
      } else if (operationType === TRANSACTION_TYPES.TRANSFERT) {
        payload.emplacement_id = sourceEmplacement.id;
        payload.emplacement_dest_id = destEmplacement.id;
      }

      const operation = await makeTransaction(operationType, payload);

      setOperationId(operation.id);
      setSubmitSuccess(true);

      toast.success("Opération créée avec succès", {
        description: `L'opération ${operation.id} a été ajoutée à la file d'attente`,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'opération:", error);
      toast.error(error.message || "Impossible de créer l'opération", {
        description: "Erreur",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewOperation = () => {
    resetForNewOperation();
    setSubmitSuccess(false);
    setOperationId(null);
  };

  const handleViewQueue = () => {
    navigate("/admin/stock/dashboard");
  };

  const handleCancel = () => {
    reset();
    navigate("/admin/stock");
  };

  // Affichage du chargement initial
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Initialisation...</p>
        </div>
      </div>
    );
  }

  // Affichage du succès
  if (submitSuccess) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Opération créée avec succès !</h2>
                <p className="text-muted-foreground">
                  L'opération a été ajoutée à la file d'attente et sera exécutée automatiquement
                </p>
              </div>

              {operationId && (
                <Alert>
                  <AlertDescription className="text-center">
                    ID de l'opération: <strong>{operationId}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={handleNewOperation} size="lg">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nouvelle opération
                </Button>
                <Button onClick={handleViewQueue} variant="outline" size="lg">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir la file d'attente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrer les étapes à afficher (exclure les étapes skippées)
  const visibleSteps = allSteps.filter(step => !skippedSteps.includes(step.number));
  const progress = ((currentStep - initialStep + 1) / (4 - skippedSteps.length + 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Navigation Bar en haut */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Nouvelle opération de stock</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Étape {currentStep - initialStep + 1} sur {visibleSteps.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel} size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                Annuler
              </Button>

              {currentStep > initialStep && (
                <Button onClick={handlePrev} disabled={isSubmitting} size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed || isSubmitting}
                  size="sm"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Valider
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stepper horizontal compact */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            {visibleSteps.map((step, index) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isAccessible = step.number <= currentStep && step.number >= initialStep;

              return (
                <div
                  key={step.number}
                  className={cn(
                    "flex-1 flex items-center",
                    index !== visibleSteps.length - 1 && "relative"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 cursor-pointer transition-opacity",
                      isAccessible ? "opacity-100" : "opacity-40",
                      !isAccessible && "cursor-not-allowed"
                    )}
                    onClick={() => isAccessible && handleStepClick(step.number)}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors text-sm font-semibold",
                        isActive &&
                          "border-primary bg-primary text-primary-foreground",
                        isCompleted &&
                          "border-green-600 bg-green-600 text-white",
                        !isActive && !isCompleted && "border-muted"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span>{step.number}</span>
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={cn(
                          "font-medium text-xs",
                          isActive && "text-primary"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {index !== visibleSteps.length - 1 && (
                    <div
                      className={cn(
                        "hidden md:block flex-1 h-0.5 mx-4",
                        currentStep > step.number ? "bg-green-600" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardContent className="pt-6">
            {currentStep === 1 && <Step1SelectOperation />}
            {currentStep === 2 && <Step2SelectElement />}
            {currentStep === 3 && <Step3ConfigureOperation />}
            {currentStep === 4 && <Step4Summary />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesktopOperationDeStock;
