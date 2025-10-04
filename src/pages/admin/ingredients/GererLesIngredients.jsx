import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  useIngredients,
  desactiverIngredient,
  reactiverIngredient,
} from "@/toolkits/ingredientToolkit";
import { toast } from "sonner";
import {
  FlaskConical,
  Zap,
  Edit3,
  Power,
  PowerOff,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  AlertCircle,
  RefreshCw,
  Archive,
  MoreVertical,
  Eye,
  FileText,
  Hash,
  Info,
  Apple,
  Carrot,
  Beef,
  Fish,
  Spade,
  Leaf,
} from "lucide-react";

// Composants extraits pour éviter la perte de focus - Mémorisés
const MobileListItem = React.memo(
  ({
    ingredient,
    processingId,
    showActions,
    setShowActions,
    handleNavigate,
    handleToggleStatus,
    getGroupIcon,
  }) => {
    const Icon = getGroupIcon(ingredient.groupe);
    const isProcessing = processingId === ingredient.id;
    const isShowingActions = showActions === ingredient.id;

    const listItemVariants = {
      hidden: { opacity: 0, x: -20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3 },
      },
      exit: {
        opacity: 0,
        x: 20,
        transition: { duration: 0.2 },
      },
    };

    const handleActionsToggle = useCallback(
      (e) => {
        e.stopPropagation();
        setShowActions(isShowingActions ? null : ingredient.id);
      },
      [isShowingActions, ingredient.id, setShowActions]
    );

    const handleNavigateClick = useCallback(() => {
      handleNavigate(ingredient.id);
    }, [ingredient.id, handleNavigate]);

    const handleStatusToggle = useCallback(
      (e) => {
        handleToggleStatus(ingredient, e);
      },
      [ingredient, handleToggleStatus]
    );

    return (
      <motion.div
        layout
        variants={listItemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileTap={{ scale: 0.98 }}
        className="bg-card rounded-lg border border-border p-4 mb-3"
        onClick={handleNavigateClick}>
        <div className="flex items-start gap-3">
          {/* Icône et statut */}
          <div
            className={`
          p-2 rounded-lg
          ${ingredient.actif ? "bg-primary/10" : "bg-muted"}
        `}>
            <Icon
              className={`
            h-5 w-5
            ${ingredient.actif ? "text-primary" : "text-muted-foreground"}
          `}
            />
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {ingredient.emoji && (
                    <span className="text-lg">{ingredient.emoji}</span>
                  )}
                  <h3 className="font-semibold text-foreground truncate">
                    {ingredient.denomination}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {ingredient.groupe}
                </p>
              </div>

              {/* Menu actions */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleActionsToggle}
                className="p-1.5 rounded-md hover:bg-muted">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Calories */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {ingredient.calories} kcal/100g
              </span>
            </div>

            {/* Groupe */}
            {ingredient.groupe && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                  <Layers className="h-3 w-3" />
                  {ingredient.groupe}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        <AnimatePresence>
          {isShowingActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-border flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStatusToggle}
                disabled={isProcessing}
                className={`
                flex-1 px-3 py-2 rounded-md font-medium text-sm
                flex items-center justify-center gap-2
                ${
                  ingredient.actif
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }
                disabled:opacity-50
              `}>
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : ingredient.actif ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    Réactiver
                  </>
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNavigateClick}
                className="flex-1 px-3 py-2 bg-accent/10 text-accent hover:bg-accent/20
                       rounded-md font-medium text-sm flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" />
                Détails
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

const DesktopCard = React.memo(
  ({
    ingredient,
    processingId,
    handleNavigate,
    handleToggleStatus,
    getGroupIcon,
  }) => {
    const Icon = getGroupIcon(ingredient.groupe);
    const isProcessing = processingId === ingredient.id;

    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
      },
      hover: {
        y: -5,
        transition: { duration: 0.2 },
      },
      tap: { scale: 0.98 },
    };

    const handleNavigateClick = useCallback(() => {
      handleNavigate(ingredient.id);
    }, [ingredient.id, handleNavigate]);

    const handleStatusClick = useCallback(
      (e) => {
        handleToggleStatus(ingredient, e);
      },
      [ingredient, handleToggleStatus]
    );

    return (
      <motion.div
        layout
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover="hover"
        whileTap="tap"
        className="relative bg-card rounded-lg border border-border p-5 cursor-pointer
                 hover:shadow-lg transition-shadow overflow-hidden group"
        onClick={handleNavigateClick}>
        {/* Badge de statut */}
        <div className="absolute top-4 right-4">
          {ingredient.actif ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* En-tête avec icône */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`
          p-2.5 rounded-lg
          ${ingredient.actif ? "bg-primary/10" : "bg-muted"}
        `}>
            <Icon
              className={`
            h-6 w-6
            ${ingredient.actif ? "text-primary" : "text-muted-foreground"}
          `}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {ingredient.emoji && (
                <span className="text-2xl">{ingredient.emoji}</span>
              )}
              <h3 className="font-semibold text-lg text-foreground truncate">
                {ingredient.denomination}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">{ingredient.groupe}</p>
          </div>
        </div>

        {/* Informations nutritionnelles */}
        <div className="space-y-3 mb-4">
          {/* Calories */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Calories</span>
            <span className="font-semibold text-accent">
              {ingredient.calories} kcal/100g
            </span>
          </div>

          {/* Catégorie nutritionnelle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valeur</span>
            <span
              className={`text-sm font-medium ${
                ingredient.calories >= 300
                  ? "text-red-500"
                  : ingredient.calories >= 100
                  ? "text-orange-500"
                  : ingredient.calories >= 50
                  ? "text-yellow-500"
                  : ingredient.calories >= 20
                  ? "text-blue-500"
                  : "text-green-500"
              }`}>
              {ingredient.calories >= 300
                ? "Très élevé"
                : ingredient.calories >= 100
                ? "Élevé"
                : ingredient.calories >= 50
                ? "Modéré"
                : ingredient.calories >= 20
                ? "Faible"
                : "Très faible"}
            </span>
          </div>
        </div>

        {/* Groupe */}
        {ingredient.groupe && (
          <div className="pt-3 border-t border-border">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                         bg-muted/50 text-foreground text-sm rounded-full font-medium">
              <Layers className="h-3.5 w-3.5" />
              {ingredient.groupe}
            </span>
          </div>
        )}

        {/* Actions au survol */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-background/95 backdrop-blur-sm
                   flex items-center justify-center gap-3 opacity-0 
                   group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateClick();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                   font-medium flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Modifier
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStatusClick}
            disabled={isProcessing}
            className={`
            px-4 py-2 rounded-md font-medium
            flex items-center gap-2 disabled:opacity-50
            ${
              ingredient.actif
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground"
            }
          `}>
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : ingredient.actif ? (
              <>
                <PowerOff className="h-4 w-4" />
                Désactiver
              </>
            ) : (
              <>
                <Power className="h-4 w-4" />
                Réactiver
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }
);

// Vues principales mémorisées
const MobileView = React.memo(
  ({
    searchTerm,
    setSearchTerm,
    selectedGroup,
    setSelectedGroup,
    activeTab,
    setActiveTab,
    groupes,
    ingredientsActifs,
    ingredientsInactifs,
    filteredActifs,
    filteredInactifs,
    loading,
    error,
    processingId,
    showActions,
    setShowActions,
    handleNavigate,
    handleToggleStatus,
    getGroupIcon,
  }) => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
        },
      },
    };

    const handleTabChange = useCallback(
      (tab) => {
        setActiveTab(tab);
      },
      [setActiveTab]
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background">
        {/* En-tête fixe */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="p-4">
            <h1 className="text-xl font-bold text-foreground mb-3">
              Gérer les ingrédients
            </h1>

            {/* Barre de recherche */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un ingrédient..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-card
                       focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Filtre par groupe */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGroup("all")}
                className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                ${
                  selectedGroup === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}>
                Tous ({ingredientsActifs.length + ingredientsInactifs.length})
              </motion.button>
              {groupes.map((groupe) => (
                <motion.button
                  key={groupe}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedGroup(groupe)}
                  className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                  ${
                    selectedGroup === groupe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }
                `}>
                  {groupe}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Onglets */}
          <div className="flex border-t border-border">
            <button
              onClick={() => handleTabChange("actifs")}
              className={`
              flex-1 py-3 text-sm font-medium relative
              ${
                activeTab === "actifs"
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            `}>
              Actifs ({filteredActifs.length})
              {activeTab === "actifs" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => handleTabChange("inactifs")}
              className={`
              flex-1 py-3 text-sm font-medium relative
              ${
                activeTab === "inactifs"
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            `}>
              Désactivés ({filteredInactifs.length})
              {activeTab === "inactifs" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>
        </div>

        {/* Liste des ingrédients */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <p className="text-muted-foreground">Erreur de chargement</p>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                variants={containerVariants}
                initial="hidden"
                animate="visible">
                {activeTab === "actifs" ? (
                  filteredActifs.length > 0 ? (
                    filteredActifs.map((ingredient) => (
                      <MobileListItem
                        key={ingredient.id}
                        ingredient={ingredient}
                        processingId={processingId}
                        showActions={showActions}
                        setShowActions={setShowActions}
                        handleNavigate={handleNavigate}
                        handleToggleStatus={handleToggleStatus}
                        getGroupIcon={getGroupIcon}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12">
                      <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        Aucun ingrédient actif trouvé
                      </p>
                    </motion.div>
                  )
                ) : filteredInactifs.length > 0 ? (
                  filteredInactifs.map((ingredient) => (
                    <MobileListItem
                      key={ingredient.id}
                      ingredient={ingredient}
                      processingId={processingId}
                      showActions={showActions}
                      setShowActions={setShowActions}
                      handleNavigate={handleNavigate}
                      handleToggleStatus={handleToggleStatus}
                      getGroupIcon={getGroupIcon}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12">
                    <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucun ingrédient désactivé
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

const DesktopView = React.memo(
  ({
    searchTerm,
    setSearchTerm,
    selectedGroup,
    setSelectedGroup,
    activeTab,
    setActiveTab,
    groupes,
    ingredientsActifs,
    ingredientsInactifs,
    filteredActifs,
    filteredInactifs,
    loading,
    error,
    processingId,
    handleNavigate,
    handleToggleStatus,
    getGroupIcon,
  }) => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
        },
      },
    };

    return (
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Gestion des ingrédients
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {ingredientsActifs.length + ingredientsInactifs.length}{" "}
                    ingrédients au total
                  </p>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {ingredientsActifs.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {ingredientsInactifs.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Désactivés</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">
                    {groupes.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Groupes</p>
                </div>
              </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background
                         focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-background
                       focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="all">Tous les groupes</option>
                {groupes.map((groupe) => (
                  <option key={groupe} value={groupe}>
                    {groupe}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="actifs" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Actifs ({filteredActifs.length})
              </TabsTrigger>
              <TabsTrigger value="inactifs" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Désactivés ({filteredInactifs.length})
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-24">
                  <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24">
                  <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Une erreur est survenue
                  </p>
                </motion.div>
              ) : (
                <>
                  <TabsContent value="actifs">
                    {filteredActifs.length > 0 ? (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredActifs.map((ingredient) => (
                          <DesktopCard
                            key={ingredient.id}
                            ingredient={ingredient}
                            processingId={processingId}
                            handleNavigate={handleNavigate}
                            handleToggleStatus={handleToggleStatus}
                            getGroupIcon={getGroupIcon}
                          />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24">
                        <FlaskConical className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          Aucun ingrédient actif trouvé
                        </h3>
                        <p className="text-muted-foreground">
                          {searchTerm || selectedGroup !== "all"
                            ? "Essayez de modifier vos filtres"
                            : "Commencez par ajouter des ingrédients"}
                        </p>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="inactifs">
                    {filteredInactifs.length > 0 ? (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredInactifs.map((ingredient) => (
                          <DesktopCard
                            key={ingredient.id}
                            ingredient={ingredient}
                            processingId={processingId}
                            handleNavigate={handleNavigate}
                            handleToggleStatus={handleToggleStatus}
                            getGroupIcon={getGroupIcon}
                          />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24">
                        <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          Aucun ingrédient désactivé
                        </h3>
                        <p className="text-muted-foreground">
                          Les ingrédients désactivés apparaîtront ici
                        </p>
                      </motion.div>
                    )}
                  </TabsContent>
                </>
              )}
            </AnimatePresence>
          </Tabs>
        </div>
      </motion.div>
    );
  }
);

const GererLesIngredients = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  const { ingredientsActifs, ingredientsInactifs, loading, error } =
    useIngredients();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [activeTab, setActiveTab] = useState("actifs");
  const [processingId, setProcessingId] = useState(null);
  const [showActions, setShowActions] = useState(null);

  // Extraire les groupes uniques - Mémorisé
  const groupes = useMemo(() => {
    const allIngredients = [...ingredientsActifs, ...ingredientsInactifs];
    return [...new Set(allIngredients.map((i) => i.groupe).filter(Boolean))];
  }, [ingredientsActifs, ingredientsInactifs]);

  // Filtrer les ingrédients - Mémorisé
  const filterIngredients = useCallback(
    (ingredients) => {
      return ingredients.filter((ingredient) => {
        const matchesSearch = ingredient.denomination
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesGroup =
          selectedGroup === "all" || ingredient.groupe === selectedGroup;
        return matchesSearch && matchesGroup;
      });
    },
    [searchTerm, selectedGroup]
  );

  const filteredActifs = useMemo(
    () => filterIngredients(ingredientsActifs),
    [filterIngredients, ingredientsActifs]
  );
  const filteredInactifs = useMemo(
    () => filterIngredients(ingredientsInactifs),
    [filterIngredients, ingredientsInactifs]
  );

  // Gérer la désactivation/réactivation - Mémorisé
  const handleToggleStatus = useCallback(async (ingredient, e) => {
    e.stopPropagation();
    setProcessingId(ingredient.id);

    try {
      const action = ingredient.actif
        ? desactiverIngredient
        : reactiverIngredient;
      const result = await action(ingredient.id);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            {ingredient.actif ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            <span>
              {ingredient.denomination}{" "}
              {ingredient.actif ? "désactivé" : "réactivé"} avec succès
            </span>
          </div>
        );
      } else {
        toast.error("Erreur lors de la modification du statut");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setProcessingId(null);
      setShowActions(null);
    }
  }, []);

  // Navigation vers la page de détail - Mémorisé
  const handleNavigate = useCallback(
    (ingredientId) => {
      navigate(`/admin/ingredients/ingredients/${ingredientId}`);
    },
    [navigate]
  );

  // Obtenir l'icône selon le groupe - Mémorisé
  const getGroupIcon = useCallback((groupe) => {
    const groupeLower = (groupe || "").toLowerCase();
    if (groupeLower.includes("fruit")) return Apple;
    if (groupeLower.includes("légume") || groupeLower.includes("legume"))
      return Carrot;
    if (groupeLower.includes("viande")) return Beef;
    if (groupeLower.includes("poisson")) return Fish;
    if (groupeLower.includes("épice") || groupeLower.includes("epice"))
      return Spade;
    return FlaskConical;
  }, []);

  // Props communes pour les composants - Mémorisées
  const commonProps = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      selectedGroup,
      setSelectedGroup,
      activeTab,
      setActiveTab,
      groupes,
      ingredientsActifs,
      ingredientsInactifs,
      filteredActifs,
      filteredInactifs,
      loading,
      error,
      processingId,
      showActions,
      setShowActions,
      handleNavigate,
      handleToggleStatus,
      getGroupIcon,
    }),
    [
      searchTerm,
      selectedGroup,
      activeTab,
      groupes,
      ingredientsActifs,
      ingredientsInactifs,
      filteredActifs,
      filteredInactifs,
      loading,
      error,
      processingId,
      showActions,
      handleNavigate,
      handleToggleStatus,
      getGroupIcon,
    ]
  );

  return isMobile ? (
    <MobileView {...commonProps} />
  ) : (
    <DesktopView {...commonProps} />
  );
};

export default GererLesIngredients;
