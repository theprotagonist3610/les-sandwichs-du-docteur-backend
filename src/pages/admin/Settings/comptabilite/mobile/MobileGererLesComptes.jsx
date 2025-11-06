import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Wallet,
  Filter,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  useComptesListe,
  useComptesTresorerieListe,
} from "@/toolkits/admin/comptabiliteToolkit";

const MobileGererLesComptes = () => {
  const navigate = useNavigate();

  // Hooks pour récupérer les comptes
  const { comptes: comptesComptables, loading: loadingComptables } = useComptesListe();
  const { comptes: comptesTresorerie, loading: loadingTresorerie } = useComptesTresorerieListe();

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("tous");
  const [sortBy, setSortBy] = useState("code");

  // Filtrage et tri des comptes comptables
  const comptesComptablesFiltres = useMemo(() => {
    let filtered = comptesComptables || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (compte) =>
          compte.code_ohada.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.denomination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categorieFilter !== "tous") {
      filtered = filtered.filter((compte) => compte.categorie === categorieFilter);
    }

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

    if (searchTerm) {
      filtered = filtered.filter(
        (compte) =>
          compte.code_ohada.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.denomination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          compte.numero?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gérer les Comptes</h1>
          <Button size="sm" onClick={() => navigate("/admin/settings/comptabilite/create")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Vos comptes comptables et de trésorerie
        </p>
      </div>

      <Separator />

      {/* Recherche et Filtres */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un compte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Sheet pour les filtres */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtres & Tri
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[300px]">
            <SheetHeader>
              <SheetTitle>Filtres & Tri</SheetTitle>
              <SheetDescription>
                Filtrez et triez vos comptes
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm">Trier par</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Code OHADA</SelectItem>
                    <SelectItem value="denomination">Dénomination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Catégorie (Comptables)</Label>
                <Select value={categorieFilter} onValueChange={setCategorieFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    <SelectItem value="entree">Entrées</SelectItem>
                    <SelectItem value="sortie">Sorties</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comptables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comptables" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Comptables
            {!loadingComptables && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {comptesComptablesFiltres.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tresorerie" className="text-xs">
            <Wallet className="h-3 w-3 mr-1" />
            Trésorerie
            {!loadingTresorerie && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {comptesTresorerieFiltres.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Comptes Comptables */}
        <TabsContent value="comptables" className="space-y-3">
          {loadingComptables ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : comptesComptablesFiltres.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Aucun compte trouvé
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {comptesComptablesFiltres.map((compte, index) => (
                  <motion.div
                    key={compte.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => handleCompteClick(compte.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`p-1.5 rounded-lg flex-shrink-0 ${
                                compte.categorie === "entree"
                                  ? "bg-green-50"
                                  : "bg-red-50"
                              }`}
                            >
                              {compte.categorie === "entree" ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge variant="outline" className="font-mono text-xs mb-1">
                                {compte.code_ohada}
                              </Badge>
                              <CardTitle className="text-sm truncate">
                                {compte.denomination}
                              </CardTitle>
                              {compte.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {compte.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Comptes de Trésorerie */}
        <TabsContent value="tresorerie" className="space-y-3">
          {loadingTresorerie ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : comptesTresorerieFiltres.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Aucun compte trouvé
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {comptesTresorerieFiltres.map((compte, index) => (
                  <motion.div
                    key={compte.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="hover:bg-accent transition-colors cursor-pointer border-emerald-200"
                      onClick={() => handleCompteClick(compte.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-1.5 rounded-lg bg-emerald-50 flex-shrink-0">
                              <Wallet className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs mb-1 border-emerald-600 text-emerald-600"
                              >
                                {compte.code_ohada}
                              </Badge>
                              <CardTitle className="text-sm truncate">
                                {compte.denomination}
                              </CardTitle>
                              {compte.numero && (
                                <p className="text-xs text-muted-foreground font-mono mt-1">
                                  {compte.numero}
                                </p>
                              )}
                              {compte.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {compte.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardHeader>
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

export default MobileGererLesComptes;
