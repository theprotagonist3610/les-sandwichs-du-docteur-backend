import React, { useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  User,
  Store,
  Package,
  Eye,
  EyeOff,
  Building,
  Navigation,
  Power,
  PowerOff,
  Loader2,
  Locate,
  AlertCircle,
  Info,
  Activity,
  Settings,
  Edit2,
  MapPinned,
  UserCog,
  FileText,
  Zap,
} from "lucide-react";

import useBreakpoint from "@/hooks/useBreakpoint";
import useEditEmplacementStore from "@/stores/useEditEmplacementStore";
import {
  useEmplacement,
  updateEmplacement,
  setVendeuseInEmplacement,
  relocateEmplacement,
} from "@/toolkits/emplacementToolkit";

import MiniLoader from "@/components/loaders/MiniLoader";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ==========================================
// ANIMATIONS OPTIMISÉES
// ==========================================
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

const listItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
const GererPointDeVenteDetail = () => {
  const { empl_id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint(1024);

  // Hook personnalisé pour l'emplacement
  const { emplacement, loading, error, refresh } = useEmplacement(empl_id);

  // Store Zustand
  const {
    activeDialog,
    editData,
    showStock,
    geoLoading,
    loadingAction,
    openDialog,
    closeDialog,
    updateEditData,
    toggleStock,
    setGeoLoading,
    setLoadingAction,
    cleanup,
  } = useEditEmplacementStore();

  // Cleanup au démontage
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ==========================================
  // FONCTIONS UTILITAIRES MÉMORISÉES
  // ==========================================
  const getEmplacementIcon = useCallback((type) => {
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
  }, []);

  const getCurrentLocation = useCallback(() => {
    setGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateEditData("coordonnees", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
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
      toast.error("Géolocalisation non supportée par ce navigateur");
      setGeoLoading(false);
    }
  }, [setGeoLoading, updateEditData]);

  const handleSave = useCallback(
    async (dialogType) => {
      setLoadingAction(true);
      try {
        switch (dialogType) {
          case "basic-info":
            await updateEmplacement(empl_id, {
              denomination: editData.denomination,
              type: editData.type,
            });
            break;
          case "activate":
            await updateEmplacement(empl_id, { status: editData.status });
            break;
          case "vendeuse":
            if (editData.nom) {
              await setVendeuseInEmplacement(empl_id, {
                nom: editData.nom,
                prenoms: editData.prenoms || [""],
              });
            }
            break;
          case "relocation":
            await relocateEmplacement(empl_id, {
              nom: editData.nom,
              departement: editData.departement || "",
              commune: editData.commune || "",
              arrondissement: editData.arrondissement || "",
              quartier: editData.quartier || "",
              indication: editData.indication || "",
              coordonnees: editData.coordonnees || {
                latitude: 0,
                longitude: 0,
              },
            });
            break;
        }
        toast.success("Modification enregistrée avec succès");
        closeDialog();
        refresh();
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        toast.error("Erreur lors de la sauvegarde");
      } finally {
        setLoadingAction(false);
      }
    },
    [empl_id, editData, closeDialog, refresh, setLoadingAction]
  );

  // ==========================================
  // COMPOSANTS DIALOGS OPTIMISÉS
  // ==========================================
  const BasicInfoDialog = useMemo(() => {
    return () => (
      <Dialog
        open={activeDialog === "basic-info"}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle>Informations générales</DialogTitle>
            </div>
            <DialogDescription>
              Modifiez les informations de base de l'emplacement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="denomination" className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Dénomination
              </Label>
              <Input
                id="denomination"
                value={editData.denomination || ""}
                onChange={(e) => updateEditData("denomination", e.target.value)}
                placeholder="Nom de l'emplacement"
              />
            </div>
            <div>
              <Label htmlFor="type" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Type
              </Label>
              <Select
                value={editData.type || ""}
                onValueChange={(value) => updateEditData("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emplacement fixe">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Emplacement fixe
                    </div>
                  </SelectItem>
                  <SelectItem value="emplacement semi-mobile">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Emplacement semi-mobile
                    </div>
                  </SelectItem>
                  <SelectItem value="emplacement mobile">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Emplacement mobile
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button
              onClick={() => handleSave("basic-info")}
              disabled={loadingAction}>
              {loadingAction && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [
    activeDialog,
    editData,
    loadingAction,
    closeDialog,
    handleSave,
    updateEditData,
  ]);

  const ActivationDialog = useMemo(() => {
    return () => (
      <Dialog
        open={activeDialog === "activate"}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <DialogTitle>Activation de l'emplacement</DialogTitle>
            </div>
            <DialogDescription>
              {editData.status ? "Activer" : "Désactiver"} cet emplacement
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
            <Switch
              checked={editData.status || false}
              onCheckedChange={(checked) => updateEditData("status", checked)}
            />
            <Label className="flex items-center gap-2">
              {editData.status ? (
                <>
                  <Power className="h-4 w-4 text-green-600" />
                  Emplacement actif
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 text-gray-500" />
                  Emplacement inactif
                </>
              )}
            </Label>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button
              onClick={() => handleSave("activate")}
              disabled={loadingAction}>
              {loadingAction && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [
    activeDialog,
    editData,
    loadingAction,
    closeDialog,
    handleSave,
    updateEditData,
  ]);

  const VendeuseDialog = useMemo(() => {
    return () => (
      <Dialog
        open={activeDialog === "vendeuse"}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              <DialogTitle>Assigner une vendeuse</DialogTitle>
            </div>
            <DialogDescription>
              Modifier la vendeuse assignée à cet emplacement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nom" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom
              </Label>
              <Input
                id="nom"
                value={editData.nom || ""}
                onChange={(e) => updateEditData("nom", e.target.value)}
                placeholder="Nom de la vendeuse"
              />
            </div>
            <div>
              <Label htmlFor="prenoms">Prénoms</Label>
              <Input
                id="prenoms"
                value={editData.prenoms?.[0] || ""}
                onChange={(e) => updateEditData("prenoms", [e.target.value])}
                placeholder="Prénoms"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button
              onClick={() => handleSave("vendeuse")}
              disabled={loadingAction || !editData.nom}>
              {loadingAction && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Assigner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [
    activeDialog,
    editData,
    loadingAction,
    closeDialog,
    handleSave,
    updateEditData,
  ]);

  const RelocationDialog = useMemo(() => {
    return () => (
      <Dialog
        open={activeDialog === "relocation"}
        onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-primary" />
              <DialogTitle>Relocaliser l'emplacement</DialogTitle>
            </div>
            <DialogDescription>
              Modifier la position géographique de l'emplacement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nom" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Nom du lieu *
              </Label>
              <Input
                id="nom"
                value={editData.nom || ""}
                onChange={(e) => updateEditData("nom", e.target.value)}
                placeholder="Ex: Marché Central"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departement">Département</Label>
                <Input
                  id="departement"
                  value={editData.departement || ""}
                  onChange={(e) =>
                    updateEditData("departement", e.target.value)
                  }
                  placeholder="Ex: Littoral"
                />
              </div>
              <div>
                <Label htmlFor="commune">Commune</Label>
                <Input
                  id="commune"
                  value={editData.commune || ""}
                  onChange={(e) => updateEditData("commune", e.target.value)}
                  placeholder="Ex: Cotonou"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="arrondissement">Arrondissement</Label>
                <Input
                  id="arrondissement"
                  value={editData.arrondissement || ""}
                  onChange={(e) =>
                    updateEditData("arrondissement", e.target.value)
                  }
                  placeholder="Ex: 1er"
                />
              </div>
              <div>
                <Label htmlFor="quartier">Quartier</Label>
                <Input
                  id="quartier"
                  value={editData.quartier || ""}
                  onChange={(e) => updateEditData("quartier", e.target.value)}
                  placeholder="Ex: Ganhi"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="indication">Indication</Label>
              <Textarea
                id="indication"
                value={editData.indication || ""}
                onChange={(e) => updateEditData("indication", e.target.value)}
                placeholder="Précisions sur l'emplacement"
                rows={3}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <Locate className="h-4 w-4" />
                  Coordonnées GPS
                </Label>
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
                  GPS
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Latitude"
                  value={editData.coordonnees?.latitude || ""}
                  onChange={(e) => {
                    const newCoords = {
                      ...editData.coordonnees,
                      latitude: parseFloat(e.target.value) || 0,
                    };
                    updateEditData("coordonnees", newCoords);
                  }}
                />
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Longitude"
                  value={editData.coordonnees?.longitude || ""}
                  onChange={(e) => {
                    const newCoords = {
                      ...editData.coordonnees,
                      longitude: parseFloat(e.target.value) || 0,
                    };
                    updateEditData("coordonnees", newCoords);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button
              onClick={() => handleSave("relocation")}
              disabled={loadingAction || !editData.nom}>
              {loadingAction && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Relocaliser
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [
    activeDialog,
    editData,
    geoLoading,
    loadingAction,
    closeDialog,
    handleSave,
    updateEditData,
    getCurrentLocation,
  ]);

  // ==========================================
  // COMPOSANTS UI MÉMORISÉS
  // ==========================================
  const MobileCard = React.memo(
    ({ title, description, icon: IconComponent, onClick, badge = null }) => (
      <motion.div
        variants={listItemVariants}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">{badge}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  );

  const StockTable = React.memo(({ stock }) => {
    const allItems = useMemo(
      () => [
        ...stock.equipements.map((item) => ({
          ...item,
          categorie: "Équipements",
        })),
        ...stock.consommable.map((item) => ({
          ...item,
          categorie: "Consommable",
        })),
        ...stock.perissable.map((item) => ({
          ...item,
          categorie: "Périssable",
        })),
      ],
      [stock]
    );

    if (allItems.length === 0) {
      return (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun stock disponible</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dénomination</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead className="text-right">Quantité</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allItems.map((item, index) => (
            <TableRow key={`${item.categorie}-${index}`}>
              <TableCell className="font-medium">{item.denomination}</TableCell>
              <TableCell>
                <Badge variant="secondary">{item.categorie}</Badge>
              </TableCell>
              <TableCell className="text-right">{item.quantite}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  });

  // ==========================================
  // GESTION DES ÉTATS DE CHARGEMENT/ERREUR
  // ==========================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <MiniLoader text="Chargement de l'emplacement..." size="md" />
      </div>
    );
  }

  if (error || !emplacement) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-destructive">
            Emplacement introuvable
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </motion.div>
    );
  }

  const IconComponent = getEmplacementIcon(emplacement.type);

  // ==========================================
  // VERSION MOBILE
  // ==========================================
  if (isMobile) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="p-4 space-y-6 pb-20">
        {/* Header Mobile */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {emplacement.denomination}
                </h1>
                <Badge
                  variant={emplacement.status ? "default" : "secondary"}
                  className="mt-1">
                  {emplacement.status ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Cards d'informations */}
        <motion.div initial="initial" animate="animate" className="space-y-3">
          <MobileCard
            title="Informations générales"
            description={emplacement.type}
            icon={Info}
            onClick={() =>
              openDialog("basic-info", {
                denomination: emplacement.denomination,
                type: emplacement.type,
              })
            }
          />

          <MobileCard
            title="Activation"
            description={
              emplacement.status ? "Emplacement actif" : "Emplacement inactif"
            }
            icon={emplacement.status ? Power : PowerOff}
            onClick={() =>
              openDialog("activate", { status: emplacement.status })
            }
            badge={
              <Badge variant={emplacement.status ? "default" : "secondary"}>
                {emplacement.status ? "ON" : "OFF"}
              </Badge>
            }
          />

          <MobileCard
            title="Vendeuse"
            description={
              emplacement.vendeuse_actuelle
                ? `${
                    emplacement.vendeuse_actuelle.nom
                  } ${emplacement.vendeuse_actuelle.prenoms?.join(" ")}`
                : "Aucune vendeuse assignée"
            }
            icon={User}
            onClick={() =>
              openDialog("vendeuse", {
                nom: emplacement.vendeuse_actuelle?.nom || "",
                prenoms: emplacement.vendeuse_actuelle?.prenoms || [""],
              })
            }
          />

          <MobileCard
            title="Localisation"
            description={
              emplacement.position_actuelle?.nom || "Position non définie"
            }
            icon={MapPin}
            onClick={() =>
              openDialog("relocation", {
                nom: emplacement.position_actuelle?.nom || "",
                departement: emplacement.position_actuelle?.departement || "",
                commune: emplacement.position_actuelle?.commune || "",
                arrondissement:
                  emplacement.position_actuelle?.arrondissement || "",
                quartier: emplacement.position_actuelle?.quartier || "",
                indication: emplacement.position_actuelle?.indication || "",
                coordonnees: emplacement.position_actuelle?.coordonnees || {
                  latitude: 0,
                  longitude: 0,
                },
              })
            }
          />

          {/* Bouton Stock */}
          <motion.div variants={listItemVariants}>
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4"
              onClick={toggleStock}>
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>
                  <div className="font-medium">Stock actuel</div>
                  <div className="text-sm text-muted-foreground">
                    {emplacement.stock_actuel.equipements.length +
                      emplacement.stock_actuel.consommable.length +
                      emplacement.stock_actuel.perissable.length}{" "}
                    articles
                  </div>
                </span>
              </span>
              {showStock ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </motion.div>

          {/* Tableau du stock */}
          <AnimatePresence>
            {showStock && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Stock actuel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StockTable stock={emplacement.stock_actuel} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dialogs */}
        <BasicInfoDialog />
        <ActivationDialog />
        <VendeuseDialog />
        <RelocationDialog />
      </motion.div>
    );
  }

  // ==========================================
  // VERSION DESKTOP
  // ==========================================
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto py-8 px-6 space-y-6">
      {/* Header Desktop */}
      <motion.div
        variants={cardVariants}
        className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <IconComponent className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{emplacement.denomination}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={emplacement.status ? "default" : "secondary"}>
                {emplacement.status ? (
                  <span className="flex items-center gap-1">
                    <Power className="h-3 w-3" />
                    Actif
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <PowerOff className="h-3 w-3" />
                    Inactif
                  </span>
                )}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                {emplacement.type}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Onglets Desktop */}
      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="informations"
            className="flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>Informations</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Stock</span>
          </TabsTrigger>
          <TabsTrigger
            value="operations"
            className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Opérations</span>
          </TabsTrigger>
          <TabsTrigger value="gerer" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Gérer</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="informations" className="mt-6">
            <motion.div
              key="informations"
              variants={cardVariants}
              initial="initial"
              animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                  <CardDescription>
                    Détails et caractéristiques de l'emplacement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Dénomination
                      </Label>
                      <p className="text-lg font-semibold">
                        {emplacement.denomination}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Type
                      </Label>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <p className="text-lg">{emplacement.type}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Position actuelle
                    </Label>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Lieu
                        </Label>
                        <p className="font-medium">
                          {emplacement.position_actuelle?.nom || "-"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Commune
                        </Label>
                        <p className="font-medium">
                          {emplacement.position_actuelle?.commune || "-"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Quartier
                        </Label>
                        <p className="font-medium">
                          {emplacement.position_actuelle?.quartier || "-"}
                        </p>
                      </div>
                    </div>
                    {emplacement.position_actuelle?.indication && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <Label className="text-xs text-muted-foreground flex items-center gap-2">
                          <Info className="h-3 w-3" />
                          Indication
                        </Label>
                        <p className="mt-1 text-sm">
                          {emplacement.position_actuelle.indication}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Vendeuse assignée
                    </Label>
                    {emplacement.vendeuse_actuelle ? (
                      <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {emplacement.vendeuse_actuelle.nom}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {emplacement.vendeuse_actuelle.prenoms?.join(" ")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                        Aucune vendeuse assignée
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="stock" className="mt-6">
            <motion.div
              key="stock"
              variants={cardVariants}
              initial="initial"
              animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Stock actuel
                  </CardTitle>
                  <CardDescription>
                    État des stocks par catégorie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StockTable stock={emplacement.stock_actuel} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="operations" className="mt-6">
            <motion.div
              key="operations"
              variants={cardVariants}
              initial="initial"
              animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Opérations de stock
                  </CardTitle>
                  <CardDescription>
                    Entrées, sorties et mouvements de stock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Fonctionnalité à implémenter : historique et nouvelles
                      opérations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="gerer" className="mt-6">
            <motion.div
              key="gerer"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Activation */}
              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() =>
                  openDialog("activate", { status: emplacement.status })
                }>
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto p-4 bg-green-100 dark:bg-green-900 rounded-full w-fit">
                    {emplacement.status ? (
                      <Power className="h-10 w-10 text-green-600" />
                    ) : (
                      <PowerOff className="h-10 w-10 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <CardTitle>Activation</CardTitle>
                    <CardDescription className="mt-2">
                      {emplacement.status ? "Désactiver" : "Activer"}{" "}
                      l'emplacement
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              {/* Card Vendeuse */}
              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() =>
                  openDialog("vendeuse", {
                    nom: emplacement.vendeuse_actuelle?.nom || "",
                    prenoms: emplacement.vendeuse_actuelle?.prenoms || [""],
                  })
                }>
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
                    <UserCog className="h-10 w-10 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Vendeuse</CardTitle>
                    <CardDescription className="mt-2">
                      Changer ou assigner une vendeuse
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              {/* Card Relocalisation */}
              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() =>
                  openDialog("relocation", {
                    nom: emplacement.position_actuelle?.nom || "",
                    departement:
                      emplacement.position_actuelle?.departement || "",
                    commune: emplacement.position_actuelle?.commune || "",
                    arrondissement:
                      emplacement.position_actuelle?.arrondissement || "",
                    quartier: emplacement.position_actuelle?.quartier || "",
                    indication: emplacement.position_actuelle?.indication || "",
                    coordonnees: emplacement.position_actuelle?.coordonnees || {
                      latitude: 0,
                      longitude: 0,
                    },
                  })
                }>
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto p-4 bg-red-100 dark:bg-red-900 rounded-full w-fit">
                    <MapPinned className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>Relocalisation</CardTitle>
                    <CardDescription className="mt-2">
                      Changer la position géographique
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Dialogs */}
      <BasicInfoDialog />
      <ActivationDialog />
      <VendeuseDialog />
      <RelocationDialog />
    </motion.div>
  );
};

export default GererPointDeVenteDetail;
