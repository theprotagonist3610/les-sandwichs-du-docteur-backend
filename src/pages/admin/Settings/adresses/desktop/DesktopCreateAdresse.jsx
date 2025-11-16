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
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
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

const DesktopCreateAdresse = () => {
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
    // Remplir automatiquement le département si disponible
    if (suggestion.departement && suggestion.departement !== departement) {
      setDepartement(suggestion.departement);
    }
  };

  const handleSelectArrondissement = (suggestion) => {
    setArrondissement(suggestion.value);
    // Remplir automatiquement les champs parents
    if (suggestion.departement && suggestion.departement !== departement) {
      setDepartement(suggestion.departement);
    }
    if (suggestion.commune && suggestion.commune !== commune) {
      setCommune(suggestion.commune);
    }
  };

  const handleSelectQuartier = (suggestion) => {
    setQuartier(suggestion.value);
    // Remplir automatiquement tous les champs parents
    if (suggestion.departement && suggestion.departement !== departement) {
      setDepartement(suggestion.departement);
    }
    if (suggestion.commune && suggestion.commune !== commune) {
      setCommune(suggestion.commune);
    }
    if (
      suggestion.arrondissement &&
      suggestion.arrondissement !== arrondissement
    ) {
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
      toast.error("Département et commune sont obligatoires");
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

      toast.success("Adresse créée avec succès");
      reset();
      navigate("/admin/settings/adresses");
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de la création";
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Créer une Adresse</h1>
          <p className="text-muted-foreground mt-1">
            Ajouter une nouvelle adresse au système
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}>
              <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100">
                        Erreur
                      </h3>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {error}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom (optionnel)</Label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <Tag />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Ex: Bureau principal, Point de vente..."
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                />
              </InputGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <AddressAutocomplete
                label="Département"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                onSelect={handleSelectDepartement}
                getSuggestions={(query) => getSuggestionsDepartements(query)}
                placeholder="Tapez pour rechercher..."
                icon={MapPin}
                required
                isOpen={isDepartementOpen}
                onOpenChange={setIsDepartementOpen}
              />

              <div className="flex items-center gap-2 pt-8">
                <Label>Actif</Label>
                <Switch checked={statut} onCheckedChange={setStatut} />
                <Power
                  className={`w-5 h-5 ${
                    statut ? "text-green-600" : "text-gray-400"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                isOpen={isArrondissementOpen}
                onOpenChange={setIsArrondissementOpen}
              />
            </div>

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
              isOpen={isQuartierOpen}
              onOpenChange={setIsQuartierOpen}
            />
          </CardContent>
        </Card>

        {/* Coordonnées GPS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Coordonnées GPS
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentPosition}>
                <Locate className="w-4 h-4 mr-2" />
                Position actuelle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Longitude</Label>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    step="0.000001"
                    placeholder="0.000000"
                    value={longitude || ""}
                    onChange={(e) =>
                      setLongitude(parseFloat(e.target.value) || 0)
                    }
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <Label>Latitude</Label>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    step="0.000001"
                    placeholder="0.000000"
                    value={latitude || ""}
                    onChange={(e) =>
                      setLatitude(parseFloat(e.target.value) || 0)
                    }
                  />
                </InputGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avertissements de doublons */}
        <AnimatePresence>
          {duplicates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}>
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                        {duplicates.length} adresse(s) similaire(s) trouvée(s)
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-orange-800 dark:text-orange-200">
                        {duplicates.map((dup) => (
                          <li key={dup.id}>
                            • {dup.nom || `${dup.commune}, ${dup.quartier}`}{" "}
                            (ID: {dup.id})
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                        Voulez-vous vraiment créer cette adresse ?
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default DesktopCreateAdresse;
