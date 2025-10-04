// components/AjouterUnMenu.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { useMenus, createMenu } from "@/toolkits/menuToolkit";
import useMenuFormStore from "@/stores/useMenuFormStore";
import {
  Package2,
  UtensilsCrossed,
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
  Tag,
  Layers,
  FlaskConical,
  Zap,
  Sparkles,
  Upload,
  FileText,
  Box,
  Sandwich,
  Cookie,
  ChefHat,
  Search,
  Beaker,
} from "lucide-react";

const AjouterUnMenu = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const { menusActifs } = useMenus();
  const [loading, setLoading] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState([]);

  // Store Zustand
  const {
    formData,
    errors,
    currentStep,
    isSubmitting,
    updateField,
    addIngredient,
    removeIngredient,
    updateIngredientQuantity,
    validateField,
    validateForm,
    nextStep,
    previousStep,
    setStep,
    setSubmitting,
    resetForm,
    fillDefaults,
  } = useMenuFormStore();

  // Extraire les catégories uniques
  const categories = [
    ...new Set(menusActifs.map((m) => m.groupe).filter(Boolean)),
  ];

  // Ajouter les catégories par défaut si elles n'existent pas
  const defaultCategories = [
    "Box",
    "Pain simple",
    "Pain viennois",
    "Sandwich",
    "Plat",
    "Autres",
  ];
  const allCategories = [...new Set([...categories, ...defaultCategories])];

  // Types de récipients
  const recipients = [
    "Box 16x16",
    "Box 20x20",
    "Emballage Kraft",
    "Assiette",
    "Bol",
    "Pot 500ml",
    "Barquette",
    "Papier aluminium",
  ];

  // Étapes pour mobile
  const steps = [
    { id: 0, title: "Informations de base", icon: UtensilsCrossed },
    { id: 1, title: "Description et prix", icon: FileText },
    { id: 2, title: "Image et calories", icon: Image },
    { id: 3, title: "Ingrédients", icon: FlaskConical },
    { id: 4, title: "Récapitulatif", icon: Check },
  ];

  // Charger les ingrédients disponibles au montage
  useEffect(() => {
    fillDefaults();
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const ingredientsDoc = await getDoc(doc(db, "ingredients", "liste"));
      if (ingredientsDoc.exists()) {
        const ingredients = ingredientsDoc.data().ingredients || [];
        setAvailableIngredients(ingredients);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des ingrédients:", error);
    }
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
      const result = await createMenu(formData);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Menu créé avec succès!</span>
          </div>
        );
        resetForm();
        fillDefaults();
      } else if (result.isDuplicate) {
        toast.error("Un menu avec cette dénomination existe déjà");
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
    if (name.includes("box")) return Box;
    if (name.includes("pain")) return Sandwich;
    if (name.includes("viennois")) return Cookie;
    return ChefHat;
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

  // Composant pour gérer les ingrédients
  const IngredientsManager = React.memo(() => {
    const [localSearch, setLocalSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);
    const dropdownTimeoutRef = useRef(null);

    useEffect(() => {
      return () => {
        if (dropdownTimeoutRef.current) {
          clearTimeout(dropdownTimeoutRef.current);
        }
      };
    }, []);

    const filteredIngredients = availableIngredients.filter(
      (ing) =>
        ing.denomination.toLowerCase().includes(localSearch.toLowerCase()) &&
        !formData.ingredients?.find(
          (existing) => existing.denomination === ing.denomination
        )
    );

    const handleAddIngredient = useCallback(
      (ingredient) => {
        addIngredient({
          id: nanoid(10),
          denomination: ingredient.denomination,
          quantite: 0,
          valeur_calorique: ingredient.valeur_calorique || 0,
        });
        setLocalSearch("");
        setShowDropdown(false);
        searchRef.current?.focus();
      },
      [addIngredient]
    );

    const handleBlur = useCallback(() => {
      dropdownTimeoutRef.current = setTimeout(() => {
        setShowDropdown(false);
      }, 200);
    }, []);

    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onBlur={handleBlur}
              placeholder="Rechercher un ingrédient..."
              className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-background
                       focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <AnimatePresence>
            {showDropdown && localSearch && filteredIngredients.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto
                         bg-card border border-border rounded-md shadow-lg z-10"
                onMouseDown={(e) => e.preventDefault()}>
                {filteredIngredients.slice(0, 10).map((ing) => (
                  <motion.button
                    key={ing.denomination}
                    whileHover={{ backgroundColor: "rgb(var(--muted) / 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddIngredient(ing)}
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between">
                    <span className="text-sm">{ing.denomination}</span>
                    {ing.valeur_calorique && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        {ing.valeur_calorique} kcal
                      </span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {formData.ingredients?.map((ingredient, index) => (
              <motion.div
                key={ingredient.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Beaker className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {ingredient.denomination}
                  </p>
                  {ingredient.valeur_calorique && (
                    <p className="text-xs text-muted-foreground">
                      {ingredient.valeur_calorique} kcal
                    </p>
                  )}
                </div>

                <input
                  type="number"
                  value={ingredient.quantite || 0}
                  onChange={(e) =>
                    updateIngredientQuantity(
                      index,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-20 px-2 py-1 text-sm rounded border border-input bg-background
                           focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Qté"
                />

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeIngredient(index)}
                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {(!formData.ingredients || formData.ingredients.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun ingrédient ajouté
            </p>
          )}
        </div>
      </div>
    );
  });

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
            Ajouter un menu
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
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5" />
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
                    placeholder="Ex: Box viande"
                  />
                </FormField>

                <FormField
                  label="Catégorie"
                  icon={Layers}
                  error={errors.groupe}
                  required>
                  <select
                    value={formData.groupe}
                    onChange={(e) => updateField("groupe", e.target.value)}
                    onBlur={() => validateField("groupe")}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Sélectionner une catégorie</option>
                    {allCategories.map((cat) => (
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
                    placeholder="Ou créer une nouvelle catégorie"
                  />
                </FormField>

                <FormField label="Récipient" icon={Package2}>
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

            {/* Étape 1 - Description et prix */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description et prix
                </h2>

                <FormField label="Description" icon={FileText}>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background
                             focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                    placeholder="Description du menu..."
                  />
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
                    placeholder="1500"
                  />
                </FormField>
              </div>
            )}

            {/* Étape 2 - Image et calories */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5" />
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
                      className="mt-3 h-32 w-full object-cover rounded-lg bg-muted"
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
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Ingrédients
                </h2>

                <IngredientsManager />
              </div>
            )}

            {/* Étape 4 - Récapitulatif */}
            {currentStep === 4 && (
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
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="font-medium">
                      {formData.groupe || "Non défini"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-medium">{formData.prix} FCFA</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Récipient</span>
                    <span className="font-medium">{formData.recipient}</span>
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

            {currentStep < 4 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentStep === 0 && !formData.denomination.trim()) {
                    toast.error("La dénomination est obligatoire");
                    return;
                  }
                  if (currentStep === 0 && !formData.groupe.trim()) {
                    toast.error("La catégorie est obligatoire");
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
                <UtensilsCrossed className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Ajouter un nouveau menu
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Créez un nouveau menu pour votre catalogue
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
                      placeholder="Ex: Box viande"
                    />
                  </FormField>

                  <FormField
                    label="Catégorie"
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
                        <option value="">Sélectionner une catégorie</option>
                        {allCategories.map((cat) => (
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

                  <FormField label="Récipient" icon={Package2}>
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
                      placeholder="1500"
                    />
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
                      placeholder="Description détaillée du menu..."
                    />
                  </FormField>
                </div>
              </div>

              {/* Section Nutrition et image */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Nutrition et visuel
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Calories"
                    icon={Zap}
                    error={errors.calories}>
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
                  Composition et ingrédients
                </h2>

                <IngredientsManager />
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
                  Enregistrer le menu
                </motion.button>
              </div>
            </motion.div>

            {/* Panneau d'aperçu */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-card rounded-lg shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Aperçu du menu
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
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="font-medium">
                      {formData.groupe || "Non définie"}
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

                {formData.description && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {formData.description}
                    </p>
                  </div>
                )}

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
            <Loader isVisible={loading} text="Création du menu..." />
          </motion.div>
        )}
      </AnimatePresence>
      {isMobile ? <MobileView /> : <DesktopView />}
    </>
  );
};

export default AjouterUnMenu;
