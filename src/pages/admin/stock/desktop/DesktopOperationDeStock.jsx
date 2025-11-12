/**
 * DesktopOperationDeStock.jsx
 * Wizard multi-étapes pour les opérations de stock (Desktop)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useOperationStockStore, selectCurrentStep, selectCanProceed } from "@/stores/operationStockStore";
import { makeTransaction, TRANSACTION_TYPES } from "@/toolkits/admin/stockToolkit";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Import des étapes
import Step1SelectOperation from "./steps/Step1SelectOperation";
import Step2SelectElement from "./steps/Step2SelectElement";
import Step3ConfigureOperation from "./steps/Step3ConfigureOperation";
import Step4Summary from "./steps/Step4Summary";

const steps = [
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
  const { toast } = useToast();
  const currentStep = useOperationStockStore(selectCurrentStep);
  const canProceed = useOperationStockStore(selectCanProceed);

  const setStep = useOperationStockStore((state) => state.setStep);
  const nextStep = useOperationStockStore((state) => state.nextStep);
  const prevStep = useOperationStockStore((state) => state.prevStep);
  const validateStep = useOperationStockStore((state) => state.validateStep);
  const reset = useOperationStockStore((state) => state.reset);
  const resetForNewOperation = useOperationStockStore((state) => state.resetForNewOperation);

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

  // Reset au montage
  useEffect(() => {
    reset();
  }, [reset]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
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
  };

  const handleStepClick = (stepNumber) => {
    // Permettre de revenir en arrière uniquement
    if (stepNumber < currentStep) {
      setStep(stepNumber);
    }
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
      // Préparer le payload selon le type d'opération
      const payload = {
        element_id: selectedElement.id,
        quantite: parseFloat(quantite),
        motif: motif || "",
        user_id: "current_user", // Sera remplacé par auth.currentUser.uid dans makeTransaction
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

      // Créer la transaction
      const operation = await makeTransaction(operationType, payload);

      setOperationId(operation.id);
      setSubmitSuccess(true);

      toast({
        title: "Opération créée avec succès",
        description: `L'opération ${operation.id} a été ajoutée à la file d'attente`,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'opération:", error);
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

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nouvelle opération de stock</h1>
          <p className="text-muted-foreground mt-1">
            Suivez les étapes pour créer une opération
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <XCircle className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />

            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const isAccessible = step.number <= currentStep;

                return (
                  <div
                    key={step.number}
                    className={cn(
                      "flex-1 flex items-center",
                      index !== steps.length - 1 && "relative"
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
                          "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                          isActive &&
                            "border-primary bg-primary text-primary-foreground",
                          isCompleted &&
                            "border-green-600 bg-green-600 text-white",
                          !isActive && !isCompleted && "border-muted"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="font-semibold">{step.number}</span>
                        )}
                      </div>
                      <div className="hidden md:block">
                        <p
                          className={cn(
                            "font-medium text-sm",
                            isActive && "text-primary"
                          )}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {index !== steps.length - 1 && (
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
        </CardContent>
      </Card>

      {/* Contenu de l'étape */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && <Step1SelectOperation />}
          {currentStep === 2 && <Step2SelectElement />}
          {currentStep === 3 && <Step3ConfigureOperation />}
          {currentStep === 4 && <Step4Summary />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1 || isSubmitting}
          size="lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Étape {currentStep} sur {steps.length}
        </div>

        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            size="lg"
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed || isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Valider l'opération
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DesktopOperationDeStock;
