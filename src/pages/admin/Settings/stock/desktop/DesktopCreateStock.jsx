/**
 * DesktopCreateStock.jsx
 * Formulaire de création d'élément de stock (version desktop)
 * - Store Zustand avec sélecteurs optimisés
 * - Framer-motion pour les animations
 * - UI input-group pour les champs
 * - Layout en grille avec cards riches et espacées
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
  Info,
  Sparkles,
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
    darkBg: "dark:bg-green-950",
  },
  [STOCK_TYPES.CONSOMMABLE]: {
    icon: ShoppingBag,
    label: "Consommable",
    color: "text-blue-600",
    bg: "bg-blue-50",
    darkBg: "dark:bg-blue-950",
  },
  [STOCK_TYPES.PERISSABLE]: {
    icon: Clock,
    label: "Périssable",
    color: "text-orange-600",
    bg: "bg-orange-50",
    darkBg: "dark:bg-orange-950",
  },
  [STOCK_TYPES.MATERIEL]: {
    icon: Box,
    label: "Matériel",
    color: "text-purple-600",
    bg: "bg-purple-50",
    darkBg: "dark:bg-purple-950",
  },
  [STOCK_TYPES.EMBALLAGE]: {
    icon: Archive,
    label: "Emballage",
    color: "text-gray-600",
    bg: "bg-gray-50",
    darkBg: "dark:bg-gray-950",
  },
};

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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
      stiffness: 120,
      damping: 15,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const DesktopCreateStock = () => {
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Package className="h-16 w-16 mx-auto text-muted-foreground animate-pulse" />
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
        className="min-h-screen flex items-center justify-center p-8"
      >
        <Card className="w-full max-w-2xl border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-600 text-2xl">
              <AlertTriangle className="h-7 w-7" />
              BASE centrale non trouvée
            </CardTitle>
            <CardDescription className="text-base">
              Vous devez d'abord initialiser le système de stock avant de créer des éléments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                La BASE centrale est l'entrepôt principal où tous les éléments de stock sont d'abord
                enregistrés avant d'être distribués vers d'autres emplacements. Elle doit être créée
                lors de l'initialisation du système de stock.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1" size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button
                onClick={() => navigate("/admin/settings/stock/initialiser")}
                className="flex-1"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Initialiser le stock
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const TypeIcon = STOCK_TYPE_CONFIG[type]?.icon || Package;
  const typeConfig = STOCK_TYPE_CONFIG[type];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen p-8 pb-24"
    >
      {/* Header */}
      <motion.div variants={headerVariants} className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${typeConfig?.bg} ${typeConfig?.darkBg}`}>
            <TypeIcon className={`h-8 w-8 ${typeConfig?.color}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Nouvel élément de stock</h1>
            <p className="text-muted-foreground">
              Créez un nouvel élément dans le système de gestion de stock
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Type de stock */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TypeIcon className={`h-5 w-5 ${typeConfig?.color}`} />
                    Type d'élément
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez la catégorie de l'élément de stock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
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
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                  <CardDescription>
                    Dénomination et description de l'élément
                  </CardDescription>
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
                        placeholder="Ex: Farine de blé T55"
                        required
                      />
                    </InputGroup>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-xs text-muted-foreground">Optionnel - Détails supplémentaires</p>
                    <InputGroup>
                      <InputGroupTextarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description détaillée de l'élément..."
                        rows={4}
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
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Unité de mesure
                  </CardTitle>
                  <CardDescription>
                    Définissez l'unité utilisée pour cet élément
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Nom de l'unité <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">Ex: kilogramme</p>
                      <InputGroup>
                        <InputGroupInput
                          type="text"
                          value={uniteNom}
                          onChange={(e) => setUniteNom(e.target.value)}
                          placeholder="kilogramme"
                          required
                        />
                      </InputGroup>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Symbole <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">Ex: kg</p>
                      <InputGroup>
                        <InputGroupInput
                          type="text"
                          value={uniteSymbol}
                          onChange={(e) => setUniteSymbol(e.target.value)}
                          placeholder="kg"
                          required
                        />
                      </InputGroup>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>
                        Exemples d'unités: kilogramme (kg), litre (L), pièce (pcs), mètre (m), etc.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Tarification */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Tarification et alertes
                  </CardTitle>
                  <CardDescription>
                    Prix unitaire et seuil d'alerte pour le stock
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Prix unitaire</label>
                    <p className="text-xs text-muted-foreground">Prix par unité (peut être 0 pour les placeholders)</p>
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
                    <p className="text-xs text-muted-foreground">Quantité minimale avant déclenchement d'alerte</p>
                    <InputGroup>
                      <InputGroupInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={seuilAlerte}
                        onChange={(e) => setSeuilAlerte(e.target.value)}
                        placeholder="10"
                      />
                    </InputGroup>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>
                        Le seuil d'alerte permet de recevoir une notification lorsque le stock
                        descend en dessous de cette quantité.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Image */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Image de l'élément
                  </CardTitle>
                  <CardDescription>
                    URL de l'image (optionnel)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">URL de l'image</label>
                    <p className="text-xs text-muted-foreground">Lien vers une image en ligne</p>
                    <InputGroup>
                      <InputGroupInput
                        type="url"
                        value={imgURL}
                        onChange={(e) => setImgURL(e.target.value)}
                        placeholder="https://exemple.com/image.jpg"
                      />
                    </InputGroup>
                  </div>

                  {imgURL && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={imgURL}
                        alt="Aperçu"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Info placeholder */}
            <motion.div variants={itemVariants}>
              <Card className="border-dashed bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Création d'un placeholder</p>
                      <p className="text-xs text-muted-foreground">
                        L'élément sera créé avec une quantité de 0. Vous pourrez ensuite ajouter
                        du stock via des transactions d'entrée dans la BASE centrale.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Afficher l'erreur si présente */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {submitError}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
            size="lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[200px]">
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Package className="h-4 w-4" />
                </motion.div>
                Création en cours...
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

export default DesktopCreateStock;
