// InitialiserIngredients.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import ingredients from "./liste";
import {
  createIngredientsBatch,
  getAllIngredients,
} from "@/toolkits/ingredientToolkit";
import useBreakpoint from "@/hooks/useBreakpoint";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package2,
  Plus,
  Info,
  ChevronRight,
  Sparkles,
  Upload,
  Hash,
  PackageCheck,
  Apple,
  Carrot,
  Beef,
  Fish,
  Spade,
  FlaskConical,
  Zap,
  DollarSign,
  Leaf,
} from "lucide-react";

const InitialiserIngredients = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [existingIngredients, setExistingIngredients] = useState([]);
  const [initialized, setInitialized] = useState({});
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [activeTab, setActiveTab] = useState("non-enregistres");

  // Charger les ingrédients existants au montage
  useEffect(() => {
    loadExistingIngredients();
  }, []);

  const loadExistingIngredients = useCallback(async () => {
    const result = await getAllIngredients();
    if (result.success) {
      setExistingIngredients(result.data);
      checkInitialized(result.data);
    }
  }, []);

  // Vérifier quels groupes sont déjà initialisés - Mémorisé pour éviter les recalculs
  const checkInitialized = useCallback((existing) => {
    const init = {};
    ingredients.forEach((groupe) => {
      const groupeIngredients = groupe.liste.map((i) => ({
        ...i,
        groupe: groupe.groupe,
      }));

      // Vérifier si tous les ingrédients du groupe existent
      const allExist = groupeIngredients.every((i) =>
        existing.some(
          (ex) => ex.denomination === i.denomination && ex.groupe === i.groupe
        )
      );

      init[groupe.groupe] = {
        initialized: allExist,
        existingCount: groupeIngredients.filter((i) =>
          existing.some(
            (ex) => ex.denomination === i.denomination && ex.groupe === i.groupe
          )
        ).length,
        totalCount: groupeIngredients.length,
      };
    });
    setInitialized(init);
  }, []);

  // Préparer les données d'un groupe pour l'insertion - Mémorisé
  const prepareGroupData = useCallback((groupe) => {
    return groupe.liste.map((ingredient) => ({
      denomination: ingredient.denomination || "Sans nom",
      groupe: groupe.groupe || "Non classé",
      emoji: ingredient.emoji || "",
      calories: ingredient.calories || 0,
    }));
  }, []);

  // Initialiser un groupe spécifique
  const initializeGroup = useCallback(
    async (groupe) => {
      setLoading(true);
      try {
        const ingredientsPrepared = prepareGroupData(groupe);
        const result = await createIngredientsBatch(ingredientsPrepared);

        if (result.success) {
          toast.success(
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Groupe "{groupe.groupe}" initialisé avec succès</span>
            </div>
          );
          await loadExistingIngredients();
        } else {
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>
                Erreur lors de l'initialisation du groupe "{groupe.groupe}"
              </span>
            </div>
          );
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    },
    [prepareGroupData, loadExistingIngredients]
  );

  // Initialiser tous les groupes - Mémorisé
  const initializeAll = useCallback(async () => {
    setLoading(true);
    try {
      let allIngredients = [];

      ingredients
        .filter((groupe) => !initialized[groupe.groupe]?.initialized)
        .forEach((groupe) => {
          const prepared = prepareGroupData(groupe);
          allIngredients = [...allIngredients, ...prepared];
        });

      const result = await createIngredientsBatch(allIngredients);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>
              {result.created} ingrédients créés
              {result.duplicates?.length > 0 &&
                `, ${result.duplicates.length} doublons ignorés`}
            </span>
          </div>
        );
        await loadExistingIngredients();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [initialized, prepareGroupData, loadExistingIngredients]);

  // Toggle sélection d'un groupe - Mémorisé
  const toggleGroupSelection = useCallback((groupeName) => {
    setSelectedGroups((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(groupeName)) {
        newSelection.delete(groupeName);
      } else {
        newSelection.add(groupeName);
      }
      return newSelection;
    });
  }, []);

  // Initialiser les groupes sélectionnés - Mémorisé
  const initializeSelected = useCallback(async () => {
    if (selectedGroups.size === 0) {
      toast.warning("Veuillez sélectionner au moins un groupe");
      return;
    }

    setLoading(true);
    try {
      let allIngredients = [];

      ingredients
        .filter((groupe) => selectedGroups.has(groupe.groupe))
        .forEach((groupe) => {
          const prepared = prepareGroupData(groupe);
          allIngredients = [...allIngredients, ...prepared];
        });

      const result = await createIngredientsBatch(allIngredients);

      if (result.success) {
        toast.success(`${result.created} ingrédients créés`);
        setSelectedGroups(new Set());
        await loadExistingIngredients();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [selectedGroups, prepareGroupData, loadExistingIngredients]);

  // Icônes par groupe - Mémorisé
  const getGroupIcon = useCallback((groupName) => {
    const name = groupName.toLowerCase();
    if (name.includes("fruit")) return Apple;
    if (name.includes("legume")) return Carrot;
    if (name.includes("viande")) return Beef;
    if (name.includes("poisson")) return Fish;
    if (name.includes("epice")) return Spade;
    return FlaskConical;
  }, []);

  // Calculer les statistiques - Mémorisé pour éviter les recalculs
  const stats = useMemo(() => {
    const totalIngredients = ingredients.reduce(
      (sum, g) => sum + g.liste.length,
      0
    );
    const groupesInitialises = Object.values(initialized).filter(
      (i) => i.initialized
    ).length;
    const totalGroups = ingredients.length;

    return {
      totalIngredients,
      groupesInitialises,
      totalGroups,
    };
  }, [initialized]);

  // Séparer les groupes - Mémorisé
  const { groupesNonInitialises, groupesInitialises } = useMemo(() => {
    const nonInit = ingredients.filter(
      (g) => !initialized[g.groupe]?.initialized
    );
    const init = ingredients.filter((g) => initialized[g.groupe]?.initialized);
    return { groupesNonInitialises: nonInit, groupesInitialises: init };
  }, [initialized]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
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

  // Composant Carte de groupe - Mémorisé pour éviter les rerenders
  const GroupCard = React.memo(({ groupe, index }) => {
    const status = initialized[groupe.groupe] || {};
    const isSelected = selectedGroups.has(groupe.groupe);
    const isInitialized = status.initialized;
    const Icon = getGroupIcon(groupe.groupe);

    return (
      <motion.div
        layout
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={{ scale: isInitialized ? 1 : 1.02 }}
        whileTap={{ scale: isInitialized ? 1 : 0.98 }}
        className={`
          relative border rounded-xl p-6 transition-all cursor-pointer overflow-hidden
          ${
            isInitialized
              ? "bg-secondary/50 border-secondary-foreground/20"
              : "bg-card hover:shadow-xl border-border hover:border-accent/50"
          }
          ${isSelected && !isInitialized ? "ring-2 ring-accent shadow-lg" : ""}
        `}
        onClick={() => {
          if (!isInitialized && isDesktop) {
            toggleGroupSelection(groupe.groupe);
          }
        }}>
        {/* Badge de statut */}
        {isInitialized && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </motion.div>
        )}

        {/* En-tête avec icône */}
        <div className="flex items-start gap-4 mb-5">
          <motion.div
            whileHover={{ rotate: 5 }}
            className={`p-3 rounded-lg ${
              isInitialized ? "bg-secondary" : "bg-accent/10"
            }`}>
            <Icon
              className={`h-6 w-6 ${
                isInitialized ? "text-primary" : "text-accent"
              }`}
            />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-foreground mb-1">
              {groupe.groupe}
            </h3>
            <p className="text-sm text-muted-foreground">
              {groupe.liste.length} ingrédient
              {groupe.liste.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Statut détaillé */}
        {status.existingCount > 0 && !isInitialized && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-4 text-sm bg-destructive/10 p-2 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive font-medium">
              {status.existingCount}/{status.totalCount} déjà existants
            </span>
          </motion.div>
        )}

        {/* Aperçu des ingrédients */}
        <div className="space-y-2 mb-5">
          {groupe.liste.slice(0, 3).map((ing, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 text-sm">
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-base">{ing.emoji}</span>
                <span className="font-medium text-foreground truncate">
                  {ing.denomination}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>{ing.calories} kcal</span>
              </div>
            </motion.div>
          ))}
          {groupe.liste.length > 3 && (
            <p className="text-xs text-muted-foreground pl-6 font-medium">
              +{groupe.liste.length - 3} autres ingrédients...
            </p>
          )}
        </div>

        {/* Stats rapides */}
        <div className="flex items-center gap-4 mb-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {groupe.liste.length}
            </span>
            <span className="text-muted-foreground">items</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {Math.round(
                groupe.liste.reduce((sum, i) => sum + i.calories, 0) /
                  groupe.liste.length
              )}
            </span>
            <span className="text-muted-foreground">kcal moy.</span>
          </div>
        </div>

        {/* Bouton d'action mobile */}
        {!isInitialized && isMobile && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              initializeGroup(groupe);
            }}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 text-sm">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>
              {loading ? "Initialisation..." : "Initialiser ce groupe"}
            </span>
          </motion.button>
        )}

        {/* Indicateur de sélection desktop */}
        {isDesktop && !isInitialized && (
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-3 left-3 w-7 h-7 bg-accent rounded-full
                         flex items-center justify-center shadow-md">
                <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    );
  });

  // Vue Mobile - Mémorisée
  const MobileView = React.memo(() => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-xl shadow-md p-5 mb-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Initialisation des Ingrédients
            </h1>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground font-medium">
                Total ingrédients
              </span>
              <span className="font-bold text-foreground">
                {stats.totalIngredients}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground font-medium">
                Groupes initialisés
              </span>
              <span className="font-bold text-foreground">
                {stats.groupesInitialises}/{stats.totalGroups}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Liste des groupes */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4">
          {ingredients.map((groupe, index) => (
            <GroupCard key={groupe.groupe} groupe={groupe} index={index} />
          ))}
        </motion.div>
      </div>
    </motion.div>
  ));

  // Vue Desktop - Mémorisée
  const DesktopView = React.memo(() => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec actions */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-xl shadow-lg p-8 mb-8 border border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-3 bg-primary/10 rounded-xl">
                <FlaskConical className="h-8 w-8 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Gestion des Ingrédients
                </h1>
                <p className="text-muted-foreground">
                  {stats.totalIngredients} ingrédients répartis en{" "}
                  {stats.totalGroups} catégories
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {selectedGroups.size > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={initializeSelected}
                  disabled={loading}
                  className="px-6 py-3 bg-accent text-accent-foreground rounded-lg
                           hover:bg-accent/90 disabled:opacity-50 font-semibold
                           flex items-center gap-2">
                  <PackageCheck className="h-5 w-5" />
                  Initialiser la sélection ({selectedGroups.size})
                </motion.button>
              )}
              {groupesNonInitialises.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={initializeAll}
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg
                           hover:bg-primary/90 disabled:opacity-50 font-semibold
                           flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  <span>Tout initialiser</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs pour séparer les ingrédients */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger
              value="non-enregistres"
              className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Non enregistrés ({groupesNonInitialises.length})
            </TabsTrigger>
            <TabsTrigger
              value="enregistres"
              className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Enregistrés ({groupesInitialises.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="non-enregistres" className="mt-0">
            <AnimatePresence mode="wait">
              {groupesNonInitialises.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Carte d'initialisation complète */}
                  <motion.div
                    variants={cardVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={initializeAll}
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8
                             flex flex-col items-center justify-center min-h-[350px]
                             bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15
                             cursor-pointer transition-all">
                    <Sparkles className="h-14 w-14 text-primary mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Initialisation Complète
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                      Initialiser tous les groupes non enregistrés en une fois
                    </p>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">
                        {groupesNonInitialises.reduce(
                          (sum, g) => sum + g.liste.length,
                          0
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        nouveaux ingrédients
                      </p>
                    </div>
                  </motion.div>

                  {/* Cartes des groupes non initialisés */}
                  {groupesNonInitialises.map((groupe, index) => (
                    <GroupCard
                      key={groupe.groupe}
                      groupe={groupe}
                      index={index}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20">
                  <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Tout est enregistré !
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Tous les ingrédients ont été initialisés avec succès.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="enregistres" className="mt-0">
            <AnimatePresence mode="wait">
              {groupesInitialises.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupesInitialises.map((groupe, index) => (
                    <GroupCard
                      key={groupe.groupe}
                      groupe={groupe}
                      index={index}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20">
                  <Info className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Aucun ingrédient enregistré
                  </h3>
                  <p className="text-muted-foreground text-lg mb-6">
                    Commencez par initialiser des groupes d'ingrédients.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("non-enregistres")}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg
                             hover:bg-primary/90 font-semibold">
                    Voir les ingrédients disponibles
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* Barre de sélection flottante */}
        <AnimatePresence>
          {selectedGroups.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2
                       bg-card rounded-xl shadow-2xl p-4 flex items-center gap-4
                       border border-border">
              <span className="text-foreground font-semibold">
                {selectedGroups.size} groupe
                {selectedGroups.size > 1 ? "s" : ""} sélectionné
                {selectedGroups.size > 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setSelectedGroups(new Set())}
                className="text-muted-foreground hover:text-foreground
                         flex items-center gap-1 font-medium">
                Désélectionner tout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  ));

  return isMobile ? <MobileView /> : <DesktopView />;
};

export default InitialiserIngredients;
