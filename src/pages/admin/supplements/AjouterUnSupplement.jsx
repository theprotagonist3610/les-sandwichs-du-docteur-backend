// components/AjouterUnSupplement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { useSupplements, createSupplement } from "@/toolkits/supplementToolkit";
import useSupplementFormStore from "@/stores/useSupplementFormStore";
import {
  Package2,
  DollarSign,
  Image,
  Info,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Save,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  Upload,
  FileText,
  Wifi,
  Heart,
  MessageCircleQuestion,
  Gift,
  CreditCard,
} from "lucide-react";

const AjouterUnSupplement = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const { supplementsActifs } = useSupplements();
  const [loading, setLoading] = useState(false);

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
  } = useSupplementFormStore();

  // Extraire les groupes uniques
  const groupes = [
    ...new Set(supplementsActifs.map((s) => s.groupe).filter(Boolean)),
  ];

  // Ajouter les groupes par défaut si ils n'existent pas
  const defaultGroupes = [
    "Services divers",
    "Services santé",
    "#QPUD",
    "Cartes et cadeaux",
    "Connectivité",
    "Autres",
  ];
  const allGroupes = [...new Set([...groupes, ...defaultGroupes])];

  // Étapes pour mobile
  const steps = [
    { id: 0, title: "Informations de base", icon: Package2 },
    { id: 1, title: "Prix et description", icon: DollarSign },
    { id: 2, title: "Image", icon: Image },
    { id: 3, title: "Récapitulatif", icon: Check },
  ];

  // Charger les données par défaut au montage
  useEffect(() => {
    fillDefaults();
  }, []);

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);
    setSubmitting(true);

    try {
      const result = await createSupplement(formData);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Supplément créé avec succès!</span>
          </div>
        );
        resetForm();
        fillDefaults();
      } else if (result.isDuplicate) {
        toast.error("Un supplément avec cette dénomination existe déjà");
      } else {
        toast.error("Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Icônes par groupe
  const getGroupIcon = (groupName) => {
    const name = (groupName || "").toLowerCase();
    if (name.includes("divers") || name.includes("service")) return Package2;
    if (name.includes("wifi") || name.includes("connexion")) return Wifi;
    if (name.includes("santé") || name.includes("health")) return Heart;
    if (name.includes("qpud") || name.includes("question"))
      return MessageCircleQuestion;
    if (name.includes("carte") || name.includes("cadeau")) return Gift;
    if (name.includes("connectivité")) return Wifi;
    return Package2;
  };

  // Formater le prix pour l'affichage
  const formatPrice = (prix) => {
    if (typeof prix === "string" && prix.toLowerCase() === "gratuit") {
      return "Gratuit";
    }
    return `${prix} FCFA`;
  };

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Composant Field pour desktop
  const FormField = ({ label, icon: Icon, children, error, required }) => (
    <motion.div variants={itemVariants} className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      <AnimatePresence>
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
  );

  // Gestion du prix (nombre ou "gratuit")
  const handlePriceChange = (value) => {
    if (value.toLowerCase() === "gratuit") {
      updateField("prix", "gratuit");
    } else {
      const numValue = parseFloat(value);
      updateField("prix", isNaN(numValue) ? 0 : numValue);
    }
  };

  // Vue Mobile
  const MobileView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
          <h1 className="text-xl font-bold text-foreground mb-2">
            Ajouter un supplément
          </h1>

          {/* Indicateur d'étapes */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(step.id)}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full
                    cursor-pointer transition-all
                    ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  `}>
                  <Icon className="h-5 w-5" />
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        absolute left-full w-[calc(100vw/5)] h-0.5 top-1/2
                        ${currentStep > step.id ? "bg-primary" : "bg-muted"}
                      `}
                    />
                  )}
                </motion.div>
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
            {/* Étape 0 - Informations de base */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Informations de base
                </h2>

                <FormField
                  label="Dénomination"
                  icon={Tag}
                  error={errors.denomination}
                  required>
                  <input
                    type="text"
                    value={formData.denomination}
                    onChange={(e) =>
                      updateField("denomination", e.target.value)
                    }
                    onBlur={() => validateField("denomination")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex: Code wifi zone 1h"
                  />
                </FormField>

                <FormField
                  label="Groupe"
                  icon={Layers}
                  error={errors.groupe}
                  required>
                  <select
                    value={formData.groupe}
                    onChange={(e) => updateField("groupe", e.target.value)}
                    onBlur={() => validateField("groupe")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Sélectionner un groupe</option>
                    {allGroupes.map((groupe) => (
                      <option key={groupe} value={groupe}>
                        {groupe}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.groupe}
                    onChange={(e) => updateField("groupe", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                    placeholder="Ou créer un nouveau groupe"
                  />
                </FormField>
              </div>
            )}

            {/* Étape 1 - Prix et description */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Prix et description
                </h2>

                <FormField
                  label="Prix"
                  icon={DollarSign}
                  error={errors.prix}
                  required>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.prix}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      onBlur={() => validateField("prix")}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="200 ou gratuit"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateField("prix", "gratuit")}
                        className="px-3 py-1 text-xs bg-accent text-accent-foreground rounded">
                        Gratuit
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("prix", 200)}
                        className="px-3 py-1 text-xs bg-muted text-foreground rounded">
                        200 FCFA
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("prix", 500)}
                        className="px-3 py-1 text-xs bg-muted text-foreground rounded">
                        500 FCFA
                      </button>
                    </div>
                  </div>
                </FormField>

                <FormField label="Description" icon={FileText}>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                    placeholder="Description du supplément..."
                  />
                </FormField>
              </div>
            )}

            {/* Étape 2 - Image */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Image du supplément
                </h2>

                <FormField
                  label="URL de l'image"
                  icon={Image}
                  error={errors.imgURL}>
                  <input
                    type="url"
                    value={formData.imgURL}
                    onChange={(e) => updateField("imgURL", e.target.value)}
                    onBlur={() => validateField("imgURL")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="https://exemple.com/image.jpg"
                  />
                  {formData.imgURL && !errors.imgURL && (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={formData.imgURL}
                      alt="Aperçu"
                      className="mt-3 h-32 w-full object-cover rounded-lg bg-muted"
                      onError={() => updateField("imgURL", "")}
                    />
                  )}
                </FormField>
              </div>
            )}

            {/* Étape 3 - Récapitulatif */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Récapitulatif
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Dénomination</span>
                    <span className="font-medium">
                      {formData.denomination || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Groupe</span>
                    <span className="font-medium">
                      {formData.groupe || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-medium text-primary">
                      {formatPrice(formData.prix)}
                    </span>
                  </div>
                </div>

                {formData.imgURL && (
                  <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={formData.imgURL}
                    alt="Aperçu"
                    className="h-40 w-full object-cover rounded-lg bg-muted"
                  />
                )}

                {formData.description && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-foreground">
                      {formData.description}
                    </p>
                  </div>
                )}
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

            {currentStep < 3 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentStep === 0 && !formData.denomination.trim()) {
                    toast.error("La dénomination est obligatoire");
                    return;
                  }
                  if (currentStep === 0 && !formData.groupe.trim()) {
                    toast.error("Le groupe est obligatoire");
                    return;
                  }
                  if (currentStep === 1 && !formData.prix) {
                    toast.error("Le prix est obligatoire");
                    return;
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
  const DesktopView = () => {
    const Icon = getGroupIcon(formData.groupe);

    return (
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
              <div className="flex items-center gap-3">
                <Package2 className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Ajouter un nouveau supplément
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Créez un nouveau supplément pour votre catalogue
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-md
                       font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Nouveau
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire principal */}
            <motion.div
              initial="hidden"
              animate="visible"
              className="lg:col-span-2 space-y-6">
              {/* Section Informations de base */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informations de base
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Dénomination"
                    icon={Tag}
                    error={errors.denomination}
                    required>
                    <input
                      type="text"
                      value={formData.denomination}
                      onChange={(e) =>
                        updateField("denomination", e.target.value)
                      }
                      onBlur={() => validateField("denomination")}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Ex: Code wifi zone 1h"
                    />
                  </FormField>

                  <FormField
                    label="Groupe"
                    icon={Layers}
                    error={errors.groupe}
                    required>
                    <div className="space-y-2">
                      <select
                        value={formData.groupe}
                        onChange={(e) => updateField("groupe", e.target.value)}
                        onBlur={() => validateField("groupe")}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background
                                 focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Sélectionner un groupe</option>
                        {allGroupes.map((groupe) => (
                          <option key={groupe} value={groupe}>
                            {groupe}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={formData.groupe}
                        onChange={(e) => updateField("groupe", e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background
                                 focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ou créer un nouveau groupe"
                      />
                    </div>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label="Prix"
                    icon={DollarSign}
                    error={errors.prix}
                    required>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.prix}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        onBlur={() => validateField("prix")}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background
                                 focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="200 ou gratuit"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => updateField("prix", "gratuit")}
                          className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-md hover:bg-accent/90">
                          Gratuit
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("prix", 200)}
                          className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80">
                          200 FCFA
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("prix", 500)}
                          className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80">
                          500 FCFA
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("prix", 1000)}
                          className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80">
                          1000 FCFA
                        </button>
                      </div>
                    </div>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField label="Description" icon={FileText}>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                      placeholder="Description détaillée du supplément..."
                    />
                  </FormField>
                </div>
              </div>

              {/* Section Image */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Image du supplément
                </h2>

                <FormField
                  label="URL de l'image"
                  icon={Image}
                  error={errors.imgURL}>
                  <input
                    type="url"
                    value={formData.imgURL}
                    onChange={(e) => updateField("imgURL", e.target.value)}
                    onBlur={() => validateField("imgURL")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="https://exemple.com/image.jpg"
                  />
                </FormField>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-muted text-foreground rounded-md
                           font-medium flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Réinitialiser
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
                  Enregistrer le supplément
                </motion.button>
              </div>
            </motion.div>

            {/* Panneau d'aperçu */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-card rounded-lg shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Aperçu du supplément
                </h3>

                {/* Icône du groupe */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className="p-4 bg-primary/10 rounded-xl">
                    <Icon className="h-12 w-12 text-primary" />
                  </motion.div>
                </div>

                {formData.imgURL ? (
                  <motion.img
                    key={formData.imgURL}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={formData.imgURL}
                    alt="Aperçu"
                    className="h-48 w-full object-cover rounded-lg bg-muted mb-4"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-48 w-full rounded-lg bg-muted flex items-center justify-center mb-4">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {formData.denomination || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Groupe</span>
                    <span className="font-medium">
                      {formData.groupe || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-medium text-primary">
                      {formatPrice(formData.prix)}
                    </span>
                  </div>
                </div>

                {formData.description && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {formData.description}
                    </p>
                  </div>
                )}

                {/* Badge du type de prix */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-center">
                    {typeof formData.prix === "string" &&
                    formData.prix.toLowerCase() === "gratuit" ? (
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                        Service gratuit
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                        Service payant
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <Loader isVisible={loading} text="Création du supplément..." />
          </motion.div>
        )}
      </AnimatePresence>
      {isMobile ? <MobileView /> : <DesktopView />}
    </>
  );
};

export default AjouterUnSupplement;
