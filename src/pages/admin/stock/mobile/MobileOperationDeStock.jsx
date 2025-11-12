/**
 * MobileOperationDeStock.jsx
 * Wizard multi-étapes pour les opérations de stock (Mobile)
 * Avec détection intelligente du contexte depuis les query params
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";

// Import des étapes (réutilisation des composants desktop, ils sont responsives)
import Step1SelectOperation from "../desktop/steps/Step1SelectOperation";
import Step2SelectElement from "../desktop/steps/Step2SelectElement";
import Step3ConfigureOperation from "../desktop/steps/Step3ConfigureOperation";
import Step4Summary from "../desktop/steps/Step4Summary";

const allSteps = [
  { number: 1, title: "Type", shortTitle: "Type" },
  { number: 2, title: "Article", shortTitle: "Article" },
  { number: 3, title: "Config", shortTitle: "Config" },
  { number: 4, title: "Valider", shortTitle: "OK" },
];

const MobileOperationDeStock = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
            toast({
              title: "Article introuvable",
              description: "L'article spécifié n'existe pas",
              variant: "destructive",
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
        toast({
          title: "Erreur d'initialisation",
          description: error.message,
          variant: "destructive",
        });
        // Fallback: wizard complet
        reset();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeWizard();
  }, [searchParams, reset, initializeFromContext, toast]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
      // Scroll vers le haut sur mobile
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast({
        title: "Validation échouée",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
    }
  };

  const handlePrev = () => {
    prevStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "Validation échouée",
        description: "Les données de l'opération sont incomplètes",
        variant: "destructive",
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

      toast({
        title: "Opération créée",
        description: `Ajoutée à la file d'attente`,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'opération",
        variant: "destructive",
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
          <p className="text-muted-foreground text-sm">Initialisation...</p>
        </div>
      </div>
    );
  }

  // Affichage du succès
  if (submitSuccess) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Opération créée !</h2>
                <p className="text-sm text-muted-foreground">
                  Ajoutée à la file d'attente
                </p>
              </div>

              {operationId && (
                <Alert>
                  <AlertDescription className="text-center text-xs">
                    ID: <strong>{operationId}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <Button onClick={handleNewOperation} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nouvelle opération
                </Button>
                <Button
                  onClick={handleViewQueue}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir la file
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold">Nouvelle opération</h1>
              <p className="text-xs text-muted-foreground">
                Étape {currentStep - initialStep + 1}/{visibleSteps.length}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          {/* Stepper horizontal compact */}
          <div className="flex items-center justify-between gap-1">
            {visibleSteps.map((step, index) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div
                  key={step.number}
                  className="flex items-center flex-1"
                >
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors text-xs font-semibold",
                        isActive && "border-primary bg-primary text-primary-foreground",
                        isCompleted && "border-green-600 bg-green-600 text-white",
                        !isActive && !isCompleted && "border-muted"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] font-medium",
                        isActive && "text-primary"
                      )}
                    >
                      {step.shortTitle}
                    </p>
                  </div>

                  {index !== visibleSteps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-1",
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
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {currentStep === 1 && <Step1SelectOperation />}
          {currentStep === 2 && <Step2SelectElement />}
          {currentStep === 3 && <Step3ConfigureOperation />}
          {currentStep === 4 && <Step4Summary />}
        </div>
      </div>

      {/* Navigation fixe en bas */}
      <div className="sticky bottom-0 z-10 bg-background border-t p-4">
        <div className="flex items-center gap-2">
          {currentStep > initialStep && (
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="flex-1"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
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
    </div>
  );
};

export default MobileOperationDeStock;
