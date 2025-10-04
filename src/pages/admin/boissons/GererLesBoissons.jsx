import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  useBoissons,
  desactiverBoisson,
  reactiverBoisson,
} from "@/toolkits/boissonToolkit";
import { toast } from "sonner";
import {
  Coffee,
  Package,
  Droplet,
  DollarSign,
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
  Image,
  Tag,
  Layers,
  AlertCircle,
  RefreshCw,
  Archive,
  MoreVertical,
  Eye,
} from "lucide-react";

// Composants extraits pour éviter la perte de focus
const MobileListItem = ({
  boisson,
  processingId,
  showActions,
  setShowActions,
  handleNavigate,
  handleToggleStatus,
  getGroupIcon,
}) => {
  const Icon = getGroupIcon(boisson.groupe);
  const isProcessing = processingId === boisson.id;
  const isShowingActions = showActions === boisson.id;

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

  return (
    <motion.div
      layout
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-lg border border-border p-4 mb-3"
      onClick={() => handleNavigate(boisson.id)}>
      <div className="flex items-start gap-3">
        {/* Icône et statut */}
        <div
          className={`
          p-2 rounded-lg
          ${boisson.actif ? "bg-primary/10" : "bg-muted"}
        `}>
          <Icon
            className={`
            h-5 w-5
            ${boisson.actif ? "text-primary" : "text-muted-foreground"}
          `}
          />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {boisson.denomination}
              </h3>
              <p className="text-sm text-muted-foreground">
                {boisson.recipient} • {boisson.volume}{" "}
                {boisson.unite?.symbole || "ml"}
              </p>
            </div>

            {/* Menu actions */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(isShowingActions ? null : boisson.id);
              }}
              className="p-1.5 rounded-md hover:bg-muted">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Informations supplémentaires */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {boisson.prix} FCFA
            </span>
            {boisson.ingredients?.length > 0 && (
              <span className="flex items-center gap-1">
                <FlaskConical className="h-3 w-3" />
                {boisson.ingredients.length} ingr.
              </span>
            )}
            {boisson.calories > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {boisson.calories} kcal
              </span>
            )}
          </div>

          {/* Catégorie */}
          {boisson.groupe && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                <Layers className="h-3 w-3" />
                {boisson.groupe}
              </span>
            </div>
          )}
        </div>

        {/* Image */}
        {boisson.imgURL && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={boisson.imgURL}
            alt={boisson.denomination}
            className="w-16 h-16 object-contain rounded-md bg-muted"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}
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
              onClick={(e) => handleToggleStatus(boisson, e)}
              disabled={isProcessing}
              className={`
                flex-1 px-3 py-2 rounded-md font-medium text-sm
                flex items-center justify-center gap-2
                ${
                  boisson.actif
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }
                disabled:opacity-50
              `}>
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : boisson.actif ? (
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
              onClick={() => handleNavigate(boisson.id)}
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
};

