import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Store,
  MapPin,
  Eye,
  ArrowRight,
  Building,
  Navigation,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Hooks
import useBreakpoint from "@/hooks/useBreakpoint";
import { useAllEmplacements } from "@/toolkits/emplacementToolkit";

// Components
import MiniLoader from "@/components/loaders/MiniLoader";

// Components UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const GererPointDeVente = () => {
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint(1024);
  const {
    emplacements,
    activeEmplacements,
    inactiveEmplacements,
    loading,
    error,
    refresh,
  } = useAllEmplacements();

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
    tap: { scale: 0.98 },
  };

  // Fonction pour obtenir l'icône selon le type d'emplacement
  const getEmplacementIcon = (type) => {
    switch (type) {
      case "emplacement fixe":
        return Building;
      case "emplacement semi-mobile":
        return Store;
      case "emplacement mobile":
        return Navigation;
      default:
        return Store;
    }
  };

  // Fonction pour obtenir la couleur du badge selon le type
  const getEmplacementBadgeVariant = (type) => {
    switch (type) {
      case "emplacement fixe":
        return "default";
      case "emplacement semi-mobile":
        return "secondary";
      case "emplacement mobile":
        return "outline";
      default:
        return "default";
    }
  };

  // Composant Card d'emplacement
  const EmplacementCard = ({ emplacement }) => {
    const IconComponent = getEmplacementIcon(emplacement.type);
    const badgeVariant = getEmplacementBadgeVariant(emplacement.type);

    const handleClick = () => {
      navigate(`/admin/points_vente/points_vente/${emplacement.id}`);
    };

    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={handleClick}
        className="cursor-pointer">
        <Card className="h-full transition-shadow hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg line-clamp-1">
                    {emplacement.denomination}
                  </CardTitle>
                  <Badge variant={badgeVariant} className="mt-1 text-xs">
                    {emplacement.type}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Localisation */}
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">
                    {emplacement.position_actuelle?.nom ||
                      "Localisation non définie"}
                  </p>
                  {(emplacement.position_actuelle?.commune ||
                    emplacement.position_actuelle?.quartier) && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {[
                        emplacement.position_actuelle?.quartier,
                        emplacement.position_actuelle?.commune,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Bouton consulter */}
              <Button
                variant="outline"
                className="w-full group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}>
                <Eye className="h-4 w-4 mr-2" />
                Consulter
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Composant liste d'emplacements
  const EmplacementsList = ({ emplacements: liste }) => {
    if (liste.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun emplacement trouvé</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-4 ${
          isMobile
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }`}>
        {liste.map((emplacement) => (
          <EmplacementCard key={emplacement.id} emplacement={emplacement} />
        ))}
      </motion.div>
    );
  };

  // Composant d'état de chargement
  const LoadingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center py-12">
      <MiniLoader
        text="Chargement des emplacements..."
        size="md"
        className="py-8"
      />
    </motion.div>
  );

  // Composant d'état d'erreur
  const ErrorState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 space-y-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center space-y-2">
        <p className="text-destructive font-medium">Erreur de chargement</p>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={refresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    </motion.div>
  );

  // Rendu conditionnel du contenu
  const renderContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState />;

    if (isMobile) {
      // Version mobile : liste simple
      return (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Points de vente</h2>
              <p className="text-muted-foreground">
                {activeEmplacements.length} actifs,{" "}
                {inactiveEmplacements.length} inactifs
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </motion.div>

          <EmplacementsList emplacements={emplacements} />
        </div>
      );
    }

    // Version desktop : onglets
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des points de vente</h1>
            <p className="text-muted-foreground mt-2">
              Gérez et consultez tous vos emplacements commerciaux
            </p>
          </div>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <Tabs defaultValue="actifs" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger
                value="actifs"
                className="flex items-center space-x-2">
                <Store className="h-4 w-4" />
                <span>Actifs ({activeEmplacements.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="inactifs"
                className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Non actifs ({inactiveEmplacements.length})</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="actifs" className="mt-6">
                <motion.div
                  key="actifs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-green-700">
                      Emplacements actifs
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Points de vente actuellement en fonctionnement
                    </p>
                  </div>
                  <EmplacementsList emplacements={activeEmplacements} />
                </motion.div>
              </TabsContent>

              <TabsContent value="inactifs" className="mt-6">
                <motion.div
                  key="inactifs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-orange-700">
                      Emplacements non actifs
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Points de vente temporairement désactivés
                    </p>
                  </div>
                  <EmplacementsList emplacements={inactiveEmplacements} />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`${isMobile ? "p-4" : "container mx-auto py-8 px-6"}`}>
      {renderContent()}
    </motion.div>
  );
};

export default GererPointDeVente;
