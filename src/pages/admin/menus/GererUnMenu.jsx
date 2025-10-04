// components/GererUnMenu.jsx
import React, { useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { updateMenu } from "@/toolkits/menuToolkit";
import useEditMenuStore from "@/stores/useEditMenuStore";
import { toast } from "sonner";
import {
  DollarSign,
  FlaskConical,
  Zap,
  Image,
  Save,
  X,
  Layers,
  Edit3,
  Check,
  RotateCcw,
  AlertCircle,
  Info,
  ArrowLeft,
  Camera,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  UtensilsCrossed,
  Package,
} from "lucide-react";

// Import des composants optimisés
import EditableField from "./EditableField";
import IngredientsManager from "./IngredientsManager";

// ==========================================
// ANIMATIONS OPTIMISÉES
// ==========================================
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// ==========================================
// COMPOSANTS MÉMORISÉS
// ==========================================

// Section Card Mobile mémorisée
const MobileSectionCard = React.memo(
  ({ title, icon: Icon, section, children, isExpanded, onToggle }) => (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className="bg-card rounded-lg border border-border overflow-hidden">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
);

MobileSectionCard.displayName = "MobileSectionCard";

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
const GererUnMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  // Sélecteurs Zustand optimisés
  const originalMenu = useEditMenuStore((state) => state.originalMenu);
  const editedMenu = useEditMenuStore((state) => state.editedMenu);
  const hasChanges = useEditMenuStore((state) => state.hasChanges);
  const isSubmitting = useEditMenuStore((state) => state.isSubmitting);
  const loading = useEditMenuStore((state) => state.loading);
  const expandedSections = useEditMenuStore((state) => state.expandedSections);

  const initializeMenu = useEditMenuStore((state) => state.initializeMenu);
  const setAvailableIngredients = useEditMenuStore(
    (state) => state.setAvailableIngredients
  );
  const setSubmitting = useEditMenuStore((state) => state.setSubmitting);
  const setLoading = useEditMenuStore((state) => state.setLoading);
  const resetToOriginal = useEditMenuStore((state) => state.resetToOriginal);
  const toggleSection = useEditMenuStore((state) => state.toggleSection);
  const cleanup = useEditMenuStore((state) => state.cleanup);

  // Constantes mémorisées
  const recipients = useMemo(
    () => [
      "Assiette",
      "Plateau",
      "Barquette",
      "Bol",
      "Grande assiette",
      "Petit bol",
    ],
    []
  );

  const groupesMenu = useMemo(
    () => [
      "Plats principaux",
      "Entrées",
      "Desserts",
      "Accompagnements",
      "Salades",
      "Sandwichs",
      "Soupes",
      "Spécialités",
    ],
    []
  );

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const menuDoc = await getDoc(doc(db, "menus", "liste"));
      if (menuDoc.exists()) {
        const menus = menuDoc.data().menus || [];
        const menu = menus.find((m) => m.id === id);

        if (menu) {
          initializeMenu(menu);
        } else {
          toast.error("Menu introuvable");
          navigate("/admin/menus");
          return;
        }
      }

      const ingredientsDoc = await getDoc(doc(db, "ingredients", "liste"));
      if (ingredientsDoc.exists()) {
        const ingredients = ingredientsDoc.data().ingredients || [];
        setAvailableIngredients(ingredients);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [id, initializeMenu, navigate, setLoading, setAvailableIngredients]);

  // Charger au montage
  useEffect(() => {
    loadData();
    return () => cleanup();
  }, [loadData, cleanup]);

  // Sauvegarder les modifications
  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      toast.info("Aucune modification à sauvegarder");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateMenu(editedMenu.id, editedMenu);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Menu mis à jour avec succès</span>
          </div>
        );
        initializeMenu(editedMenu);
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }, [hasChanges, editedMenu, initializeMenu, setSubmitting]);

  // Calculer les calories totales
  const calculateTotalCalories = useMemo(() => {
    if (!editedMenu?.ingredients) return editedMenu?.calories || 0;

    const ingredientCalories = editedMenu.ingredients.reduce((total, ing) => {
      return total + (ing.calories || 0) * (ing.quantite || 0);
    }, 0);

    return (editedMenu.calories || 0) + ingredientCalories;
  }, [editedMenu?.ingredients, editedMenu?.calories]);

  // Handlers mémorisés
  const handleToggleSection = useCallback(
    (section) => {
      toggleSection(section);
    },
    [toggleSection]
  );

  const handleBack = useCallback(() => {
    navigate("/admin/menus");
  }, [navigate]);

  // ==========================================
  // VUE MOBILE
  // ==========================================
  const MobileView = useCallback(
    () => (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-background pb-24">
        {/* En-tête fixe */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-muted rounded-md transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h1 className="font-semibold text-lg">Modifier le menu</h1>

            {hasChanges ? (
              <button
                onClick={resetToOriginal}
                className="p-2 hover:bg-muted rounded-md transition-colors">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>

          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-2 bg-accent/10 text-accent text-sm text-center overflow-hidden">
                Modifications non sauvegardées
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contenu principal */}
        <div className="p-4 space-y-4">
          {/* Section Informations générales */}
          <MobileSectionCard
            title="Informations générales"
            icon={Info}
            section="general"
            isExpanded={expandedSections.general}
            onToggle={() => handleToggleSection("general")}>
            <EditableField
              field="denomination"
              label="Dénomination"
              icon={UtensilsCrossed}
              placeholder="Nom du menu"
            />

            <EditableField
              field="groupe"
              label="Groupe"
              icon={Layers}
              options={groupesMenu}
            />

            <EditableField
              field="recipient"
              label="Récipient"
              icon={Package}
              options={recipients}
            />

            <EditableField
              field="description"
              label="Description"
              icon={FileText}
              placeholder="Description du menu..."
              multiline={true}
            />
          </MobileSectionCard>

          {/* Section Prix */}
          <MobileSectionCard
            title="Prix"
            icon={DollarSign}
            section="prix"
            isExpanded={expandedSections.prix}
            onToggle={() => handleToggleSection("prix")}>
            <EditableField
              field="prix"
              label="Prix (FCFA)"
              icon={DollarSign}
              type="number"
              placeholder="0"
            />
          </MobileSectionCard>

          {/* Section Ingrédients */}
          <MobileSectionCard
            title="Ingrédients"
            icon={FlaskConical}
            section="ingredients"
            isExpanded={expandedSections.ingredients}
            onToggle={() => handleToggleSection("ingredients")}>
            <IngredientsManager />
          </MobileSectionCard>

          {/* Section Image */}
          <MobileSectionCard
            title="Image"
            icon={Camera}
            section="image"
            isExpanded={expandedSections.image}
            onToggle={() => handleToggleSection("image")}>
            <EditableField
              field="imgURL"
              label="URL de l'image"
              icon={Image}
              placeholder="https://..."
            />

            {editedMenu?.imgURL && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3">
                <img
                  src={editedMenu.imgURL}
                  alt="Aperçu"
                  className="h-40 w-full object-contain rounded-lg bg-muted"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </motion.div>
            )}
          </MobileSectionCard>

          {/* Section Nutrition */}
          <MobileSectionCard
            title="Nutrition"
            icon={Zap}
            section="nutrition"
            isExpanded={expandedSections.nutrition}
            onToggle={() => handleToggleSection("nutrition")}>
            <EditableField
              field="calories"
              label="Calories de base"
              icon={Zap}
              type="number"
              placeholder="0"
            />

            <div className="p-3 bg-accent/10 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calories totales</span>
                <span className="text-lg font-bold text-accent">
                  {calculateTotalCalories} kcal
                </span>
              </div>
            </div>
          </MobileSectionCard>
        </div>

        {/* Boutons d'action fixes */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg">
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-md
                     font-medium flex items-center justify-center gap-2 transition-colors">
              <X className="h-4 w-4" />
              Annuler
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={!hasChanges || isSubmitting}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-md
                     font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}>
                  <Save className="h-4 w-4" />
                </motion.div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    ),
    [
      hasChanges,
      isSubmitting,
      expandedSections,
      recipients,
      groupesMenu,
      calculateTotalCalories,
      editedMenu,
      handleBack,
      handleSave,
      resetToOriginal,
      handleToggleSection,
    ]
  );

  // ==========================================
  // VUE DESKTOP
  // ==========================================
  const DesktopView = useCallback(
    () => (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-muted rounded-md transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                    Modifier le menu
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {originalMenu?.denomination}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {hasChanges && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3">
                      <span className="text-sm text-accent flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Modifications non sauvegardées
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetToOriginal}
                        className="px-4 py-2 bg-muted text-foreground rounded-md
                               font-medium flex items-center gap-2 transition-colors">
                        <RotateCcw className="h-4 w-4" />
                        Réinitialiser
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={!hasChanges || isSubmitting}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md
                         font-medium disabled:opacity-50 flex items-center gap-2 transition-colors">
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}>
                      <Save className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Sauvegarder les modifications
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section Informations générales */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Informations générales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField
                    field="denomination"
                    label="Dénomination"
                    icon={UtensilsCrossed}
                    placeholder="Nom du menu"
                  />

                  <EditableField
                    field="groupe"
                    label="Groupe"
                    icon={Layers}
                    options={groupesMenu}
                  />

                  <EditableField
                    field="recipient"
                    label="Récipient"
                    icon={Package}
                    options={recipients}
                  />

                  <EditableField
                    field="prix"
                    label="Prix (FCFA)"
                    icon={DollarSign}
                    type="number"
                    placeholder="0"
                  />
                </div>

                <div className="mt-4">
                  <EditableField
                    field="description"
                    label="Description"
                    icon={FileText}
                    placeholder="Description du menu..."
                    multiline={true}
                  />
                </div>
              </motion.div>

              {/* Section Nutrition */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Nutrition
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField
                    field="calories"
                    label="Calories de base"
                    icon={Zap}
                    type="number"
                    placeholder="0"
                  />

                  <div className="p-4 bg-accent/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-accent" />
                        <div>
                          <span className="font-medium">Calories totales</span>
                          <p className="text-xs text-muted-foreground">
                            (Base + Ingrédients)
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-accent">
                        {calculateTotalCalories} kcal
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section Ingrédients */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  Composition et Ingrédients
                </h2>

                <IngredientsManager />
              </motion.div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Aperçu de l'image */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Image du produit
                </h3>

                {editedMenu?.imgURL ? (
                  <div className="space-y-4">
                    <img
                      src={editedMenu.imgURL}
                      alt="Aperçu"
                      className="h-48 w-full object-contain rounded-lg bg-muted"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    <EditableField
                      field="imgURL"
                      label="URL de l'image"
                      icon={Image}
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-48 w-full rounded-lg bg-muted flex items-center justify-center">
                      <Image className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <EditableField
                      field="imgURL"
                      label="URL de l'image"
                      icon={Image}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </motion.div>

              {/* Résumé des modifications */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-primary" />
                  Résumé
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Statut</span>
                    <span
                      className={`font-medium ${
                        editedMenu?.actif
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}>
                      {editedMenu?.actif ? "Actif" : "Désactivé"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-medium">
                      {editedMenu?.prix || 0} FCFA
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Groupe</span>
                    <span className="font-medium">
                      {editedMenu?.groupe || "Non défini"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Récipient</span>
                    <span className="font-medium">
                      {editedMenu?.recipient || "Non défini"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ingrédients</span>
                    <span className="font-medium">
                      {editedMenu?.ingredients?.length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Calories totales
                    </span>
                    <span className="font-medium text-accent">
                      {calculateTotalCalories} kcal
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {hasChanges && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border overflow-hidden">
                      <div className="flex items-center gap-2 text-accent">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">
                          Des modifications sont en attente
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    ),
    [
      originalMenu,
      editedMenu,
      hasChanges,
      isSubmitting,
      recipients,
      groupesMenu,
      calculateTotalCalories,
      handleBack,
      handleSave,
      resetToOriginal,
    ]
  );

  // ==========================================
  // RENDU CONDITIONNEL
  // ==========================================
  if (loading) {
    return <Loader isVisible={loading} text="Chargement du menu..." />;
  }

  if (!editedMenu) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Menu introuvable
            </h2>
            <p className="text-muted-foreground mb-4">
              Le menu demandé n'existe pas ou a été supprimé
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                       font-medium hover:bg-primary/90 transition-colors">
              Retour aux menus
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <Loader isVisible={isSubmitting} text="Sauvegarde en cours..." />
          </motion.div>
        )}
      </AnimatePresence>
      {isMobile ? <MobileView /> : <DesktopView />}
    </>
  );
};

export default GererUnMenu;