const DesktopCard = ({
  boisson,
  processingId,
  handleNavigate,
  handleToggleStatus,
  getGroupIcon,
}) => {
  const Icon = getGroupIcon(boisson.groupe);
  const isProcessing = processingId === boisson.id;

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
      onClick={() => handleNavigate(boisson.id)}>
      {/* Badge de statut */}
      <div className="absolute top-4 right-4">
        {boisson.actif ? (
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
          ${boisson.actif ? "bg-primary/10" : "bg-muted"}
        `}>
          <Icon
            className={`
            h-6 w-6
            ${boisson.actif ? "text-primary" : "text-muted-foreground"}
          `}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">
            {boisson.denomination}
          </h3>
          <p className="text-sm text-muted-foreground">
            {boisson.recipient} • {boisson.volume}{" "}
            {boisson.unite?.symbole || "ml"}
          </p>
        </div>
      </div>

      {/* Image */}
      {boisson.imgURL && (
        <div className="relative h-32 mb-4 -mx-5 px-5 bg-gradient-to-b from-muted/20 to-transparent">
          <img
            src={boisson.imgURL}
            alt={boisson.denomination}
            className="h-full w-full object-contain"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}

      {/* Informations détaillées */}
      <div className="space-y-3">
        {/* Prix */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Prix</span>
          <span className="font-semibold text-primary">
            {boisson.prix} FCFA
          </span>
        </div>

        {/* Ingrédients et Calories */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {boisson.ingredients?.length || 0}
              </span>
              <span className="text-muted-foreground">ingr.</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{boisson.calories || 0}</span>
              <span className="text-muted-foreground">kcal</span>
            </div>
          </div>
        </div>

        {/* Catégorie */}
        {boisson.groupe && (
          <div className="pt-3 border-t border-border">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                           bg-accent/10 text-accent text-sm rounded-full font-medium">
              <Layers className="h-3.5 w-3.5" />
              {boisson.groupe}
            </span>
          </div>
        )}
      </div>

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
            handleNavigate(boisson.id);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                   font-medium flex items-center gap-2">
          <Edit3 className="h-4 w-4" />
          Modifier
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => handleToggleStatus(boisson, e)}
          disabled={isProcessing}
          className={`
            px-4 py-2 rounded-md font-medium
            flex items-center gap-2 disabled:opacity-50
            ${
              boisson.actif
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground"
            }
          `}>
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : boisson.actif ? (
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
};

const MobileView = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  activeTab,
  setActiveTab,
  categories,
  boissonsActives,
  boissonsInactives,
  filteredActives,
  filteredInactives,
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background">
      {/* En-tête fixe */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground mb-3">
            Gérer les boissons
          </h1>

          {/* Barre de recherche */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une boisson..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-card
                       focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Filtre par catégorie */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory("all")}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}>
              Toutes ({boissonsActives.length + boissonsInactives.length})
            </motion.button>
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                  ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }
                `}>
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-t border-border">
          <button
            onClick={() => setActiveTab("actives")}
            className={`
              flex-1 py-3 text-sm font-medium relative
              ${
                activeTab === "actives"
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            `}>
            Activées ({filteredActives.length})
            {activeTab === "actives" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("inactives")}
            className={`
              flex-1 py-3 text-sm font-medium relative
              ${
                activeTab === "inactives"
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            `}>
            Désactivées ({filteredInactives.length})
            {activeTab === "inactives" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>
      </div>

      {/* Liste des boissons */}
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
              {activeTab === "actives" ? (
                filteredActives.length > 0 ? (
                  filteredActives.map((boisson) => (
                    <MobileListItem
                      key={boisson.id}
                      boisson={boisson}
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
                    <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucune boisson active trouvée
                    </p>
                  </motion.div>
                )
              ) : filteredInactives.length > 0 ? (
                filteredInactives.map((boisson) => (
                  <MobileListItem
                    key={boisson.id}
                    boisson={boisson}
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
                    Aucune boisson désactivée
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const DesktopView = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  activeTab,
  setActiveTab,
  categories,
  boissonsActives,
  boissonsInactives,
  filteredActives,
  filteredInactives,
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gestion des boissons
              </h1>
              <p className="text-muted-foreground mt-1">
                {boissonsActives.length + boissonsInactives.length} boissons au
                total
              </p>
            </div>

            {/* Statistiques rapides */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {boissonsActives.length}
                </p>
                <p className="text-sm text-muted-foreground">Activées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {boissonsInactives.length}
                </p>
                <p className="text-sm text-muted-foreground">Désactivées</p>
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background
                       focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="actives" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Activées ({filteredActives.length})
            </TabsTrigger>
            <TabsTrigger value="inactives" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Désactivées ({filteredInactives.length})
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
                <TabsContent value="actives">
                  {filteredActives.length > 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredActives.map((boisson) => (
                        <DesktopCard
                          key={boisson.id}
                          boisson={boisson}
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
                      <Coffee className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Aucune boisson active trouvée
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm || selectedCategory !== "all"
                          ? "Essayez de modifier vos filtres"
                          : "Commencez par ajouter des boissons"}
                      </p>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="inactives">
                  {filteredInactives.length > 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredInactives.map((boisson) => (
                        <DesktopCard
                          key={boisson.id}
                          boisson={boisson}
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
                        Aucune boisson désactivée
                      </h3>
                      <p className="text-muted-foreground">
                        Les boissons désactivées apparaîtront ici
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
};

const GererLesBoissons = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  const { boissonsActives, boissonsInactives, loading, error } = useBoissons();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("actives");
  const [processingId, setProcessingId] = useState(null);
  const [showActions, setShowActions] = useState(null);

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const allBoissons = [...boissonsActives, ...boissonsInactives];
    return [...new Set(allBoissons.map((b) => b.groupe).filter(Boolean))];
  }, [boissonsActives, boissonsInactives]);

  // Filtrer les boissons
  const filterBoissons = (boissons) => {
    return boissons.filter((boisson) => {
      const matchesSearch = boisson.denomination
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || boisson.groupe === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredActives = filterBoissons(boissonsActives);
  const filteredInactives = filterBoissons(boissonsInactives);

  // Gérer la désactivation/réactivation
  const handleToggleStatus = async (boisson, e) => {
    e.stopPropagation();
    setProcessingId(boisson.id);

    try {
      const action = boisson.actif ? desactiverBoisson : reactiverBoisson;
      const result = await action(boisson.id);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            {boisson.actif ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            <span>
              {boisson.denomination}{" "}
              {boisson.actif ? "désactivée" : "réactivée"} avec succès
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
  };

  // Navigation vers la page de détail
  const handleNavigate = (boissonId) => {
    navigate(`/admin/boissons/boissons/${boissonId}`);
  };

  // Obtenir l'icône selon le groupe
  const getGroupIcon = (groupe) => {
    const groupeLower = (groupe || "").toLowerCase();
    if (groupeLower.includes("yaourt")) return Droplet;
    if (groupeLower.includes("jus")) return Package;
    return Coffee;
  };

  // Props communes pour les composants
  const commonProps = {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    activeTab,
    setActiveTab,
    categories,
    boissonsActives,
    boissonsInactives,
    filteredActives,
    filteredInactives,
    loading,
    error,
    processingId,
    showActions,
    setShowActions,
    handleNavigate,
    handleToggleStatus,
    getGroupIcon,
  };

  return isMobile ? (
    <MobileView {...commonProps} />
  ) : (
    <DesktopView {...commonProps} />
  );
};

export default GererLesBoissons;
