import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Loader2,
  AlertCircle,
  X,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useComptes } from "@/toolkits/admin/comptabiliteToolkit";

const DesktopGererLesComptes = () => {
  const navigate = useNavigate();
  const { comptes, loading, error } = useComptes();

  // États des filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filtrage des comptes
  const filteredComptes = useMemo(() => {
    if (!comptes) return [];

    return comptes.filter((compte) => {
      // Filtre par recherche (code ou dénomination)
      const matchesSearch =
        searchQuery === "" ||
        compte.code_ohada.toLowerCase().includes(searchQuery.toLowerCase()) ||
        compte.denomination.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtre par type
      const matchesType = typeFilter === "all" || compte.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [comptes, searchQuery, typeFilter]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "entree":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "sortie":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case "entree/sortie":
        return <ArrowLeftRight className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "entree":
        return "bg-green-100 text-green-700 border-green-200";
      case "sortie":
        return "bg-red-100 text-red-700 border-red-200";
      case "entree/sortie":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleCompteClick = (compteId) => {
    navigate(`/admin/settings/comptabilite/gerer/${compteId}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  // Statistiques
  const stats = useMemo(() => {
    if (!comptes) return { entree: 0, sortie: 0, mixte: 0 };
    return {
      entree: comptes.filter((c) => c.type === "entree").length,
      sortie: comptes.filter((c) => c.type === "sortie").length,
      mixte: comptes.filter((c) => c.type === "entree/sortie").length,
    };
  }, [comptes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Chargement des comptes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-lg">Erreur</p>
                <p className="text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Gérer les Comptes
          </h1>
          <p className="text-muted-foreground mt-1">
            {comptes?.length || 0} compte(s) disponible(s)
          </p>
        </div>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.entree}
                  </p>
                  <p className="text-sm text-green-700">Comptes d'entrée</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.sortie}
                  </p>
                  <p className="text-sm text-red-700">Comptes de sortie</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.mixte}
                  </p>
                  <p className="text-sm text-blue-700">Comptes mixtes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="lg:col-span-2 space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Search className="h-4 w-4" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="text"
                    placeholder="Code OHADA ou dénomination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <InputGroupAddon align="inline-end">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </div>

              {/* Filtre par type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de compte</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="entree">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Entrée</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sortie">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span>Sortie</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="entree/sortie">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                        <span>Mixte (Entrée/Sortie)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Réinitialiser et compteur */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredComptes.length !== comptes?.length ? (
                  <>
                    <span className="font-medium text-foreground">
                      {filteredComptes.length}
                    </span>{" "}
                    résultat(s) sur {comptes?.length || 0}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {filteredComptes.length}
                    </span>{" "}
                    compte(s)
                  </>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grille des comptes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredComptes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full"
            >
              <Card className="border-dashed">
                <CardContent className="pt-8 pb-8 text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Aucun compte trouvé
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Essayez de modifier vos critères de recherche
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredComptes.map((compte, index) => (
              <motion.div
                key={compte.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                layout
              >
                <Card
                  className="h-full cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/20"
                  onClick={() => handleCompteClick(compte.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {getTypeIcon(compte.type)}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getTypeBadgeColor(
                          compte.type
                        )}`}
                      >
                        {compte.type === "entree/sortie"
                          ? "Mixte"
                          : compte.type === "entree"
                          ? "Entrée"
                          : "Sortie"}
                      </span>
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                      {compte.denomination}
                    </CardTitle>
                    <p className="text-sm font-mono text-muted-foreground font-semibold">
                      Code: {compte.code_ohada}
                    </p>
                  </CardHeader>
                  {compte.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {compte.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DesktopGererLesComptes;
