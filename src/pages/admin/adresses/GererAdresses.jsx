import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Building2,
  Hash,
  Navigation as NavigationIcon,
  X,
  Loader2,
} from "lucide-react";

// Hooks
import useBreakpoint from "@/hooks/useBreakpoint";
import { useAdresses } from "@/toolkits/adressesToolkit";

// Components UI
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MiniLoader from "@/components/loaders/MiniLoader";

const GererAdresses = () => {
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint(1024);
  const { adresses, loading, error } = useAdresses();
  const [searchTerm, setSearchTerm] = useState("");

  // Fonction de recherche avancée incluant les localisations
  const normalizeString = useCallback((str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }, []);

  const filteredAdresses = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return adresses;

    const searchNormalized = normalizeString(searchTerm);

    return adresses.filter((adresse) => {
      // Recherche dans les champs principaux
      const departement = normalizeString(adresse.departement);
      const commune = normalizeString(adresse.commune);
      const arrondissement = normalizeString(adresse.arrondissement);
      const quartier = normalizeString(adresse.quartier);

      // Recherche dans les localisations
      const hasLocalisationMatch = adresse.loc?.some((loc) => {
        const locDenomination = normalizeString(loc.denomination);
        return (
          locDenomination.includes(searchNormalized) ||
          searchNormalized.includes(locDenomination)
        );
      });

      return (
        departement.includes(searchNormalized) ||
        commune.includes(searchNormalized) ||
        arrondissement.includes(searchNormalized) ||
        quartier.includes(searchNormalized) ||
        searchNormalized.includes(departement) ||
        searchNormalized.includes(commune) ||
        searchNormalized.includes(arrondissement) ||
        searchNormalized.includes(quartier) ||
        hasLocalisationMatch
      );
    });
  }, [searchTerm, adresses, normalizeString]);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
    hover: {
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  };

  // Composant élément de liste (mobile)
  const AdresseListItem = ({ adresse }) => (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/admin/adresses/adresses/${adresse.id}`)}
      className="cursor-pointer">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold capitalize text-lg">
                  {adresse.quartier}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {adresse.commune && (
                    <>
                      <span className="capitalize">{adresse.commune}</span>
                      <span>•</span>
                    </>
                  )}
                  {adresse.arrondissement && (
                    <>
                      <span className="capitalize">
                        {adresse.arrondissement}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span className="capitalize">
                    {adresse.departement?.charAt(0).toUpperCase() +
                      adresse.departement?.slice(1) || ""}
                  </span>
                </div>
              </div>
              <NavigationIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Badge variant="secondary">
                {adresse.loc?.length || 0} localisation(s)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Composant carte (desktop)
  const AdresseCard = ({ adresse }) => (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/admin/adresses/adresses/${adresse.id}`)}
      className="cursor-pointer">
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="capitalize">{adresse.quartier}</span>
            <NavigationIcon className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription className="capitalize">
            {adresse.commune || "Commune non définie"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize text-muted-foreground">
                {adresse.departement || "-"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize text-muted-foreground">
                {adresse.arrondissement || "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <MapPin className="h-4 w-4 text-primary" />
            <Badge variant="secondary">
              {adresse.loc?.length || 0} localisation(s)
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <MiniLoader text="Chargement des adresses..." size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-destructive">Erreur : {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  // Version Mobile
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 space-y-4">
        {/* Header avec recherche */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Gérer les adresses</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredAdresses.length} adresse(s)
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une adresse ou localisation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setSearchTerm("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Liste des adresses */}
        {filteredAdresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "Aucune adresse trouvée"
                : "Aucune adresse disponible"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredAdresses.map((adresse) => (
                <AdresseListItem key={adresse.id} adresse={adresse} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Version Desktop
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8 px-6 space-y-6">
      {/* Header avec recherche */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gérer les adresses</h1>
            <p className="text-muted-foreground mt-2">
              Consulter, modifier ou supprimer les adresses existantes
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {filteredAdresses.length} adresse(s)
          </Badge>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une adresse ou localisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setSearchTerm("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Grid des adresses */}
      {filteredAdresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {searchTerm
              ? "Aucune adresse trouvée"
              : "Aucune adresse disponible"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAdresses.map((adresse) => (
              <AdresseCard key={adresse.id} adresse={adresse} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GererAdresses;
