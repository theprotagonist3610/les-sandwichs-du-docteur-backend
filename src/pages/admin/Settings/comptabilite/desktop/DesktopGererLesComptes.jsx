import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Wallet,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Building2,
  Hash,
  Loader2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import {
  useComptesListe,
  useComptesTresorerieListe,
} from "@/toolkits/admin/comptabiliteToolkit";

const DesktopGererLesComptes = () => {
  const navigate = useNavigate();

  // Hooks pour récupérer les comptes
  const { comptes: comptesComptables, loading: loadingComptables } = useComptesListe();
  const { comptes: comptesTresorerie, loading: loadingTresorerie } = useComptesTresorerieListe();

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("tous");
  const [sortBy, setSortBy] = useState("code"); // "code" | "denomination"

  // Filtrage et tri des comptes comptables
  const comptesComptablesFiltres = useMemo(() => {
    let filtered = comptesComptables || [];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (compte) =>
          compte.code_ohada.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.denomination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (categorieFilter !== "tous") {
      filtered = filtered.filter((compte) => compte.categorie === categorieFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === "code") {
        return a.code_ohada.localeCompare(b.code_ohada);
      } else {
        return a.denomination.localeCompare(b.denomination);
      }
    });

    return filtered;
  }, [comptesComptables, searchTerm, categorieFilter, sortBy]);

  // Filtrage et tri des comptes de trésorerie
  const comptesTresorerieFiltres = useMemo(() => {
    let filtered = comptesTresorerie || [];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (compte) =>
          compte.code_ohada.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.denomination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.numero?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === "code") {
        return a.code_ohada.localeCompare(b.code_ohada);
      } else {
        return a.denomination.localeCompare(b.denomination);
      }
    });

    return filtered;
  }, [comptesTresorerie, searchTerm, sortBy]);

  const handleCompteClick = (compteId) => {
    navigate(`/admin/settings/comptabilite/gerer/${compteId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gérer les Comptes</h1>
          <p className="text-muted-foreground mt-1">
            Visualisez et gérez tous vos comptes comptables et de trésorerie
          </p>
        </div>
        <Button onClick={() => navigate("/admin/settings/comptabilite/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau compte
        </Button>
      </div>

      <Separator />

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, dénomination ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Tri */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code">Trier par code OHADA</SelectItem>
                <SelectItem value="denomination">Trier par dénomination</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour séparer comptables et trésorerie */}
      <Tabs defaultValue="comptables" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="comptables" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Comptes Comptables
            {!loadingComptables && (
              <Badge variant="secondary">{comptesComptablesFiltres.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tresorerie" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Trésorerie
            {!loadingTresorerie && (
              <Badge variant="secondary">{comptesTresorerieFiltres.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Comptes Comptables */}
        <TabsContent value="comptables" className="space-y-4">
          {/* Filtre de catégorie (uniquement pour comptables) */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes les catégories</SelectItem>
                <SelectItem value="entree">Entrées (Produits)</SelectItem>
                <SelectItem value="sortie">Sorties (Charges)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingComptables ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : comptesComptablesFiltres.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchTerm || categorieFilter !== "tous"
                    ? "Aucun compte ne correspond aux filtres"
                    : "Aucun compte comptable trouvé"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {comptesComptablesFiltres.map((compte, index) => (
                  <motion.div
                    key={compte.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => handleCompteClick(compte.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                compte.categorie === "entree"
                                  ? "bg-green-50"
                                  : "bg-red-50"
                              }`}
                            >
                              {compte.categorie === "entree" ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <Badge variant="outline" className="font-mono text-xs mb-1">
                                {compte.code_ohada}
                              </Badge>
                              <CardTitle className="text-base">
                                {compte.denomination}
                              </CardTitle>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </CardHeader>
                      {compte.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {compte.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Comptes de Trésorerie */}
        <TabsContent value="tresorerie" className="space-y-4">
          {loadingTresorerie ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : comptesTresorerieFiltres.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchTerm
                    ? "Aucun compte ne correspond aux filtres"
                    : "Aucun compte de trésorerie trouvé"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {comptesTresorerieFiltres.map((compte, index) => (
                  <motion.div
                    key={compte.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="hover:shadow-lg transition-all cursor-pointer group border-emerald-200"
                      onClick={() => handleCompteClick(compte.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50">
                              <Wallet className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <Badge
                                variant="outline"
                                className="font-mono text-xs mb-1 border-emerald-600 text-emerald-600"
                              >
                                {compte.code_ohada}
                              </Badge>
                              <CardTitle className="text-base">
                                {compte.denomination}
                              </CardTitle>
                              {compte.numero && (
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                  {compte.numero}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </CardHeader>
                      {compte.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {compte.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesktopGererLesComptes;
