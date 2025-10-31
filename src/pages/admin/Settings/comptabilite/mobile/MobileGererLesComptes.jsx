import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MobileGererLesComptes = () => {
  const navigate = useNavigate();
  const { comptes, loading, error } = useComptes();

  // États des filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        return "bg-green-100 text-green-700";
      case "sortie":
        return "bg-red-100 text-red-700";
      case "entree/sortie":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleCompteClick = (compteId) => {
    navigate(`/admin/settings/comptabilite/gerer/${compteId}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const activeFiltersCount = (searchQuery ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">
            Chargement des comptes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Erreur</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Gérer les Comptes
        </h1>
        <p className="text-sm text-muted-foreground">
          {comptes?.length || 0} compte(s) disponible(s)
        </p>
      </motion.div>

      {/* Barre de recherche et filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {/* Recherche */}
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>
              <Search className="h-4 w-4" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Rechercher par code ou nom..."
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

        {/* Bouton filtres avec Sheet */}
        <div className="flex items-center gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 relative">
                <Filter className="mr-2 h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[300px]">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
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
                          <span>Mixte</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearFilters}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Compteur de résultats */}
      {filteredComptes.length !== comptes?.length && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          {filteredComptes.length} résultat(s) sur {comptes?.length || 0}
        </motion.p>
      )}

      {/* Liste des comptes */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredComptes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun compte trouvé
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredComptes.map((compte, index) => (
              <motion.div
                key={compte.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCompteClick(compte.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getTypeIcon(compte.type)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight line-clamp-2">
                            {compte.denomination}
                          </CardTitle>
                          <p className="text-sm font-mono text-muted-foreground mt-1">
                            Code: {compte.code_ohada}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${getTypeBadgeColor(
                            compte.type
                          )}`}
                        >
                          {compte.type === "entree/sortie"
                            ? "Mixte"
                            : compte.type === "entree"
                            ? "Entrée"
                            : "Sortie"}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  {compte.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
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

export default MobileGererLesComptes;
