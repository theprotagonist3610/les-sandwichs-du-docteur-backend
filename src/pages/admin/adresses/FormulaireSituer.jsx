// components/FormulaireSituer.jsx
import React, { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MapPin, Save, Locate, Loader2, X } from "lucide-react";

// Store
import { useAdresseStore } from "@/stores/useAdresseStore";

// Toolkit
import { useAdresses, updateAdresse } from "@/toolkits/adressesToolkit";

// Components UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MiniLoader from "@/components/loaders/MiniLoader";

const FormulaireSituer = () => {
  const { adresses, loading: adressesLoading, refresh } = useAdresses();

  // Zustand store
  const {
    searchTerm,
    selectedAdresse,
    localisationForm,
    loading,
    geoLoading,
    setSearchTerm,
    setSelectedAdresse,
    updateLocalisationField,
    setGeoCoordinates,
    resetLocalisationForm,
    setLoading,
    setGeoLoading,
  } = useAdresseStore();

  // Fonction de recherche floue
  const normalizeString = useCallback((str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }, []);

  const filteredAdresses = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return [];

    const searchNormalized = normalizeString(searchTerm);

    return adresses.filter((adresse) => {
      const departement = normalizeString(adresse.departement);
      const commune = normalizeString(adresse.commune);
      const arrondissement = normalizeString(adresse.arrondissement);
      const quartier = normalizeString(adresse.quartier);

      return (
        departement.includes(searchNormalized) ||
        commune.includes(searchNormalized) ||
        arrondissement.includes(searchNormalized) ||
        quartier.includes(searchNormalized) ||
        searchNormalized.includes(departement) ||
        searchNormalized.includes(commune) ||
        searchNormalized.includes(arrondissement) ||
        searchNormalized.includes(quartier)
      );
    });
  }, [searchTerm, adresses, normalizeString]);

  // Géolocalisation
  const getCurrentLocation = useCallback(() => {
    setGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
          setGeoLoading(false);
          toast.success("Position GPS récupérée");
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
          toast.error("Impossible de récupérer la position GPS");
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      toast.error("Géolocalisation non supportée");
      setGeoLoading(false);
    }
  }, [setGeoCoordinates, setGeoLoading]);

  // Soumission
  const handleSoumettre = useCallback(async () => {
    if (!selectedAdresse) {
      toast.error("Veuillez sélectionner une adresse");
      return;
    }

    if (
      !localisationForm.denomination ||
      !localisationForm.longitude ||
      !localisationForm.latitude
    ) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
      const nouvelleLocalisation = {
        denomination: localisationForm.denomination,
        longitude: parseFloat(localisationForm.longitude),
        latitude: parseFloat(localisationForm.latitude),
      };

      const updatedLoc = [...(selectedAdresse.loc || []), nouvelleLocalisation];

      const result = await updateAdresse(
        selectedAdresse.departement,
        selectedAdresse.id,
        { loc: updatedLoc }
      );

      if (result.success) {
        toast.success("Localisation ajoutée avec succès");
        resetLocalisationForm();
        setSelectedAdresse(null);
        setSearchTerm("");
        refresh();
      }
    } catch (error) {
      console.error("Erreur ajout localisation:", error);
      toast.error("Erreur lors de l'ajout de la localisation");
    } finally {
      setLoading(false);
    }
  }, [
    selectedAdresse,
    localisationForm,
    setLoading,
    resetLocalisationForm,
    setSelectedAdresse,
    setSearchTerm,
    refresh,
  ]);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4">
      {/* Champ de recherche */}
      <motion.div variants={itemVariants}>
        <Label htmlFor="search-adresse">Rechercher une adresse</Label>
        <div className="relative mt-1">
          <Input
            id="search-adresse"
            placeholder="Rechercher par département, commune, quartier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => {
                setSearchTerm("");
                setSelectedAdresse(null);
              }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Liste des résultats */}
      <AnimatePresence>
        {searchTerm && filteredAdresses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {filteredAdresses.length} résultat(s) trouvé(s)
            </p>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredAdresses.map((adresse) => (
                <motion.div
                  key={adresse.id}
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                  className="p-3 cursor-pointer border-b last:border-b-0 transition-colors"
                  onClick={() => {
                    setSelectedAdresse(adresse);
                    setSearchTerm("");
                  }}>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold capitalize">
                      {adresse.quartier}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="capitalize">
                      {adresse.commune || "Non définie"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      (
                      {adresse.departement?.charAt(0).toUpperCase() +
                        adresse.departement?.slice(1) || ""}
                      )
                    </span>
                  </div>
                  {adresse.arrondissement && (
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {adresse.arrondissement}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {searchTerm && filteredAdresses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
            Aucune adresse trouvée
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adresse sélectionnée */}
      <AnimatePresence>
        {selectedAdresse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-3 border-2 border-primary rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Adresse sélectionnée :
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-bold capitalize">
                    {selectedAdresse.quartier}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="capitalize">
                    {selectedAdresse.commune || "Non définie"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    (
                    {selectedAdresse.departement?.charAt(0).toUpperCase() +
                      selectedAdresse.departement?.slice(1) || ""}
                    )
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAdresse(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulaire de localisation */}
      {selectedAdresse && (
        <>
          <motion.div variants={itemVariants}>
            <Label htmlFor="denomination">
              Dénomination de la localisation *
            </Label>
            <Input
              id="denomination"
              placeholder="Ex: Marché principal, École primaire..."
              value={localisationForm.denomination}
              onChange={(e) =>
                updateLocalisationField("denomination", e.target.value)
              }
              className="mt-1"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-2">
              <Label>Coordonnées GPS *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={geoLoading}>
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Locate className="h-4 w-4" />
                )}
                <span className="ml-2">GPS</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={localisationForm.latitude}
                onChange={(e) =>
                  updateLocalisationField("latitude", e.target.value)
                }
              />
              <Input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={localisationForm.longitude}
                onChange={(e) =>
                  updateLocalisationField("longitude", e.target.value)
                }
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              onClick={handleSoumettre}
              disabled={loading}
              className="w-full"
              size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Ajouter la localisation
                </>
              )}
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default FormulaireSituer;
