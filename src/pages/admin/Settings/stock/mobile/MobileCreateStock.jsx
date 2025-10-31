/**
 * MobileCreateStock.jsx
 * Formulaire de création d'élément de stock (version mobile)
 * - Store Zustand avec sélecteurs optimisés
 * - Framer-motion pour les animations
 * - UI input-group pour les champs
 * - Layout vertical aéré
 */

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Package,
  DollarSign,
  AlertTriangle,
  Image as ImageIcon,
  ArrowLeft,
  Save,
  RotateCcw,
  Utensils,
  ShoppingBag,
  Clock,
  Box,
  Archive,
  CheckCircle2,
  Ruler,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";

import useCreateStockStore, {
  selectDenomination,
  selectType,
  selectUniteNom,
  selectUniteSymbol,
  selectPrixUnitaire,
  selectSeuilAlerte,
  selectDescription,
  selectImgURL,
  selectIsSubmitting,
  selectSubmitError,
} from "@/stores/admin/useCreateStockStore.js";

import { createElement, STOCK_TYPES } from "@/toolkits/admin/stockToolkit.jsx";
import { baseExists } from "@/toolkits/admin/initStockToolkit.jsx";
import { useEffect, useState } from "react";

// Icônes pour chaque type de stock
const STOCK_TYPE_CONFIG = {
  [STOCK_TYPES.INGREDIENT]: {
    icon: Utensils,
    label: "Ingrédient",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  [STOCK_TYPES.CONSOMMABLE]: {
    icon: ShoppingBag,
    label: "Consommable",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  [STOCK_TYPES.PERISSABLE]: {
    icon: Clock,
    label: "Périssable",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  [STOCK_TYPES.MATERIEL]: {
    icon: Box,
    label: "Matériel",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  [STOCK_TYPES.EMBALLAGE]: {
    icon: Archive,
    label: "Emballage",
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

const MobileCreateStock = () => {
  const navigate = useNavigate();

  // Store state avec sélecteurs optimisés
  const denomination = useCreateStockStore(selectDenomination);
  const type = useCreateStockStore(selectType);
  const uniteNom = useCreateStockStore(selectUniteNom);
  const uniteSymbol = useCreateStockStore(selectUniteSymbol);
  const prixUnitaire = useCreateStockStore(selectPrixUnitaire);
  const seuilAlerte = useCreateStockStore(selectSeuilAlerte);
  const description = useCreateStockStore(selectDescription);
  const imgURL = useCreateStockStore(selectImgURL);
  const isSubmitting = useCreateStockStore(selectIsSubmitting);
  const submitError = useCreateStockStore(selectSubmitError);

  // Actions du store
  const {
    setDenomination,
    setType,
    setUniteNom,
    setUniteSymbol,
    setPrixUnitaire,
    setSeuilAlerte,
    setDescription,
    setImgURL,
    setIsSubmitting,
    setSubmitError,
    resetForm,
    validateForm,
    getFormData,
  } = useCreateStockStore();

  const [baseExistsFlag, setBaseExistsFlag] = useState(false);
  const [checkingBase, setCheckingBase] = useState(true);

  // Vérifier l'existence de la BASE centrale au chargement
  useEffect(() => {
    const checkBase = async () => {
      try {
        const exists = await baseExists();
        setBaseExistsFlag(exists);
      } catch (error) {
        console.error("Erreur vérification BASE:", error);
        setBaseExistsFlag(false);
      } finally {
        setCheckingBase(false);
      }
    };

    checkBase();
  }, []);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier la BASE centrale
    if (!baseExistsFlag) {
      toast.error("La BASE centrale n'existe pas. Veuillez d'abord initialiser le stock.");
      navigate("/admin/settings/stock/initialiser");
      return;
    }

    // Valider le formulaire
    const validation = validateForm();
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = getFormData();

      // Créer l'élément de stock
      const newElement = await createElement(formData);

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Élément créé: {newElement.denomination}</span>
        </div>
      );

      // Réinitialiser le formulaire
      resetForm();

      // Rediriger vers la liste ou rester sur la page
      // navigate("/admin/settings/stock");
    } catch (error) {
      console.error("Erreur création élément:", error);
      setSubmitError(error.message);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la réinitialisation
  const handleReset = () => {
    resetForm();
    toast.info("Formulaire réinitialisé");
  };

  if (checkingBase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Package className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Vérification de la BASE centrale...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!baseExistsFlag) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              BASE centrale non trouvée
            </CardTitle>
            <CardDescription>
              Vous devez d'abord initialiser le système de stock avant de créer des éléments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La BASE centrale est l'entrepôt principal où tous les éléments de stock sont d'abord
              enregistrés avant d'être distribués.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button
                onClick={() => navigate("/admin/settings/stock/initialiser")}
                className="flex-1"
              >
                Initialiser le stock
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const TypeIcon = STOCK_TYPE_CONFIG[type]?.icon || Package;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen p-4 pb-24 space-y-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-lg font-bold">Nouvel élément</h1>
        <div className="w-16" /> {/* Spacer */}
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type de stock */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TypeIcon className={`h-5 w-5 ${STOCK_TYPE_CONFIG[type]?.color}`} />
                Type d'élément
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STOCK_TYPE_CONFIG).map(([key, config]) => {
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Informations générales */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Dénomination <span className="text-destructive">*</span>
                </label>
                <InputGroup>
                  <InputGroupInput
                    type="text"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    placeholder="Ex: Farine de blé"
                    required
                  />
                </InputGroup>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <p className="text-xs text-muted-foreground">Optionnel</p>
                <InputGroup>
                  <InputGroupTextarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description de l'élément..."
                    rows={3}
                  />
                </InputGroup>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Unité de mesure */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Unité de mesure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Nom de l'unité <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Ex: kilogramme, litre, pièce</p>
                <InputGroup>
                  <InputGroupInput
                    type="text"
                    value={uniteNom}
                    onChange={(e) => setUniteNom(e.target.value)}
                    placeholder="Ex: kilogramme"
                    required
                  />
                </InputGroup>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Symbole <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Ex: kg, L, pcs</p>
                <InputGroup>
                  <InputGroupInput
                    type="text"
                    value={uniteSymbol}
                    onChange={(e) => setUniteSymbol(e.target.value)}
                    placeholder="Ex: kg"
                    required
                  />
                </InputGroup>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Informations financières */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Prix unitaire</label>
                <p className="text-xs text-muted-foreground">Prix par unité (optionnel, peut être 0)</p>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={prixUnitaire}
                    onChange={(e) => setPrixUnitaire(e.target.value)}
                    placeholder="0.00"
                  />
                </InputGroup>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Seuil d'alerte</label>
                <p className="text-xs text-muted-foreground">Quantité minimale avant alerte (optionnel)</p>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={seuilAlerte}
                    onChange={(e) => setSeuilAlerte(e.target.value)}
                    placeholder="0"
                  />
                </InputGroup>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Image (optionnel) */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">URL de l'image</label>
                <p className="text-xs text-muted-foreground">Optionnel</p>
                <InputGroup>
                  <InputGroupInput
                    type="url"
                    value={imgURL}
                    onChange={(e) => setImgURL(e.target.value)}
                    placeholder="https://..."
                  />
                </InputGroup>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Separator />

        {/* Afficher l'erreur si présente */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {submitError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Package className="h-4 w-4" />
                </motion.div>
                Création...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créer l'élément
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default MobileCreateStock;
