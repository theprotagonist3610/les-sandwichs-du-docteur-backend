import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin,
  Store,
  Tag,
  User,
  Clock,
  ArrowLeft,
  Save,
  Compass,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import SmallLoader from "@/components/global/SmallLoader";
import AddressInputGroup from "@/components/global/AddressInputGroup";

import useCreateEmplacementStore, {
  selectTypeFamille,
  selectTypeSousType,
  selectDenomination,
  selectTheme,
  selectThemeDescription,
  selectDepartement,
  selectCommune,
  selectArrondissement,
  selectQuartier,
  selectLongitude,
  selectLatitude,
  selectVendeurId,
  selectHoraireLundi,
  selectHoraireMardi,
  selectHoraireMercredi,
  selectHoraireJeudi,
  selectHoraireVendredi,
  selectHoraireSamedi,
  selectHoraireDimanche,
  selectIsSubmitting,
} from "@/stores/admin/useCreateEmplacementStore";

import {
  createEmplacement,
  EMPLACEMENT_TYPES,
} from "@/toolkits/admin/emplacementToolkit.jsx";
import { useUsers } from "@/toolkits/admin/userToolkit.jsx";

const EMPLACEMENT_TYPE_CONFIG = {
  [EMPLACEMENT_TYPES.ENTREPOT]: {
    label: "Entrepôt",
    description: "Lieu de stockage principal",
    icon: Building2,
  },
  [EMPLACEMENT_TYPES.POINT_DE_VENTE]: {
    label: "Point de vente",
    description: "Boutique ou magasin fixe",
    icon: Store,
  },
  [EMPLACEMENT_TYPES.STAND]: {
    label: "Stand",
    description: "Point de vente mobile",
    icon: MapPin,
  },
};

const JOURS_SEMAINE = [
  {
    key: "lundi",
    label: "Lundi",
    selector: selectHoraireLundi,
    setter: "setHoraireLundi",
  },
  {
    key: "mardi",
    label: "Mardi",
    selector: selectHoraireMardi,
    setter: "setHoraireMardi",
  },
  {
    key: "mercredi",
    label: "Mercredi",
    selector: selectHoraireMercredi,
    setter: "setHoraireMercredi",
  },
  {
    key: "jeudi",
    label: "Jeudi",
    selector: selectHoraireJeudi,
    setter: "setHoraireJeudi",
  },
  {
    key: "vendredi",
    label: "Vendredi",
    selector: selectHoraireVendredi,
    setter: "setHoraireVendredi",
  },
  {
    key: "samedi",
    label: "Samedi",
    selector: selectHoraireSamedi,
    setter: "setHoraireSamedi",
  },
  {
    key: "dimanche",
    label: "Dimanche",
    selector: selectHoraireDimanche,
    setter: "setHoraireDimanche",
  },
];

