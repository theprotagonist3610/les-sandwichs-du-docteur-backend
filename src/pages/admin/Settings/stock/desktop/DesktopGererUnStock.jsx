/**
 * DesktopGererUnStock.jsx
 * Page de gestion d'un élément de stock (version desktop)
 * - Grid spacieuse pour les détails
 * - Tableau spacieux pour l'historique avec filtres
 * - Dialog d'édition de transaction
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Package,
  ArrowLeft,
  Save,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Ruler,
  AlertTriangle,
  Filter,
  Calendar,
  MapPin,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import SmallLoader from "@/components/global/SmallLoader.jsx";

import {
  getElement,
  updateElement,
  makeTransaction,
  useTransactions,
  useStockByEmplacement,
  STOCK_TYPES,
  TRANSACTION_TYPES,
} from "@/toolkits/admin/stockToolkit.jsx";
import { getEmplacements } from "@/toolkits/admin/emplacementToolkit.jsx";

import useEditStockElementStore, {
  selectDenomination,
  selectType,
  selectUniteNom,
  selectUniteSymbol,
  selectPrixUnitaire,
  selectSeuilAlerte,
  selectDescription,
  selectImgURL,
  selectStatus,
  selectIsSubmitting,
} from "@/stores/admin/useEditStockElementStore.js";

import useTransactionStockStore, {
  selectType as selectTransactionType,
  selectEmplacementId,
  selectEmplacementDestId,
  selectQuantite,
  selectCoutTotal,
  selectMotif,
  selectIsSubmitting as selectTransactionIsSubmitting,
  selectPrixUnitaireCalcule,
} from "@/stores/admin/useTransactionStockStore.js";

import useEditTransactionStockStore, {
  selectIsDialogOpen,
  selectSelectedTransaction,
} from "@/stores/admin/useEditTransactionStockStore.js";

// Configuration des types
const STOCK_TYPE_CONFIG = {
  [STOCK_TYPES.INGREDIENT]: { label: "Ingrédient", color: "text-green-600" },
  [STOCK_TYPES.CONSOMMABLE]: { label: "Consommable", color: "text-blue-600" },
  [STOCK_TYPES.PERISSABLE]: { label: "Périssable", color: "text-orange-600" },
  [STOCK_TYPES.MATERIEL]: { label: "Matériel", color: "text-purple-600" },
  [STOCK_TYPES.EMBALLAGE]: { label: "Emballage", color: "text-gray-600" },
};

// Configuration des transactions (adapté au thème corporate)
const TRANSACTION_CONFIG = {
  [TRANSACTION_TYPES.ENTREE]: {
    icon: TrendingUp,
    label: "Entrée",
    color: "text-chart-1", // Rouge corporate #a41624
    bg: "bg-chart-1/10", // Rouge très léger
    border: "border-chart-1/20",
    badgeVariant: "default",
  },
  [TRANSACTION_TYPES.SORTIE]: {
    icon: TrendingDown,
    label: "Sortie",
    color: "text-destructive", // Orange #d9571d
    bg: "bg-destructive/10", // Orange très léger
    border: "border-destructive/20",
    badgeVariant: "destructive",
  },
  [TRANSACTION_TYPES.TRANSFERT]: {
    icon: ArrowRightLeft,
    label: "Transfert",
    color: "text-accent", // Miel #ffb564
    bg: "bg-accent/10", // Miel très léger
    border: "border-accent/20",
    badgeVariant: "secondary",
  },
};

const DesktopGererUnStock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [element, setElement] = useState(null);
  const [emplacements, setEmplacements] = useState([]);

  // Filtres historique
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
  const [historyDays, setHistoryDays] = useState(7);

  // Récupérer l'historique des transactions avec le hook
  const {
    transactions: allTransactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions(historyDays, { elementId: id });

  // Récupérer le stock par emplacement
  const {
    stockByEmplacement,
    loading: stockByEmplacementLoading,
    error: stockByEmplacementError,
  } = useStockByEmplacement(id);

  // Helper pour obtenir le nom d'un emplacement à partir de son ID
  const getEmplacementName = (emplacementId) => {
    if (!emplacementId) return "Non spécifié";
    const emplacement = emplacements.find((emp) => emp.id === emplacementId);
    return emplacement ? emplacement.denomination : emplacementId;
  };

  // Store détails
  const denomination = useEditStockElementStore(selectDenomination);
  const type = useEditStockElementStore(selectType);
  const uniteNom = useEditStockElementStore(selectUniteNom);
  const uniteSymbol = useEditStockElementStore(selectUniteSymbol);
  const prixUnitaire = useEditStockElementStore(selectPrixUnitaire);
  const seuilAlerte = useEditStockElementStore(selectSeuilAlerte);
  const description = useEditStockElementStore(selectDescription);
  const imgURL = useEditStockElementStore(selectImgURL);
  const status = useEditStockElementStore(selectStatus);
  const isSubmitting = useEditStockElementStore(selectIsSubmitting);

  const {
    setDenomination,
    setType,
    setUniteNom,
    setUniteSymbol,
    setSeuilAlerte,
    setDescription,
    setImgURL,
    setStatus,
    setIsSubmitting,
    loadElement: loadElementInStore,
    validateForm,
    getFormData,
  } = useEditStockElementStore();

  // Store transaction
  const transactionType = useTransactionStockStore(selectTransactionType);
  const emplacementId = useTransactionStockStore(selectEmplacementId);
  const emplacementDestId = useTransactionStockStore(selectEmplacementDestId);
  const quantite = useTransactionStockStore(selectQuantite);
  const coutTotal = useTransactionStockStore(selectCoutTotal);
  const prixUnitaireCalcule = useTransactionStockStore(
    selectPrixUnitaireCalcule
  );
  const motif = useTransactionStockStore(selectMotif);
  const transactionIsSubmitting = useTransactionStockStore(
    selectTransactionIsSubmitting
  );

  const {
    setType: setTransactionType,
    setEmplacementId,
    setEmplacementDestId,
    setQuantite,
    setCoutTotal,
    setMotif,
    setIsSubmitting: setTransactionIsSubmitting,
    resetForm: resetTransactionForm,
    validateForm: validateTransactionForm,
    getFormData: getTransactionFormData,
  } = useTransactionStockStore();

  // Store edit transaction
  const isDialogOpen = useEditTransactionStockStore(selectIsDialogOpen);
  const selectedTransaction = useEditTransactionStockStore(
    selectSelectedTransaction
  );
  const { openDialog, closeDialog } = useEditTransactionStockStore();

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [elementData, emplacementsData] = await Promise.all([
          getElement(id),
          getEmplacements(),
        ]);

        setElement(elementData);
        setEmplacements(emplacementsData);
        loadElementInStore(elementData);
      } catch (err) {
        console.error("Erreur chargement:", err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sauvegarder les détails
  const handleSaveDetails = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = getFormData();
      await updateElement(id, formData);

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Élément mis à jour</span>
        </div>
      );

      // Recharger l'élément
      const updatedElement = await getElement(id);
      setElement(updatedElement);
      loadElementInStore(updatedElement);
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Créer une transaction
  const handleCreateTransaction = async () => {
    const validation = validateTransactionForm();
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setTransactionIsSubmitting(true);

    try {
      const formData = getTransactionFormData();
      await makeTransaction(transactionType, {
        ...formData,
        element_id: id,
        user_id: "current_user",
      });

      toast.success("Transaction créée avec succès");
      resetTransactionForm();

      // Recharger les données
      const updatedElement = await getElement(id);
      setElement(updatedElement);
      refetchTransactions(); // Recharger les transactions
    } catch (err) {
      console.error("Erreur transaction:", err);
      toast.error(err.message);
    } finally {
      setTransactionIsSubmitting(false);
    }
  };

  // Filtrer les transactions
  const filteredTransactions =
    historyTypeFilter === "all"
      ? allTransactions
      : allTransactions.filter((t) => t.type === historyTypeFilter);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !element) {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 mx-auto text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">Erreur</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {error || "Élément introuvable"}
                </p>
              </div>
              <Button onClick={() => navigate(-1)} variant="outline">
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{element.denomination}</h1>
            <p className="text-muted-foreground">
              {STOCK_TYPE_CONFIG[element.type]?.label} • Stock:{" "}
              {element.quantite_actuelle} {element.unite?.symbol}
            </p>
          </div>
        </div>
        <Badge
          variant={element.status ? "default" : "secondary"}
          className="text-base px-4 py-2">
          {element.status ? "Actif" : "Inactif"}
        </Badge>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne gauche: Transaction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Nouvelle transaction
              </CardTitle>
              <CardDescription>
                Ajouter une entrée, sortie ou transfert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={transactionType}
                  onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSACTION_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Emplacement */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {transactionType === TRANSACTION_TYPES.TRANSFERT
                    ? "Depuis"
                    : "Emplacement"}
                </label>
                <Select value={emplacementId} onValueChange={setEmplacementId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {emplacements.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.denomination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination (si transfert) */}
              {transactionType === TRANSACTION_TYPES.TRANSFERT && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vers</label>
                  <Select
                    value={emplacementDestId}
                    onValueChange={setEmplacementDestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {emplacements
                        .filter((emp) => emp.id !== emplacementId)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.denomination}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quantité */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantité</label>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    placeholder="0"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{element.unite?.symbol}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {/* Coût total (uniquement pour les entrées) */}
              {transactionType === TRANSACTION_TYPES.ENTREE && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Coût total</label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <DollarSign className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={coutTotal}
                        onChange={(e) => setCoutTotal(e.target.value)}
                        placeholder="0.00"
                      />
                    </InputGroup>
                  </div>

                  {/* Prix unitaire calculé (lecture seule) */}
                  {quantite && coutTotal && parseFloat(quantite) > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Prix unitaire (calculé)
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {prixUnitaireCalcule.toFixed(2)} FCFA /{" "}
                          {element.unite?.symbol}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Motif */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Motif</label>
                <InputGroup>
                  <InputGroupTextarea
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Description..."
                    rows={3}
                  />
                </InputGroup>
              </div>

              <Button
                onClick={handleCreateTransaction}
                disabled={transactionIsSubmitting}
                className="w-full">
                {transactionIsSubmitting ? (
                  <SmallLoader text="Création" spinnerSize={16} />
                ) : (
                  "Créer la transaction"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Colonne droite: Détails et Historique */}
        <div className="col-span-2 space-y-6">
          {/* Détails éditables */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Modifier les détails de l'élément
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Dénomination */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dénomination</label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Package className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        value={denomination}
                        onChange={(e) => setDenomination(e.target.value)}
                      />
                    </InputGroup>
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STOCK_TYPE_CONFIG).map(
                          ([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unité nom */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unité</label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Ruler className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        value={uniteNom}
                        onChange={(e) => setUniteNom(e.target.value)}
                        placeholder="kilogramme"
                      />
                    </InputGroup>
                  </div>

                  {/* Unité symbole */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Symbole</label>
                    <InputGroup>
                      <InputGroupInput
                        value={uniteSymbol}
                        onChange={(e) => setUniteSymbol(e.target.value)}
                        placeholder="kg"
                      />
                    </InputGroup>
                  </div>

                  {/* Prix unitaire (lecture seule) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Prix unitaire moyen
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border h-9">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {parseFloat(prixUnitaire || 0).toFixed(2)} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Seuil */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Seuil d'alerte
                    </label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <AlertTriangle className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={seuilAlerte}
                        onChange={(e) => setSeuilAlerte(e.target.value)}
                      />
                    </InputGroup>
                  </div>

                  {/* Description */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <InputGroup>
                      <InputGroupTextarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description..."
                        rows={3}
                      />
                    </InputGroup>
                  </div>

                  {/* Image URL */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">URL Image</label>
                    <InputGroup>
                      <InputGroupInput
                        type="url"
                        value={imgURL}
                        onChange={(e) => setImgURL(e.target.value)}
                        placeholder="https://..."
                      />
                    </InputGroup>
                  </div>

                  {/* Statut */}
                  <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">Statut</label>
                      <p className="text-xs text-muted-foreground">
                        {status
                          ? "L'élément est actif"
                          : "L'élément est inactif"}
                      </p>
                    </div>
                    <Switch checked={status} onCheckedChange={setStatus} />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveDetails}
                    disabled={isSubmitting}
                    size="lg">
                    {isSubmitting ? (
                      <SmallLoader text="Sauvegarde" spinnerSize={16} />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder les modifications
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stock par emplacement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Stock par emplacement
                    </CardTitle>
                    <CardDescription>
                      Répartition du stock dans les différents emplacements
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stockByEmplacementLoading ? (
                  <div className="flex justify-center py-12">
                    <SmallLoader text="Chargement du stock par emplacement" />
                  </div>
                ) : stockByEmplacementError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {stockByEmplacementError}
                    </p>
                  </div>
                ) : stockByEmplacement.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base font-medium mb-1">Aucun stock trouvé</p>
                    <p className="text-sm text-muted-foreground">
                      Cet élément n'est présent dans aucun emplacement
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Total Card */}
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Stock total
                          </p>
                          <p className="text-3xl font-bold text-primary mt-1">
                            {stockByEmplacement.reduce((sum, item) => sum + item.quantite, 0)}{" "}
                            <span className="text-xl">{element?.unite?.symbol}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {stockByEmplacement.length} emplacement
                            {stockByEmplacement.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tableau */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Emplacement</TableHead>
                          <TableHead>Localisation</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead className="text-right">Pourcentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockByEmplacement.map((item) => {
                          const totalStock = stockByEmplacement.reduce(
                            (sum, i) => sum + i.quantite,
                            0
                          );
                          const percentage = (item.quantite / totalStock) * 100;

                          return (
                            <TableRow key={item.emplacementId}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span className="font-medium">
                                    {item.emplacementNom}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {item.position?.actuelle?.quartier ||
                                   item.position?.actuelle?.commune ||
                                   "Position non définie"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-lg">
                                    {item.quantite}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {element?.unite?.symbol}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-3">
                                  {/* Barre de progression */}
                                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-medium text-sm min-w-[50px]">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Historique */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Historique des transactions</CardTitle>
                    <CardDescription>
                      {filteredTransactions.length} transactions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* Filtre type */}
                    <Select
                      value={historyTypeFilter}
                      onValueChange={setHistoryTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(TRANSACTION_CONFIG).map(
                          ([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {/* Filtre période */}
                    <Select
                      value={historyDays.toString()}
                      onValueChange={(v) => setHistoryDays(parseInt(v))}>
                      <SelectTrigger className="w-[150px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 derniers jours</SelectItem>
                        <SelectItem value="30">30 derniers jours</SelectItem>
                        <SelectItem value="90">90 derniers jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Aucune transaction trouvée
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Emplacement</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead className="text-right">Motif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const config = TRANSACTION_CONFIG[transaction.type];
                        const Icon = config?.icon || Package;

                        return (
                          <TableRow
                            key={transaction.id}
                            className={`cursor-pointer transition-all ${config?.bg} hover:${config?.bg} hover:border-l-4 ${config?.border}`}
                            onClick={() => openDialog(transaction)}>
                            <TableCell>
                              <Badge
                                variant={config?.badgeVariant}
                                className="gap-1">
                                <Icon className="h-3 w-3" />
                                {config?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(
                                transaction.timestamp
                              ).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              {transaction.emplacement
                                ? getEmplacementName(transaction.emplacement)
                                : "—"}
                              {transaction.type ===
                                TRANSACTION_TYPES.TRANSFERT &&
                                transaction.emplacement_dest && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    →{" "}
                                    {getEmplacementName(
                                      transaction.emplacement_dest
                                    )}
                                  </span>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {transaction.quantite} {element.unite?.symbol}
                            </TableCell>
                            <TableCell className="text-right">
                              {transaction.type === TRANSACTION_TYPES.ENTREE &&
                              transaction.prix_unitaire !== undefined
                                ? `${transaction.prix_unitaire?.toFixed(
                                    2
                                  )} FCFA`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right max-w-[200px] truncate">
                              {transaction.motif || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Dialog Transaction */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
            <DialogDescription>
              {selectedTransaction && (
                <>
                  {TRANSACTION_CONFIG[selectedTransaction.type]?.label} •{" "}
                  {new Date(selectedTransaction.timestamp).toLocaleDateString(
                    "fr-FR"
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Type</span>
                <p className="font-medium">
                  {TRANSACTION_CONFIG[selectedTransaction.type]?.label}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Quantité</span>
                <p className="font-medium">
                  {selectedTransaction.quantite} {element.unite?.symbol}
                </p>
              </div>
              {selectedTransaction.emplacement && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">
                    Emplacement
                  </span>
                  <p className="font-medium">
                    {getEmplacementName(selectedTransaction.emplacement)}
                  </p>
                </div>
              )}
              {selectedTransaction.type === TRANSACTION_TYPES.TRANSFERT &&
                selectedTransaction.emplacement_dest && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Destination
                    </span>
                    <p className="font-medium">
                      {getEmplacementName(selectedTransaction.emplacement_dest)}
                    </p>
                  </div>
                )}
              {selectedTransaction.type === TRANSACTION_TYPES.ENTREE &&
                selectedTransaction.prix_unitaire !== undefined && (
                  <>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">
                        Prix unitaire
                      </span>
                      <p className="font-medium">
                        {selectedTransaction.prix_unitaire?.toFixed(2)} FCFA
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">
                        Montant total
                      </span>
                      <p className="font-medium">
                        {(
                          selectedTransaction.quantite *
                          selectedTransaction.prix_unitaire
                        ).toFixed(2)}{" "}
                        FCFA
                      </p>
                    </div>
                  </>
                )}
              {selectedTransaction.motif && (
                <div className="col-span-2 space-y-1">
                  <span className="text-sm text-muted-foreground">Motif</span>
                  <p className="text-sm">{selectedTransaction.motif}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopGererUnStock;
