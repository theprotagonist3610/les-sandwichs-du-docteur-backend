// components/GererUnIngredient.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { updateIngredient } from "@/toolkits/ingredientToolkit";
import useEditIngredientStore from "@/stores/useEditIngredientStore";
import { toast } from "sonner";
import {
  Beaker,
  Layers,
  Zap,
  Save,
  X,
  Check,
  RotateCcw,
  AlertCircle,
  Info,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Smile,
  Edit3,
} from "lucide-react";

const GererUnIngredient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint();

  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    nutrition: true,
  });

  // Store Zustand
  const {
    originalIngredient,
    editedIngredient,
    hasChanges,
    isSubmitting,
    initializeIngredient,
    updateField,
    resetToOriginal,
    setSubmitting,
    cleanup,
  } = useEditIngredientStore();

  // Groupes d'ingrédients disponibles
  const groupesIngredients = [
    "Fruits",
    "Légumes",
    "Viandes",
    "Poissons",
    "Produits laitiers",
    "Céréales",
    "Légumineuses",
    "Épices",
    "Condiments",
    "Huiles",
    "Autres",
  ];

  // Charger l'ingrédient au montage
  useEffect(() => {
    loadIngredient();
    return () => cleanup();
  }, [id]);

  const loadIngredient = async () => {
    try {
      setLoading(true);

      const ingredientsDoc = await getDoc(doc(db, "ingredients", "liste"));
      if (ingredientsDoc.exists()) {
        const ingredients = ingredientsDoc.data().ingredients || [];
        const ingredient = ingredients.find((i) => i.id === id);

        if (ingredient) {
          initializeIngredient(ingredient);
        } else {
          toast.error("Ingrédient introuvable");
          navigate("/admin/ingredients");
          return;
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("Aucune modification à sauvegarder");
      return;
    }

    // Validation basique
    if (!editedIngredient.denomination?.trim()) {
      toast.error("La dénomination est requise");
      return;
    }

    if (!editedIngredient.groupe?.trim()) {
      toast.error("Le groupe est requis");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateIngredient(
        editedIngredient.id,
        editedIngredient
      );

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Ingrédient mis à jour avec succès</span>
          </div>
        );
        initializeIngredient(editedIngredient); // Réinitialiser avec les nouvelles valeurs
      } else {
        if (result.isDuplicate) {
          toast.error("Un ingrédient avec cette combinaison existe déjà");
        } else {
          toast.error("Erreur lors de la mise à jour");
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle section mobile
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 },
    },
  };

  // Composant Field réutilisable
  const EditableField = ({
    label,
    value,
    onChange,
    icon: Icon,
    type = "text",
    options = null,
    placeholder = "",
  }) => (
    <motion.div variants={itemVariants} className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Choisir...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              type === "number"
                ? parseFloat(e.target.value) || 0
                : e.target.value
            )
          }
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-md border border-input bg-background
                   focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </motion.div>
  );

  // Section Card Mobile
  const MobileSectionCard = ({ title, icon: Icon, section, children }) => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-card rounded-lg border border-border overflow-hidden">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => toggleSection(section)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {expandedSections[section] ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </motion.button>

      <AnimatePresence>
        {expandedSections[section] && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Vue Mobile
  const MobileView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24">
      {/* En-tête fixe */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/admin/ingredients")}
            className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="font-semibold text-lg">Modifier l'ingrédient</h1>

          {hasChanges && (
            <button
              onClick={resetToOriginal}
              className="p-2 hover:bg-muted rounded-md">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {hasChanges && (
          <div className="px-4 py-2 bg-accent/10 text-accent text-sm text-center">
            Modifications non sauvegardées
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        {/* Section Informations générales */}
        <MobileSectionCard
          title="Informations générales"
          icon={Info}
          section="general">
          <EditableField
            label="Dénomination"
            value={editedIngredient?.denomination || ""}
            onChange={(value) => updateField("denomination", value)}
            icon={Beaker}
            placeholder="Nom de l'ingrédient"
          />

          <EditableField
            label="Groupe"
            value={editedIngredient?.groupe || ""}
            onChange={(value) => updateField("groupe", value)}
            icon={Layers}
            options={groupesIngredients}
          />

          <EditableField
            label="Emoji"
            value={editedIngredient?.emoji || ""}
            onChange={(value) => updateField("emoji", value)}
            icon={Smile}
            placeholder="🍎"
          />
        </MobileSectionCard>

        {/* Section Nutrition */}
        <MobileSectionCard title="Nutrition" icon={Zap} section="nutrition">
          <EditableField
            label="Calories (kcal pour 100g)"
            value={editedIngredient?.calories || 0}
            onChange={(value) => updateField("calories", value)}
            icon={Zap}
            type="number"
            placeholder="0"
          />

          <div className="p-3 bg-accent/10 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valeur calorique</span>
              <span className="text-lg font-bold text-accent">
                {editedIngredient?.calories || 0} kcal
              </span>
            </div>
          </div>
        </MobileSectionCard>
      </div>

      {/* Boutons d'action fixes */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/ingredients")}
            className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-md
                     font-medium flex items-center justify-center gap-2">
            <X className="h-4 w-4" />
            Annuler
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-md
                     font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/ingredients")}
                className="p-2 hover:bg-muted rounded-md">
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Modifier l'ingrédient
                </h1>
                <p className="text-muted-foreground">
                  {originalIngredient?.denomination}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <>
                  <span className="text-sm text-accent flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Modifications non sauvegardées
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetToOriginal}
                    className="px-4 py-2 bg-muted text-foreground rounded-md
                             font-medium flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser
                  </motion.button>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={!hasChanges || isSubmitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md
                         font-medium disabled:opacity-50 flex items-center gap-2">
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
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informations générales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField
                  label="Dénomination"
                  value={editedIngredient?.denomination || ""}
                  onChange={(value) => updateField("denomination", value)}
                  icon={Beaker}
                  placeholder="Nom de l'ingrédient"
                />

                <EditableField
                  label="Groupe"
                  value={editedIngredient?.groupe || ""}
                  onChange={(value) => updateField("groupe", value)}
                  icon={Layers}
                  options={groupesIngredients}
                />

                <EditableField
                  label="Emoji"
                  value={editedIngredient?.emoji || ""}
                  onChange={(value) => updateField("emoji", value)}
                  icon={Smile}
                  placeholder="🍎"
                />
              </div>
            </motion.div>

            {/* Section Nutrition */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Valeurs nutritionnelles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField
                  label="Calories (kcal pour 100g)"
                  value={editedIngredient?.calories || 0}
                  onChange={(value) => updateField("calories", value)}
                  icon={Zap}
                  type="number"
                  placeholder="0"
                />

                <div className="p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-accent" />
                      <span className="font-medium">Valeur calorique</span>
                    </div>
                    <span className="text-2xl font-bold text-accent">
                      {editedIngredient?.calories || 0} kcal
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Aperçu */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Aperçu
              </h3>

              <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
                <div className="text-6xl mb-4">
                  {editedIngredient?.emoji || "🍴"}
                </div>
                <h4 className="text-xl font-bold text-foreground text-center">
                  {editedIngredient?.denomination || "Sans nom"}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {editedIngredient?.groupe || "Sans groupe"}
                </p>
              </div>
            </motion.div>

            {/* Résumé */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Résumé
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span
                    className={`font-medium ${
                      editedIngredient?.actif
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}>
                    {editedIngredient?.actif !== false ? "Actif" : "Désactivé"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Groupe</span>
                  <span className="font-medium">
                    {editedIngredient?.groupe || "Non défini"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calories</span>
                  <span className="font-medium text-accent">
                    {editedIngredient?.calories || 0} kcal
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emoji</span>
                  <span className="text-xl">
                    {editedIngredient?.emoji || "❌"}
                  </span>
                </div>
              </div>

              {hasChanges && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-accent">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Des modifications sont en attente
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return <Loader isVisible={loading} text="Chargement de l'ingrédient..." />;
  }

  if (!editedIngredient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Ingrédient introuvable
          </h2>
          <p className="text-muted-foreground mb-4">
            L'ingrédient demandé n'existe pas ou a été supprimé
          </p>
          <button
            onClick={() => navigate("/admin/ingredients")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                     font-medium">
            Retour aux ingrédients
          </button>
        </div>
      </div>
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

export default GererUnIngredient;
