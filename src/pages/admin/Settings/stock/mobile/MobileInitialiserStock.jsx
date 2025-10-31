/**
 * MobileInitialiserStock.jsx
 * Initialisation du système de stock (version mobile avec animations)
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
  Check,
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
  ChevronUp,
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
  ingredient: { icon: Utensils, color: "text-green-600", bg: "bg-green-50" },
  consommable: { icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
  perissable: { icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  materiel: { icon: Box, color: "text-purple-600", bg: "bg-purple-50" },
  emballage: { icon: Archive, color: "text-gray-600", bg: "bg-gray-50" },
};

const MobileInitialiserStock = () => {
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
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(false);
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

      // Simuler le progress (car initializeStock fait tout en batch)
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
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
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
      <div className="p-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-green-900">Stock déjà initialisé</h2>
                  <p className="text-sm text-green-700 mt-1">
                    Initialisé le {info?.date ? new Date(info.date).toLocaleDateString() : ""}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    {info?.elements_count} élément(s) créé(s)
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
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Affichage principal
  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Warehouse className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Initialiser le Stock</h1>
            <p className="text-xs text-muted-foreground">Créer la base centrale et ajouter des éléments</p>
          </div>
        </div>
      </motion.div>

      {/* Configuration de la BASE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-blue-600" />
            Configuration de la Base
          </CardTitle>
          <CardDescription className="text-xs">Entrepôt central de stockage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Dénomination</label>
            <Input
              value={baseConfig.denomination}
              onChange={(e) => setBaseConfig({ ...baseConfig, denomination: e.target.value })}
              placeholder="Base Centrale"
              className="h-9"
            />
          </div>

          {/* Position géographique - OBLIGATOIRE */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-red-600">Position géographique *</label>

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
                  className="h-9"
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
                  className="h-9"
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
                  className="h-9"
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
                  className="h-9"
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
                    className="h-9"
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
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thème central */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Thème</label>
            <Input
              value={baseConfig.theme_central.theme}
              onChange={(e) => setBaseConfig({
                ...baseConfig,
                theme_central: { ...baseConfig.theme_central, theme: e.target.value }
              })}
              placeholder="Stock général"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description du thème</label>
            <Input
              value={baseConfig.theme_central.description}
              onChange={(e) => setBaseConfig({
                ...baseConfig,
                theme_central: { ...baseConfig.theme_central, description: e.target.value }
              })}
              placeholder="Description..."
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Liste des éléments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Éléments de Stock
            </h2>
            <p className="text-xs text-muted-foreground">{elements.length} élément(s)</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleLoadPredefinedList} variant="outline" disabled={elements.length > 0}>
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)} variant="outline">
              {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-dashed">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-medium">Dénomination *</label>
                      <Input
                        value={newElement.denomination}
                        onChange={(e) => setNewElement({ ...newElement, denomination: e.target.value })}
                        placeholder="Farine, Tomates..."
                        className="h-9"
                      />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-medium">Type *</label>
                      <Select value={newElement.type} onValueChange={(val) => setNewElement({ ...newElement, type: val })}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Unité *</label>
                      <Input
                        value={newElement.unite}
                        onChange={(e) => setNewElement({ ...newElement, unite: e.target.value })}
                        placeholder="kg, L, unité..."
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Quantité *</label>
                      <Input
                        type="number"
                        value={newElement.quantite_initiale}
                        onChange={(e) => setNewElement({ ...newElement, quantite_initiale: e.target.value })}
                        placeholder="100"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Prix unitaire</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newElement.prix_unitaire}
                        onChange={(e) => setNewElement({ ...newElement, prix_unitaire: e.target.value })}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Seuil alerte</label>
                      <Input
                        type="number"
                        value={newElement.seuil_alerte}
                        onChange={(e) => setNewElement({ ...newElement, seuil_alerte: e.target.value })}
                        placeholder="10"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddElement} className="flex-1">
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des éléments ajoutés */}
        {elements.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {elements.map((element, index) => {
              const iconData = STOCK_TYPE_ICONS[element.type] || STOCK_TYPE_ICONS.ingredient;
              const Icon = iconData.icon;

              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg ${iconData.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${iconData.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{element.denomination}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="capitalize">{element.type}</span>
                            <span>•</span>
                            <span className="font-medium">
                              {element.quantite_initiale} {element.unite}
                            </span>
                            {element.prix_unitaire > 0 && (
                              <>
                                <span>•</span>
                                <span>{element.prix_unitaire}€/{element.unite}</span>
                              </>
                            )}
                          </div>
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

        {/* Message si vide */}
        {elements.length === 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun élément ajouté</p>
            <p className="text-xs text-muted-foreground">Cliquez sur + pour commencer</p>
          </motion.div>
        )}
      </div>

      <Separator />

      {/* Bouton d'initialisation */}
      <div className="space-y-3">
        {initializing && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Initialisation en cours...</p>
                    <p className="text-xs text-muted-foreground">
                      {progress.current}/{progress.total} - {progress.currentItem}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {initSuccess ? (
          <motion.div variants={successVariants} initial="hidden" animate="show">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">Stock initialisé !</p>
                    <p className="text-xs text-green-700">Tous les éléments ont été créés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Button
            onClick={handleInitialize}
            disabled={initializing || elements.length === 0}
            className="w-full h-11"
            size="lg"
          >
            {initializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initialisation...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Initialiser le Stock ({elements.length})
              </>
            )}
          </Button>
        )}

        {elements.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Ajoutez au moins un élément de stock pour continuer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInitialiserStock;
