import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  ChevronDown,
  RotateCcw,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group";
import useGererOperationsStore, {
  selectOperationsFiltrees,
  selectComptesDisponibles,
  selectFiltreCompte,
  selectFiltreType,
  selectMontantMin,
  selectMontantMax,
  selectDateDebut,
  selectDateFin,
  selectFiltreMotif,
  selectIsLoading,
  selectError,
  selectShowFilters,
  selectSetFiltreCompte,
  selectSetFiltreType,
  selectSetMontantMin,
  selectSetMontantMax,
  selectSetDateDebut,
  selectSetDateFin,
  selectSetFiltreMotif,
  selectSetShowFilters,
  selectSetOperations,
  selectSetComptesDisponibles,
  selectSetIsLoading,
  selectSetError,
  selectResetFiltres,
  selectSetPeriodePredefined,
  selectReset,
} from "@/stores/admin/useGererOperationsStore";
import {
  getOperationsToday,
  getAllComptes,
  getAllComptesTresorerie,
} from "@/toolkits/admin/comptabiliteToolkit";

const DesktopGererLesOperationsComptables = () => {
  const navigate = useNavigate();

  // Store state
  const operationsFiltrees = useGererOperationsStore(selectOperationsFiltrees);
  const comptesDisponibles = useGererOperationsStore(selectComptesDisponibles);
  const filtreCompte = useGererOperationsStore(selectFiltreCompte);
  const filtreType = useGererOperationsStore(selectFiltreType);
  const montantMin = useGererOperationsStore(selectMontantMin);
  const montantMax = useGererOperationsStore(selectMontantMax);
  const dateDebut = useGererOperationsStore(selectDateDebut);
  const dateFin = useGererOperationsStore(selectDateFin);
  const filtreMotif = useGererOperationsStore(selectFiltreMotif);
  const isLoading = useGererOperationsStore(selectIsLoading);
  const error = useGererOperationsStore(selectError);
  const showFilters = useGererOperationsStore(selectShowFilters);

  // Store actions
  const setFiltreCompte = useGererOperationsStore(selectSetFiltreCompte);
  const setFiltreType = useGererOperationsStore(selectSetFiltreType);
  const setMontantMin = useGererOperationsStore(selectSetMontantMin);
  const setMontantMax = useGererOperationsStore(selectSetMontantMax);
  const setDateDebut = useGererOperationsStore(selectSetDateDebut);
  const setDateFin = useGererOperationsStore(selectSetDateFin);
  const setFiltreMotif = useGererOperationsStore(selectSetFiltreMotif);
  const setShowFilters = useGererOperationsStore(selectSetShowFilters);
  const setOperations = useGererOperationsStore(selectSetOperations);
  const setComptesDisponibles = useGererOperationsStore(selectSetComptesDisponibles);
  const setIsLoading = useGererOperationsStore(selectSetIsLoading);
  const setError = useGererOperationsStore(selectSetError);
  const resetFiltres = useGererOperationsStore(selectResetFiltres);
  const setPeriodePredefined = useGererOperationsStore(selectSetPeriodePredefined);
  const reset = useGererOperationsStore(selectReset);

  // Charger les opérations et les comptes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger les opérations du jour et les comptes en parallèle
        const [operationsData, comptesData, tresorerieData] = await Promise.all([
          getOperationsToday(),
          getAllComptes(),
          getAllComptesTresorerie(),
        ]);

        // Fusionner les comptes
        const allComptes = [
          ...comptesData.comptes,
          ...tresorerieData.comptes,
        ];

        setOperations(operationsData.operations);
        setComptesDisponibles(allComptes);

        console.log(`✅ ${operationsData.operations.length} opérations chargées`);
      } catch (err) {
        console.error("❌ Erreur chargement données:", err);
        setError(err.message);
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      reset();
    };
  }, []);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Opérations Comptables</h1>
          <p className="text-muted-foreground">
            {operationsFiltrees.length} opération(s) trouvée(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Masquer" : "Afficher"} les filtres
          </Button>
          <Button onClick={() => navigate("/admin/comptabilite/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle opération
          </Button>
        </div>
      </div>

      <Separator />

      {/* Panneau de filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filtres
                    </CardTitle>
                    <CardDescription>
                      Affinez votre recherche d'opérations
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetFiltres}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Filtre par type */}
                  <div className="space-y-2">
                    <Label>Type d'opération</Label>
                    <Select value={filtreType} onValueChange={setFiltreType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous</SelectItem>
                        <SelectItem value="entree">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            Entrées
                          </div>
                        </SelectItem>
                        <SelectItem value="sortie">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            Sorties
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre par compte */}
                  <div className="space-y-2">
                    <Label>Compte</Label>
                    <Select value={filtreCompte || "tous"} onValueChange={(value) => setFiltreCompte(value === "tous" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les comptes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous les comptes</SelectItem>
                        {comptesDisponibles.map((compte) => (
                          <SelectItem key={compte.id} value={compte.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {compte.code_ohada}
                              </Badge>
                              <span>{compte.denomination}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Période prédéfinie */}
                  <div className="space-y-2">
                    <Label>Période rapide</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <Calendar className="h-4 w-4 mr-2" />
                          Sélectionner
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setPeriodePredefined("aujourdhui")}>
                          Aujourd'hui
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPeriodePredefined("hier")}>
                          Hier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPeriodePredefined("7jours")}>
                          7 derniers jours
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPeriodePredefined("30jours")}>
                          30 derniers jours
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPeriodePredefined("moisActuel")}>
                          Mois actuel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Date début */}
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <InputGroup>
                      <InputGroupInput
                        type="date"
                        value={new Date(dateDebut).toISOString().split("T")[0]}
                        onChange={(e) => setDateDebut(new Date(e.target.value).getTime())}
                      />
                    </InputGroup>
                  </div>

                  {/* Date fin */}
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <InputGroup>
                      <InputGroupInput
                        type="date"
                        value={new Date(dateFin).toISOString().split("T")[0]}
                        onChange={(e) => setDateFin(new Date(e.target.value).getTime())}
                      />
                    </InputGroup>
                  </div>

                  {/* Montant min */}
                  <div className="space-y-2">
                    <Label>Montant min (FCFA)</Label>
                    <InputGroup>
                      <InputGroupInput
                        type="number"
                        placeholder="0"
                        value={montantMin}
                        onChange={(e) => setMontantMin(e.target.value)}
                        min="0"
                      />
                    </InputGroup>
                  </div>

                  {/* Montant max */}
                  <div className="space-y-2">
                    <Label>Montant max (FCFA)</Label>
                    <InputGroup>
                      <InputGroupInput
                        type="number"
                        placeholder="Illimité"
                        value={montantMax}
                        onChange={(e) => setMontantMax(e.target.value)}
                        min="0"
                      />
                    </InputGroup>
                  </div>

                  {/* Recherche par motif */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Rechercher dans le motif</Label>
                    <InputGroup>
                      <InputGroupInput
                        placeholder="Ex: achat, vente, salaire..."
                        value={filtreMotif}
                        onChange={(e) => setFiltreMotif(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des opérations */}
      {operationsFiltrees.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune opération trouvée</p>
              <p className="text-sm">
                Essayez de modifier les filtres ou créez une nouvelle opération
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {operationsFiltrees.map((operation) => (
            <motion.div
              key={operation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/admin/comptabilite/gerer/${operation.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icône et type */}
                      <div
                        className={`p-3 rounded-lg ${
                          operation.type_operation === "entree"
                            ? "bg-green-50"
                            : "bg-red-50"
                        }`}
                      >
                        {operation.type_operation === "entree" ? (
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        )}
                      </div>

                      {/* Informations */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {operation.compte_ohada}
                          </Badge>
                          <span className="font-semibold">
                            {operation.compte_denomination}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {operation.motif}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(operation.date)}
                          </div>
                        </div>
                      </div>

                      {/* Montant */}
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            operation.type_operation === "entree"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {operation.type_operation === "entree" ? "+" : "-"}
                          {formatMontant(operation.montant)} FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesktopGererLesOperationsComptables;
