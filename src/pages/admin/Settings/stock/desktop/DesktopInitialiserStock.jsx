/**
 * DesktopInitialiserStock.jsx
 * Initialisation du système de stock (version desktop avec animations)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  Warehouse,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Box,
  Archive,
  ShoppingBag,
  Utensils,
  Clock,
  CheckCircle2,
  MapPin,
} from "lucide-react";

import {
  initializeStock,
  useStockInitialization,
  BASE_DENOMINATION,
} from "@/toolkits/admin/initStockToolkit.jsx";
import { STOCK_TYPES } from "@/toolkits/admin/stockToolkit.jsx";
import { liste as stockListePredefined } from "../liste.js";

// Icônes pour chaque type de stock
const STOCK_TYPE_ICONS = {
  ingredient: { icon: Utensils, color: "text-green-600", bg: "bg-green-50", darkBg: "dark:bg-green-950" },
  consommable: { icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", darkBg: "dark:bg-blue-950" },
  perissable: { icon: Clock, color: "text-orange-600", bg: "bg-orange-50", darkBg: "dark:bg-orange-950" },
  materiel: { icon: Box, color: "text-purple-600", bg: "bg-purple-50", darkBg: "dark:bg-purple-950" },
  emballage: { icon: Archive, color: "text-gray-600", bg: "bg-gray-50", darkBg: "dark:bg-gray-950" },
};

const DesktopInitialiserStock = () => {
  const { initialized, loading: checkingInit, info, checkInit } = useStockInitialization();

  const [baseConfig, setBaseConfig] = useState({
    denomination: BASE_DENOMINATION,
    position: {
      departement: "",
      commune: "",
      arrondissement: "",
      quartier: "",
      longitude: 0,
      latitude: 0,
    },
    theme_central: {
      theme: "Stock général",
      description: "",
    },
    sous_type: "entrepot_principal",
    responsable: null, // {id, nom, prenoms} ou null
  });

  const [elements, setElements] = useState([]);
  const [initializing, setInitializing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentItem: "" });
  const [initSuccess, setInitSuccess] = useState(false);

  // État pour un nouvel élément
  const [newElement, setNewElement] = useState({
    denomination: "",
    type: "ingredient",
    unite: "",
    quantite_initiale: "",
    prix_unitaire: "",
    seuil_alerte: "",
    description: "",
  });

  // Vérifier l'initialisation au chargement
  useEffect(() => {
    checkInit();
  }, [checkInit]);

  // Ajouter un élément à la liste
  const handleAddElement = () => {
    if (!newElement.denomination || !newElement.unite || !newElement.quantite_initiale) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    const element = {
      ...newElement,
      quantite_initiale: parseFloat(newElement.quantite_initiale) || 0,
      prix_unitaire: parseFloat(newElement.prix_unitaire) || 0,
      seuil_alerte: parseFloat(newElement.seuil_alerte) || 0,
    };

    setElements([...elements, element]);
    setNewElement({
      denomination: "",
      type: "ingredient",
      unite: "",
      quantite_initiale: "",
      prix_unitaire: "",
      seuil_alerte: "",
      description: "",
    });
    toast.success("Élément ajouté");
  };

  // Supprimer un élément
  const handleRemoveElement = (index) => {
    setElements(elements.filter((_, i) => i !== index));
    toast.info("Élément supprimé");
  };

  // Charger la liste prédéfinie
  const handleLoadPredefinedList = () => {
    const converted = stockListePredefined.map(item => ({
      denomination: item.denomination,
      type: item.type,
      unite: item.unite.symbol,
      quantite_initiale: 0, // Quantité à définir par l'utilisateur
      prix_unitaire: 0,
      seuil_alerte: 0,
      description: item.description || "",
    }));

    setElements(converted);
    toast.success(`${converted.length} éléments chargés depuis la liste prédéfinie`);
  };

  // Récupérer la position GPS actuelle
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    toast.info("Récupération de votre position...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setBaseConfig({
          ...baseConfig,
          position: {
            ...baseConfig.position,
            latitude: parseFloat(latitude.toFixed(4)),
            longitude: parseFloat(longitude.toFixed(4)),
          },
        });
        toast.success(`Position récupérée: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (error) => {
        let errorMessage = "Impossible de récupérer votre position";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission de géolocalisation refusée";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position non disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Délai de récupération dépassé";
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Initialiser le stock
  const handleInitialize = async () => {
    if (elements.length === 0) {
      toast.error("Ajoutez au moins un élément de stock");
      return;
    }

    // Validation des champs obligatoires de la base
    if (!baseConfig.position.departement || !baseConfig.position.commune) {
      toast.error("Veuillez renseigner au moins le département et la commune de la base");
      return;
    }

    try {
      setInitializing(true);
      setProgress({ current: 0, total: elements.length, currentItem: "" });

      // Simuler le progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev.current >= prev.total) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            current: prev.current + 1,
            currentItem: elements[prev.current]?.denomination || "",
          };
        });
      }, 500);

      const result = await initializeStock(elements, baseConfig);

      clearInterval(progressInterval);
      setProgress({ current: result.totalElements, total: result.totalElements, currentItem: "" });

      if (result.success) {
        setInitSuccess(true);
        toast.success(`Stock initialisé avec ${result.elementsCreated} éléments !`);

        // Recharger l'état d'initialisation
        setTimeout(() => {
          checkInit();
        }, 1000);
      } else {
        toast.warning(`Initialisé avec ${result.errors.length} erreur(s)`);
      }
    } catch (error) {
      console.error("❌ Erreur initialisation:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    show: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  };

  // Si déjà initialisé
  if (initialized && !initSuccess) {
    return (
      <div className="container mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                    Stock déjà initialisé
                  </h2>
                  <p className="text-green-700 dark:text-green-300 mt-2">
                    Initialisé le {info?.date ? new Date(info.date).toLocaleDateString() : ""}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-3">
                    {info?.elements_count} élément(s) créé(s) dans la base centrale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Vérification en cours
  if (checkingInit) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification de l'état d'initialisation...</p>
        </div>
      </div>
    );
  }

  // Affichage principal
  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Warehouse className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Initialiser le Stock</h1>
            <p className="text-muted-foreground mt-1">
              Créer la base centrale et ajouter des éléments de stock
            </p>
          </div>
        </div>

        {elements.length > 0 && (
          <Button
            onClick={handleInitialize}
            disabled={initializing}
            size="lg"
            className="min-w-[220px]"
          >
            {initializing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Initialisation...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Initialiser ({elements.length})
              </>
            )}
          </Button>
        )}
      </motion.div>

      {/* Progress Bar */}
      <AnimatePresence>
        {initializing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Initialisation en cours...</p>
                      <p className="text-sm text-muted-foreground">
                        {progress.current}/{progress.total} - {progress.currentItem}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {Math.round((progress.current / progress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-3">
                    <motion.div
                      className="bg-blue-600 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {initSuccess && (
          <motion.div variants={successVariants} initial="hidden" animate="show">
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Stock initialisé avec succès !
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Tous les éléments ont été créés dans la base centrale
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche: Configuration et formulaire */}
        <div className="lg:col-span-1 space-y-6">
          {/* Configuration de la BASE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-blue-600" />
                Configuration de la Base
              </CardTitle>
              <CardDescription>Entrepôt central de stockage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dénomination</label>
                <Input
                  value={baseConfig.denomination}
                  onChange={(e) => setBaseConfig({ ...baseConfig, denomination: e.target.value })}
                  placeholder="Base Centrale"
                />
              </div>

              {/* Position géographique - OBLIGATOIRE */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-red-600">Position géographique *</label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Département *</label>
                    <Input
                      value={baseConfig.position.departement}
                      onChange={(e) => setBaseConfig({
                        ...baseConfig,
                        position: { ...baseConfig.position, departement: e.target.value }
                      })}
                      placeholder="ex: Atlantique"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Commune *</label>
                    <Input
                      value={baseConfig.position.commune}
                      onChange={(e) => setBaseConfig({
                        ...baseConfig,
                        position: { ...baseConfig.position, commune: e.target.value }
                      })}
                      placeholder="ex: Abomey-Calavi"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Arrondissement</label>
                    <Input
                      value={baseConfig.position.arrondissement}
                      onChange={(e) => setBaseConfig({
                        ...baseConfig,
                        position: { ...baseConfig.position, arrondissement: e.target.value }
                      })}
                      placeholder="ex: Godomey"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Quartier</label>
                    <Input
                      value={baseConfig.position.quartier}
                      onChange={(e) => setBaseConfig({
                        ...baseConfig,
                        position: { ...baseConfig.position, quartier: e.target.value }
                      })}
                      placeholder="ex: Vossa"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Coordonnées GPS</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGetCurrentLocation}
                      className="h-7 text-xs"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Position actuelle
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Longitude</label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={baseConfig.position.longitude}
                        onChange={(e) => setBaseConfig({
                          ...baseConfig,
                          position: { ...baseConfig.position, longitude: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="2.3522"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Latitude</label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={baseConfig.position.latitude}
                        onChange={(e) => setBaseConfig({
                          ...baseConfig,
                          position: { ...baseConfig.position, latitude: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="6.4489"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thème central */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Thème</label>
                <Input
                  value={baseConfig.theme_central.theme}
                  onChange={(e) => setBaseConfig({
                    ...baseConfig,
                    theme_central: { ...baseConfig.theme_central, theme: e.target.value }
                  })}
                  placeholder="Stock général"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description du thème</label>
                <Input
                  value={baseConfig.theme_central.description}
                  onChange={(e) => setBaseConfig({
                    ...baseConfig,
                    theme_central: { ...baseConfig.theme_central, description: e.target.value }
                  })}
                  placeholder="Description..."
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Formulaire d'ajout */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Ajouter un élément
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dénomination *</label>
                <Input
                  value={newElement.denomination}
                  onChange={(e) => setNewElement({ ...newElement, denomination: e.target.value })}
                  placeholder="Farine, Tomates..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Select value={newElement.type} onValueChange={(val) => setNewElement({ ...newElement, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STOCK_TYPES).map(([, value]) => {
                      const iconData = STOCK_TYPE_ICONS[value];
                      const Icon = iconData?.icon || Package;
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${iconData?.color}`} />
                            <span className="capitalize">{value}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unité *</label>
                  <Input
                    value={newElement.unite}
                    onChange={(e) => setNewElement({ ...newElement, unite: e.target.value })}
                    placeholder="kg, L..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantité *</label>
                  <Input
                    type="number"
                    value={newElement.quantite_initiale}
                    onChange={(e) => setNewElement({ ...newElement, quantite_initiale: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prix unitaire</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newElement.prix_unitaire}
                    onChange={(e) => setNewElement({ ...newElement, prix_unitaire: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Seuil alerte</label>
                  <Input
                    type="number"
                    value={newElement.seuil_alerte}
                    onChange={(e) => setNewElement({ ...newElement, seuil_alerte: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>

              <Button onClick={handleAddElement} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter à la liste
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite: Liste des éléments */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Éléments de Stock ({elements.length})
                  </CardTitle>
                  <CardDescription>
                    Liste des éléments qui seront initialisés dans la base centrale
                  </CardDescription>
                </div>
                {elements.length === 0 && (
                  <Button onClick={handleLoadPredefinedList} variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Charger la liste (70+ éléments)
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {elements.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun élément ajouté</p>
                  <p className="text-sm text-muted-foreground">
                    Utilisez le formulaire pour ajouter des éléments
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {elements.map((element, index) => {
                    const iconData = STOCK_TYPE_ICONS[element.type] || STOCK_TYPE_ICONS.ingredient;
                    const Icon = iconData.icon;

                    return (
                      <motion.div key={index} variants={itemVariants}>
                        <Card className={`overflow-hidden hover:shadow-md transition-all ${iconData.bg} ${iconData.darkBg} border-2`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Icon className={`h-6 w-6 ${iconData.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{element.denomination}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <span className="capitalize">{element.type}</span>
                                  <span>•</span>
                                  <span className="font-medium">
                                    {element.quantite_initiale} {element.unite}
                                  </span>
                                </div>
                                {element.prix_unitaire > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {element.prix_unitaire}€/{element.unite}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleRemoveElement(index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Avertissement */}
          {elements.length > 0 && !initSuccess && (
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Attention
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      Cette opération va créer <strong>{elements.length} élément(s)</strong> dans la
                      base centrale et ne peut être effectuée qu'une seule fois. Vérifiez que le stock
                      n'est pas déjà initialisé.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopInitialiserStock;
