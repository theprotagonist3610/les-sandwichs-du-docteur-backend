/**
 * DesktopGererLeStock.jsx
 * Page de gestion du stock (version desktop)
 * - Grid spacieuse de cards cliquables
 * - Filtres et recherche avancés
 * - Statistiques détaillées
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
  TrendingUp,
  TrendingDown,
  X,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
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
    borderColor: "border-green-200",
    hoverBg: "hover:bg-green-50",
  },
  [STOCK_TYPES.CONSOMMABLE]: {
    icon: ShoppingBag,
    label: "Consommable",
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverBg: "hover:bg-blue-50",
  },
  [STOCK_TYPES.PERISSABLE]: {
    icon: Clock,
    label: "Périssable",
    color: "text-orange-600",
    bg: "bg-orange-50",
    borderColor: "border-orange-200",
    hoverBg: "hover:bg-orange-50",
  },
  [STOCK_TYPES.MATERIEL]: {
    icon: Box,
    label: "Matériel",
    color: "text-purple-600",
    bg: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverBg: "hover:bg-purple-50",
  },
  [STOCK_TYPES.EMBALLAGE]: {
    icon: Archive,
    label: "Emballage",
    color: "text-gray-600",
    bg: "bg-gray-50",
    borderColor: "border-gray-200",
    hoverBg: "hover:bg-gray-50",
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

const DesktopGererLeStock = () => {
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

  // Statistiques détaillées
  const stats = {
    total: elements?.length || 0,
    active: elements?.filter((e) => e.status)?.length || 0,
    inactive: elements?.filter((e) => !e.status)?.length || 0,
    lowStock: elements?.filter((e) => e.quantite_actuelle <= (e.seuil_alerte || 0) && e.quantite_actuelle > 0)?.length || 0,
    outOfStock: elements?.filter((e) => e.quantite_actuelle === 0)?.length || 0,
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Chargement du stock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 mx-auto text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">Erreur de chargement</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={refetch}>Réessayer</Button>
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
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestion du stock</h1>
            <p className="text-muted-foreground">
              {stats.total} éléments • {stats.active} actifs
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/admin/settings/stock/create")} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nouvel élément
        </Button>
      </motion.div>

      {/* Statistiques en cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-5 gap-4"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Alerte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Rupture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Inactifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et recherche
              </CardTitle>
              {(typeFilter !== "all" || statusFilter !== "all" || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Nom de l'élément..."
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
              </div>

              {/* Type */}
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

              {/* Statut */}
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
            </div>

            {/* Filtres actifs */}
            <AnimatePresence>
              {(typeFilter !== "all" || statusFilter !== "all") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                    {typeFilter !== "all" && (
                      <Badge variant="secondary" className="gap-2">
                        {STOCK_TYPE_CONFIG[typeFilter]?.label}
                        <button onClick={() => setTypeFilter("all")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="gap-2">
                        {statusFilter === "active" ? "Actifs" : "Inactifs"}
                        <button onClick={() => setStatusFilter("all")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grille d'éléments */}
      {sortedElements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <Package className="h-20 w-20 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Aucun élément trouvé</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || typeFilter !== "all" || statusFilter !== "all"
              ? "Essayez de modifier vos filtres"
              : "Commencez par créer un élément de stock"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-6"
        >
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
                  variants={cardVariants}
                  layout
                  exit="exit"
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/admin/settings/stock/gerer/${element.id}`)}
                >
                  <Card
                    className={`cursor-pointer transition-all ${config?.hoverBg} ${
                      !element.status ? "opacity-60" : ""
                    } h-full`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className={`p-3 rounded-xl ${config?.bg}`}>
                          <Icon className={`h-7 w-7 ${config?.color}`} />
                        </div>
                        <div className="flex flex-col gap-1">
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
                      <CardTitle className="mt-3 line-clamp-2">{element.denomination}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {config?.label} • {element.unite?.nom || "N/A"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Separator className="mb-4" />
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-muted-foreground">Quantité:</span>
                          <span
                            className={`text-2xl font-bold ${
                              isOutOfStock
                                ? "text-red-600"
                                : isLowStock
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {element.quantite_actuelle}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {element.unite?.symbol || ""}
                          </span>
                        </div>
                        {element.seuil_alerte > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Seuil d'alerte: {element.seuil_alerte} {element.unite?.symbol || ""}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default DesktopGererLeStock;
