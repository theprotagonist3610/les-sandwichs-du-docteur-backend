/**
 * MobileGererLeStock.jsx
 * Page de gestion du stock (version mobile)
 * - Liste des éléments de stock avec filtres
 * - Recherche par nom
 * - Filtrage par type et statut
 * - Navigation vers détail d'un élément
 */

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Utensils,
  ShoppingBag,
  Clock,
  Box,
  Archive,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet.tsx";
import { Separator } from "@/components/ui/separator.tsx";

import { STOCK_TYPES } from "@/toolkits/admin/stockToolkit.jsx";
import useStockFilterStore, {
  selectSearchQuery,
  selectTypeFilter,
  selectStatusFilter,
  selectSetSearchQuery,
  selectSetTypeFilter,
  selectSetStatusFilter,
  selectResetFilters,
} from "@/stores/admin/useStockFilterStore.js";
import { useFilteredStockElements } from "@/hooks/useFilteredStockElements.js";

// Configuration des types de stock
const STOCK_TYPE_CONFIG = {
  [STOCK_TYPES.INGREDIENT]: {
    icon: Utensils,
    label: "Ingrédient",
    color: "text-green-600",
    bg: "bg-green-50",
    badgeVariant: "default",
  },
  [STOCK_TYPES.CONSOMMABLE]: {
    icon: ShoppingBag,
    label: "Consommable",
    color: "text-blue-600",
    bg: "bg-blue-50",
    badgeVariant: "secondary",
  },
  [STOCK_TYPES.PERISSABLE]: {
    icon: Clock,
    label: "Périssable",
    color: "text-orange-600",
    bg: "bg-orange-50",
    badgeVariant: "destructive",
  },
  [STOCK_TYPES.MATERIEL]: {
    icon: Box,
    label: "Matériel",
    color: "text-purple-600",
    bg: "bg-purple-50",
    badgeVariant: "outline",
  },
  [STOCK_TYPES.EMBALLAGE]: {
    icon: Archive,
    label: "Emballage",
    color: "text-gray-600",
    bg: "bg-gray-50",
    badgeVariant: "secondary",
  },
};

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
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
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

const MobileGererLeStock = () => {
  const navigate = useNavigate();

  // Récupérer les filtres depuis le store
  const searchQuery = useStockFilterStore(selectSearchQuery);
  const typeFilter = useStockFilterStore(selectTypeFilter);
  const statusFilter = useStockFilterStore(selectStatusFilter);
  const setSearchQuery = useStockFilterStore(selectSetSearchQuery);
  const setTypeFilter = useStockFilterStore(selectSetTypeFilter);
  const setStatusFilter = useStockFilterStore(selectSetStatusFilter);
  const resetFilters = useStockFilterStore(selectResetFilters);

  // Récupérer les éléments filtrés avec le hook personnalisé
  const { elements, loading, error, refetch } = useFilteredStockElements();

  // Trier par ordre alphabétique
  const sortedElements = [...(elements || [])].sort((a, b) =>
    a.denomination.localeCompare(b.denomination)
  );

  // Statistiques
  const stats = {
    total: elements?.length || 0,
    active: elements?.filter((e) => e.status)?.length || 0,
    inactive: elements?.filter((e) => !e.status)?.length || 0,
    lowStock: elements?.filter((e) => e.quantite_actuelle <= (e.seuil_alerte || 0))?.length || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Chargement du stock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
              <div>
                <h3 className="font-semibold text-red-600">Erreur de chargement</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={refetch} variant="outline">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 pb-24 space-y-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Gérer le stock</h1>
            <p className="text-xs text-muted-foreground">{stats.total} éléments</p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/admin/settings/stock/create")}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </motion.div>

      {/* Statistiques */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
            <p className="text-xs text-muted-foreground">Alerte stock</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Barre de recherche */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filtres dans un Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(STOCK_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs uniquement</SelectItem>
                    <SelectItem value="inactive">Inactifs uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Filtres actifs */}
      <AnimatePresence>
        {(typeFilter !== "all" || statusFilter !== "all") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {typeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {STOCK_TYPE_CONFIG[typeFilter]?.label}
                <button onClick={() => setTypeFilter("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {statusFilter === "active" ? "Actifs" : "Inactifs"}
                <button onClick={() => setStatusFilter("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Separator />

      {/* Liste des éléments */}
      {sortedElements.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun élément trouvé</p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sortedElements.map((element) => {
              const config = STOCK_TYPE_CONFIG[element.type];
              const Icon = config?.icon || Package;
              const isLowStock =
                element.quantite_actuelle <= (element.seuil_alerte || 0) &&
                element.quantite_actuelle > 0;
              const isOutOfStock = element.quantite_actuelle === 0;

              return (
                <motion.div
                  key={element.id}
                  variants={itemVariants}
                  layout
                  exit="exit"
                  onClick={() => navigate(`/admin/settings/stock/gerer/${element.id}`)}
                >
                  <Card
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      !element.status ? "opacity-60" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icône */}
                        <div className={`p-2 rounded-lg ${config?.bg}`}>
                          <Icon className={`h-5 w-5 ${config?.color}`} />
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{element.denomination}</h3>
                              <p className="text-xs text-muted-foreground">
                                {config?.label} • {element.unite?.nom || "N/A"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>

                          {/* Quantité */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1">
                              <div className="flex items-baseline gap-1">
                                <span
                                  className={`text-lg font-bold ${
                                    isOutOfStock
                                      ? "text-red-600"
                                      : isLowStock
                                      ? "text-orange-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {element.quantite_actuelle}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {element.unite?.symbol || ""}
                                </span>
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex gap-1">
                              {!element.status && (
                                <Badge variant="outline" className="text-xs">
                                  Inactif
                                </Badge>
                              )}
                              {isOutOfStock && (
                                <Badge variant="destructive" className="text-xs">
                                  Rupture
                                </Badge>
                              )}
                              {isLowStock && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                  Alerte
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MobileGererLeStock;
