import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import {
  createMoyenPaiement,
  TYPES_PAIEMENT,
  GROUPES_MOBILE,
  GROUPES_BANCAIRE,
} from "@/toolkits/moyenPaiementToolkit";
import useMoyenPaiementFormStore from "@/stores/useMoyenPaiementFormStore";
import {
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  DollarSign,
  Info,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Save,
  AlertCircle,
  Upload,
  Hash,
  Tag,
} from "lucide-react";

// Composant Field optimisé avec memo
const FormField = memo(
  ({ label, icon: Icon, children, error, required, info }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {info && !error && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          {info}
        </p>
      )}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
);

FormField.displayName = "FormField";

const AjouterUnMoyenDePaiement = () => {
  const { isMobile } = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Store Zustand
  const {
    formData,
    errors,
    currentStep,
    isSubmitting,
    updateField,
    validateField,
    validateForm,
    nextStep,
    previousStep,
    setStep,
    setSubmitting,
    resetForm,
    fillDefaults,
  } = useMoyenPaiementFormStore();

  // Appliquer les valeurs par défaut au montage
  useEffect(() => {
    fillDefaults();
  }, [fillDefaults]);

  // Icônes par type
  const getIconForType = (type) => {
    switch (type) {
      case TYPES_PAIEMENT.ESPECES:
        return "💵";
      case TYPES_PAIEMENT.MOBILE:
        return "📱";
      case TYPES_PAIEMENT.BANCAIRE:
        return "🏦";
      default:
        return "💰";
    }
  };

  // Couleur par type
  const getColorForType = (type) => {
    switch (type) {
      case TYPES_PAIEMENT.ESPECES:
        return "#22c55e";
      case TYPES_PAIEMENT.MOBILE:
        return "#3b82f6";
      case TYPES_PAIEMENT.BANCAIRE:
        return "#a855f7";
      default:
        return "#6b7280";
    }
  };

  // Générer la dénomination automatique
  const getDenominationAuto = () => {
    if (formData.type === TYPES_PAIEMENT.ESPECES) {
      return "Espèces";
    }
    if (formData.groupe && formData.numero) {
      return `${formData.groupe} - ${formData.numero}`;
    }
    return formData.denomination || "Moyen de paiement";
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);
    setSubmitting(true);

    try {
      const result = await createMoyenPaiement(formData);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Moyen de paiement créé avec succès!</span>
          </div>
        );
        resetForm();
        fillDefaults();
      } else if (result.isDuplicate) {
        // Le toast est déjà affiché par le toolkit
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  // Étapes pour mobile
  const steps = [
    { id: 0, title: "Type", icon: Wallet },
    { id: 1, title: "Détails", icon: Info },
    { id: 2, title: "Récapitulatif", icon: Check },
  ];

  // Vue Mobile
  const MobileView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-sm mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
          <h1 className="text-xl font-bold text-foreground mb-2">
            Ajouter un moyen de paiement
          </h1>

          {/* Indicateur d'étapes */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep(step.id)}
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full
                      cursor-pointer transition-all
                      ${
                        currentStep >= step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }
                    `}>
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-2
                        ${currentStep > step.id ? "bg-primary" : "bg-muted"}
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Contenu des étapes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-card rounded-lg shadow-sm p-5 border border-border">
            {/* Étape 0 - Type de paiement */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Type de paiement
                </h2>

                <div className="space-y-3">
                  {/* Espèces */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateField("type", TYPES_PAIEMENT.ESPECES)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${
                        formData.type === TYPES_PAIEMENT.ESPECES
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }
                    `}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">💵</div>
                      <div className="flex-1">
                        <p className="font-semibold">Espèces</p>
                        <p className="text-xs text-muted-foreground">
                          Paiement en liquide
                        </p>
                      </div>
                      {formData.type === TYPES_PAIEMENT.ESPECES && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </motion.button>

                  {/* Paiement Mobile */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateField("type", TYPES_PAIEMENT.MOBILE)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${
                        formData.type === TYPES_PAIEMENT.MOBILE
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }
                    `}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">📱</div>
                      <div className="flex-1">
                        <p className="font-semibold">Paiement Mobile</p>
                        <p className="text-xs text-muted-foreground">
                          MTN, Moov, Celtiis
                        </p>
                      </div>
                      {formData.type === TYPES_PAIEMENT.MOBILE && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </motion.button>

                  {/* Compte Bancaire */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateField("type", TYPES_PAIEMENT.BANCAIRE)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${
                        formData.type === TYPES_PAIEMENT.BANCAIRE
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }
                    `}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🏦</div>
                      <div className="flex-1">
                        <p className="font-semibold">Compte Bancaire</p>
                        <p className="text-xs text-muted-foreground">
                          BOA, Ecobank, UBA, etc.
                        </p>
                      </div>
                      {formData.type === TYPES_PAIEMENT.BANCAIRE && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Étape 1 - Détails */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Détails du moyen de paiement
                </h2>

                {formData.type === TYPES_PAIEMENT.ESPECES ? (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-4xl mb-2">💵</div>
                    <p className="font-medium">Paiement en espèces</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aucune configuration supplémentaire requise
                    </p>
                  </div>
                ) : (
                  <>
                    <FormField
                      label="Groupe / Opérateur"
                      icon={Building2}
                      error={errors.groupe}
                      required>
                      <select
                        value={formData.groupe}
                        onChange={(e) => updateField("groupe", e.target.value)}
                        onBlur={() => validateField("groupe")}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background
                                 focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Sélectionner</option>
                        {formData.type === TYPES_PAIEMENT.MOBILE
                          ? Object.entries(GROUPES_MOBILE).map(
                              ([key, value]) => (
                                <option key={key} value={value}>
                                  {value}
                                </option>
                              )
                            )
                          : Object.entries(GROUPES_BANCAIRE).map(
                              ([key, value]) => (
                                <option key={key} value={value}>
                                  {value}
                                </option>
                              )
                            )}
                      </select>
                    </FormField>

                    <FormField
                      label={
                        formData.type === TYPES_PAIEMENT.MOBILE
                          ? "Numéro de téléphone"
                          : "Numéro de compte"
                      }
                      icon={Hash}
                      error={errors.numero}
                      required>
                      <input
                        type="text"
                        value={formData.numero}
                        onChange={(e) => updateField("numero", e.target.value)}
                        onBlur={() => validateField("numero")}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background
                                 focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={
                          formData.type === TYPES_PAIEMENT.MOBILE
                            ? "Ex: 97001234"
                            : "Ex: BJ066..."
                        }
                      />
                    </FormField>

                    <FormField
                      label="Dénomination personnalisée (optionnel)"
                      icon={Tag}
                      info="Laissez vide pour générer automatiquement">
                      <input
                        type="text"
                        value={formData.denomination}
                        onChange={(e) =>
                          updateField("denomination", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-input bg-background
                                 focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={getDenominationAuto()}
                      />
                    </FormField>
                  </>
                )}
              </div>
            )}

            {/* Étape 2 - Récapitulatif */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Récapitulatif
                </h2>

                <div className="flex items-center justify-center mb-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{
                      backgroundColor: getColorForType(formData.type) + "20",
                    }}>
                    {getIconForType(formData.type)}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">
                      {formData.type === TYPES_PAIEMENT.ESPECES
                        ? "Espèces"
                        : formData.type === TYPES_PAIEMENT.MOBILE
                        ? "Paiement Mobile"
                        : "Compte Bancaire"}
                    </span>
                  </div>

                  {formData.type !== TYPES_PAIEMENT.ESPECES && (
                    <>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">
                          {formData.type === TYPES_PAIEMENT.MOBILE
                            ? "Opérateur"
                            : "Banque"}
                        </span>
                        <span className="font-medium">
                          {formData.groupe || "Non défini"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Numéro</span>
                        <span className="font-medium">
                          {formData.numero || "Non défini"}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Dénomination</span>
                    <span className="font-medium">{getDenominationAuto()}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Boutons de navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="max-w-sm mx-auto flex gap-3">
            {currentStep > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={previousStep}
                className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-md
                         font-medium flex items-center justify-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </motion.button>
            )}

            {currentStep < 2 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Validation conditionnelle
                  if (
                    currentStep === 1 &&
                    formData.type !== TYPES_PAIEMENT.ESPECES
                  ) {
                    if (!formData.groupe || !formData.numero) {
                      toast.error(
                        "Veuillez remplir tous les champs obligatoires"
                      );
                      return;
                    }
                  }
                  nextStep();
                }}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-md
                         font-medium flex items-center justify-center gap-2">
                Suivant
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-md
                         font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                Enregistrer
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Vue Desktop
  const DesktopView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Ajouter un moyen de paiement
              </h1>
              <p className="text-muted-foreground mt-1">
                Configurez un nouveau moyen de paiement pour votre système
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 space-y-6">
            {/* Section Type */}
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Type de paiement
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Espèces */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateField("type", TYPES_PAIEMENT.ESPECES)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${
                      formData.type === TYPES_PAIEMENT.ESPECES
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }
                  `}>
                  <div className="text-4xl mb-2">💵</div>
                  <p className="font-semibold text-sm">Espèces</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paiement liquide
                  </p>
                </motion.button>

                {/* Mobile */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateField("type", TYPES_PAIEMENT.MOBILE)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${
                      formData.type === TYPES_PAIEMENT.MOBILE
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }
                  `}>
                  <div className="text-4xl mb-2">📱</div>
                  <p className="font-semibold text-sm">Mobile Money</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MTN, Moov, Celtiis
                  </p>
                </motion.button>

                {/* Bancaire */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateField("type", TYPES_PAIEMENT.BANCAIRE)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${
                      formData.type === TYPES_PAIEMENT.BANCAIRE
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }
                  `}>
                  <div className="text-4xl mb-2">🏦</div>
                  <p className="font-semibold text-sm">Compte Bancaire</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    BOA, Ecobank, UBA
                  </p>
                </motion.button>
              </div>
            </div>

            {/* Section Détails */}
            {formData.type !== TYPES_PAIEMENT.ESPECES && (
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Détails
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={
                      formData.type === TYPES_PAIEMENT.MOBILE
                        ? "Opérateur mobile"
                        : "Banque"
                    }
                    icon={Building2}
                    error={errors.groupe}
                    required>
                    <select
                      value={formData.groupe}
                      onChange={(e) => updateField("groupe", e.target.value)}
                      onBlur={() => validateField("groupe")}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Sélectionner</option>
                      {formData.type === TYPES_PAIEMENT.MOBILE
                        ? Object.entries(GROUPES_MOBILE).map(([key, value]) => (
                            <option key={key} value={value}>
                              {value}
                            </option>
                          ))
                        : Object.entries(GROUPES_BANCAIRE).map(
                            ([key, value]) => (
                              <option key={key} value={value}>
                                {value}
                              </option>
                            )
                          )}
                    </select>
                  </FormField>

                  <FormField
                    label={
                      formData.type === TYPES_PAIEMENT.MOBILE
                        ? "Numéro de téléphone"
                        : "Numéro de compte"
                    }
                    icon={Hash}
                    error={errors.numero}
                    required>
                    <input
                      type="text"
                      value={formData.numero}
                      onChange={(e) => updateField("numero", e.target.value)}
                      onBlur={() => validateField("numero")}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={
                        formData.type === TYPES_PAIEMENT.MOBILE
                          ? "Ex: 97001234"
                          : "Ex: BJ066..."
                      }
                    />
                  </FormField>

                  <FormField
                    label="Dénomination personnalisée"
                    icon={Tag}
                    info="Laissez vide pour générer automatiquement">
                    <input
                      type="text"
                      value={formData.denomination}
                      onChange={(e) =>
                        updateField("denomination", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={getDenominationAuto()}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Message pour espèces */}
            {formData.type === TYPES_PAIEMENT.ESPECES && (
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">💵</div>
                  <div>
                    <p className="font-medium text-foreground">
                      Paiement en espèces
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aucune configuration supplémentaire n'est nécessaire pour
                      ce type de paiement. Vous pouvez enregistrer directement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetForm}
                className="px-6 py-2.5 bg-muted text-foreground rounded-md
                         font-medium flex items-center gap-2">
                <X className="h-4 w-4" />
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md
                         font-medium disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}>
                    <Upload className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </motion.button>
            </div>
          </motion.div>

          {/* Panneau d'aperçu */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1">
            <div className="sticky top-8 bg-card rounded-lg shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Aperçu
              </h3>

              {/* Carte de prévisualisation */}
              <motion.div
                layout
                className="rounded-lg p-4 mb-4"
                style={{
                  backgroundColor: getColorForType(formData.type) + "15",
                  borderLeft: `4px solid ${getColorForType(formData.type)}`,
                }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: getColorForType(formData.type) + "30",
                    }}>
                    {getIconForType(formData.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      {getDenominationAuto()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.type === TYPES_PAIEMENT.ESPECES
                        ? "Espèces"
                        : formData.type === TYPES_PAIEMENT.MOBILE
                        ? "Paiement Mobile"
                        : "Compte Bancaire"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Détails */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {formData.type === TYPES_PAIEMENT.ESPECES
                      ? "Espèces"
                      : formData.type === TYPES_PAIEMENT.MOBILE
                      ? "Mobile"
                      : "Bancaire"}
                  </span>
                </div>

                {formData.type !== TYPES_PAIEMENT.ESPECES && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {formData.type === TYPES_PAIEMENT.MOBILE
                          ? "Opérateur"
                          : "Banque"}
                      </span>
                      <span className="font-medium">
                        {formData.groupe || "---"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Numéro</span>
                      <span className="font-medium font-mono text-xs">
                        {formData.numero || "---"}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className="font-medium text-green-600">Actif</span>
                </div>
              </div>

              {/* Badge de couleur */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Couleur du thème
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border border-border"
                    style={{ backgroundColor: getColorForType(formData.type) }}
                  />
                  <span className="text-xs font-mono">
                    {getColorForType(formData.type)}
                  </span>
                </div>
              </div>

              {/* Informations supplémentaires */}
              {formData.type !== TYPES_PAIEMENT.ESPECES && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>
                      {formData.type === TYPES_PAIEMENT.MOBILE
                        ? "Ce moyen de paiement sera disponible pour les paiements via mobile money."
                        : "Ce compte bancaire sera disponible pour les virements et paiements électroniques."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <Loader
              isVisible={loading}
              text="Création du moyen de paiement..."
            />
          </motion.div>
        )}
      </AnimatePresence>
      {isMobile ? <MobileView /> : <DesktopView />}
    </>
  );
};

export default AjouterUnMoyenDePaiement;
