// InitialiserBoissons.jsx
import React, { useState, useEffect } from "react";
import boissons from "./liste";
import { createBoissonsBatch, getAllBoissons } from "@/toolkits/boissonToolkit";
import useBreakpoint from "@/hooks/useBreakpoint";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  Coffee,
  Droplet,
  Plus,
  RefreshCw,
  Info,
  ChevronRight,
  Sparkles,
  Archive,
  Upload,
  X,
} from "lucide-react";

const InitialiserBoissons = () => {
  const { isMobile, isDesktop } = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [existingBoissons, setExistingBoissons] = useState([]);
  const [initialized, setInitialized] = useState({});
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [activeTab, setActiveTab] = useState("non-enregistrees");

  // Charger les boissons existantes au montage
  useEffect(() => {
    loadExistingBoissons();
  }, []);

  const loadExistingBoissons = async () => {
    const result = await getAllBoissons();
    if (result.success) {
      setExistingBoissons(result.data);
      checkInitialized(result.data);
    }
  };

  // Vérifier quels groupes sont déjà initialisés
  const checkInitialized = (existing) => {
    const init = {};
    boissons.forEach((groupe) => {
      const groupeBoissons = groupe.liste.map((b) => ({
        ...b,
        groupe: groupe.groupe,
      }));

      // Vérifier si toutes les boissons du groupe existent
      const allExist = groupeBoissons.every((b) =>
        existing.some(
          (ex) =>
            ex.denomination === b.denomination && ex.recipient === b.recipient
        )
      );

      init[groupe.groupe] = {
        initialized: allExist,
        existingCount: groupeBoissons.filter((b) =>
          existing.some(
            (ex) =>
              ex.denomination === b.denomination && ex.recipient === b.recipient
          )
        ).length,
        totalCount: groupeBoissons.length,
      };
    });
    setInitialized(init);
  };

  // Préparer les données avec valeurs par défaut
  const prepareGroupData = (groupe) => {
    return groupe.liste.map((boisson) => ({
      denomination: boisson.denomination || "Sans nom",
      groupe: groupe.groupe || "Non classé",
      recipient: boisson.recipient || "Standard",
      volume: boisson.volume || 330,
      unite: boisson.unite || { nom: "mililitres", symbole: "ml" },
      prix: (boisson.prix || 1) * 500, // Valeur par défaut: 500 FCFA
      imgURL: boisson.imgURL || "",
      ingredients: boisson.ingredients || [],
      calories: boisson.calories || 0,
    }));
  };

  // Initialiser un groupe spécifique
  const initializeGroup = async (groupe) => {
    setLoading(true);
    try {
      const boissonsPrepared = prepareGroupData(groupe);
      const result = await createBoissonsBatch(boissonsPrepared);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Groupe "{groupe.groupe}" initialisé avec succès</span>
          </div>
        );
        await loadExistingBoissons();
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
  };

  // Initialiser tous les groupes
  const initializeAll = async () => {
    setLoading(true);
    try {
      let allBoissons = [];

      boissons
        .filter((groupe) => !initialized[groupe.groupe]?.initialized)
        .forEach((groupe) => {
          const prepared = prepareGroupData(groupe);
          allBoissons = [...allBoissons, ...prepared];
        });

      const result = await createBoissonsBatch(allBoissons);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>
              {result.created} boissons créées
              {result.duplicates?.length > 0 &&
                `, ${result.duplicates.length} doublons ignorés`}
            </span>
          </div>
        );
        await loadExistingBoissons();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Toggle sélection d'un groupe
  const toggleGroupSelection = (groupeName) => {
    const newSelection = new Set(selectedGroups);
    if (newSelection.has(groupeName)) {
      newSelection.delete(groupeName);
    } else {
      newSelection.add(groupeName);
    }
    setSelectedGroups(newSelection);
  };

  // Initialiser les groupes sélectionnés
  const initializeSelected = async () => {
    if (selectedGroups.size === 0) {
      toast.warning("Veuillez sélectionner au moins un groupe");
      return;
    }

    setLoading(true);
    try {
      let allBoissons = [];

      boissons
        .filter((groupe) => selectedGroups.has(groupe.groupe))
        .forEach((groupe) => {
          const prepared = prepareGroupData(groupe);
          allBoissons = [...allBoissons, ...prepared];
        });

      const result = await createBoissonsBatch(allBoissons);

      if (result.success) {
        toast.success(`${result.created} boissons créées`);
        setSelectedGroups(new Set());
        await loadExistingBoissons();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Icônes par groupe
  const getGroupIcon = (groupName) => {
    if (groupName.toLowerCase().includes("yaourt")) return Droplet;
    if (groupName.toLowerCase().includes("jus")) return Package;
    return Coffee;
  };

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

  // Composant Carte de groupe
  const GroupCard = ({ groupe, index }) => {
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
          relative border rounded-lg p-5 transition-all cursor-pointer overflow-hidden
          ${
            isInitialized
              ? "bg-secondary/50 border-secondary-foreground/20"
              : "bg-card hover:shadow-lg border-border hover:border-accent/50"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </motion.div>
        )}

        {/* En-tête avec icône */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`p-2 rounded-lg ${
              isInitialized ? "bg-secondary" : "bg-accent/10"
            }`}>
            <Icon
              className={`h-5 w-5 ${
                isInitialized ? "text-primary" : "text-accent"
              }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">
              {groupe.groupe}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {groupe.liste.length} boisson{groupe.liste.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Statut détaillé */}
        {status.existingCount > 0 && !isInitialized && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Info className="h-4 w-4 text-destructive" />
            <span className="text-destructive">
              {status.existingCount}/{status.totalCount} déjà existants
            </span>
          </div>
        )}

        {/* Aperçu des boissons */}
        <div className="space-y-1.5 mb-4">
          {groupe.liste.slice(0, 3).map((b, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
              <span className="truncate">{b.denomination}</span>
              <span className="text-xs opacity-60">({b.recipient})</span>
            </motion.div>
          ))}
          {groupe.liste.length > 3 && (
            <p className="text-xs text-muted-foreground pl-5">
              +{groupe.liste.length - 3} autres...
            </p>
          )}
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
            className="w-full py-2.5 px-4 rounded-md bg-primary text-primary-foreground font-medium
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{loading ? "Chargement..." : "Initialiser"}</span>
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
                className="absolute top-2 left-2 w-6 h-6 bg-accent rounded-full
                         flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    );
  };

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
          className="bg-card rounded-lg shadow-sm p-5 mb-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Initialisation des Boissons
          </h1>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Total boissons</span>
              <span className="font-semibold text-foreground">
                {boissons.reduce((sum, g) => sum + g.liste.length, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Groupes initialisés</span>
              <span className="font-semibold text-foreground">
                {Object.values(initialized).filter((i) => i.initialized).length}
                /{boissons.length}
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
          {boissons.map((groupe, index) => (
            <GroupCard key={index} groupe={groupe} index={index} />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );

  // Vue Desktop avec Tabs
  const DesktopView = () => {
    const groupesNonInitialises = boissons.filter(
      (g) => !initialized[g.groupe]?.initialized
    );
    const groupesInitialises = boissons.filter(
      (g) => initialized[g.groupe]?.initialized
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          {/* En-tête avec actions */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Gestion des Boissons
                </h1>
                <p className="text-muted-foreground">
                  {boissons.reduce((sum, g) => sum + g.liste.length, 0)}{" "}
                  boissons réparties en {boissons.length} groupes
                </p>
              </div>

              <div className="flex gap-3">
                {selectedGroups.size > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={initializeSelected}
                    disabled={loading}
                    className="px-5 py-2.5 bg-accent text-accent-foreground rounded-md
                             hover:bg-accent/90 disabled:opacity-50 font-medium
                             flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Initialiser la sélection ({selectedGroups.size})
                  </motion.button>
                )}
                {groupesNonInitialises.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={initializeAll}
                    disabled={loading}
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md
                             hover:bg-primary/90 disabled:opacity-50 font-medium
                             flex items-center gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>Tout initialiser</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tabs pour séparer les boissons */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger
                value="non-enregistrees"
                className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Non enregistrées ({groupesNonInitialises.length})
              </TabsTrigger>
              <TabsTrigger
                value="enregistrees"
                className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Enregistrées ({groupesInitialises.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="non-enregistrees" className="mt-0">
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
                      className="border-2 border-dashed border-primary/30 rounded-lg p-6
                               flex flex-col items-center justify-center min-h-[280px]
                               bg-primary/5 hover:bg-primary/10 cursor-pointer
                               transition-colors">
                      <Sparkles className="h-12 w-12 text-primary mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Initialisation Complète
                      </h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Initialiser tous les groupes non enregistrés
                      </p>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {groupesNonInitialises.reduce(
                            (sum, g) => sum + g.liste.length,
                            0
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          nouvelles boissons
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
                    className="text-center py-16">
                    <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Tout est enregistré !
                    </h3>
                    <p className="text-muted-foreground">
                      Toutes les boissons ont été initialisées avec succès.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="enregistrees" className="mt-0">
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
                    className="text-center py-16">
                    <Info className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Aucune boisson enregistrée
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par initialiser des groupes de boissons.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("non-enregistrees")}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md
                               hover:bg-primary/90 font-medium">
                      Voir les boissons disponibles
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
                         bg-card rounded-lg shadow-xl p-4 flex items-center gap-4
                         border border-border">
                <span className="text-foreground font-medium">
                  {selectedGroups.size} groupe
                  {selectedGroups.size > 1 ? "s" : ""} sélectionné
                  {selectedGroups.size > 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSelectedGroups(new Set())}
                  className="text-muted-foreground hover:text-foreground
                           flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Désélectionner
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return isMobile ? <MobileView /> : <DesktopView />;
};

export default InitialiserBoissons;
