import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building2,
  Map,
  MapPinned,
  Filter,
  Search,
  Power,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
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
import { Separator } from "@/components/ui/separator";
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

const DesktopGererLesAdresses = () => {
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
      toast.error("Erreur lors du chargement des adresses");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les adresses
  const filteredAdresses = adresses.filter((adresse) => {
    // Filtre par recherche
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

    // Filtre par département
    if (filterDepartement && filterDepartement !== "__all__" && adresse.departement !== filterDepartement) return false;

    // Filtre par commune
    if (filterCommune && filterCommune !== "__all__" && adresse.commune !== filterCommune) return false;

    // Filtre par arrondissement
    if (filterArrondissement && filterArrondissement !== "__all__" && adresse.arrondissement !== filterArrondissement)
      return false;

    // Filtre par quartier
    if (filterQuartier && filterQuartier !== "__all__" && adresse.quartier !== filterQuartier) return false;

    // Filtre par statut
    if (filterStatut === "active" && !adresse.statut) return false;
    if (filterStatut === "inactive" && adresse.statut) return false;

    return true;
  });

  // Compter les adresses actives
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
      // Si la commune sélectionnée n'existe pas dans le département, la réinitialiser
      if (filterCommune && filterCommune !== "__all__" && !availableCommunes.includes(filterCommune)) {
        setFilterCommune("__all__");
      }
    }
  }, [filterDepartement, availableCommunes, filterCommune]);

  useEffect(() => {
    if ((filterDepartement && filterDepartement !== "__all__") || (filterCommune && filterCommune !== "__all__")) {
      // Si l'arrondissement sélectionné n'existe pas, le réinitialiser
      if (filterArrondissement && filterArrondissement !== "__all__" && !availableArrondissements.includes(filterArrondissement)) {
        setFilterArrondissement("__all__");
      }
    }
  }, [filterDepartement, filterCommune, availableArrondissements, filterArrondissement]);

  useEffect(() => {
    if ((filterDepartement && filterDepartement !== "__all__") || (filterCommune && filterCommune !== "__all__") || (filterArrondissement && filterArrondissement !== "__all__")) {
      // Si le quartier sélectionné n'existe pas, le réinitialiser
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
          toast.success(`Département ${value} activé (${result.updated} adresses)`);
          break;
        case "commune":
          result = await toggleStatutCommuneAuto(value, true);
          toast.success(`Commune ${value} activée (${result.updated} adresses)`);
          break;
        case "arrondissement":
          result = await toggleStatutArrondissementAuto(value, true);
          toast.success(`Arrondissement ${value} activé (${result.updated} adresses)`);
          break;
        case "quartier":
          result = await toggleStatutQuartierAuto(value, true);
          toast.success(`Quartier ${value} activé (${result.updated} adresses)`);
          break;
      }
      await loadAdresses();
    } catch (error) {
      console.error("Erreur toggle statut:", error);
      toast.error("Erreur lors de la mise à jour");
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gérer les Adresses</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les départements, communes, arrondissements et adresses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                {activeCount} / {totalCount} actives
              </span>
            </div>
          </div>

          <Button onClick={() => navigate("/admin/settings/adresses/create")}>
            <MapPin className="w-4 h-4 mr-2" />
            Nouvelle adresse
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("adresses")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "adresses"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Adresses
          {activeTab === "adresses" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("gerer")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "gerer"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Gérer
          {activeTab === "gerer" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "adresses" && (
          <motion.div
            key="adresses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
                placeholder="Rechercher une adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>

            {/* Filtres inline */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtres
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Map className="w-4 h-4 text-muted-foreground" />
                      Département
                    </label>
                    <Select
                      value={filterDepartement || undefined}
                      onValueChange={setFilterDepartement}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Commune
                    </label>
                    <Select
                      value={filterCommune || undefined}
                      onValueChange={setFilterCommune}
                      disabled={!filterDepartement || filterDepartement === "__all__"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!filterDepartement || filterDepartement === "__all__" ? "Sélectionner département" : "Toutes"} />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPinned className="w-4 h-4 text-muted-foreground" />
                      Arrondissement
                    </label>
                    <Select
                      value={filterArrondissement || undefined}
                      onValueChange={setFilterArrondissement}
                      disabled={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__") ? "Sélectionner parent" : "Tous"} />
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Quartier
                    </label>
                    <Select
                      value={filterQuartier || undefined}
                      onValueChange={setFilterQuartier}
                      disabled={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__") && (!filterArrondissement || filterArrondissement === "__all__")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={(!filterDepartement || filterDepartement === "__all__") && (!filterCommune || filterCommune === "__all__") && (!filterArrondissement || filterArrondissement === "__all__") ? "Sélectionner parent" : "Tous"} />
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
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">Statut</span>
                  <Separator className="flex-1" />
                </div>

                <div className="flex justify-center">
                  <Select value={filterStatut} onValueChange={setFilterStatut}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Actifs uniquement
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Inactifs uniquement
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste des adresses */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAdresses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune adresse trouvée</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredAdresses.map((adresse) => (
                  <motion.div
                    key={adresse.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() =>
                        navigate(`/admin/settings/adresses/gerer/${adresse.id}`)
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">
                              {adresse.nom || adresse.quartier || adresse.commune}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {adresse.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {adresse.statut ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {adresse.departement?.charAt(0).toUpperCase() +
                              adresse.departement?.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{adresse.commune}</span>
                        </div>
                        {adresse.arrondissement && (
                          <div className="flex items-center gap-2 text-sm">
                            <Map className="w-4 h-4 text-muted-foreground" />
                            <span>{adresse.arrondissement}</span>
                          </div>
                        )}
                        {adresse.quartier && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPinned className="w-4 h-4 text-muted-foreground" />
                            <span>{adresse.quartier}</span>
                          </div>
                        )}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Card Départements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Départements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {getDepartementsBeninList()
                    .filter((d) => d !== "inconnu")
                    .map((dept) => (
                      <div
                        key={dept}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <span className="font-medium">
                          {dept.charAt(0).toUpperCase() + dept.slice(1)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatut("departement", dept)}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Card Communes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Communes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {communes.slice(0, 10).map((commune) => (
                    <div
                      key={commune}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <span className="font-medium">{commune}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatut("commune", commune)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Card Arrondissements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="w-5 h-5" />
                    Arrondissements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {arrondissements.slice(0, 10).map((arr) => (
                    <div
                      key={arr}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <span className="font-medium">{arr}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatut("arrondissement", arr)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Card Quartiers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPinned className="w-5 h-5" />
                    Quartiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {quartiers.slice(0, 10).map((quartier) => (
                    <div
                      key={quartier}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <span className="font-medium">{quartier}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatut("quartier", quartier)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopGererLesAdresses;
