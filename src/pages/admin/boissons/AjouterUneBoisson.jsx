// components/AjouterUneBoisson.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { useBoissons, createBoisson } from "@/toolkits/boissonToolkit";
import useBoissonFormStore from "@/stores/useBoissonFormStore";
import {
  Package,
  Coffee,
  DollarSign,
  Image,
  Info,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Droplet,
  Tag,
  Layers,
  FlaskConical,
  Zap,
  Sparkles,
  Upload,
} from "lucide-react";

const AjouterUneBoisson = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const { boissonsActives } = useBoissons();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Store Zustand
  const {
    formData,
    errors,
    currentStep,
    isSubmitting,
    updateField,
    addIngredient,
    removeIngredient,
    validateField,
    validateForm,
    nextStep,
    previousStep,
    setStep,
    setSubmitting,
    resetForm,
    fillDefaults,
  } = useBoissonFormStore();

  // État local pour les ingrédients
  const [newIngredient, setNewIngredient] = useState({
    denomination: "",
    quantite: 0,
  });

  // Extraire les catégories uniques
  const categories = [
    ...new Set(boissonsActives.map((b) => b.groupe).filter(Boolean)),
  ];

  // Récipients courants
  const recipients = [
    "Canette",
    "Bouteille",
    "Petit pot",
    "Grand pot",
    "Verre",
    "Tasse",
  ];

  // Unités de volume
  const unites = [
    { nom: "mililitres", symbole: "ml" },
    { nom: "litres", symbole: "l" },
    { nom: "centilitres", symbole: "cl" },
  ];

  // Étapes pour mobile
  const steps = [
    { id: 0, title: "Informations de base", icon: Coffee },
    { id: 1, title: "Prix et volume", icon: DollarSign },
    { id: 2, title: "Image et calories", icon: Image },
    { id: 3, title: "Ingrédients", icon: FlaskConical },
    { id: 4, title: "Récapitulatif", icon: Check },
  ];

  // Appliquer les valeurs par défaut au montage
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
      const result = await createBoisson(formData);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Boisson créée avec succès!</span>
          </div>
        );
        resetForm();
        fillDefaults();
      } else if (result.isDuplicate) {
        toast.error("Une boisson avec cette dénomination existe déjà");
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

  // Ajouter un ingrédient
  const handleAddIngredient = () => {
    if (!newIngredient.denomination.trim()) {
      toast.warning("Veuillez entrer le nom de l'ingrédient");
      return;
    }

    addIngredient({
      id: nanoid(10),
      denomination: newIngredient.denomination,
      quantite: newIngredient.quantite || 0,
    });

    setNewIngredient({ denomination: "", quantite: 0 });
    toast.success("Ingrédient ajouté");
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

  // Vue Mobile - Formulaire à étapes
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
            Ajouter une boisson
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
                        absolute left-full w-[calc(100vw/6)] h-0.5 top-1/2
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
                <h2 className="text-lg font-semibold text-foreground mb-4">
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
                    placeholder="Ex: Coca Cola"
                  />
                </FormField>

                <FormField label="Catégorie" icon={Layers}>
                  <select
                    value={formData.groupe}
                    onChange={(e) => updateField("groupe", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Sélectionner ou créer</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.groupe}
                    onChange={(e) => updateField("groupe", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                    placeholder="Nouvelle catégorie"
                  />
                </FormField>

                <FormField label="Récipient" icon={Package}>
                  <select
                    value={formData.recipient}
                    onChange={(e) => updateField("recipient", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring">
                    {recipients.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            )}

            {/* Étape 1 - Prix et volume */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Prix et volume
                </h2>

                <FormField
                  label="Prix (FCFA)"
                  icon={DollarSign}
                  error={errors.prix}>
                  <input
                    type="number"
                    value={formData.prix}
                    onChange={(e) =>
                      updateField("prix", parseInt(e.target.value) || 0)
                    }
                    onBlur={() => validateField("prix")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="500"
                  />
                </FormField>

                <FormField label="Volume" icon={Droplet} error={errors.volume}>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.volume}
                      onChange={(e) =>
                        updateField("volume", parseInt(e.target.value) || 0)
                      }
                      onBlur={() => validateField("volume")}
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="330"
                    />
                    <select
                      value={formData.unite.symbole}
                      onChange={(e) => {
                        const unite = unites.find(
                          (u) => u.symbole === e.target.value
                        );
                        updateField("unite", unite);
                      }}
                      className="w-24 px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring">
                      {unites.map((u) => (
                        <option key={u.symbole} value={u.symbole}>
                          {u.symbole}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>
              </div>
            )}

            {/* Étape 2 - Image et calories */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Image et nutrition
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
                      className="mt-3 h-32 w-32 object-contain mx-auto rounded-lg bg-muted"
                      onError={() => updateField("imgURL", "")}
                    />
                  )}
                </FormField>

                <FormField label="Calories" icon={Zap} error={errors.calories}>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) =>
                      updateField("calories", parseInt(e.target.value) || 0)
                    }
                    onBlur={() => validateField("calories")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                  />
                </FormField>
              </div>
            )}

            {/* Étape 3 - Ingrédients */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Ingrédients
                </h2>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIngredient.denomination}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          denomination: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Nom de l'ingrédient"
                    />
                    <input
                      type="number"
                      value={newIngredient.quantite}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          quantite: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Qté"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddIngredient}
                      className="p-2 bg-primary text-primary-foreground rounded-md
                               hover:bg-primary/90">
                      <Plus className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {formData.ingredients.map((ingredient, index) => (
                      <motion.div
                        key={ingredient.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <span className="font-medium">
                            {ingredient.denomination}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({ingredient.quantite})
                          </span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeIngredient(index)}
                          className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Étape 4 - Récapitulatif */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">
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
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="font-medium">
                      {formData.groupe || "Non classé"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-medium">{formData.prix} FCFA</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium">
                      {formData.volume} {formData.unite.symbole}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Ingrédients</span>
                    <span className="font-medium">
                      {formData.ingredients.length}
                    </span>
                  </div>
                </div>

                {formData.imgURL && (
                  <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={formData.imgURL}
                    alt="Aperçu"
                    className="h-40 w-40 object-contain mx-auto rounded-lg bg-muted"
                  />
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

            {currentStep < 4 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentStep === 0 && !formData.denomination.trim()) {
                    toast.error("La dénomination est obligatoire");
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

  // Vue Desktop - Formulaire complet
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
                Ajouter une nouvelle boisson
              </h1>
              <p className="text-muted-foreground mt-1">
                Remplissez les informations pour créer une nouvelle boisson
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-md
                       font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {showPreview ? "Masquer" : "Aperçu"}
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <motion.div
            variants={containerVariants}
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
                    placeholder="Ex: Coca Cola"
                  />
                </FormField>

                <FormField label="Catégorie" icon={Layers}>
                  <div className="space-y-2">
                    <select
                      value={formData.groupe}
                      onChange={(e) => updateField("groupe", e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.groupe}
                      onChange={(e) => updateField("groupe", e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Ou créer une nouvelle catégorie"
                    />
                  </div>
                </FormField>

                <FormField label="Récipient" icon={Package}>
                  <select
                    value={formData.recipient}
                    onChange={(e) => updateField("recipient", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring">
                    {recipients.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Prix (FCFA)"
                  icon={DollarSign}
                  error={errors.prix}>
                  <input
                    type="number"
                    value={formData.prix}
                    onChange={(e) =>
                      updateField("prix", parseInt(e.target.value) || 0)
                    }
                    onBlur={() => validateField("prix")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="500"
                  />
                </FormField>
              </div>
            </div>

            {/* Section Volume et nutrition */}
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Droplet className="h-5 w-5" />
                Volume et nutrition
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Volume" icon={Droplet} error={errors.volume}>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.volume}
                      onChange={(e) =>
                        updateField("volume", parseInt(e.target.value) || 0)
                      }
                      onBlur={() => validateField("volume")}
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="330"
                    />
                    <select
                      value={formData.unite.symbole}
                      onChange={(e) => {
                        const unite = unites.find(
                          (u) => u.symbole === e.target.value
                        );
                        updateField("unite", unite);
                      }}
                      className="w-24 px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring">
                      {unites.map((u) => (
                        <option key={u.symbole} value={u.symbole}>
                          {u.symbole}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>

                <FormField label="Calories" icon={Zap} error={errors.calories}>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) =>
                      updateField("calories", parseInt(e.target.value) || 0)
                    }
                    onBlur={() => validateField("calories")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                  />
                </FormField>

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
            </div>

            {/* Section Ingrédients */}
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Ingrédients
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIngredient.denomination}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        denomination: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Nom de l'ingrédient"
                  />
                  <input
                    type="number"
                    value={newIngredient.quantite}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        quantite: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-32 px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Quantité"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddIngredient}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-md
                             hover:bg-accent/90 font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {formData.ingredients.map((ingredient, index) => (
                      <motion.div
                        key={ingredient.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <span className="font-medium">
                            {ingredient.denomination}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            (Qté: {ingredient.quantite})
                          </span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeIngredient(index)}
                          className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
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
                Enregistrer la boisson
              </motion.button>
            </div>
          </motion.div>

          {/* Panneau d'aperçu */}
          <AnimatePresence>
            {(showPreview || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-1">
                <div className="sticky top-8 bg-card rounded-lg shadow-sm p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Aperçu de la boisson
                  </h3>

                  {formData.imgURL ? (
                    <motion.img
                      key={formData.imgURL}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={formData.imgURL}
                      alt="Aperçu"
                      className="h-48 w-full object-contain rounded-lg bg-muted mb-4"
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
                      <span className="text-muted-foreground">Catégorie</span>
                      <span className="font-medium">
                        {formData.groupe || "Non classé"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Récipient</span>
                      <span className="font-medium">{formData.recipient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix</span>
                      <span className="font-medium text-primary">
                        {formData.prix} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-medium">
                        {formData.volume} {formData.unite.symbole}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calories</span>
                      <span className="font-medium">
                        {formData.calories} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingrédients</span>
                      <span className="font-medium">
                        {formData.ingredients.length}
                      </span>
                    </div>
                  </div>

                  {formData.ingredients.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Liste des ingrédients
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {formData.ingredients.map((ing) => (
                          <span
                            key={ing.id}
                            className="text-xs bg-muted px-2 py-1 rounded">
                            {ing.denomination}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  // Container des animations pour framer-motion
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
            <Loader isVisible={loading} text="Création de la boisson..." />
          </motion.div>
        )}
      </AnimatePresence>
      {isMobile ? <MobileView /> : <DesktopView />}
    </>
  );
};

export default AjouterUneBoisson;
