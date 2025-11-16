/**
 * MobileComptes.jsx
 * Vue mobile pour les comptes comptables avec navigation et historique
 */

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  History,
  ChevronRight,
  BarChart3,
} from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

// Recharts
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Hook personnalisé
import { useComptesData } from "../../../../hooks/useComptesData";

// Store
import useComptesStore from "../../../../stores/admin/useComptesStore";

// Utilitaires
import {
  formatMontant,
  formatPourcentage,
  formatDateComplete,
  getCompteOhadaConfig,
  getCategorieLabel,
  getTypeOperationLabel,
} from "../../../../utils/comptabilite/comptesFormatters";

import {
  getOperationsCompteToday,
  calculerStatistiquesCompte,
} from "../../../../utils/comptabilite/calculerSoldesComptes";

// Components
import ComptesSkeleton from "../components/ComptesSkeleton";

const MobileComptes = () => {
  // ============================================================================
  // HOOKS
  // ============================================================================

  const {
    comptesComptables,
    comptesEntree,
    comptesSortie,
    soldeTotal,
    variationPourcentage,
    compteSelectionne,
    isLoading,
    error,
    dataEntreesSorties,
    dataFluxCategorie,
    selectionnerCompte,
    deselectionnerCompte,
    rafraichir,
  } = useComptesData();

  // Store pour la vue
  const vue = useComptesStore((state) => state.vue);
  const setVue = useComptesStore((state) => state.setVue);
  const filtreCategorie = useComptesStore((state) => state.filtreCategorie);
  const setFiltreCategorie = useComptesStore((state) => state.setFiltreCategorie);
  const filtreRecherche = useComptesStore((state) => state.filtreRecherche);
  const setFiltreRecherche = useComptesStore((state) => state.setFiltreRecherche);
  const getComptesFiltered = useComptesStore((state) => state.getComptesFiltered);

  // État local pour les opérations du compte sélectionné
  const [operationsCompte, setOperationsCompte] = useState([]);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ============================================================================
  // EFFET - Charger les opérations quand un compte est sélectionné
  // ============================================================================

  useEffect(() => {
    const chargerOperations = async () => {
      if (compteSelectionne) {
        setLoadingOperations(true);
        try {
          const ops = await getOperationsCompteToday(compteSelectionne.id);
          setOperationsCompte(ops);
        } catch (err) {
          console.error("Erreur chargement opérations:", err);
        } finally {
          setLoadingOperations(false);
        }
      } else {
        setOperationsCompte([]);
      }
    };

    chargerOperations();
  }, [compteSelectionne]);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  const handleVoirDetail = useCallback(
    (compte) => {
      selectionnerCompte(compte);
      setVue("detail");
    },
    [selectionnerCompte, setVue]
  );

  const handleRetourListe = useCallback(() => {
    deselectionnerCompte();
    setVue("liste");
  }, [deselectionnerCompte, setVue]);

  const handleRefresh = useCallback(() => {
    rafraichir();
  }, [rafraichir]);

  // ============================================================================
  // DONNÉES MÉMOÏSÉES
  // ============================================================================

  const comptesAffichage = useMemo(() => {
    console.log("🔍 [MobileComptes] Recalcul des comptes filtrés");
    console.log("🔍 [MobileComptes] Filtre catégorie:", filtreCategorie);
    console.log("🔍 [MobileComptes] Filtre recherche:", filtreRecherche);
    console.log("🔍 [MobileComptes] Comptes comptables total:", comptesComptables.length);

    const filtered = getComptesFiltered();
    console.log("🔍 [MobileComptes] Comptes après filtrage:", filtered.length);

    return filtered;
  }, [getComptesFiltered, filtreCategorie, filtreRecherche, comptesComptables]);

  const statsCompteSelectionne = useMemo(() => {
    if (!compteSelectionne || operationsCompte.length === 0) {
      return { total: 0, nombre: 0, moyenne: 0 };
    }
    return calculerStatistiquesCompte(compteSelectionne.id, operationsCompte);
  }, [compteSelectionne, operationsCompte]);

  // ============================================================================
  // RENDU - LOADING
  // ============================================================================

  if (isLoading) {
    return <ComptesSkeleton />;
  }

  // ============================================================================
  // RENDU - ERROR
  // ============================================================================

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // RENDU - VUE DÉTAIL
  // ============================================================================

  if (vue === "detail" && compteSelectionne) {
    const config = getCompteOhadaConfig(compteSelectionne.code_ohada);
    const IconCompte = config.icon;

    return (
      <div className="min-h-screen bg-background">
        {/* Header fixe */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={handleRetourListe}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold truncate">{compteSelectionne.denomination}</h1>
              <p className="text-xs text-muted-foreground">Code: {compteSelectionne.code_ohada}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="p-4 space-y-4">
            {/* Card solde */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div
                    className="inline-flex p-4 rounded-full mb-3"
                    style={{ backgroundColor: `${config.strokeColor}20` }}
                  >
                    <IconCompte className="h-8 w-8" style={{ color: config.strokeColor }} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Solde du compte</p>
                  <p className="text-3xl font-bold">{formatMontant(compteSelectionne.solde)} FCFA</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="outline">{config.category}</Badge>
                    <Badge variant={compteSelectionne.categorie === "entree" ? "default" : "destructive"}>
                      {getCategorieLabel(compteSelectionne.categorie)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Total opérations</p>
                  <p className="text-xl font-bold">{formatMontant(statsCompteSelectionne.total)}</p>
                  <p className="text-xs text-muted-foreground">{statsCompteSelectionne.nombre} op.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Montant moyen</p>
                  <p className="text-xl font-bold">{formatMontant(statsCompteSelectionne.moyenne)}</p>
                  <p className="text-xs text-muted-foreground">par opération</p>
                </CardContent>
              </Card>
            </div>

            {/* Historique des opérations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Historique ({operationsCompte.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOperations ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Chargement...</p>
                ) : operationsCompte.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Aucune opération aujourd'hui
                  </p>
                ) : (
                  <div className="space-y-3">
                    {operationsCompte.map((operation) => (
                      <motion.div
                        key={operation.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm flex-1">{operation.motif}</p>
                          <p className={`text-lg font-bold ml-2 ${
                            operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                          }`}>
                            {operation.type_operation === "entree" ? "+" : "-"}
                            {formatMontant(operation.montant)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(operation.date).toLocaleDateString("fr-FR")}
                          </p>
                          <Badge
                            variant={operation.type_operation === "entree" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {operation.type_operation === "entree" ? "Entrée" : "Sortie"}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ============================================================================
  // RENDU - VUE LISTE
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixe avec résumé */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Comptes Comptables</h1>
            <div className="flex gap-2">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Catégorie</label>
                      <Select
                        value={filtreCategorie || "all"}
                        onValueChange={(val) => setFiltreCategorie(val === "all" ? null : val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          <SelectItem value="entree">Entrées</SelectItem>
                          <SelectItem value="sortie">Sorties</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => setShowFilters(false)} className="w-full">
                      Appliquer
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Résumé compact */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-accent rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold truncate">{formatMontant(soldeTotal)}</p>
            </div>
            <div className="bg-accent rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Entrées</p>
              <p className="text-sm font-bold">{comptesEntree.length}</p>
            </div>
            <div className="bg-accent rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Sorties</p>
              <p className="text-sm font-bold">{comptesSortie.length}</p>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un compte..."
              value={filtreRecherche}
              onChange={(e) => setFiltreRecherche(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="liste" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="liste" className="flex-1">Liste</TabsTrigger>
          <TabsTrigger value="stats" className="flex-1">Statistiques</TabsTrigger>
        </TabsList>

        {/* TAB: Liste */}
        <TabsContent value="liste" className="m-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-3">
              {comptesAffichage.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Aucun compte trouvé
                </p>
              ) : (
                comptesAffichage.map((compte) => {
                  const config = getCompteOhadaConfig(compte.code_ohada);
                  const IconCompte = config.icon;

                  return (
                    <motion.div
                      key={compte.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleVoirDetail(compte)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: `${config.strokeColor}20` }}
                            >
                              <IconCompte className="h-5 w-5" style={{ color: config.strokeColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{compte.denomination}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{compte.code_ohada}</span>
                                <Badge
                                  variant={compte.categorie === "entree" ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {compte.categorie === "entree" ? "E" : "S"}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold">{formatMontant(compte.solde || 0)}</p>
                              <p className="text-xs text-muted-foreground">FCFA</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* TAB: Statistiques */}
        <TabsContent value="stats" className="m-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-4">
              {/* Entrées vs Sorties */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Entrées vs Sorties</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dataEntreesSorties.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="montant" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 font-medium">Entrées</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatMontant(dataEntreesSorties.totalEntrees)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-700 font-medium">Sorties</p>
                      <p className="text-lg font-bold text-red-900">
                        {formatMontant(dataEntreesSorties.totalSorties)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flux par catégorie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flux par catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dataFluxCategorie.slice(0, 5).map((flux) => (
                      <div key={flux.nom} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: flux.color }}
                          />
                          <span className="text-sm font-medium">{flux.nom}</span>
                        </div>
                        <span className="text-sm font-bold">{formatMontant(flux.montant)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileComptes;
