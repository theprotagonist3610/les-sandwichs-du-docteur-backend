import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  useSupplements,
  desactiverSupplement,
  reactiverSupplement,
} from "@/toolkits/supplementToolkit";
import { toast } from "sonner";
import {
  Package2,
  DollarSign,
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
  FileText,
  Hash,
  Info,
  Wifi,
  Heart,
  MessageCircleQuestion,
  Gift,
  CreditCard,
} from "lucide-react";

// Composants extraits pour éviter la perte de focus
const MobileListItem = ({
  supplement,
  processingId,
  showActions,
  setShowActions,
  handleNavigate,
  handleToggleStatus,
  getGroupIcon,
  formatPrice,
}) => {
  const Icon = getGroupIcon(supplement.groupe);
  const isProcessing = processingId === supplement.id;
  const isShowingActions = showActions === supplement.id;

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
      onClick={() => handleNavigate(supplement.id)}>
      <div className="flex items-start gap-3">
        {/* Icône et statut */}
        <div
          className={`
          p-2 rounded-lg
          ${supplement.actif ? "bg-primary/10" : "bg-muted"}
        `}>
          <Icon
            className={`
            h-5 w-5
            ${supplement.actif ? "text-primary" : "text-muted-foreground"}
          `}
          />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {supplement.denomination}
              </h3>
              <p className="text-sm text-muted-foreground">
                {supplement.groupe}
              </p>
            </div>

            {/* Menu actions */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(isShowingActions ? null : supplement.id);
              }}
              className="p-1.5 rounded-md hover:bg-muted">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Description */}
          {supplement.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {supplement.description}
            </p>
          )}

          {/* Prix */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatPrice(supplement.prix)}
            </span>
          </div>

          {/* Groupe */}
          {supplement.groupe && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                <Layers className="h-3 w-3" />
                {supplement.groupe}
              </span>
            </div>
          )}
        </div>

        {/* Image */}
        {supplement.imgURL && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={supplement.imgURL}
            alt={supplement.denomination}
            className="w-16 h-16 object-cover rounded-md bg-muted"
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
              onClick={(e) => handleToggleStatus(supplement, e)}
              disabled={isProcessing}
              className={`
                flex-1 px-3 py-2 rounded-md font-medium text-sm
                flex items-center justify-center gap-2
                ${
                  supplement.actif
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }
                disabled:opacity-50
              `}>
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : supplement.actif ? (
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
              onClick={() => handleNavigate(supplement.id)}
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
  supplement,
  processingId,
  handleNavigate,
  handleToggleStatus,
  getGroupIcon,
  formatPrice,
}) => {
  const Icon = getGroupIcon(supplement.groupe);
  const isProcessing = processingId === supplement.id;

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
      onClick={() => handleNavigate(supplement.id)}>
      {/* Badge de statut */}
      <div className="absolute top-4 right-4">
        {supplement.actif ? (
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
          ${supplement.actif ? "bg-primary/10" : "bg-muted"}
        `}>
          <Icon
            className={`
            h-6 w-6
            ${supplement.actif ? "text-primary" : "text-muted-foreground"}
          `}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">
            {supplement.denomination}
          </h3>
          <p className="text-sm text-muted-foreground">{supplement.groupe}</p>
        </div>
      </div>

      {/* Image */}
      {supplement.imgURL && (
        <div className="relative h-32 mb-4 -mx-5 px-5 bg-gradient-to-b from-muted/20 to-transparent">
          <img
            src={supplement.imgURL}
            alt={supplement.denomination}
            className="h-full w-full object-cover rounded-md"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}

      {/* Description */}
      {supplement.description && (
        <div className="mb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {supplement.description}
          </p>
        </div>
      )}

      {/* Informations détaillées */}
      <div className="space-y-3">
        {/* Prix */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Prix</span>
          <span
            className={`font-semibold ${
              typeof supplement.prix === "string" &&
              supplement.prix.toLowerCase() === "gratuit"
                ? "text-accent"
                : "text-primary"
            }`}>
            {formatPrice(supplement.prix)}
          </span>
        </div>

        {/* Type de service */}
        <div className="pt-3 border-t border-border">
          <div className="flex justify-center">
            {typeof supplement.prix === "string" &&
            supplement.prix.toLowerCase() === "gratuit" ? (
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                Service gratuit
              </span>
            ) : (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                Service payant
              </span>
            )}
          </div>
        </div>

        {/* Groupe */}
        {supplement.groupe && (
          <div className="pt-3 border-t border-border">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                           bg-muted/50 text-foreground text-sm rounded-full font-medium">
              <Layers className="h-3.5 w-3.5" />
              {supplement.groupe}
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
            handleNavigate(supplement.id);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                   font-medium flex items-center gap-2">
          <Edit3 className="h-4 w-4" />
          Modifier
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => handleToggleStatus(supplement, e)}
          disabled={isProcessing}
          className={`
            px-4 py-2 rounded-md font-medium
            flex items-center gap-2 disabled:opacity-50
            ${
              supplement.actif
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground"
            }
          `}>
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : supplement.actif ? (
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
  selectedGroup,
  setSelectedGroup,
  activeTab,
  setActiveTab,
  groupes,
  supplementsActifs,
  supplementsInactifs,
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
  formatPrice,
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
            Gérer les suppléments
          </h1>

          {/* Barre de recherche */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un supplément..."
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
              Tous ({supplementsActifs.length + supplementsInactifs.length})
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
            onClick={() => setActiveTab("actifs")}
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
            onClick={() => setActiveTab("inactifs")}
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

      {/* Liste des suppléments */}
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
                  filteredActifs.map((supplement) => (
                    <MobileListItem
                      key={supplement.id}
                      supplement={supplement}
                      processingId={processingId}
                      showActions={showActions}
                      setShowActions={setShowActions}
                      handleNavigate={handleNavigate}
                      handleToggleStatus={handleToggleStatus}
                      getGroupIcon={getGroupIcon}
                      formatPrice={formatPrice}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12">
                    <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucun supplément actif trouvé
                    </p>
                  </motion.div>
                )
              ) : filteredInactifs.length > 0 ? (
                filteredInactifs.map((supplement) => (
                  <MobileListItem
                    key={supplement.id}
                    supplement={supplement}
                    processingId={processingId}
                    showActions={showActions}
                    setShowActions={setShowActions}
                    handleNavigate={handleNavigate}
                    handleToggleStatus={handleToggleStatus}
                    getGroupIcon={getGroupIcon}
                    formatPrice={formatPrice}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12">
                  <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Aucun supplément désactivé
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
  selectedGroup,
  setSelectedGroup,
  activeTab,
  setActiveTab,
  groupes,
  supplementsActifs,
  supplementsInactifs,
  filteredActifs,
  filteredInactifs,
  loading,
  error,
  processingId,
  handleNavigate,
  handleToggleStatus,
  getGroupIcon,
  formatPrice,
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
              <Package2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Gestion des suppléments
                </h1>
                <p className="text-muted-foreground mt-1">
                  {supplementsActifs.length + supplementsInactifs.length}{" "}
                  suppléments au total
                </p>
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {supplementsActifs.length}
                </p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {supplementsInactifs.length}
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
                      {filteredActifs.map((supplement) => (
                        <DesktopCard
                          key={supplement.id}
                          supplement={supplement}
                          processingId={processingId}
                          handleNavigate={handleNavigate}
                          handleToggleStatus={handleToggleStatus}
                          getGroupIcon={getGroupIcon}
                          formatPrice={formatPrice}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-24">
                      <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Aucun supplément actif trouvé
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm || selectedGroup !== "all"
                          ? "Essayez de modifier vos filtres"
                          : "Commencez par ajouter des suppléments"}
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
                      {filteredInactifs.map((supplement) => (
                        <DesktopCard
                          key={supplement.id}
                          supplement={supplement}
                          processingId={processingId}
                          handleNavigate={handleNavigate}
                          handleToggleStatus={handleToggleStatus}
                          getGroupIcon={getGroupIcon}
                          formatPrice={formatPrice}
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
                        Aucun supplément désactivé
                      </h3>
                      <p className="text-muted-foreground">
                        Les suppléments désactivés apparaîtront ici
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

const GererLesSupplements = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  const { supplementsActifs, supplementsInactifs, loading, error } =
    useSupplements();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [activeTab, setActiveTab] = useState("actifs");
  const [processingId, setProcessingId] = useState(null);
  const [showActions, setShowActions] = useState(null);

  // Extraire les groupes uniques
  const groupes = useMemo(() => {
    const allSupplements = [...supplementsActifs, ...supplementsInactifs];
    return [...new Set(allSupplements.map((s) => s.groupe).filter(Boolean))];
  }, [supplementsActifs, supplementsInactifs]);

  // Filtrer les suppléments
  const filterSupplements = (supplements) => {
    return supplements.filter((supplement) => {
      const matchesSearch = supplement.denomination
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesGroup =
        selectedGroup === "all" || supplement.groupe === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  };

  const filteredActifs = filterSupplements(supplementsActifs);
  const filteredInactifs = filterSupplements(supplementsInactifs);

  // Gérer la désactivation/réactivation
  const handleToggleStatus = async (supplement, e) => {
    e.stopPropagation();
    setProcessingId(supplement.id);

    try {
      const action = supplement.actif
        ? desactiverSupplement
        : reactiverSupplement;
      const result = await action(supplement.id);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            {supplement.actif ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            <span>
              {supplement.denomination}{" "}
              {supplement.actif ? "désactivé" : "réactivé"} avec succès
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
  const handleNavigate = (supplementId) => {
    navigate(`/admin/supplements/supplements/${supplementId}`);
  };

  // Obtenir l'icône selon le groupe
  const getGroupIcon = (groupe) => {
    const groupeLower = (groupe || "").toLowerCase();
    if (groupeLower.includes("divers") || groupeLower.includes("service"))
      return Package2;
    if (groupeLower.includes("wifi") || groupeLower.includes("connexion"))
      return Wifi;
    if (groupeLower.includes("santé") || groupeLower.includes("health"))
      return Heart;
    if (groupeLower.includes("qpud") || groupeLower.includes("question"))
      return MessageCircleQuestion;
    if (groupeLower.includes("carte") || groupeLower.includes("cadeau"))
      return Gift;
    if (groupeLower.includes("connectivité")) return Wifi;
    return Package2;
  };

  // Formater le prix
  const formatPrice = (prix) => {
    if (typeof prix === "string" && prix.toLowerCase() === "gratuit") {
      return "Gratuit";
    }
    return `${prix} FCFA`;
  };

  // Props communes pour les composants
  const commonProps = {
    searchTerm,
    setSearchTerm,
    selectedGroup,
    setSelectedGroup,
    activeTab,
    setActiveTab,
    groupes,
    supplementsActifs,
    supplementsInactifs,
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
    formatPrice,
  };

  return isMobile ? (
    <MobileView {...commonProps} />
  ) : (
    <DesktopView {...commonProps} />
  );
};

export default GererLesSupplements;
