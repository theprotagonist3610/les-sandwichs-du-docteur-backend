import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Map,
  Building2,
  MapPinned,
  Navigation,
  Save,
  X,
  Loader2,
  Tag,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useFullPageLoader } from "@/components/global/FullPageLoader";
import {
  useNom,
  useSetNom,
  useDepartement,
  useSetDepartement,
  useCommune,
  useSetCommune,
  useArrondissement,
  useSetArrondissement,
  useQuartier,
  useSetQuartier,
  useLatitude,
  useSetLatitude,
  useLongitude,
  useSetLongitude,
  useStatut,
  useSetStatut,
  useIsLoading,
  useSetIsLoading,
  useIsLocating,
  useSetIsLocating,
  useLoadAdresse,
  useResetEditAdresse,
} from "@/stores/admin/useEditAdresseStore";
import {
  getAllAdresses,
  updateAdresse,
} from "@/toolkits/admin/adresseToolkit";

const MobileGererUneAdresse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useFullPageLoader();

  // Sélecteurs granulaires du store
  const nom = useNom();
  const setNom = useSetNom();
  const departement = useDepartement();
  const setDepartement = useSetDepartement();
  const commune = useCommune();
  const setCommune = useSetCommune();
  const arrondissement = useArrondissement();
  const setArrondissement = useSetArrondissement();
  const quartier = useQuartier();
  const setQuartier = useSetQuartier();
  const latitude = useLatitude();
  const setLatitude = useSetLatitude();
  const longitude = useLongitude();
  const setLongitude = useSetLongitude();
  const statut = useStatut();
  const setStatut = useSetStatut();
  const isLoading = useIsLoading();
  const setIsLoading = useSetIsLoading();
  const isLocating = useIsLocating();
  const setIsLocating = useSetIsLocating();
  const loadAdresse = useLoadAdresse();
  const reset = useResetEditAdresse();

  // Charger l'adresse au montage
  useEffect(() => {
    const fetchAdresse = async () => {
      if (!id) {
        toast.error("ID d'adresse manquant");
        navigate("/admin/settings/adresses");
        return;
      }

      setIsLoading(true);
      try {
        const allAdresses = await getAllAdresses();
        const adresse = allAdresses.find((a) => a.id === id);

        if (!adresse) {
          toast.error("Adresse introuvable");
          navigate("/admin/settings/adresses");
          return;
        }

        loadAdresse(adresse);
      } catch (error) {
        console.error("Erreur chargement adresse:", error);
        toast.error("Erreur lors du chargement de l'adresse");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdresse();

    return () => {
      reset();
    };
  }, [id, navigate, loadAdresse, reset, setIsLoading]);

  // Fonction pour obtenir la position actuelle
  const handleGetCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        toast.success("Position obtenue");
        setIsLocating(false);
      },
      (error) => {
        console.error("Erreur géolocalisation:", error);
        toast.error("Position impossible à obtenir");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Validation du formulaire
  const validateForm = () => {
    if (!departement.trim()) {
      toast.error("Département requis");
      return false;
    }
    if (!commune.trim()) {
      toast.error("Commune requise");
      return false;
    }
    if (!arrondissement.trim()) {
      toast.error("Arrondissement requis");
      return false;
    }
    if (!quartier.trim()) {
      toast.error("Quartier requis");
      return false;
    }

    // Validation des coordonnées
    if (latitude && isNaN(parseFloat(latitude))) {
      toast.error("Latitude invalide");
      return false;
    }
    if (longitude && isNaN(parseFloat(longitude))) {
      toast.error("Longitude invalide");
      return false;
    }

    return true;
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!validateForm()) return;

    showLoader("Mise à jour...");

    try {
      const updatedAdresse = {
        id,
        nom: nom.trim(),
        departement: departement.trim().toLowerCase(),
        commune: commune.trim(),
        arrondissement: arrondissement.trim(),
        quartier: quartier.trim(),
        localisation: {
          latitude: latitude ? parseFloat(latitude) : 0,
          longitude: longitude ? parseFloat(longitude) : 0,
        },
        statut,
      };

      await updateAdresse(id, updatedAdresse);
      toast.success("Adresse mise à jour");
      navigate("/admin/settings/adresses");
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur mise à jour");
    } finally {
      hideLoader();
    }
  };

  // Annuler et retourner
  const handleCancel = () => {
    navigate("/admin/settings/adresses");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Modifier l'adresse</h1>
            <p className="text-xs text-muted-foreground">
              Mise à jour des informations
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1 text-sm">
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave} className="flex-1 text-sm">
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nom optionnel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-xs font-medium flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              Nom (optionnel)
            </label>
            <InputGroup className="text-sm">
              <InputGroupAddon>
                <InputGroupText>
                  <Tag className="w-3.5 h-3.5" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Ex: Maison, Bureau..."
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </InputGroup>
          </motion.div>

          <Separator />

          {/* Département */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="text-xs font-medium flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-muted-foreground" />
              Département *
            </label>
            <InputGroup className="text-sm">
              <InputGroupAddon>
                <InputGroupText>
                  <Map className="w-3.5 h-3.5" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Ex: Atlantique"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                required
              />
            </InputGroup>
          </motion.div>

          {/* Commune */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <label className="text-xs font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              Commune *
            </label>
            <InputGroup className="text-sm">
              <InputGroupAddon>
                <InputGroupText>
                  <Building2 className="w-3.5 h-3.5" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Ex: Cotonou"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                required
              />
            </InputGroup>
          </motion.div>

          {/* Arrondissement */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <label className="text-xs font-medium flex items-center gap-1.5">
              <MapPinned className="w-3.5 h-3.5 text-muted-foreground" />
              Arrondissement *
            </label>
            <InputGroup className="text-sm">
              <InputGroupAddon>
                <InputGroupText>
                  <MapPinned className="w-3.5 h-3.5" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Ex: 1er arrondissement"
                value={arrondissement}
                onChange={(e) => setArrondissement(e.target.value)}
                required
              />
            </InputGroup>
          </motion.div>

          {/* Quartier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <label className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Quartier *
            </label>
            <InputGroup className="text-sm">
              <InputGroupAddon>
                <InputGroupText>
                  <MapPin className="w-3.5 h-3.5" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Ex: Akpakpa"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                required
              />
            </InputGroup>
          </motion.div>

          <Separator />

          {/* Localisation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
                GPS
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetCurrentPosition}
                disabled={isLocating}
                className="h-7 text-xs"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3 mr-1.5" />
                )}
                Position
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Latitude</label>
                <InputGroup className="text-sm">
                  <InputGroupInput
                    type="number"
                    step="any"
                    placeholder="6.3654"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Longitude</label>
                <InputGroup className="text-sm">
                  <InputGroupInput
                    type="number"
                    step="any"
                    placeholder="2.4183"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </InputGroup>
              </div>
            </div>
          </motion.div>

          <Separator />

          {/* Statut */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              {statut ? (
                <ToggleRight className="w-5 h-5 text-green-600" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {statut ? "Actif" : "Inactif"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statut ? "Disponible" : "Désactivée"}
                </p>
              </div>
            </div>
            <Button
              variant={statut ? "destructive" : "default"}
              size="sm"
              onClick={() => setStatut(!statut)}
              className="h-7 text-xs"
            >
              {statut ? "Désactiver" : "Activer"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MobileGererUneAdresse;
