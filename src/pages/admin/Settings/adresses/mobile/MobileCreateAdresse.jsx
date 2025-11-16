import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building2,
  Map,
  MapPinned,
  Navigation,
  Tag,
  Save,
  X,
  AlertCircle,
  Locate,
  Loader2,
  Power,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/global/AddressAutocomplete";
import useCreateAdresseStore from "@/stores/admin/useCreateAdresseStore";
import {
  createAdresse,
  checkForDuplicates,
  getSuggestionsDepartements,
  getSuggestionsCommunes,
  getSuggestionsArrondissements,
  getSuggestionsQuartiers,
} from "@/toolkits/admin/adresseToolkit";

const MobileCreateAdresse = () => {
  const navigate = useNavigate();

  // États du store
  const nom = useCreateAdresseStore((state) => state.nom);
  const departement = useCreateAdresseStore((state) => state.departement);
  const commune = useCreateAdresseStore((state) => state.commune);
  const arrondissement = useCreateAdresseStore((state) => state.arrondissement);
  const quartier = useCreateAdresseStore((state) => state.quartier);
  const longitude = useCreateAdresseStore((state) => state.longitude);
  const latitude = useCreateAdresseStore((state) => state.latitude);
  const statut = useCreateAdresseStore((state) => state.statut);
  const isSubmitting = useCreateAdresseStore((state) => state.isSubmitting);
  const error = useCreateAdresseStore((state) => state.error);
  const duplicates = useCreateAdresseStore((state) => state.duplicates);

  // États d'ouverture des autocompletes
  const isDepartementOpen = useCreateAdresseStore((state) => state.isDepartementOpen);
  const isCommuneOpen = useCreateAdresseStore((state) => state.isCommuneOpen);
  const isArrondissementOpen = useCreateAdresseStore((state) => state.isArrondissementOpen);
  const isQuartierOpen = useCreateAdresseStore((state) => state.isQuartierOpen);

  // Actions du store
  const setNom = useCreateAdresseStore((state) => state.setNom);
  const setDepartement = useCreateAdresseStore((state) => state.setDepartement);
  const setCommune = useCreateAdresseStore((state) => state.setCommune);
  const setArrondissement = useCreateAdresseStore(
    (state) => state.setArrondissement
  );
  const setQuartier = useCreateAdresseStore((state) => state.setQuartier);
  const setLongitude = useCreateAdresseStore((state) => state.setLongitude);
  const setLatitude = useCreateAdresseStore((state) => state.setLatitude);
  const setStatut = useCreateAdresseStore((state) => state.setStatut);
  const setIsSubmitting = useCreateAdresseStore(
    (state) => state.setIsSubmitting
  );
  const setError = useCreateAdresseStore((state) => state.setError);
  const setDuplicates = useCreateAdresseStore((state) => state.setDuplicates);
  const getCurrentPosition = useCreateAdresseStore(
    (state) => state.getCurrentPosition
  );
  const reset = useCreateAdresseStore((state) => state.reset);

  // Actions pour l'ouverture des autocompletes
  const setIsDepartementOpen = useCreateAdresseStore((state) => state.setIsDepartementOpen);
  const setIsCommuneOpen = useCreateAdresseStore((state) => state.setIsCommuneOpen);
  const setIsArrondissementOpen = useCreateAdresseStore((state) => state.setIsArrondissementOpen);
  const setIsQuartierOpen = useCreateAdresseStore((state) => state.setIsQuartierOpen);

  // Callbacks pour remplir automatiquement les champs parents
  const handleSelectDepartement = (suggestion) => {
    setDepartement(suggestion.value);
  };

  const handleSelectCommune = (suggestion) => {
    setCommune(suggestion.value);
    if (suggestion.departement && suggestion.departement !== departement) {
      setDepartement(suggestion.departement);
    }
  };

  const handleSelectArrondissement = (suggestion) => {
    setArrondissement(suggestion.value);
    if (suggestion.departement && suggestion.departement !== departement) {
      setDepartement(suggestion.departement);
    }
    if (suggestion.commune && suggestion.commune !== commune) {
      setCommune(suggestion.commune);
    }
  };

  const handleSelectQuartier = (suggestion) => {
    setQuartier(suggestion.value);
    if (suggestion.departement && suggestion.departement !== departement) {
      setDepartement(suggestion.departement);
    }
    if (suggestion.commune && suggestion.commune !== commune) {
      setCommune(suggestion.commune);
    }
    if (suggestion.arrondissement && suggestion.arrondissement !== arrondissement) {
      setArrondissement(suggestion.arrondissement);
    }
  };

  // Vérifier les doublons lors de la saisie
  useEffect(() => {
    if (!departement || !commune) {
      setDuplicates([]);
      return;
    }

    const checkDuplicates = async () => {
      try {
        const dups = await checkForDuplicates({
          departement,
          commune,
          arrondissement,
          quartier,
          nom,
        });
        setDuplicates(dups);
      } catch (err) {
        console.error("Erreur vérification doublons:", err);
      }
    };

    const timeoutId = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(timeoutId);
  }, [departement, commune, arrondissement, quartier, nom, setDuplicates]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!departement || !commune) {
      toast.error("Département et commune requis");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAdresse({
        nom,
        departement,
        commune,
        arrondissement,
        quartier,
        localisation: {
          longitude,
          latitude,
        },
        statut,
      });

      toast.success("Adresse créée");
      reset();
      navigate("/admin/settings/adresses");
    } catch (err) {
      const errorMessage = err.message || "Erreur";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    navigate("/admin/settings/adresses");
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Créer une Adresse</h1>
        <p className="text-sm text-muted-foreground mt-1">Nouvelle adresse</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Nom (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InputGroup>
              <InputGroupInput
                placeholder="Ex: Bureau principal"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </InputGroup>
          </CardContent>
        </Card>

        {/* Département */}
        <Card>
          <CardContent className="pt-6">
            <AddressAutocomplete
              label="Département"
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              onSelect={handleSelectDepartement}
              getSuggestions={(query) => getSuggestionsDepartements(query)}
              placeholder="Tapez pour rechercher..."
              icon={MapPin}
              required
              className="text-sm"
              isOpen={isDepartementOpen}
              onOpenChange={setIsDepartementOpen}
            />
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AddressAutocomplete
              label="Commune"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              onSelect={handleSelectCommune}
              getSuggestions={(query) =>
                getSuggestionsCommunes(query, departement)
              }
              placeholder="Tapez pour rechercher..."
              icon={Building2}
              required
              className="text-sm"
              isOpen={isCommuneOpen}
              onOpenChange={setIsCommuneOpen}
            />

            <AddressAutocomplete
              label="Arrondissement"
              value={arrondissement}
              onChange={(e) => setArrondissement(e.target.value)}
              onSelect={handleSelectArrondissement}
              getSuggestions={(query) =>
                getSuggestionsArrondissements(query, departement, commune)
              }
              placeholder="Tapez pour rechercher..."
              icon={Map}
              className="text-sm"
              isOpen={isArrondissementOpen}
              onOpenChange={setIsArrondissementOpen}
            />

            <AddressAutocomplete
              label="Quartier"
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              onSelect={handleSelectQuartier}
              getSuggestions={(query) =>
                getSuggestionsQuartiers(
                  query,
                  departement,
                  commune,
                  arrondissement
                )
              }
              placeholder="Tapez pour rechercher..."
              icon={MapPinned}
              className="text-sm"
              isOpen={isQuartierOpen}
              onOpenChange={setIsQuartierOpen}
            />
          </CardContent>
        </Card>

        {/* GPS */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                GPS
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentPosition}>
                <Locate className="w-3 h-3 mr-1" />
                Position actuelle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Longitude</Label>
              <InputGroup>
                <InputGroupInput
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={longitude || ""}
                  onChange={(e) =>
                    setLongitude(parseFloat(e.target.value) || 0)
                  }
                />
              </InputGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Latitude</Label>
              <InputGroup>
                <InputGroupInput
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={latitude || ""}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                />
              </InputGroup>
            </div>
          </CardContent>
        </Card>

        {/* Statut */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power
                  className={`w-5 h-5 ${
                    statut ? "text-green-600" : "text-gray-400"
                  }`}
                />
                <Label>Actif</Label>
              </div>
              <Switch checked={statut} onCheckedChange={setStatut} />
            </div>
          </CardContent>
        </Card>

        {/* Doublons */}
        <AnimatePresence>
          {duplicates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}>
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-orange-900 dark:text-orange-100">
                        {duplicates.length} similaire(s)
                      </h3>
                      <ul className="mt-1 space-y-0.5 text-xs text-orange-800 dark:text-orange-200">
                        {duplicates.slice(0, 3).map((dup) => (
                          <li key={dup.id}>
                            • {dup.nom || `${dup.commune}, ${dup.quartier}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}>
              <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm text-red-900 dark:text-red-100">
                        Erreur
                      </h3>
                      <p className="text-xs text-red-800 dark:text-red-200">
                        {error}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons */}
        <div className="grid grid-cols-2 gap-3 sticky bottom-4 pt-4 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Créer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MobileCreateAdresse;
