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

const DesktopGererUneAdresse = () => {
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
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        toast.success("Position obtenue avec succès");
        setIsLocating(false);
      },
      (error) => {
        console.error("Erreur géolocalisation:", error);
        toast.error("Impossible d'obtenir votre position");
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
      toast.error("Le département est requis");
      return false;
    }
    if (!commune.trim()) {
      toast.error("La commune est requise");
      return false;
    }
    if (!arrondissement.trim()) {
      toast.error("L'arrondissement est requis");
      return false;
    }
    if (!quartier.trim()) {
      toast.error("Le quartier est requis");
      return false;
    }

    // Validation des coordonnées
    if (latitude && isNaN(parseFloat(latitude))) {
      toast.error("La latitude doit être un nombre valide");
      return false;
    }
    if (longitude && isNaN(parseFloat(longitude))) {
      toast.error("La longitude doit être un nombre valide");
      return false;
    }

    return true;
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!validateForm()) return;

    showLoader("Mise à jour de l'adresse...");

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
      toast.success("Adresse mise à jour avec succès");
      navigate("/admin/settings/adresses");
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour de l'adresse");
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
      className="p-6 max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Modifier l'adresse</h1>
            <p className="text-muted-foreground mt-1">
              Mettez à jour les informations de l'adresse
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Informations de l'adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nom optionnel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Nom (optionnel)
            </label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>
                  <Tag className="w-4 h-4" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Ex: Maison principale, Bureau..."
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </InputGroup>
            <p className="text-xs text-muted-foreground">
              Un nom pour identifier facilement cette adresse
            </p>
          </motion.div>

          <Separator />

          {/* Département */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <Map className="w-4 h-4 text-muted-foreground" />
              Département *
            </label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>
                  <Map className="w-4 h-4" />
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
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Commune *
            </label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>
                  <Building2 className="w-4 h-4" />
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
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-muted-foreground" />
              Arrondissement *
            </label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>
                  <MapPinned className="w-4 h-4" />
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
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Quartier *
            </label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>
                  <MapPin className="w-4 h-4" />
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
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Navigation className="w-4 h-4 text-muted-foreground" />
                Coordonnées GPS
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetCurrentPosition}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 mr-2" />
                )}
                Position actuelle
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Latitude</label>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    step="any"
                    placeholder="Ex: 6.3654"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Longitude</label>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    step="any"
                    placeholder="Ex: 2.4183"
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
            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {statut ? (
                <ToggleRight className="w-6 h-6 text-green-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  Statut : {statut ? "Actif" : "Inactif"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statut
                    ? "Cette adresse est disponible pour utilisation"
                    : "Cette adresse est désactivée"}
                </p>
              </div>
            </div>
            <Button
              variant={statut ? "destructive" : "default"}
              onClick={() => setStatut(!statut)}
            >
              {statut ? "Désactiver" : "Activer"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DesktopGererUneAdresse;
