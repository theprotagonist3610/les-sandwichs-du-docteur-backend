// components/GererUneBoisson.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import useBreakpoint from "@/hooks/useBreakpoint";
import Loader from "@/components/loaders/Loader";
import { updateBoisson } from "@/toolkits/boissonToolkit";
import useEditBoissonStore from "@/stores/useEditBoissonStore";
import { toast } from "sonner";
import {
  Coffee,
  Package,
  Droplet,
  DollarSign,
  FlaskConical,
  Zap,
  Image,
  Save,
  X,
  Plus,
  Trash2,
  Tag,
  Layers,
  Edit3,
  Check,
  RotateCcw,
  AlertCircle,
  Info,
  Beaker,
  ArrowLeft,
  Camera,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

const GererUneBoisson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint();

  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    prix: true,
    ingredients: true,
    image: true,
    nutrition: true,
  });

  const {
    originalBoisson,
    editedBoisson,
    hasChanges,
    isSubmitting,
    availableIngredients,
    initializeBoisson,
    updateField,
    addIngredient,
    removeIngredient,
    updateIngredientQuantity,
    setAvailableIngredients,
    setSubmitting,
    resetToOriginal,
    cleanup,
  } = useEditBoissonStore();

  // Récipients et unités disponibles
  const recipients = [
    "Canette",
    "Bouteille",
    "Petit pot",
    "Grand pot",
    "Verre",
    "Tasse",
  ];
  const unites = [
    { nom: "mililitres", symbole: "ml" },
    { nom: "litres", symbole: "l" },
    { nom: "centilitres", symbole: "cl" },
  ];

  // Charger la boisson et les ingrédients au montage
  useEffect(() => {
    loadData();
    return () => cleanup();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger la boisson
      const boissonDoc = await getDoc(doc(db, "boissons", "liste"));
      if (boissonDoc.exists()) {
        const boissons = boissonDoc.data().boissons || [];
        const boisson = boissons.find((b) => b.id === id);

        if (boisson) {
          initializeBoisson(boisson);
        } else {
          toast.error("Boisson introuvable");
          navigate("/admin/boissons");
          return;
        }
      }

      // Charger les ingrédients disponibles
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
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("Aucune modification à sauvegarder");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateBoisson(editedBoisson.id, editedBoisson);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Boisson mise à jour avec succès</span>
          </div>
        );
        initializeBoisson(editedBoisson); // Réinitialiser avec les nouvelles valeurs
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculer les calories totales
  const calculateTotalCalories = useCallback(() => {
    if (!editedBoisson?.ingredients) return editedBoisson?.calories || 0;

    const ingredientCalories = editedBoisson.ingredients.reduce(
      (total, ing) => {
        return total + (ing.valeur_calorique || 0) * (ing.quantite || 0);
      },
      0
    );

    return (editedBoisson.calories || 0) + ingredientCalories;
  }, [editedBoisson]);

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

  // Composant pour gérer les ingrédients - Mémorisé pour éviter les rerenders
  const IngredientsManager = React.memo(() => {
    const [localIngredientSearch, setLocalIngredientSearch] = useState("");
    const [localShowDropdown, setLocalShowDropdown] = useState(false);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const dropdownTimeoutRef = useRef(null);

    // Nettoyer le timeout au démontage
    useEffect(() => {
      return () => {
        if (dropdownTimeoutRef.current) {
          clearTimeout(dropdownTimeoutRef.current);
        }
      };
    }, []);

    // Filtrer les ingrédients localement
    const localFilteredIngredients = useMemo(() => {
      if (!localIngredientSearch) return [];

      return availableIngredients.filter(
        (ing) =>
          ing.denomination
            .toLowerCase()
            .includes(localIngredientSearch.toLowerCase()) &&
          !editedBoisson?.ingredients?.find(
            (existing) => existing.denomination === ing.denomination
          )
      );
    }, [
      localIngredientSearch,
      availableIngredients,
      editedBoisson?.ingredients,
    ]);

    // Handler pour l'ajout d'ingrédient
    const handleAddIngredientLocal = useCallback(
      (ingredient) => {
        addIngredient(ingredient);
        setLocalIngredientSearch("");
        setLocalShowDropdown(false);
        searchInputRef.current?.focus();
      },
      [addIngredient]
    );

    // Handler pour le focus
    const handleFocus = useCallback(() => {
      setLocalShowDropdown(true);
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    }, []);

    // Handler pour le blur avec délai
    const handleBlur = useCallback(() => {
      dropdownTimeoutRef.current = setTimeout(() => {
        setLocalShowDropdown(false);
      }, 200); // Délai pour permettre le clic sur le dropdown
    }, []);

    // Handler pour le changement de recherche
    const handleSearchChange = useCallback((e) => {
      setLocalIngredientSearch(e.target.value);
      setLocalShowDropdown(true);
    }, []);

    return (
      <div className="space-y-4">
        {/* Recherche et ajout d'ingrédient */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={localIngredientSearch}
                onChange={handleSearchChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Rechercher un ingrédient..."
                className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-background
                         focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Dropdown des ingrédients */}
          <AnimatePresence>
            {localShowDropdown &&
              localIngredientSearch &&
              localFilteredIngredients.length > 0 && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto
                         bg-card border border-border rounded-md shadow-lg z-10"
                  onMouseDown={(e) => e.preventDefault()} // Empêche la perte de focus
                >
                  {localFilteredIngredients.map((ing) => (
                    <motion.button
                      key={ing.denomination}
                      whileHover={{
                        backgroundColor: "rgb(var(--muted) / 0.5)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddIngredientLocal(ing)}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between">
                      <span className="text-sm">{ing.denomination}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {ing.valeur_calorique && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {ing.valeur_calorique} kcal
                          </span>
                        )}
                        {ing.symbole && <span>{ing.symbole}</span>}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        {/* Liste des ingrédients actuels */}
        <div className="space-y-2">
          <AnimatePresence>
            {editedBoisson?.ingredients?.map((ingredient) => (
              <IngredientItem
                key={ingredient.id}
                ingredient={ingredient}
                onQuantityChange={updateIngredientQuantity}
                onRemove={removeIngredient}
              />
            ))}
          </AnimatePresence>

          {(!editedBoisson?.ingredients ||
            editedBoisson.ingredients.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun ingrédient ajouté
            </p>
          )}
        </div>
      </div>
    );
  });

  // Composant pour un item d'ingrédient - Mémorisé séparément
  const IngredientItem = React.memo(
    ({ ingredient, onQuantityChange, onRemove }) => {
      const handleQuantityChange = useCallback(
        (e) => {
          onQuantityChange(ingredient.id, parseFloat(e.target.value) || 0);
        },
        [ingredient.id, onQuantityChange]
      );

      const handleRemove = useCallback(() => {
        onRemove(ingredient.id);
      }, [ingredient.id, onRemove]);

      return (
        <motion.div
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Beaker className="h-4 w-4 text-muted-foreground flex-shrink-0" />

          <div className="flex-1">
            <p className="font-medium text-sm">{ingredient.denomination}</p>
            {ingredient.valeur_calorique && (
              <p className="text-xs text-muted-foreground">
                {ingredient.valeur_calorique} kcal {ingredient.symbole || ""}
              </p>
            )}
          </div>

          <input
            type="number"
            value={ingredient.quantite || 0}
            onChange={handleQuantityChange}
            className="w-20 px-2 py-1 text-sm rounded border border-input bg-background
                   focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Qté"
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </motion.div>
      );
    }
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
            onClick={() => navigate("/admin/boissons")}
            className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="font-semibold text-lg">Modifier la boisson</h1>

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
            value={editedBoisson?.denomination || ""}
            onChange={(value) => updateField("denomination", value)}
            icon={Tag}
          />

          <EditableField
            label="Catégorie"
            value={editedBoisson?.groupe || ""}
            onChange={(value) => updateField("groupe", value)}
            icon={Layers}
          />

          <EditableField
            label="Récipient"
            value={editedBoisson?.recipient || ""}
            onChange={(value) => updateField("recipient", value)}
            icon={Package}
            options={recipients}
          />
        </MobileSectionCard>

        {/* Section Prix et Volume */}
        <MobileSectionCard
          title="Prix et Volume"
          icon={DollarSign}
          section="prix">
          <EditableField
            label="Prix (FCFA)"
            value={editedBoisson?.prix || 0}
            onChange={(value) => updateField("prix", value)}
            icon={DollarSign}
            type="number"
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <EditableField
                label="Volume"
                value={editedBoisson?.volume || 0}
                onChange={(value) => updateField("volume", value)}
                icon={Droplet}
                type="number"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-foreground mb-2">
                Unité
              </label>
              <select
                value={editedBoisson?.unite?.symbole || "ml"}
                onChange={(e) => {
                  const unite = unites.find(
                    (u) => u.symbole === e.target.value
                  );
                  updateField("unite", unite);
                }}
                className="w-full px-2 py-2 rounded-md border border-input bg-background
                         focus:outline-none focus:ring-2 focus:ring-ring">
                {unites.map((u) => (
                  <option key={u.symbole} value={u.symbole}>
                    {u.symbole}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </MobileSectionCard>

        {/* Section Ingrédients */}
        <MobileSectionCard
          title="Ingrédients"
          icon={FlaskConical}
          section="ingredients">
          <IngredientsManager />
        </MobileSectionCard>

        {/* Section Image */}
        <MobileSectionCard title="Image" icon={Camera} section="image">
          <EditableField
            label="URL de l'image"
            value={editedBoisson?.imgURL || ""}
            onChange={(value) => updateField("imgURL", value)}
            icon={Image}
          />

          {editedBoisson?.imgURL && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3">
              <img
                src={editedBoisson.imgURL}
                alt="Aperçu"
                className="h-40 w-full object-contain rounded-lg bg-muted"
                onError={(e) => (e.target.style.display = "none")}
              />
            </motion.div>
          )}
        </MobileSectionCard>

        {/* Section Nutrition */}
        <MobileSectionCard title="Nutrition" icon={Zap} section="nutrition">
          <EditableField
            label="Calories de base"
            value={editedBoisson?.calories || 0}
            onChange={(value) => updateField("calories", value)}
            icon={Zap}
            type="number"
          />

          <div className="p-3 bg-accent/10 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Calories totales</span>
              <span className="text-lg font-bold text-accent">
                {calculateTotalCalories()} kcal
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
            onClick={() => navigate("/admin/boissons")}
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
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/boissons")}
                className="p-2 hover:bg-muted rounded-md">
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Modifier la boisson
                </h1>
                <p className="text-muted-foreground">
                  {originalBoisson?.denomination}
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
                  value={editedBoisson?.denomination || ""}
                  onChange={(value) => updateField("denomination", value)}
                  icon={Tag}
                />

                <EditableField
                  label="Catégorie"
                  value={editedBoisson?.groupe || ""}
                  onChange={(value) => updateField("groupe", value)}
                  icon={Layers}
                />

                <EditableField
                  label="Récipient"
                  value={editedBoisson?.recipient || ""}
                  onChange={(value) => updateField("recipient", value)}
                  icon={Package}
                  options={recipients}
                />

                <EditableField
                  label="Prix (FCFA)"
                  value={editedBoisson?.prix || 0}
                  onChange={(value) => updateField("prix", value)}
                  icon={DollarSign}
                  type="number"
                />
              </div>
            </motion.div>

            {/* Section Volume et Nutrition */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Volume et Nutrition
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 flex gap-2">
                  <div className="flex-1">
                    <EditableField
                      label="Volume"
                      value={editedBoisson?.volume || 0}
                      onChange={(value) => updateField("volume", value)}
                      icon={Droplet}
                      type="number"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-foreground mb-2 mt-7">
                      Unité
                    </label>
                    <select
                      value={editedBoisson?.unite?.symbole || "ml"}
                      onChange={(e) => {
                        const unite = unites.find(
                          (u) => u.symbole === e.target.value
                        );
                        updateField("unite", unite);
                      }}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background
                               focus:outline-none focus:ring-2 focus:ring-ring">
                      {unites.map((u) => (
                        <option key={u.symbole} value={u.symbole}>
                          {u.symbole}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <EditableField
                  label="Calories de base"
                  value={editedBoisson?.calories || 0}
                  onChange={(value) => updateField("calories", value)}
                  icon={Zap}
                  type="number"
                />
              </div>

              <div className="mt-4 p-4 bg-accent/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-accent" />
                    <span className="font-medium">Calories totales</span>
                    <span className="text-sm text-muted-foreground">
                      (Base + Ingrédients)
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-accent">
                    {calculateTotalCalories()} kcal
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Section Ingrédients */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
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
              initial="hidden"
              animate="visible"
              className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Image du produit
              </h3>

              {editedBoisson?.imgURL ? (
                <div className="space-y-4">
                  <img
                    src={editedBoisson.imgURL}
                    alt="Aperçu"
                    className="h-48 w-full object-contain rounded-lg bg-muted"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <EditableField
                    label="URL de l'image"
                    value={editedBoisson.imgURL}
                    onChange={(value) => updateField("imgURL", value)}
                    icon={Image}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-48 w-full rounded-lg bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <EditableField
                    label="URL de l'image"
                    value=""
                    onChange={(value) => updateField("imgURL", value)}
                    icon={Image}
                  />
                </div>
              )}
            </motion.div>

            {/* Résumé des modifications */}
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
                      editedBoisson?.actif
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}>
                    {editedBoisson?.actif ? "Active" : "Désactivée"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix</span>
                  <span className="font-medium">
                    {editedBoisson?.prix || 0} FCFA
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">
                    {editedBoisson?.volume || 0}{" "}
                    {editedBoisson?.unite?.symbole || "ml"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingrédients</span>
                  <span className="font-medium">
                    {editedBoisson?.ingredients?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Calories totales
                  </span>
                  <span className="font-medium text-accent">
                    {calculateTotalCalories()} kcal
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
    return <Loader isVisible={loading} text="Chargement de la boisson..." />;
  }

  if (!editedBoisson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Boisson introuvable
          </h2>
          <p className="text-muted-foreground mb-4">
            La boisson demandée n'existe pas ou a été supprimée
          </p>
          <button
            onClick={() => navigate("/admin/boissons")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                     font-medium">
            Retour aux boissons
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

export default GererUneBoisson;
