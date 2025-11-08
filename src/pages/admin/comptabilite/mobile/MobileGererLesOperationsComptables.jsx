import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Loader2,
  RotateCcw,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  selectSetFiltreCompte,
  selectSetFiltreType,
  selectSetMontantMin,
  selectSetMontantMax,
  selectSetDateDebut,
  selectSetDateFin,
  selectSetFiltreMotif,
  selectSetOperations,
  selectSetComptesDisponibles,
  selectSetIsLoading,
  selectSetError,
  selectResetFiltres,
  selectSetPeriodePredefined,
  selectReset,
  selectNeedsReload,
  selectSetNeedsReload,
  selectSetCurrentPeriodDays,
} from "@/stores/admin/useGererOperationsStore";
import {
  getOperationsToday,
  getAllComptes,
  getAllComptesTresorerie,
} from "@/toolkits/admin/comptabiliteToolkit";
import { loadOperationsForDateRange } from "@/utils/comptabilite/loadOperationsForPeriod";

const MobileGererLesOperationsComptables = () => {
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
  const needsReload = useGererOperationsStore(selectNeedsReload);

  // Store actions
  const setFiltreCompte = useGererOperationsStore(selectSetFiltreCompte);
  const setFiltreType = useGererOperationsStore(selectSetFiltreType);
  const setMontantMin = useGererOperationsStore(selectSetMontantMin);
  const setMontantMax = useGererOperationsStore(selectSetMontantMax);
  const setDateDebut = useGererOperationsStore(selectSetDateDebut);
  const setDateFin = useGererOperationsStore(selectSetDateFin);
  const setFiltreMotif = useGererOperationsStore(selectSetFiltreMotif);
  const setOperations = useGererOperationsStore(selectSetOperations);
  const setComptesDisponibles = useGererOperationsStore(selectSetComptesDisponibles);
  const setIsLoading = useGererOperationsStore(selectSetIsLoading);
  const setError = useGererOperationsStore(selectSetError);
  const resetFiltres = useGererOperationsStore(selectResetFiltres);
  const setPeriodePredefined = useGererOperationsStore(selectSetPeriodePredefined);
  const reset = useGererOperationsStore(selectReset);
  const setNeedsReload = useGererOperationsStore(selectSetNeedsReload);
  const setCurrentPeriodDays = useGererOperationsStore(selectSetCurrentPeriodDays);

  // Charger les opérations et les comptes (initial)
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [operationsResult, comptesData, tresorerieData] = await Promise.all([
          loadOperationsForDateRange(dateDebut, dateFin),
          getAllComptes(),
          getAllComptesTresorerie(),
        ]);

        const allComptes = [...comptesData.comptes, ...tresorerieData.comptes];

        setOperations(operationsResult.operations);
        setComptesDisponibles(allComptes);
        setCurrentPeriodDays(operationsResult.daysLoaded);

        console.log(`✅ ${operationsResult.operations.length} opérations chargées`);
      } catch (err) {
        console.error("❌ Erreur chargement:", err);
        setError(err.message);
        toast.error("Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    return () => reset();
  }, []);

  // Surveiller needsReload et recharger si nécessaire
  useEffect(() => {
    if (!needsReload) return;

    const reloadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("🔄 Rechargement pour nouvelle période...");

        const operationsResult = await loadOperationsForDateRange(dateDebut, dateFin);

        setOperations(operationsResult.operations);
        setCurrentPeriodDays(operationsResult.daysLoaded);
        setNeedsReload(false);

        console.log(`✅ ${operationsResult.operations.length} opérations rechargées`);
      } catch (err) {
        console.error("❌ Erreur rechargement:", err);
        setError(err.message);
        toast.error("Erreur rechargement");
        setNeedsReload(false);
      } finally {
        setIsLoading(false);
      }
    };

    reloadData();
  }, [needsReload, dateDebut, dateFin]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Opérations</h1>
            <p className="text-sm text-muted-foreground">
              {operationsFiltrees.length} trouvée(s)
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/admin/comptabilite/create")}>
            <Plus className="h-4 w-4 mr-1" />
            Nouveau
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filtres dans un Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto px-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrer les opérations
            </SheetTitle>
            <SheetDescription>Affinez votre recherche</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6 pb-6">
            <Button variant="outline" size="sm" onClick={resetFiltres} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-sm">Type</Label>
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

            {/* Compte */}
            <div className="space-y-2">
              <Label className="text-sm">Compte</Label>
              <Select value={filtreCompte || "tous"} onValueChange={(value) => setFiltreCompte(value === "tous" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  {comptesDisponibles.map((compte) => (
                    <SelectItem key={compte.id} value={compte.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {compte.code_ohada}
                        </Badge>
                        <span className="text-sm">{compte.denomination}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Périodes rapides */}
            <div className="space-y-2">
              <Label className="text-sm">Période</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setPeriodePredefined("aujourdhui")}>
                  Aujourd'hui
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPeriodePredefined("hier")}>
                  Hier
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPeriodePredefined("7jours")}>
                  7 jours
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPeriodePredefined("30jours")}>
                  30 jours
                </Button>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label className="text-sm">Date début</Label>
              <InputGroup>
                <InputGroupInput
                  type="date"
                  value={new Date(dateDebut).toISOString().split("T")[0]}
                  onChange={(e) => setDateDebut(new Date(e.target.value).getTime())}
                />
              </InputGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Date fin</Label>
              <InputGroup>
                <InputGroupInput
                  type="date"
                  value={new Date(dateFin).toISOString().split("T")[0]}
                  onChange={(e) => setDateFin(new Date(e.target.value).getTime())}
                />
              </InputGroup>
            </div>

            {/* Montants */}
            <div className="space-y-2">
              <Label className="text-sm">Montant min (FCFA)</Label>
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

            <div className="space-y-2">
              <Label className="text-sm">Montant max (FCFA)</Label>
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

            {/* Motif */}
            <div className="space-y-2">
              <Label className="text-sm">Motif</Label>
              <InputGroup>
                <InputGroupInput
                  placeholder="Rechercher..."
                  value={filtreMotif}
                  onChange={(e) => setFiltreMotif(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Liste */}
      {operationsFiltrees.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aucune opération</p>
              <p className="text-xs">Modifiez les filtres</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {operationsFiltrees.map((operation) => (
            <motion.div
              key={operation.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => navigate(`/admin/comptabilite/gerer/${operation.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        operation.type_operation === "entree" ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      {operation.type_operation === "entree" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="font-mono text-xs mb-1">
                        {operation.compte_ohada}
                      </Badge>
                      <p className="font-semibold text-sm line-clamp-1">
                        {operation.compte_denomination}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {operation.motif}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(operation.date)}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-lg font-bold ${
                          operation.type_operation === "entree" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {operation.type_operation === "entree" ? "+" : "-"}
                        {formatMontant(operation.montant)}
                      </p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
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

export default MobileGererLesOperationsComptables;
