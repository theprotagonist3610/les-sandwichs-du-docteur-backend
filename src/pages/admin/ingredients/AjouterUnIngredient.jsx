// components/AjouterUnIngredient.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { useIngredients, createIngredient } from "@/toolkits/ingredientToolkit";
import useIngredientFormStore from "@/stores/useIngredientFormStore";
import {
  FlaskConical,
  Zap,
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
  Apple,
  Carrot,
  Beef,
  Fish,
  Spade,
  Leaf,
  Smile,
} from "lucide-react";

const AjouterUnIngredient = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const { ingredientsActifs } = useIngredients();
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
  } = useIngredientFormStore();

  // Extraire les groupes uniques
  const groupes = [
    ...new Set(ingredientsActifs.map((i) => i.groupe).filter(Boolean)),
  ];

  // Ajouter les groupes par défaut si ils n'existent pas
  const defaultGroupes = [
    "Légumes",
    "Fruits",
    "Viandes",
    "Poissons",
    "Épices",
    "Autres",
  ];
  const allGroupes = [...new Set([...groupes, ...defaultGroupes])];

  // Étapes pour mobile
  const steps = [
    { id: 0, title: "Informations de base", icon: FlaskConical },
    { id: 1, title: "Calories et emoji", icon: Zap },
    { id: 2, title: "Récapitulatif", icon: Check },
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
      const result = await createIngredient(formData);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Ingrédient créé avec succès!</span>
          </div>
        );
        resetForm();
        fillDefaults();
      } else if (result.isDuplicate) {
        toast.error(
          "Un ingrédient avec cette dénomination existe déjà dans ce groupe"
        );
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
    if (name.includes("fruit")) return Apple;
    if (name.includes("légume") || name.includes("legume")) return Carrot;
    if (name.includes("viande")) return Beef;
    if (name.includes("poisson")) return Fish;
    if (name.includes("épice") || name.includes("epice")) return Spade;
    return FlaskConical;
  };

  // Emojis suggérés par groupe
  const getSuggestedEmojis = (groupe) => {
    const groupeLower = (groupe || "").toLowerCase();
    if (groupeLower.includes("fruit"))
      return ["🍎", "🍌", "🍇", "🍊", "🥭", "🍓"];
    if (groupeLower.includes("légume") || groupeLower.includes("legume"))
      return ["🥕", "🥬", "🧅", "🌶️", "🫑", "🥒"];
    if (groupeLower.includes("viande"))
      return ["🥩", "🍗", "🥓", "🐄", "🐷", "🐑"];
    if (groupeLower.includes("poisson"))
      return ["🐟", "🐠", "🦐", "🦀", "🐙", "🍤"];
    if (groupeLower.includes("épice") || groupeLower.includes("epice"))
      return ["🧂", "🌶️", "🧄", "🫚", "🥄", "⚫"];
    return ["🥄", "🍽️", "🥫", "🫙", "🌾", "🍬"];
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

  // Composant pour la sélection d'emoji
  const EmojiSelector = ({ selectedEmoji, onSelect, suggestions }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Smile className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Emoji actuel:</span>
        <span className="text-2xl">{selectedEmoji || "🥄"}</span>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {suggestions.map((emoji, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(emoji)}
            className={`
              p-2 text-xl rounded-md border transition-all
              ${
                selectedEmoji === emoji
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-accent"
              }
            `}>
            {emoji}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={selectedEmoji}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="Ou tapez un emoji..."
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring text-center"
        />
        <button
          type="button"
          onClick={() => onSelect("")}
          className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80">
          Effacer
        </button>
      </div>
    </div>
  );

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
            Ajouter un ingrédient
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
                        absolute left-full w-[calc(100vw/4)] h-0.5 top-1/2
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
                  <FlaskConical className="h-5 w-5" />
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
                    placeholder="Ex: Tomate"
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

            {/* Étape 1 - Calories et emoji */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Calories et emoji
                </h2>

                <FormField
                  label="Calories (pour 100g)"
                  icon={Zap}
                  error={errors.calories}>
                  <input
                    type="number"
                    value={formData.calories || ""}
                    onChange={(e) =>
                      updateField("calories", parseInt(e.target.value) || 0)
                    }
                    onBlur={() => validateField("calories")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex: 25"
                  />
                </FormField>

                <FormField label="Emoji" icon={Smile}>
                  <EmojiSelector
                    selectedEmoji={formData.emoji}
                    onSelect={(emoji) => updateField("emoji", emoji)}
                    suggestions={getSuggestedEmojis(formData.groupe)}
                  />
                </FormField>
              </div>
            )}

            {/* Étape 2 - Récapitulatif */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Récapitulatif
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Dénomination</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{formData.emoji}</span>
                      <span className="font-medium">
                        {formData.denomination || "Non défini"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Groupe</span>
                    <span className="font-medium">
                      {formData.groupe || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Calories</span>
                    <span className="font-medium text-accent">
                      {formData.calories || 0} kcal/100g
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-accent/10 rounded-lg text-center">
                  <div className="text-4xl mb-2">{formData.emoji || "🥄"}</div>
                  <p className="font-medium text-foreground">
                    {formData.denomination || "Nouvel ingrédient"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.groupe || "Groupe non défini"}
                  </p>
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
                  if (currentStep === 0 && !formData.denomination.trim()) {
                    toast.error("La dénomination est obligatoire");
                    return;
                  }
                  if (currentStep === 0 && !formData.groupe.trim()) {
                    toast.error("Le groupe est obligatoire");
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
                <FlaskConical className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Ajouter un nouvel ingrédient
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Créez un nouvel ingrédient pour vos recettes
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
                      placeholder="Ex: Tomate"
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
              </div>

              {/* Section Calories */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Valeur nutritionnelle
                </h2>

                <FormField
                  label="Calories (pour 100g)"
                  icon={Zap}
                  error={errors.calories}>
                  <input
                    type="number"
                    value={formData.calories || ""}
                    onChange={(e) =>
                      updateField("calories", parseInt(e.target.value) || 0)
                    }
                    onBlur={() => validateField("calories")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex: 25"
                  />
                </FormField>
              </div>

              {/* Section Emoji */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smile className="h-5 w-5" />
                  Représentation visuelle
                </h2>

                <EmojiSelector
                  selectedEmoji={formData.emoji}
                  onSelect={(emoji) => updateField("emoji", emoji)}
                  suggestions={getSuggestedEmojis(formData.groupe)}
                />
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
                  Enregistrer l'ingrédient
                </motion.button>
              </div>
            </motion.div>

            {/* Panneau d'aperçu */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-card rounded-lg shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Aperçu de l'ingrédient
                </h3>

                {/* Icône du groupe */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className="p-4 bg-primary/10 rounded-xl">
                    <Icon className="h-12 w-12 text-primary" />
                  </motion.div>
                </div>

                {/* Aperçu principal */}
                <div className="text-center mb-6">
                  <div className="text-6xl mb-3">{formData.emoji || "🥄"}</div>
                  <h4 className="text-xl font-bold text-foreground mb-1">
                    {formData.denomination || "Nouvel ingrédient"}
                  </h4>
                  <p className="text-muted-foreground">
                    {formData.groupe || "Groupe non défini"}
                  </p>
                </div>

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
                    <span className="text-muted-foreground">Calories</span>
                    <span className="font-medium text-accent">
                      {formData.calories || 0} kcal/100g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Emoji</span>
                    <span className="font-medium text-xl">
                      {formData.emoji || "🥄"}
                    </span>
                  </div>
                </div>

                {/* Badge du groupe */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {formData.groupe || "Aucun groupe"}
                    </span>
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
            <Loader isVisible={loading} text="Création de l'ingrédient..." />
          </motion.div>
        )}
      </AnimatePresence>
      {isMobile ? <MobileView /> : <DesktopView />}
    </>
  );
};

export default AjouterUnIngredient;
