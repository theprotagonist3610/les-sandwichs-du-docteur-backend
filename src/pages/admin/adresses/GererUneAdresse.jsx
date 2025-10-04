import React, { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Locate,
  ExternalLink,
  Loader2,
  Navigation as NavigationIcon,
} from "lucide-react";

// Hooks
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  useAdressesDepartement,
  updateAdresse,
} from "@/toolkits/adressesToolkit";

// Store
import { useGererAdresseStore } from "@/stores/useGererAdresseStore";

// Components UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MiniLoader from "@/components/loaders/MiniLoader";

const GererUneAdresse = () => {
  const { id: adresseId } = useParams();
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint(1024);

  // Store Zustand
  const {
    adresseInfo,
    editMode,
    localisationForm,
    showAddLocDialog,
    showEditLocDialog,
    showDeleteConfirm,
    locToDelete,
    editingLocalisation,
    loading,
    geoLoading,
    setAdresseInfo,
    updateAdresseField,
    setEditMode,
    updateLocalisationField,
    setGeoCoordinates,
    resetLocalisationForm,
    openAddLocDialog,
    closeAddLocDialog,
    openEditLocDialog,
    closeEditLocDialog,
    openDeleteConfirm,
    closeDeleteConfirm,
    setLoading,
    setGeoLoading,
  } = useGererAdresseStore();

  // Charger les adresses du département pour trouver celle avec l'ID
  // Note: useAdressesDepartement nécessite le département, on utilise donc un workaround
  // On pourrait aussi créer une fonction getAdresseById dans le toolkit
  const [currentAdresse, setCurrentAdresse] = React.useState(null);
  const [departementLoaded, setDepartementLoaded] = React.useState("");

  // Récupérer l'adresse depuis le localStorage ou Firestore
  useEffect(() => {
    const loadAdresse = () => {
      const cached = localStorage.getItem("lsd_adresses");
      if (cached) {
        const adresses = JSON.parse(cached);
        const adresse = adresses.find((a) => a.id === adresseId);
        if (adresse) {
          setCurrentAdresse(adresse);
          setDepartementLoaded(adresse.departement);
          setAdresseInfo({
            departement: adresse.departement || "",
            commune: adresse.commune || "",
            arrondissement: adresse.arrondissement || "",
            quartier: adresse.quartier || "",
          });
        }
      }
    };

    loadAdresse();
  }, [adresseId, setAdresseInfo]);

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
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("Géolocalisation non supportée");
      setGeoLoading(false);
    }
  }, [setGeoCoordinates, setGeoLoading]);

  // Ouvrir Google Maps
  const openInMaps = useCallback((lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
  }, []);

  // Copier coordonnées
  const copyCoordinates = useCallback((lat, lng) => {
    const coords = `${lat}, ${lng}`;
    navigator.clipboard.writeText(coords);
    toast.success("Coordonnées copiées");
  }, []);

  // Sauvegarder les modifications de l'adresse
  const handleSaveAdresseInfo = useCallback(async () => {
    if (!adresseInfo.quartier) {
      toast.error("Le quartier est obligatoire");
      return;
    }

    setLoading(true);

    try {
      const result = await updateAdresse(
        currentAdresse.departement,
        adresseId,
        adresseInfo
      );

      if (result.success) {
        toast.success("Informations mises à jour");
        setEditMode(false);
        setCurrentAdresse({ ...currentAdresse, ...adresseInfo });
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }, [adresseInfo, currentAdresse, adresseId, setLoading, setEditMode]);

  // Ajouter une localisation
  const handleAddLocalisation = useCallback(async () => {
    if (
      !localisationForm.denomination ||
      !localisationForm.latitude ||
      !localisationForm.longitude
    ) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }

    setLoading(true);

    try {
      const newLoc = {
        denomination: localisationForm.denomination,
        latitude: parseFloat(localisationForm.latitude),
        longitude: parseFloat(localisationForm.longitude),
      };

      const updatedLoc = [...(currentAdresse.loc || []), newLoc];

      const result = await updateAdresse(
        currentAdresse.departement,
        adresseId,
        { loc: updatedLoc }
      );

      if (result.success) {
        toast.success("Localisation ajoutée");
        setCurrentAdresse({ ...currentAdresse, loc: updatedLoc });
        closeAddLocDialog();
      }
    } catch (error) {
      console.error("Erreur ajout localisation:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  }, [
    localisationForm,
    currentAdresse,
    adresseId,
    setLoading,
    closeAddLocDialog,
  ]);

  // Modifier une localisation
  const handleEditLocalisation = useCallback(async () => {
    if (
      !localisationForm.denomination ||
      !localisationForm.latitude ||
      !localisationForm.longitude
    ) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }

    setLoading(true);

    try {
      const updatedLoc = currentAdresse.loc.map((loc) =>
        loc === editingLocalisation
          ? {
              denomination: localisationForm.denomination,
              latitude: parseFloat(localisationForm.latitude),
              longitude: parseFloat(localisationForm.longitude),
            }
          : loc
      );

      const result = await updateAdresse(
        currentAdresse.departement,
        adresseId,
        { loc: updatedLoc }
      );

      if (result.success) {
        toast.success("Localisation modifiée");
        setCurrentAdresse({ ...currentAdresse, loc: updatedLoc });
        closeEditLocDialog();
      }
    } catch (error) {
      console.error("Erreur modification localisation:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  }, [
    localisationForm,
    currentAdresse,
    editingLocalisation,
    adresseId,
    setLoading,
    closeEditLocDialog,
  ]);

  // Supprimer une localisation
  const handleDeleteLocalisation = useCallback(async () => {
    setLoading(true);

    try {
      const updatedLoc = currentAdresse.loc.filter(
        (loc) => loc !== locToDelete
      );

      const result = await updateAdresse(
        currentAdresse.departement,
        adresseId,
        { loc: updatedLoc }
      );

      if (result.success) {
        toast.success("Localisation supprimée");
        setCurrentAdresse({ ...currentAdresse, loc: updatedLoc });
        closeDeleteConfirm();
      }
    } catch (error) {
      console.error("Erreur suppression localisation:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }, [currentAdresse, locToDelete, adresseId, setLoading, closeDeleteConfirm]);

  // Animations
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  if (!currentAdresse) {
    return (
      <div className="flex justify-center py-12">
        <MiniLoader text="Chargement de l'adresse..." size="md" />
      </div>
    );
  }

  // Composant Localisation Card/Item
  const LocalisationItem = ({ localisation, index }) => (
    <motion.div variants={itemVariants}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">
                  {localisation.denomination}
                </h4>
                <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <button
                    onClick={() =>
                      copyCoordinates(
                        localisation.latitude,
                        localisation.longitude
                      )
                    }
                    className="hover:text-primary transition-colors">
                    {localisation.latitude}, {localisation.longitude}
                  </button>
                </div>
              </div>
              <Badge variant="secondary">#{index + 1}</Badge>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openInMaps(localisation.latitude, localisation.longitude)
                }>
                <ExternalLink className="h-4 w-4 mr-2" />
                Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditLocDialog(localisation)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openDeleteConfirm(localisation)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Version Mobile
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Gérer l'adresse</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Infos de l'adresse */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informations</CardTitle>
                {!editMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div>
                    <Label>Département</Label>
                    <Input
                      value={adresseInfo.departement}
                      onChange={(e) =>
                        updateAdresseField("departement", e.target.value)
                      }
                      placeholder="Optionnel"
                    />
                  </div>
                  <div>
                    <Label>Commune</Label>
                    <Input
                      value={adresseInfo.commune}
                      onChange={(e) =>
                        updateAdresseField("commune", e.target.value)
                      }
                      placeholder="Optionnel"
                    />
                  </div>
                  <div>
                    <Label>Arrondissement</Label>
                    <Input
                      value={adresseInfo.arrondissement}
                      onChange={(e) =>
                        updateAdresseField("arrondissement", e.target.value)
                      }
                      placeholder="Optionnel"
                    />
                  </div>
                  <div>
                    <Label>Quartier *</Label>
                    <Input
                      value={adresseInfo.quartier}
                      onChange={(e) =>
                        updateAdresseField("quartier", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveAdresseInfo}
                      disabled={loading}
                      className="flex-1">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="flex-1">
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Quartier</p>
                      <p className="font-semibold capitalize">
                        {currentAdresse.quartier}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commune</p>
                      <p className="capitalize">
                        {currentAdresse.commune || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Département
                      </p>
                      <p className="capitalize">
                        {currentAdresse.departement || "-"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Localisations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Localisations</h2>
              <Button onClick={openAddLocDialog} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3">
              {currentAdresse.loc?.length > 0 ? (
                currentAdresse.loc.map((loc, index) => (
                  <LocalisationItem
                    key={index}
                    localisation={loc}
                    index={index}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune localisation</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>

        {/* Dialogs */}
        <LocalisationDialogs
          showAddDialog={showAddLocDialog}
          showEditDialog={showEditLocDialog}
          localisationForm={localisationForm}
          geoLoading={geoLoading}
          loading={loading}
          onCloseAdd={closeAddLocDialog}
          onCloseEdit={closeEditLocDialog}
          onAdd={handleAddLocalisation}
          onEdit={handleEditLocalisation}
          updateField={updateLocalisationField}
          getCurrentLocation={getCurrentLocation}
        />

        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onClose={closeDeleteConfirm}
          onConfirm={handleDeleteLocalisation}
          loading={loading}
        />
      </motion.div>
    );
  }

  // Version Desktop
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8 px-6 space-y-6">
      {/* Header Desktop */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold capitalize">
              {currentAdresse.quartier}
            </h1>
            <p className="text-muted-foreground mt-2">
              {currentAdresse.commune && (
                <span className="capitalize">{currentAdresse.commune}</span>
              )}
              {currentAdresse.commune && currentAdresse.departement && " • "}
              {currentAdresse.departement && (
                <span className="capitalize">{currentAdresse.departement}</span>
              )}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {currentAdresse.loc?.length || 0} localisation(s)
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos de l'adresse */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informations</CardTitle>
                {!editMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div>
                    <Label>Département</Label>
                    <Input
                      value={adresseInfo.departement}
                      onChange={(e) =>
                        updateAdresseField("departement", e.target.value)
                      }
                      placeholder="Optionnel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Commune</Label>
                    <Input
                      value={adresseInfo.commune}
                      onChange={(e) =>
                        updateAdresseField("commune", e.target.value)
                      }
                      placeholder="Optionnel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Arrondissement</Label>
                    <Input
                      value={adresseInfo.arrondissement}
                      onChange={(e) =>
                        updateAdresseField("arrondissement", e.target.value)
                      }
                      placeholder="Optionnel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Quartier *</Label>
                    <Input
                      value={adresseInfo.quartier}
                      onChange={(e) =>
                        updateAdresseField("quartier", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button onClick={handleSaveAdresseInfo} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}>
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Quartier
                    </p>
                    <p className="text-lg font-semibold capitalize mt-1">
                      {currentAdresse.quartier}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Commune
                    </p>
                    <p className="capitalize mt-1">
                      {currentAdresse.commune || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Arrondissement
                    </p>
                    <p className="capitalize mt-1">
                      {currentAdresse.arrondissement || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Département
                    </p>
                    <p className="capitalize mt-1">
                      {currentAdresse.departement || "-"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Localisations Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Localisations</h2>
            <Button onClick={openAddLocDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une localisation
            </Button>
          </div>

          {currentAdresse.loc?.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAdresse.loc.map((loc, index) => (
                <LocalisationItem
                  key={index}
                  localisation={loc}
                  index={index}
                />
              ))}
            </motion.div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  Aucune localisation enregistrée
                </p>
                <Button onClick={openAddLocDialog} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter la première localisation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <LocalisationDialogs
        showAddDialog={showAddLocDialog}
        showEditDialog={showEditLocDialog}
        localisationForm={localisationForm}
        geoLoading={geoLoading}
        loading={loading}
        onCloseAdd={closeAddLocDialog}
        onCloseEdit={closeEditLocDialog}
        onAdd={handleAddLocalisation}
        onEdit={handleEditLocalisation}
        updateField={updateLocalisationField}
        getCurrentLocation={getCurrentLocation}
      />

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteLocalisation}
        loading={loading}
      />
    </motion.div>
  );
};

// Composants de dialogs
const LocalisationDialogs = ({
  showAddDialog,
  showEditDialog,
  localisationForm,
  geoLoading,
  loading,
  onCloseAdd,
  onCloseEdit,
  onAdd,
  onEdit,
  updateField,
  getCurrentLocation,
}) => (
  <>
    <Dialog open={showAddDialog} onOpenChange={onCloseAdd}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une localisation</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle localisation avec ses coordonnées GPS
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Dénomination *</Label>
            <Input
              value={localisationForm.denomination}
              onChange={(e) => updateField("denomination", e.target.value)}
              placeholder="Ex: Marché principal"
              className="mt-1"
            />
          </div>
          <div>
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
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={localisationForm.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
              />
              <Input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={localisationForm.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCloseAdd}>
            Annuler
          </Button>
          <Button onClick={onAdd} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={showEditDialog} onOpenChange={onCloseEdit}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la localisation</DialogTitle>
          <DialogDescription>
            Modifiez les informations de cette localisation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Dénomination *</Label>
            <Input
              value={localisationForm.denomination}
              onChange={(e) => updateField("denomination", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
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
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={localisationForm.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
              />
              <Input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={localisationForm.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCloseEdit}>
            Annuler
          </Button>
          <Button onClick={onEdit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);

const DeleteConfirmDialog = ({ open, onClose, onConfirm, loading }) => (
  <AlertDialog open={open} onOpenChange={onClose}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Supprimer la localisation ?</AlertDialogTitle>
        <AlertDialogDescription>
          Cette action est irréversible. La localisation sera définitivement
          supprimée.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Supprimer
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default GererUneAdresse;
