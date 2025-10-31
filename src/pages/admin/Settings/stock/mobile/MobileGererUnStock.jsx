/**
 * MobileGererUnStock.jsx
 * Page de gestion d'un élément de stock (version mobile)
 * - Tabs: Détails | Historique
 * - Détails: Champs éditables avec InputGroup
 * - Card pour ajouter des transactions
 * - Historique: Liste avec code couleur (vert=entrée, rouge=sortie, bleu=transfert)
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Package,
  ArrowLeft,
  Save,
  Info,
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Ruler,
  AlertTriangle,
  MapPin,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

const MobileGererUnStock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [element, setElement] = useState(null);
  const [emplacements, setEmplacements] = useState([]);

  // Récupérer l'historique des transactions avec le hook
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions(7, { elementId: id });

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
    setSubmitError,
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
    setSubmitError(null);

    try {
      const formData = getFormData();
      console.log(formData);
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
      setSubmitError(err.message);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !element) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
              <div>
                <h3 className="font-semibold text-red-600">Erreur</h3>
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
    <div className="min-h-screen p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold line-clamp-1">
              {element.denomination}
            </h1>
            <p className="text-xs text-muted-foreground">
              {STOCK_TYPE_CONFIG[element.type]?.label} •{" "}
              {element.quantite_actuelle} {element.unite?.symbol}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === "details"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}>
          <div className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            Détails
          </div>
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === "stock"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}>
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4" />
            Stock
          </div>
        </button>
        <button
          onClick={() => setActiveTab("historique")}
          className={`flex-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === "historique"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}>
          <div className="flex items-center justify-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4">
            {/* Card Transaction */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nouvelle transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Type de transaction */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={transactionType}
                    onValueChange={setTransactionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRANSACTION_CONFIG).map(
                        ([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${config.color}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        }
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Emplacement */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {transactionType === TRANSACTION_TYPES.TRANSFERT
                      ? "Depuis"
                      : "Emplacement"}
                  </label>
                  <Select
                    value={emplacementId}
                    onValueChange={setEmplacementId}>
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

                {/* Emplacement destination (si transfert) */}
                {transactionType === TRANSACTION_TYPES.TRANSFERT && (
                  <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
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
                      <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Motif</label>
                  <InputGroup>
                    <InputGroupTextarea
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Description de la transaction..."
                      rows={2}
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

            <Separator />

            {/* Détails éditables */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Dénomination */}
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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

                {/* Unité */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Symbole</label>
                    <InputGroup>
                      <InputGroupInput
                        value={uniteSymbol}
                        onChange={(e) => setUniteSymbol(e.target.value)}
                        placeholder="kg"
                      />
                    </InputGroup>
                  </div>
                </div>

                {/* Prix unitaire (lecture seule) et seuil */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
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
                </div>

                {/* Description */}
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Statut actif</label>
                  <Switch checked={status} onCheckedChange={setStatus} />
                </div>

                <Button
                  onClick={handleSaveDetails}
                  disabled={isSubmitting}
                  className="w-full">
                  {isSubmitting ? (
                    <SmallLoader text="Sauvegarde" spinnerSize={16} />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "stock" && (
          <motion.div
            key="stock"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4">

            {/* En-tête Stock actuel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Stock par emplacement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stockByEmplacementLoading ? (
                  <div className="flex justify-center py-8">
                    <SmallLoader text="Chargement du stock" />
                  </div>
                ) : stockByEmplacementError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {stockByEmplacementError}
                    </p>
                  </div>
                ) : stockByEmplacement.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Aucun stock trouvé dans les emplacements
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Total */}
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Stock total</span>
                        <span className="text-lg font-bold text-primary">
                          {stockByEmplacement.reduce((sum, item) => sum + item.quantite, 0)}{" "}
                          {element?.unite?.symbol}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Réparti sur {stockByEmplacement.length} emplacement
                        {stockByEmplacement.length > 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Liste hiérarchique des emplacements */}
                    {stockByEmplacement.map((item) => (
                      <Card key={item.emplacementId} className="overflow-hidden">
                        <CardContent className="p-4">
                          {/* En-tête de l'emplacement */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">
                                  {item.emplacementNom}
                                </span>
                              </div>
                              {item.position?.actuelle && (
                                <p className="text-xs text-muted-foreground ml-6">
                                  {item.position.actuelle.quartier ||
                                   item.position.actuelle.commune ||
                                   "Position non définie"}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {item.quantite}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {element?.unite?.symbol}
                              </div>
                            </div>
                          </div>

                          {/* Barre de progression */}
                          <div className="space-y-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{
                                  width: `${
                                    (item.quantite /
                                      stockByEmplacement.reduce((sum, i) => sum + i.quantite, 0)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                              {(
                                (item.quantite /
                                  stockByEmplacement.reduce((sum, i) => sum + i.quantite, 0)) *
                                100
                              ).toFixed(1)}
                              % du stock total
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "historique" && (
          <motion.div
            key="historique"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune transaction</p>
              </div>
            ) : (
              transactions.map((transaction) => {
                const config = TRANSACTION_CONFIG[transaction.type];
                const Icon = config?.icon || Package;

                return (
                  <Card
                    key={transaction.id}
                    className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${config?.bg} ${config?.border}`}
                    onClick={() => openDialog(transaction)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-card`}>
                          <Icon className={`h-5 w-5 ${config?.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-sm">
                                {config?.label}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(
                                  transaction.timestamp
                                ).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <Badge
                              variant={config?.badgeVariant}
                              className="text-xs">
                              {transaction.quantite} {element.unite?.symbol}
                            </Badge>
                          </div>

                          {transaction.emplacement && (
                            <div className="text-xs mt-1 line-clamp-2">
                              <span className="font-semibold mr-2">
                                Emplacement :
                              </span>
                              <span className="text-muted-foreground">
                                {getEmplacementName(transaction.emplacement)}
                              </span>
                            </div>
                          )}
                          {transaction.type === TRANSACTION_TYPES.TRANSFERT &&
                            transaction.emplacement_dest && (
                              <div className="text-xs mt-1 line-clamp-2">
                                <span className="font-semibold mr-2">
                                  Vers :
                                </span>
                                <span className="text-muted-foreground">
                                  {getEmplacementName(
                                    transaction.emplacement_dest
                                  )}
                                </span>
                              </div>
                            )}
                          {transaction.motif && (
                            <div className="text-xs mt-1 line-clamp-2">
                              <span className="font-semibold mr-2">
                                Motif :
                              </span>
                              <span className="text-muted-foreground">
                                {transaction.motif}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog Edit Transaction */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
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
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Quantité:</span>
                <p className="font-medium">
                  {selectedTransaction.quantite} {element.unite?.symbol}
                </p>
              </div>
              {selectedTransaction.emplacement && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Emplacement:
                  </span>
                  <p className="font-medium">
                    {getEmplacementName(selectedTransaction.emplacement)}
                  </p>
                </div>
              )}
              {selectedTransaction.type === TRANSACTION_TYPES.TRANSFERT &&
                selectedTransaction.emplacement_dest && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Destination:
                    </span>
                    <p className="font-medium">
                      {getEmplacementName(selectedTransaction.emplacement_dest)}
                    </p>
                  </div>
                )}
              {selectedTransaction.type === TRANSACTION_TYPES.ENTREE &&
                selectedTransaction.prix_unitaire !== undefined && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Prix unitaire:
                    </span>
                    <p className="font-medium">
                      {selectedTransaction.prix_unitaire} FCFA
                    </p>
                  </div>
                )}
              {selectedTransaction.motif && (
                <div>
                  <span className="text-sm text-muted-foreground">Motif:</span>
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

export default MobileGererUnStock;
