/**
 * MobileGererUnEmplacement.jsx
 * Page de détail et d'édition d'un emplacement (version mobile)
 * - Tabs: Détails | Stock
 * - Détails: Champs éditables avec InputGroup
 * - Stock: Affichage du stock actuel par élément
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Store,
  ArrowLeft,
  Save,
  Info,
  Package,
  MapPin,
  User,
  Clock,
  Tag,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import SmallLoader from "@/components/global/SmallLoader.jsx";
import AddressInputGroup from "@/components/global/AddressInputGroup.jsx";

import {
  useEmplacement,
  updateEmplacement,
  EMPLACEMENT_TYPES,
} from "@/toolkits/admin/emplacementToolkit.jsx";
import { useUsers } from "@/toolkits/admin/userToolkit.jsx";

import useEditEmplacementStore, {
  selectDenomination,
  selectTypeFamille,
  selectTypeSousType,
  selectThemeCentral,
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
  selectStatus,
  selectIsSubmitting,
} from "@/stores/admin/useEditEmplacementStore.js";

const EMPLACEMENT_TYPE_CONFIG = {
  [EMPLACEMENT_TYPES.ENTREPOT]: { label: "Entrepôt", icon: Package },
  [EMPLACEMENT_TYPES.POINT_DE_VENTE]: { label: "Point de vente", icon: Store },
  [EMPLACEMENT_TYPES.STAND]: { label: "Stand", icon: MapPin },
};

const JOURS_SEMAINE = [
  { key: "lundi", label: "Lundi", selector: selectHoraireLundi, setter: "setHoraireLundi" },
  { key: "mardi", label: "Mardi", selector: selectHoraireMardi, setter: "setHoraireMardi" },
  { key: "mercredi", label: "Mercredi", selector: selectHoraireMercredi, setter: "setHoraireMercredi" },
  { key: "jeudi", label: "Jeudi", selector: selectHoraireJeudi, setter: "setHoraireJeudi" },
  { key: "vendredi", label: "Vendredi", selector: selectHoraireVendredi, setter: "setHoraireVendredi" },
  { key: "samedi", label: "Samedi", selector: selectHoraireSamedi, setter: "setHoraireSamedi" },
  { key: "dimanche", label: "Dimanche", selector: selectHoraireDimanche, setter: "setHoraireDimanche" },
];

const MobileGererUnEmplacement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");

  // Charger l'emplacement
  const { emplacement, loading, error } = useEmplacement(id);

  // Charger les utilisateurs
  const { users, loading: usersLoading } = useUsers();

  // Store
  const denomination = useEditEmplacementStore(selectDenomination);
  const typeFamille = useEditEmplacementStore(selectTypeFamille);
  const typeSousType = useEditEmplacementStore(selectTypeSousType);
  const themeCentral = useEditEmplacementStore(selectThemeCentral);
  const themeDescription = useEditEmplacementStore(selectThemeDescription);
  const departement = useEditEmplacementStore(selectDepartement);
  const commune = useEditEmplacementStore(selectCommune);
  const arrondissement = useEditEmplacementStore(selectArrondissement);
  const quartier = useEditEmplacementStore(selectQuartier);
  const longitude = useEditEmplacementStore(selectLongitude);
  const latitude = useEditEmplacementStore(selectLatitude);
  const vendeurId = useEditEmplacementStore(selectVendeurId);
  const status = useEditEmplacementStore(selectStatus);
  const isSubmitting = useEditEmplacementStore(selectIsSubmitting);

  // Horaires - tous les hooks doivent être appelés avant le render
  const horaireLundi = useEditEmplacementStore(selectHoraireLundi);
  const horaireMardi = useEditEmplacementStore(selectHoraireMardi);
  const horaireMercredi = useEditEmplacementStore(selectHoraireMercredi);
  const horaireJeudi = useEditEmplacementStore(selectHoraireJeudi);
  const horaireVendredi = useEditEmplacementStore(selectHoraireVendredi);
  const horaireSamedi = useEditEmplacementStore(selectHoraireSamedi);
  const horaireDimanche = useEditEmplacementStore(selectHoraireDimanche);

  const {
    setDenomination,
    setTypeFamille,
    setTypeSousType,
    setThemeCentral,
    setThemeDescription,
    setDepartement,
    setCommune,
    setArrondissement,
    setQuartier,
    setLongitude,
    setLatitude,
    setVendeurId,
    setStatus,
    setIsSubmitting,
    loadEmplacement,
    resetStore,
    setHoraireLundi,
    setHoraireMardi,
    setHoraireMercredi,
    setHoraireJeudi,
    setHoraireVendredi,
    setHoraireSamedi,
    setHoraireDimanche,
  } = useEditEmplacementStore();

  // Charger l'emplacement dans le store
  useEffect(() => {
    if (emplacement) {
      loadEmplacement(emplacement);
    }
    return () => resetStore();
  }, [emplacement, loadEmplacement, resetStore]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Récupérer les informations du vendeur sélectionné
      let vendeur = undefined;
      if (vendeurId && vendeurId !== "0") {
        const selectedUser = users.find((u) => u.id === vendeurId);
        if (selectedUser) {
          vendeur = {
            id: selectedUser.id,
            nom: selectedUser.nom,
            prenoms: selectedUser.prenoms || [],
          };
        }
      }

      const updates = {
        denomination,
        type: {
          famille: typeFamille,
          sous_type: typeSousType,
        },
        theme_central: {
          theme: themeCentral,
          description: themeDescription,
        },
        position: {
          actuelle: {
            departement,
            commune,
            arrondissement,
            quartier,
            localisation: {
              longitude: parseFloat(longitude),
              latitude: parseFloat(latitude),
            },
          },
          historique: emplacement?.position?.historique || [],
        },
        vendeur_actuel: vendeur,
        horaires: {
          lun: useEditEmplacementStore.getState().horaireLundi,
          mar: useEditEmplacementStore.getState().horaireMardi,
          mer: useEditEmplacementStore.getState().horaireMercredi,
          jeu: useEditEmplacementStore.getState().horaireJeudi,
          ven: useEditEmplacementStore.getState().horaireVendredi,
          sam: useEditEmplacementStore.getState().horaireSamedi,
          dim: useEditEmplacementStore.getState().horaireDimanche,
        },
        status,
      };

      await updateEmplacement(id, updates);
      toast.success("Emplacement mis à jour");
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SmallLoader text="Chargement de l'emplacement" />
      </div>
    );
  }

  if (error || !emplacement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground">{error || "Emplacement non trouvé"}</p>
        <Button onClick={() => navigate("/admin/settings/emplacements")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  // Calculer le stock total
  const stockTotal = emplacement.stock_actuel
    ? Object.values(emplacement.stock_actuel).reduce((sum, item) => sum + (item.quantite_actuelle || 0), 0)
    : 0;

  // Mapping des horaires pour éviter l'appel de hooks dans le map
  const horairesMap = {
    lundi: { value: horaireLundi, setter: setHoraireLundi },
    mardi: { value: horaireMardi, setter: setHoraireMardi },
    mercredi: { value: horaireMercredi, setter: setHoraireMercredi },
    jeudi: { value: horaireJeudi, setter: setHoraireJeudi },
    vendredi: { value: horaireVendredi, setter: setHoraireVendredi },
    samedi: { value: horaireSamedi, setter: setHoraireSamedi },
    dimanche: { value: horaireDimanche, setter: setHoraireDimanche },
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/settings/emplacements")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="mt-2">
          <h1 className="text-xl font-bold">{emplacement.denomination}</h1>
          <p className="text-xs text-muted-foreground">
            {EMPLACEMENT_TYPE_CONFIG[emplacement.type?.famille]?.label}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-4">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === "details"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}>
          <div className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            Détails
          </div>
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === "stock"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}>
          <div className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4" />
            Stock
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4">

            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText><Store className="h-4 w-4" /></InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Dénomination"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                  />
                </InputGroup>

                <Select value={typeFamille} onValueChange={setTypeFamille}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'emplacement" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLACEMENT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText><Tag className="h-4 w-4" /></InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Sous-type (optionnel)"
                    value={typeSousType}
                    onChange={(e) => setTypeSousType(e.target.value)}
                  />
                </InputGroup>

                <Separator />

                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText><TrendingUp className="h-4 w-4" /></InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Thème central"
                    value={themeCentral}
                    onChange={(e) => setThemeCentral(e.target.value)}
                  />
                </InputGroup>

                <InputGroup>
                  <InputGroupTextarea
                    placeholder="Description du thème"
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    rows={3}
                  />
                </InputGroup>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Statut actif</label>
                  <Switch checked={status} onCheckedChange={setStatus} />
                </div>
              </CardContent>
            </Card>

            {/* Position */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddressInputGroup
                  departement={departement}
                  commune={commune}
                  arrondissement={arrondissement}
                  quartier={quartier}
                  onDepartementChange={setDepartement}
                  onCommuneChange={setCommune}
                  onArrondissementChange={setArrondissement}
                  onQuartierChange={setQuartier}
                />

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <InputGroup>
                    <InputGroupInput
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </InputGroup>
                  <InputGroup>
                    <InputGroupInput
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </InputGroup>
                </div>
              </CardContent>
            </Card>

            {/* Vendeur */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vendeur actuel
                </CardTitle>
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
                            <div className="flex flex-col">
                              <span className="font-medium">{fullName}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Horaires */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {JOURS_SEMAINE.map(({ key, label }) => {
                  const { value: horaire, setter } = horairesMap[key];

                  return (
                    <div key={key} className="space-y-2 pb-3 border-b last:border-b-0">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{label}</label>
                        <Switch
                          checked={horaire.ouvert}
                          onCheckedChange={(checked) => {
                            setter({ ...horaire, ouvert: checked });
                          }}
                        />
                      </div>

                      {horaire.ouvert && (
                        <div className="grid grid-cols-2 gap-2 pl-4">
                          <InputGroup>
                            <InputGroupInput
                              type="time"
                              value={horaire.ouverture}
                              onChange={(e) => {
                                setter({ ...horaire, ouverture: e.target.value });
                              }}
                            />
                          </InputGroup>
                          <InputGroup>
                            <InputGroupInput
                              type="time"
                              value={horaire.fermeture}
                              onChange={(e) => {
                                setter({ ...horaire, fermeture: e.target.value });
                              }}
                            />
                          </InputGroup>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <SmallLoader text="Sauvegarde" spinnerSize={16} />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </motion.div>
        )}

        {activeTab === "stock" && (
          <motion.div
            key="stock"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stockTotal === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Aucun stock dans cet emplacement</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <div className="text-sm text-muted-foreground">Stock total</div>
                      <div className="text-2xl font-bold text-primary">{stockTotal} articles</div>
                    </div>

                    {Object.entries(emplacement.stock_actuel || {}).map(([elementId, item]) => (
                      <Card key={elementId}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.denomination || elementId}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.type && EMPLACEMENT_TYPE_CONFIG[item.type]?.label}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{item.quantite_actuelle || 0}</div>
                              <div className="text-xs text-muted-foreground">{item.unite?.symbol}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileGererUnEmplacement;