const MobileCreateEmplacement = () => {
  const navigate = useNavigate();

  // Charger les utilisateurs
  const { users, loading: usersLoading } = useUsers();

  // Store - Valeurs
  const typeFamille = useCreateEmplacementStore(selectTypeFamille);
  const typeSousType = useCreateEmplacementStore(selectTypeSousType);
  const denomination = useCreateEmplacementStore(selectDenomination);
  const theme = useCreateEmplacementStore(selectTheme);
  const themeDescription = useCreateEmplacementStore(selectThemeDescription);
  const departement = useCreateEmplacementStore(selectDepartement);
  const commune = useCreateEmplacementStore(selectCommune);
  const arrondissement = useCreateEmplacementStore(selectArrondissement);
  const quartier = useCreateEmplacementStore(selectQuartier);
  const longitude = useCreateEmplacementStore(selectLongitude);
  const latitude = useCreateEmplacementStore(selectLatitude);
  const vendeurId = useCreateEmplacementStore(selectVendeurId);
  const isSubmitting = useCreateEmplacementStore(selectIsSubmitting);

  // Store - Actions
  const {
    setTypeFamille,
    setTypeSousType,
    setDenomination,
    setTheme,
    setThemeDescription,
    setDepartement,
    setCommune,
    setArrondissement,
    setQuartier,
    setLongitude,
    setLatitude,
    setVendeurId,
    setIsSubmitting,
    setSubmitError,
    validateForm,
    getFormData,
    resetForm,
  } = useCreateEmplacementStore();

  // Handlers
  const handleSubmit = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const formData = await getFormData();
      const result = await createEmplacement(formData);

      toast.success("Emplacement créé avec succès");
      resetForm();
      navigate(`/admin/settings/emplacements/gerer/${result.id}`);
    } catch (error) {
      console.error("Erreur création emplacement:", error);
      toast.error(error.message || "Erreur lors de la création");
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    navigate("/admin/settings/emplacements");
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Nouvel emplacement</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Créer un nouveau lieu de stockage ou de vente
        </p>
      </motion.div>

      {/* Type d'emplacement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Type d'emplacement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Famille *</label>
              <Select value={typeFamille} onValueChange={setTypeFamille}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLACEMENT_TYPE_CONFIG).map(
                    ([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    }
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Sous-type (optionnel)
              </label>
              <InputGroup>
                <InputGroupInput
                  placeholder="Ex: Boutique de quartier, Stand de marché..."
                  value={typeSousType}
                  onChange={(e) => setTypeSousType(e.target.value)}
                />
              </InputGroup>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Informations générales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dénomination *</label>
              <InputGroup>
                <InputGroupInput
                  placeholder="Nom de l'emplacement"
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                />
              </InputGroup>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Thème central *</label>
              <InputGroup>
                <InputGroupInput
                  placeholder="Ex: Sandwichs, Boissons..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </InputGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description du thème
              </label>
              <InputGroup>
                <InputGroupInput
                  placeholder="Détails sur les produits vendus..."
                  value={themeDescription}
                  onChange={(e) => setThemeDescription(e.target.value)}
                />
              </InputGroup>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Position */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localisation
            </CardTitle>
            <CardDescription>
              Position géographique de l'emplacement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Adresse intelligente avec autocomplétion */}
            <AddressInputGroup
              departement={departement}
              commune={commune}
              arrondissement={arrondissement}
              quartier={quartier}
              onDepartementChange={setDepartement}
              onCommuneChange={setCommune}
              onArrondissementChange={setArrondissement}
              onQuartierChange={setQuartier}
              required={true}
            />

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude *</label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Compass className="h-4 w-4" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    step="any"
                    placeholder="2.4419"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude *</label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Compass className="h-4 w-4" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    step="any"
                    placeholder="6.3654"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </InputGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vendeur actuel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Vendeur actuel
            </CardTitle>
            <CardDescription>
              Optionnel - Peut être ajouté plus tard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Sélectionner un vendeur
              </label>
              <Select
                value={vendeurId}
                onValueChange={setVendeurId}
                disabled={usersLoading}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      usersLoading ? "Chargement..." : "Choisir un vendeur"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aucun vendeur</SelectItem>
                  {users.map((user) => {
                    const fullName = `${user.nom} ${
                      user.prenoms?.join(" ") || ""
                    }`.trim();
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{fullName}</div>
                            {user.email && (
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {usersLoading && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <SmallLoader spinnerSize={12} />
                  Chargement des utilisateurs...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Horaires */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horaires
            </CardTitle>
            <CardDescription>Définir les heures d'ouverture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {JOURS_SEMAINE.map(({ key, label, selector, setter }) => {
              const horaire = useCreateEmplacementStore(selector);
              const store = useCreateEmplacementStore();

              return (
                <div
                  key={key}
                  className="space-y-3 pb-4 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{label}</label>
                    <Switch
                      checked={horaire.ouvert}
                      onCheckedChange={(checked) => {
                        store[setter]({ ...horaire, ouvert: checked });
                      }}
                    />
                  </div>

                  {horaire.ouvert && (
                    <div className="grid grid-cols-2 gap-3 pl-4">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Ouverture
                        </label>
                        <InputGroup>
                          <InputGroupInput
                            type="time"
                            value={horaire.ouverture}
                            onChange={(e) => {
                              store[setter]({
                                ...horaire,
                                ouverture: e.target.value,
                              });
                            }}
                          />
                        </InputGroup>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Fermeture
                        </label>
                        <InputGroup>
                          <InputGroupInput
                            type="time"
                            value={horaire.fermeture}
                            onChange={(e) => {
                              store[setter]({
                                ...horaire,
                                fermeture: e.target.value,
                              });
                            }}
                          />
                        </InputGroup>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleCancel}
          disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <SmallLoader text="Création" spinnerSize={16} />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Créer
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default MobileCreateEmplacement;
