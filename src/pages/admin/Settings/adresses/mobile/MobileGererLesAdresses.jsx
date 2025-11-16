import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building2,
  Map,
  MapPinned,
  Search,
  Power,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useFullPageLoader } from "@/components/global/FullPageLoader";
import {
  getAllAdresses,
  getDepartementsBeninList,
  toggleStatutDepartement,
  toggleStatutCommuneAuto,
  toggleStatutArrondissementAuto,
  toggleStatutQuartierAuto,
} from "@/toolkits/admin/adresseToolkit";

const MobileGererLesAdresses = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useFullPageLoader();
  const [activeTab, setActiveTab] = useState("adresses");
  const [isLoading, setIsLoading] = useState(true);
  const [adresses, setAdresses] = useState([]);

  // États de filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartement, setFilterDepartement] = useState("");
  const [filterCommune, setFilterCommune] = useState("");
  const [filterArrondissement, setFilterArrondissement] = useState("");
  const [filterQuartier, setFilterQuartier] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");

  // Listes pour les filtres
  const [departements, setDepartements] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [arrondissements, setArrondissements] = useState([]);
  const [quartiers, setQuartiers] = useState([]);

  // Charger les adresses
  useEffect(() => {
    loadAdresses();
  }, []);

  const loadAdresses = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAdresses();
      setAdresses(data);

      // Extraire les valeurs uniques pour les filtres
      const depts = [...new Set(data.map((a) => a.departement))].filter(Boolean);
      const comms = [...new Set(data.map((a) => a.commune))].filter(Boolean);
      const arrs = [...new Set(data.map((a) => a.arrondissement))].filter(Boolean);
      const quarts = [...new Set(data.map((a) => a.quartier))].filter(Boolean);

      setDepartements(depts.sort());
      setCommunes(comms.sort());
      setArrondissements(arrs.sort());
      setQuartiers(quarts.sort());
    } catch (error) {
      console.error("Erreur chargement adresses:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les adresses
  const filteredAdresses = adresses.filter((adresse) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        adresse.nom?.toLowerCase().includes(query) ||
        adresse.departement?.toLowerCase().includes(query) ||
        adresse.commune?.toLowerCase().includes(query) ||
        adresse.arrondissement?.toLowerCase().includes(query) ||
        adresse.quartier?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filterDepartement && filterDepartement !== "__all__" && adresse.departement !== filterDepartement) return false;
    if (filterCommune && filterCommune !== "__all__" && adresse.commune !== filterCommune) return false;
    if (filterArrondissement && filterArrondissement !== "__all__" && adresse.arrondissement !== filterArrondissement)
      return false;
    if (filterQuartier && filterQuartier !== "__all__" && adresse.quartier !== filterQuartier) return false;
    if (filterStatut === "active" && !adresse.statut) return false;
    if (filterStatut === "inactive" && adresse.statut) return false;

    return true;
  });

  const activeCount = filteredAdresses.filter((a) => a.statut).length;
  const totalCount = filteredAdresses.length;

  // Listes filtrées dynamiquement pour les selects
  const availableCommunes = filterDepartement && filterDepartement !== "__all__"
    ? [...new Set(
        adresses
          .filter((a) => a.departement === filterDepartement)
          .map((a) => a.commune)
      )].filter(Boolean).sort()
    : communes;

  const availableArrondissements = (() => {
    let filtered = adresses;
    if (filterDepartement && filterDepartement !== "__all__") {
      filtered = filtered.filter((a) => a.departement === filterDepartement);
    }
    if (filterCommune && filterCommune !== "__all__") {
      filtered = filtered.filter((a) => a.commune === filterCommune);
    }
    return [...new Set(filtered.map((a) => a.arrondissement))].filter(Boolean).sort();
  })();

  const availableQuartiers = (() => {
    let filtered = adresses;
    if (filterDepartement && filterDepartement !== "__all__") {
      filtered = filtered.filter((a) => a.departement === filterDepartement);
    }
    if (filterCommune && filterCommune !== "__all__") {
      filtered = filtered.filter((a) => a.commune === filterCommune);
    }
    if (filterArrondissement && filterArrondissement !== "__all__") {
      filtered = filtered.filter((a) => a.arrondissement === filterArrondissement);
    }
    return [...new Set(filtered.map((a) => a.quartier))].filter(Boolean).sort();
  })();

  // Réinitialiser les filtres enfants quand le parent change
  useEffect(() => {
    if (filterDepartement && filterDepartement !== "__all__") {
      if (filterCommune && filterCommune !== "__all__" && !availableCommunes.includes(filterCommune)) {
        setFilterCommune("__all__");
      }
    }
  }, [filterDepartement, availableCommunes, filterCommune]);

  useEffect(() => {
    if ((filterDepartement && filterDepartement !== "__all__") || (filterCommune && filterCommune !== "__all__")) {
      if (filterArrondissement && filterArrondissement !== "__all__" && !availableArrondissements.includes(filterArrondissement)) {
        setFilterArrondissement("__all__");
      }
    }
  }, [filterDepartement, filterCommune, availableArrondissements, filterArrondissement]);

  useEffect(() => {
    if ((filterDepartement && filterDepartement !== "__all__") || (filterCommune && filterCommune !== "__all__") || (filterArrondissement && filterArrondissement !== "__all__")) {
      if (filterQuartier && filterQuartier !== "__all__" && !availableQuartiers.includes(filterQuartier)) {
        setFilterQuartier("__all__");
      }
    }
  }, [filterDepartement, filterCommune, filterArrondissement, availableQuartiers, filterQuartier]);

  // Gérer le changement de statut
  const handleToggleStatut = async (type, value) => {
    const messages = {
      departement: `Activation du département ${value}...`,
      commune: `Activation de la commune ${value}...`,
      arrondissement: `Activation de l'arrondissement ${value}...`,
      quartier: `Activation du quartier ${value}...`,
    };

    showLoader(messages[type] || "Mise à jour en cours...");

    try {
      let result;
      switch (type) {
        case "departement":
          result = await toggleStatutDepartement(value, true);
          toast.success(`${value} activé (${result.updated} adresses)`);
          break;
        case "commune":
          result = await toggleStatutCommuneAuto(value, true);
          toast.success(`${value} activé (${result.updated} adresses)`);
          break;
        case "arrondissement":
          result = await toggleStatutArrondissementAuto(value, true);
          toast.success(`${value} activé (${result.updated} adresses)`);
          break;
        case "quartier":
          result = await toggleStatutQuartierAuto(value, true);
          toast.success(`${value} activé (${result.updated} adresses)`);
          break;
      }
      await loadAdresses();
    } catch (error) {
      console.error("Erreur toggle statut:", error);
      toast.error("Erreur");
    } finally {
      hideLoader();
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery("");
    setFilterDepartement("__all__");
    setFilterCommune("__all__");
    setFilterArrondissement("__all__");
    setFilterQuartier("__all__");
    setFilterStatut("all");
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Gérer Adresses</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            {activeCount} / {totalCount} actives
          </p>
          <Button
            size="sm"
            onClick={() => navigate("/admin/settings/adresses/create")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("adresses")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "adresses"
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          Adresses
          {activeTab === "adresses" && (
            <motion.div
              layoutId="activeTabMobile"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("gerer")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "gerer" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          Gérer
          {activeTab === "gerer" && (
            <motion.div
              layoutId="activeTabMobile"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "adresses" && (
          <motion.div
            key="adresses"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Recherche */}
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>
                  <Search />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>

            {/* Filtres */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Filtres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filterDepartement || undefined}
                    onValueChange={setFilterDepartement}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Tous</SelectItem>
                      {departements.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept.charAt(0).toUpperCase() + dept.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterCommune || undefined}
                    onValueChange={setFilterCommune}
                    disabled={!filterDepartement || filterDepartement === "__all__"}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder={!filterDepartement || filterDepartement === "__all__" ? "Dept. d'abord" : "Commune"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Toutes</SelectItem>
                      {availableCommunes.map((comm) => (
                        <SelectItem key={comm} value={comm}>
                          {comm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filterArrondissement || undefined}
                    onValueChange={setFilterArrondissement}
                    disabled={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__")}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__") ? "Parent d'abord" : "Arrondiss."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Tous</SelectItem>
                      {availableArrondissements.map((arr) => (
                        <SelectItem key={arr} value={arr}>
                          {arr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterQuartier || undefined}
                    onValueChange={setFilterQuartier}
                    disabled={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__") && (!filterArrondissement || filterArrondissement === "__all__")}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__") && (!filterArrondissement || filterArrondissement === "__all__") ? "Parent d'abord" : "Quartier"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Tous</SelectItem>
                      {availableQuartiers.map((quart) => (
                        <SelectItem key={quart} value={quart}>
                          {quart}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={resetFilters}
                >
                  Réinitialiser
                </Button>
              </CardContent>
            </Card>

            {/* Liste des adresses */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAdresses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune adresse</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAdresses.map((adresse) => (
                  <motion.div
                    key={adresse.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card
                      className="cursor-pointer active:scale-95 transition-transform"
                      onClick={() =>
                        navigate(`/admin/settings/adresses/gerer/${adresse.id}`)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">
                              {adresse.nom || adresse.quartier || adresse.commune}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              ID: {adresse.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {adresse.statut ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>
                              {adresse.departement?.charAt(0).toUpperCase() +
                                adresse.departement?.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <span>{adresse.commune}</span>
                          </div>
                          {adresse.arrondissement && (
                            <div className="flex items-center gap-2 text-xs">
                              <Map className="w-3 h-3 text-muted-foreground" />
                              <span>{adresse.arrondissement}</span>
                            </div>
                          )}
                          {adresse.quartier && (
                            <div className="flex items-center gap-2 text-xs">
                              <MapPinned className="w-3 h-3 text-muted-foreground" />
                              <span>{adresse.quartier}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "gerer" && (
          <motion.div
            key="gerer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Card Départements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Départements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {getDepartementsBeninList()
                  .filter((d) => d !== "inconnu")
                  .map((dept) => (
                    <div
                      key={dept}
                      className="flex items-center justify-between p-2 rounded-lg border text-sm"
                    >
                      <span className="font-medium">
                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatut("departement", dept)}
                      >
                        <Power className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Card Communes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Communes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {communes.slice(0, 10).map((commune) => (
                  <div
                    key={commune}
                    className="flex items-center justify-between p-2 rounded-lg border text-sm"
                  >
                    <span className="font-medium">{commune}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatut("commune", commune)}
                    >
                      <Power className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Card Arrondissements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Arrondissements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {arrondissements.slice(0, 10).map((arr) => (
                  <div
                    key={arr}
                    className="flex items-center justify-between p-2 rounded-lg border text-sm"
                  >
                    <span className="font-medium">{arr}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatut("arrondissement", arr)}
                    >
                      <Power className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Card Quartiers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPinned className="w-4 h-4" />
                  Quartiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quartiers.slice(0, 10).map((quartier) => (
                  <div
                    key={quartier}
                    className="flex items-center justify-between p-2 rounded-lg border text-sm"
                  >
                    <span className="font-medium">{quartier}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatut("quartier", quartier)}
                    >
                      <Power className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileGererLesAdresses;
