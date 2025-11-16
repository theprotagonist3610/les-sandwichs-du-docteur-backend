/**
 * DesktopGererUnEmplacement.jsx - Version desktop de la page de détail d'un emplacement
 * Grid 2 colonnes spacieuse avec édition complète des informations
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Store, ArrowLeft, Save, Package, MapPin, User, Clock, Tag, TrendingUp,
  AlertCircle, Compass,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import SmallLoader from "@/components/global/SmallLoader.jsx";
import AddressInputGroup from "@/components/global/AddressInputGroup.jsx";

import { useEmplacement, updateEmplacement, EMPLACEMENT_TYPES } from "@/toolkits/admin/emplacementToolkit.jsx";
import { useUsers } from "@/toolkits/admin/userToolkit.jsx";
import useEditEmplacementStore, {
  selectDenomination, selectTypeFamille, selectTypeSousType, selectThemeCentral, selectThemeDescription,
  selectDepartement, selectCommune, selectArrondissement, selectQuartier, selectLongitude, selectLatitude,
  selectVendeurId, selectHoraireLundi, selectHoraireMardi, selectHoraireMercredi,
  selectHoraireJeudi, selectHoraireVendredi, selectHoraireSamedi, selectHoraireDimanche, selectStatus, selectIsSubmitting,
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

const DesktopGererUnEmplacement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { emplacement, loading, error } = useEmplacement(id);

  // Charger les utilisateurs
  const { users, loading: usersLoading } = useUsers();

  // Store values
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

  const { setDenomination, setTypeFamille, setTypeSousType, setThemeCentral, setThemeDescription,
    setDepartement, setCommune, setArrondissement, setQuartier, setLongitude, setLatitude,
    setVendeurId, setStatus, setIsSubmitting, loadEmplacement, resetStore,
    setHoraireLundi, setHoraireMardi, setHoraireMercredi, setHoraireJeudi, setHoraireVendredi,
    setHoraireSamedi, setHoraireDimanche,
  } = useEditEmplacementStore();

  useEffect(() => {
    if (emplacement) loadEmplacement(emplacement);
    return () => resetStore();
  }, [emplacement, loadEmplacement, resetStore]);

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

      await updateEmplacement(id, {
        denomination, type: { famille: typeFamille, sous_type: typeSousType },
        theme_central: { theme: themeCentral, description: themeDescription },
        position: {
          actuelle: { departement, commune, arrondissement, quartier,
            localisation: { longitude: parseFloat(longitude), latitude: parseFloat(latitude) }
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
      });
      toast.success("Emplacement mis à jour");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><SmallLoader text="Chargement" /></div>;
  if (error || !emplacement) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <AlertCircle className="h-16 w-16 text-destructive mb-4" />
      <p className="text-muted-foreground mb-6">{error || "Emplacement non trouvé"}</p>
      <Button onClick={() => navigate("/admin/settings/emplacements")}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
    </div>
  );

  const stockTotal = emplacement.stock_actuel ? Object.values(emplacement.stock_actuel).reduce((sum, item) => sum + (item.quantite_actuelle || 0), 0) : 0;

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/admin/settings/emplacements")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />Retour
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{emplacement.denomination}</h1>
              <p className="text-muted-foreground mt-2">{EMPLACEMENT_TYPE_CONFIG[emplacement.type?.famille]?.label}</p>
            </div>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <SmallLoader text="Sauvegarde" spinnerSize={16} /> : <><Save className="h-5 w-5 mr-2" />Sauvegarder</>}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Informations générales</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dénomination *</label>
                      <InputGroup><InputGroupInput value={denomination} onChange={(e) => setDenomination(e.target.value)} /></InputGroup>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type *</label>
                      <Select value={typeFamille} onValueChange={setTypeFamille}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLACEMENT_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sous-type</label>
                    <InputGroup><InputGroupAddon><InputGroupText><Tag className="h-4 w-4" /></InputGroupText></InputGroupAddon>
                      <InputGroupInput value={typeSousType} onChange={(e) => setTypeSousType(e.target.value)} />
                    </InputGroup>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Thème central *</label>
                      <InputGroup><InputGroupAddon><InputGroupText><TrendingUp className="h-4 w-4" /></InputGroupText></InputGroupAddon>
                        <InputGroupInput value={themeCentral} onChange={(e) => setThemeCentral(e.target.value)} />
                      </InputGroup>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Statut</label>
                      <div className="flex items-center h-10 px-3 border rounded-md">
                        <Switch checked={status} onCheckedChange={setStatus} />
                        <span className="ml-2 text-sm">{status ? "Actif" : "Inactif"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description du thème</label>
                    <InputGroup><InputGroupTextarea value={themeDescription} onChange={(e) => setThemeDescription(e.target.value)} rows={3} /></InputGroup>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Localisation</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <AddressInputGroup
                    departement={departement} commune={commune} arrondissement={arrondissement} quartier={quartier}
                    onDepartementChange={setDepartement} onCommuneChange={setCommune}
                    onArrondissementChange={setArrondissement} onQuartierChange={setQuartier}
                  />
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Longitude *</label>
                      <InputGroup><InputGroupAddon><InputGroupText><Compass className="h-4 w-4" /></InputGroupText></InputGroupAddon>
                        <InputGroupInput type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                      </InputGroup>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Latitude *</label>
                      <InputGroup><InputGroupAddon><InputGroupText><Compass className="h-4 w-4" /></InputGroupText></InputGroupAddon>
                        <InputGroupInput type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                      </InputGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Vendeur</CardTitle><CardDescription>Optionnel</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sélectionner un vendeur</label>
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
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Horaires</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {JOURS_SEMAINE.map(({ key, label }) => {
                    const { value: horaire, setter } = horairesMap[key];
                    return (
                      <div key={key} className="space-y-2 pb-3 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">{label}</label>
                          <Switch checked={horaire.ouvert} onCheckedChange={(checked) => { setter({ ...horaire, ouvert: checked }); }} />
                        </div>
                        {horaire.ouvert && (
                          <div className="grid grid-cols-2 gap-2 pl-4">
                            <InputGroup><InputGroupInput type="time" value={horaire.ouverture} onChange={(e) => { setter({ ...horaire, ouverture: e.target.value }); }} /></InputGroup>
                            <InputGroup><InputGroupInput type="time" value={horaire.fermeture} onChange={(e) => { setter({ ...horaire, fermeture: e.target.value }); }} /></InputGroup>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Stock actuel</CardTitle></CardHeader>
                <CardContent>
                  {stockTotal === 0 ? (
                    <div className="text-center py-8"><Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">Aucun stock</p></div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/5 rounded-lg">
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-2xl font-bold text-primary">{stockTotal}</div>
                        <div className="text-xs text-muted-foreground">articles</div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {Object.entries(emplacement.stock_actuel || {}).map(([elementId, item]) => (
                          <div key={elementId} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.denomination || elementId}</p>
                                <p className="text-xs text-muted-foreground">{item.type}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{item.quantite_actuelle || 0}</div>
                                <div className="text-xs text-muted-foreground">{item.unite?.symbol}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopGererUnEmplacement;
