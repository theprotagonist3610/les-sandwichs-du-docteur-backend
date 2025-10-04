import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Timestamp } from "firebase/firestore";
import LogisticVan from "@/customIcons/LogisticVan";
import {
  Store,
  MapPin,
  User,
  Package,
  ChevronRight,
  ChevronLeft,
  Save,
  ArrowLeft,
  Building,
  Navigation,
  Hash,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";

// Hooks
import useBreakpoint from "@/hooks/useBreakpoint";
import { createEmplacement } from "@/toolkits/emplacementToolkit";

// Composants UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AjouterPointDeVente = () => {
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useBreakpoint(1024);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // Pour le formulaire mobile multi-étapes
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEmplacement, setCreatedEmplacement] = useState(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    // Informations de base
    denomination: "",
    type: "emplacement fixe",

    // Position
    position: {
      nom: "",
      departement: "",
      commune: "",
      arrondissement: "",
      quartier: "",
      indication: "",
      coordonnees: {
        longitude: 0,
        latitude: 0,
      },
    },

    // Vendeuse (optionnel)
    hasVendeuse: false,
    vendeuse: {
      id: "",
      nom: "",
      prenoms: [""],
    },

    // Stock initial (optionnel)
    hasInitialStock: false,
    initialStock: {
      equipements: [],
      consommable: [],
      perissable: [],
    },
  });

  // Validation par étape
  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Infos de base
        return formData.denomination.trim() !== "";
      case 1: // Position
        return formData.position.nom.trim() !== "";
      case 2: // Vendeuse
        return !formData.hasVendeuse || formData.vendeuse.nom.trim() !== "";
      case 3: // Stock
        return true; // Stock optionnel
      default:
        return true;
    }
  };

  // Gestion des changements
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePositionChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      position: {
        ...prev.position,
        [field]: value,
      },
    }));
  };

  const handleCoordonnees = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      position: {
        ...prev.position,
        coordonnees: {
          ...prev.position.coordonnees,
          [field]: parseFloat(value) || 0,
        },
      },
    }));
  };

  const handleVendeuseChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      vendeuse: {
        ...prev.vendeuse,
        [field]: value,
      },
    }));
  };

  // Gestion des prénoms multiples
  const addPrenom = () => {
    setFormData((prev) => ({
      ...prev,
      vendeuse: {
        ...prev.vendeuse,
        prenoms: [...prev.vendeuse.prenoms, ""],
      },
    }));
  };

  const updatePrenom = (index, value) => {
    const newPrenoms = [...formData.vendeuse.prenoms];
    newPrenoms[index] = value;
    setFormData((prev) => ({
      ...prev,
      vendeuse: {
        ...prev.vendeuse,
        prenoms: newPrenoms,
      },
    }));
  };

  const removePrenom = (index) => {
    const newPrenoms = formData.vendeuse.prenoms.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      vendeuse: {
        ...prev.vendeuse,
        prenoms: newPrenoms.length > 0 ? newPrenoms : [""],
      },
    }));
  };

  // Ajout d'items au stock initial
  const addStockItem = (categorie) => {
    const newItem = {
      id: nanoid(8),
      denomination: "",
      quantite: 0,
    };

    setFormData((prev) => ({
      ...prev,
      initialStock: {
        ...prev.initialStock,
        [categorie]: [...prev.initialStock[categorie], newItem],
      },
    }));
  };

  const updateStockItem = (categorie, index, field, value) => {
    const newItems = [...formData.initialStock[categorie]];
    newItems[index] = {
      ...newItems[index],
      [field]: field === "quantite" ? parseInt(value) || 0 : value,
    };

    setFormData((prev) => ({
      ...prev,
      initialStock: {
        ...prev.initialStock,
        [categorie]: newItems,
      },
    }));
  };

  const removeStockItem = (categorie, index) => {
    const newItems = formData.initialStock[categorie].filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      initialStock: {
        ...prev.initialStock,
        [categorie]: newItems,
      },
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Préparer les données pour le toolkit
      const emplData = {
        denomination: formData.denomination,
        type: formData.type,
        position: {
          ...formData.position,
          periode: {
            debut: Timestamp.now(),
            fin: null,
          },
        },
      };

      // Ajouter la vendeuse si nécessaire
      if (formData.hasVendeuse && formData.vendeuse.nom) {
        emplData.vendeuse = {
          id: formData.vendeuse.id || nanoid(10),
          nom: formData.vendeuse.nom,
          prenoms: formData.vendeuse.prenoms.filter((p) => p.trim() !== ""),
          periode: {
            debut: Timestamp.now(),
            fin: null,
          },
        };
      }

      // Ajouter le stock initial si nécessaire
      if (formData.hasInitialStock) {
        const hasStock =
          formData.initialStock.equipements.length > 0 ||
          formData.initialStock.consommable.length > 0 ||
          formData.initialStock.perissable.length > 0;

        if (hasStock) {
          emplData.stock_actuel = formData.initialStock;
        }
      }

      // Créer l'emplacement
      const result = await createEmplacement(emplData);

      if (result.success) {
        setCreatedEmplacement(result.data);
        setShowSuccessDialog(true);

        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
          navigate("/admin/points_vente/points_vente/");
        }, 2000);
      } else {
        throw new Error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
      toast.error("Erreur lors de la création du point de vente");
    } finally {
      setLoading(false);
    }
  };

  // Étapes du formulaire mobile
  const mobileSteps = [
    { title: "Informations", icon: Store, component: "basic" },
    { title: "Localisation", icon: MapPin, component: "location" },
    { title: "Vendeuse", icon: User, component: "vendeuse" },
    { title: "Stock initial", icon: Package, component: "stock" },
  ];

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  // ========================================
  // RENDU MOBILE
  // ========================================
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header mobile */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Nouveau point de vente</h1>
          <div className="w-10" />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-secondary">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / mobileSteps.length) * 100}%` }}
          />
        </div>

        {/* Indicateur d'étape */}
        <div className="p-4 bg-card border-b">
          <div className="flex items-center justify-between">
            {mobileSteps.map((s, idx) => (
              <motion.div
                key={idx}
                className={`flex items-center ${
                  idx <= step ? "text-primary" : "text-muted-foreground"
                }`}
                animate={{ scale: idx === step ? 1.1 : 1 }}>
                <s.icon className="h-5 w-5" />
                {idx < mobileSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                )}
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-center mt-2 font-medium">
            {mobileSteps[step].title}
          </p>
        </div>

        {/* Contenu du formulaire */}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait" custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="p-4 space-y-4">
              {/* Étape 0: Informations de base */}
              {step === 0 && (
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible">
                  <motion.div variants={itemVariants}>
                    <Label htmlFor="denomination">Dénomination *</Label>
                    <Input
                      id="denomination"
                      placeholder="Ex: Stand Marché Central A12"
                      value={formData.denomination}
                      onChange={(e) =>
                        handleChange("denomination", e.target.value)
                      }
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="type">Type d'emplacement</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleChange("type", value)}>
                      <SelectTrigger id="type" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emplacement fixe">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Emplacement fixe
                          </div>
                        </SelectItem>
                        <SelectItem value="emplacement semi-mobile">
                          <div className="flex items-center">
                            <Store className="h-4 w-4 mr-2" />
                            Emplacement semi-mobile
                          </div>
                        </SelectItem>
                        <SelectItem value="emplacement mobile">
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-2" />
                            Emplacement mobile
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-2">
                    <Badge variant="outline" className="text-xs">
                      {formData.type}
                    </Badge>
                  </motion.div>
                </motion.div>
              )}

              {/* Étape 1: Localisation */}
              {step === 1 && (
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible">
                  <motion.div variants={itemVariants}>
                    <Label htmlFor="nom">Nom du lieu *</Label>
                    <Input
                      id="nom"
                      placeholder="Ex: Marché Central"
                      value={formData.position.nom}
                      onChange={(e) =>
                        handlePositionChange("nom", e.target.value)
                      }
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="departement">Département</Label>
                    <Input
                      id="departement"
                      placeholder="Ex: Littoral"
                      value={formData.position.departement}
                      onChange={(e) =>
                        handlePositionChange("departement", e.target.value)
                      }
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="commune">Commune</Label>
                    <Input
                      id="commune"
                      placeholder="Ex: Cotonou"
                      value={formData.position.commune}
                      onChange={(e) =>
                        handlePositionChange("commune", e.target.value)
                      }
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="arrondissement">Arrondissement</Label>
                    <Input
                      id="arrondissement"
                      placeholder="Ex: 1er"
                      value={formData.position.arrondissement}
                      onChange={(e) =>
                        handlePositionChange("arrondissement", e.target.value)
                      }
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="quartier">Quartier</Label>
                    <Input
                      id="quartier"
                      placeholder="Ex: Ganhi"
                      value={formData.position.quartier}
                      onChange={(e) =>
                        handlePositionChange("quartier", e.target.value)
                      }
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="indication">Indication</Label>
                    <Textarea
                      id="indication"
                      placeholder="Ex: Allée A, Stand 12, près de l'entrée principale"
                      value={formData.position.indication}
                      onChange={(e) =>
                        handlePositionChange("indication", e.target.value)
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label>Coordonnées GPS (optionnel)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="Latitude"
                          value={formData.position.coordonnees.latitude || ""}
                          onChange={(e) =>
                            handleCoordonnees("latitude", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="Longitude"
                          value={formData.position.coordonnees.longitude || ""}
                          onChange={(e) =>
                            handleCoordonnees("longitude", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Étape 2: Vendeuse */}
              {step === 2 && (
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible">
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between">
                    <Label htmlFor="hasVendeuse">Assigner une vendeuse</Label>
                    <Switch
                      id="hasVendeuse"
                      checked={formData.hasVendeuse}
                      onCheckedChange={(checked) =>
                        handleChange("hasVendeuse", checked)
                      }
                    />
                  </motion.div>

                  {formData.hasVendeuse && (
                    <>
                      <motion.div variants={itemVariants}>
                        <Label htmlFor="vendeuseNom">Nom de famille *</Label>
                        <Input
                          id="vendeuseNom"
                          placeholder="Ex: AHOUANSOU"
                          value={formData.vendeuse.nom}
                          onChange={(e) =>
                            handleVendeuseChange("nom", e.target.value)
                          }
                          className="mt-1"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Prénoms</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPrenom}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {formData.vendeuse.prenoms.map((prenom, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Prénom ${index + 1}`}
                              value={prenom}
                              onChange={(e) =>
                                updatePrenom(index, e.target.value)
                              }
                            />
                            {formData.vendeuse.prenoms.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePrenom(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    </>
                  )}

                  {!formData.hasVendeuse && (
                    <motion.div
                      variants={itemVariants}
                      className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune vendeuse assignée</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Étape 3: Stock initial */}
              {step === 3 && (
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible">
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between">
                    <Label htmlFor="hasStock">Ajouter un stock initial</Label>
                    <Switch
                      id="hasStock"
                      checked={formData.hasInitialStock}
                      onCheckedChange={(checked) =>
                        handleChange("hasInitialStock", checked)
                      }
                    />
                  </motion.div>

                  {formData.hasInitialStock && (
                    <Tabs defaultValue="consommable" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="equipements">Équip.</TabsTrigger>
                        <TabsTrigger value="consommable">Consom.</TabsTrigger>
                        <TabsTrigger value="perissable">Périss.</TabsTrigger>
                      </TabsList>

                      {["equipements", "consommable", "perissable"].map(
                        (categorie) => (
                          <TabsContent
                            key={categorie}
                            value={categorie}
                            className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm">{categorie}</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addStockItem(categorie)}>
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter
                              </Button>
                            </div>

                            {formData.initialStock[categorie].map(
                              (item, index) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex gap-2">
                                  <Input
                                    placeholder="Dénomination"
                                    value={item.denomination}
                                    onChange={(e) =>
                                      updateStockItem(
                                        categorie,
                                        index,
                                        "denomination",
                                        e.target.value
                                      )
                                    }
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Qté"
                                    value={item.quantite}
                                    onChange={(e) =>
                                      updateStockItem(
                                        categorie,
                                        index,
                                        "quantite",
                                        e.target.value
                                      )
                                    }
                                    className="w-20"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeStockItem(categorie, index)
                                    }>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              )
                            )}

                            {formData.initialStock[categorie].length === 0 && (
                              <p className="text-center text-sm text-muted-foreground py-4">
                                Aucun article dans cette catégorie
                              </p>
                            )}
                          </TabsContent>
                        )
                      )}
                    </Tabs>
                  )}

                  {!formData.hasInitialStock && (
                    <motion.div
                      variants={itemVariants}
                      className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Stock initial vide</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Actions en bas */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            )}

            {step < mobileSteps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!validateStep(step) || loading}
                className="flex-1">
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(step) || loading}
                className="flex-1">
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Création...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Créer
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU DESKTOP
  // ========================================
  return (
    <motion.div
      className="container mx-auto py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nouveau point de vente</h1>
            <p className="text-muted-foreground mt-2">
              Créez un nouvel emplacement pour votre activité commerciale
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Store className="h-5 w-5 mr-2" />
            {formData.type}
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Définissez les caractéristiques principales du point de vente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="denomination">Dénomination *</Label>
                  <Input
                    id="denomination"
                    placeholder="Ex: Stand Marché Central A12"
                    value={formData.denomination}
                    onChange={(e) =>
                      handleChange("denomination", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type d'emplacement</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger id="type" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emplacement fixe">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Emplacement fixe
                        </div>
                      </SelectItem>
                      <SelectItem value="emplacement semi-mobile">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 mr-2" />
                          Emplacement semi-mobile
                        </div>
                      </SelectItem>
                      <SelectItem value="emplacement mobile">
                        <div className="flex items-center">
                          <Navigation className="h-4 w-4 mr-2" />
                          Emplacement mobile
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Localisation */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Localisation
                </CardTitle>
                <CardDescription>
                  Précisez l'emplacement géographique du point de vente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nom">Nom du lieu *</Label>
                  <Input
                    id="nom"
                    placeholder="Ex: Marché Central"
                    value={formData.position.nom}
                    onChange={(e) =>
                      handlePositionChange("nom", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departement">Département</Label>
                    <Input
                      id="departement"
                      placeholder="Ex: Littoral"
                      value={formData.position.departement}
                      onChange={(e) =>
                        handlePositionChange("departement", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commune">Commune</Label>
                    <Input
                      id="commune"
                      placeholder="Ex: Cotonou"
                      value={formData.position.commune}
                      onChange={(e) =>
                        handlePositionChange("commune", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="arrondissement">Arrondissement</Label>
                    <Input
                      id="arrondissement"
                      placeholder="Ex: 1er"
                      value={formData.position.arrondissement}
                      onChange={(e) =>
                        handlePositionChange("arrondissement", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quartier">Quartier</Label>
                    <Input
                      id="quartier"
                      placeholder="Ex: Ganhi"
                      value={formData.position.quartier}
                      onChange={(e) =>
                        handlePositionChange("quartier", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="indication">Indication</Label>
                  <Textarea
                    id="indication"
                    placeholder="Ex: Allée A, Stand 12, près de l'entrée principale"
                    value={formData.position.indication}
                    onChange={(e) =>
                      handlePositionChange("indication", e.target.value)
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Separator />

                <div>
                  <Label>Coordonnées GPS (optionnel)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label
                        htmlFor="latitude"
                        className="text-sm text-muted-foreground">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        placeholder="6.3654"
                        value={formData.position.coordonnees.latitude || ""}
                        onChange={(e) =>
                          handleCoordonnees("latitude", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="longitude"
                        className="text-sm text-muted-foreground">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        placeholder="2.4315"
                        value={formData.position.coordonnees.longitude || ""}
                        onChange={(e) =>
                          handleCoordonnees("longitude", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Vendeuse */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Vendeuse
                  </span>
                  <Switch
                    checked={formData.hasVendeuse}
                    onCheckedChange={(checked) =>
                      handleChange("hasVendeuse", checked)
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Assignez une vendeuse à cet emplacement
                </CardDescription>
              </CardHeader>
              {formData.hasVendeuse && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="vendeuseNom">Nom de famille *</Label>
                    <Input
                      id="vendeuseNom"
                      placeholder="Ex: AHOUANSOU"
                      value={formData.vendeuse.nom}
                      onChange={(e) =>
                        handleVendeuseChange("nom", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Prénoms</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPrenom}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.vendeuse.prenoms.map((prenom, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Prénom ${index + 1}`}
                            value={prenom}
                            onChange={(e) =>
                              updatePrenom(index, e.target.value)
                            }
                          />
                          {formData.vendeuse.prenoms.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePrenom(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Stock initial */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Stock initial
                  </span>
                  <Switch
                    checked={formData.hasInitialStock}
                    onCheckedChange={(checked) =>
                      handleChange("hasInitialStock", checked)
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Ajoutez un stock de départ (optionnel)
                </CardDescription>
              </CardHeader>
              {formData.hasInitialStock && (
                <CardContent>
                  <Tabs defaultValue="consommable" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="equipements">Équip.</TabsTrigger>
                      <TabsTrigger value="consommable">Consom.</TabsTrigger>
                      <TabsTrigger value="perissable">Périss.</TabsTrigger>
                    </TabsList>

                    {["equipements", "consommable", "perissable"].map(
                      (categorie) => (
                        <TabsContent
                          key={categorie}
                          value={categorie}
                          className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm capitalize">
                              {categorie}
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addStockItem(categorie)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {formData.initialStock[categorie].map(
                                (item, index) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-2">
                                    <Input
                                      placeholder="Article"
                                      value={item.denomination}
                                      onChange={(e) =>
                                        updateStockItem(
                                          categorie,
                                          index,
                                          "denomination",
                                          e.target.value
                                        )
                                      }
                                      className="flex-1"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Qté"
                                      value={item.quantite}
                                      onChange={(e) =>
                                        updateStockItem(
                                          categorie,
                                          index,
                                          "quantite",
                                          e.target.value
                                        )
                                      }
                                      className="w-16"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeStockItem(categorie, index)
                                      }>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </motion.div>
                                )
                              )}
                              {formData.initialStock[categorie].length ===
                                0 && (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                  Aucun article
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      )
                    )}
                  </Tabs>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="sticky bottom-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.denomination || !formData.position.nom || loading
                  }
                  className="w-full"
                  size="lg">
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Création en cours...
                    </div>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Créer le point de vente
                    </>
                  )}
                </Button>

                {formData.denomination && formData.position.nom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center">
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                      Prêt à créer
                    </p>
                  </motion.div>
                )}

                {(!formData.denomination || !formData.position.nom) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3">
                    <p className="text-sm text-destructive flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Champs requis manquants
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Dialog de succès */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </motion.div>
            <DialogTitle className="text-center">
              Point de vente créé avec succès !
            </DialogTitle>
            <DialogDescription className="text-center">
              {createdEmplacement && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium">
                    {createdEmplacement.denomination}
                  </p>
                  <p className="text-sm">{createdEmplacement.position?.nom}</p>
                  <Badge className="mt-2">{createdEmplacement.type}</Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AjouterPointDeVente;
