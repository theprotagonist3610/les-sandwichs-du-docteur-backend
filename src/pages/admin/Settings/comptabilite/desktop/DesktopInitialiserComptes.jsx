import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Database,
  Loader2,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COMPTES_OHADA_DEFAULT,
  initializeComptesOHADA,
  useComptes,
} from "@/toolkits/admin/comptabiliteToolkit";
import { toast } from "sonner";

const DesktopInitialiserComptes = () => {
  const { comptes, loading: loadingComptes } = useComptes();
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const isAlreadyInitialized = comptes && comptes.length > 0;

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      await initializeComptesOHADA();
      setInitialized(true);
      toast.success("Comptes OHADA initialisés avec succès", {
        description: `${COMPTES_OHADA_DEFAULT.length} comptes ont été créés`,
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation:", error);
      toast.error("Erreur lors de l'initialisation", {
        description: error.message || "Une erreur s'est produite",
      });
    } finally {
      setInitializing(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "entree":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "sortie":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case "entree/sortie":
        return <ArrowLeftRight className="h-5 w-5 text-blue-500" />;
      default:
        return <Coins className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "entree":
        return "bg-green-100 text-green-700";
      case "sortie":
        return "bg-red-100 text-red-700";
      case "entree/sortie":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Statistiques des comptes par type
  const stats = {
    entree: COMPTES_OHADA_DEFAULT.filter((c) => c.type === "entree").length,
    sortie: COMPTES_OHADA_DEFAULT.filter((c) => c.type === "sortie").length,
    mixte: COMPTES_OHADA_DEFAULT.filter((c) => c.type === "entree/sortie")
      .length,
  };

  if (loadingComptes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Chargement des comptes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* En-tête avec bouton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8" />
            Initialiser les Comptes OHADA
          </h1>
          <p className="text-muted-foreground">
            {COMPTES_OHADA_DEFAULT.length} comptes comptables disponibles selon
            le plan OHADA
          </p>
        </div>

        <Button
          onClick={handleInitialize}
          disabled={initializing || isAlreadyInitialized}
          className="h-11"
          size="lg"
        >
          {initializing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Initialisation...
            </>
          ) : isAlreadyInitialized ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Déjà initialisés
            </>
          ) : (
            <>
              <Database className="mr-2 h-5 w-5" />
              Initialiser tous les comptes
            </>
          )}
        </Button>
      </motion.div>

      {/* Statistiques et alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stats rapides */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.entree}</p>
                  <p className="text-sm text-muted-foreground">
                    Comptes d'entrée
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.sortie}</p>
                  <p className="text-sm text-muted-foreground">
                    Comptes de sortie
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.mixte}</p>
                  <p className="text-sm text-muted-foreground">Comptes mixtes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerte si déjà initialisé */}
      <AnimatePresence>
        {(isAlreadyInitialized || initialized) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 text-lg">
                      Comptes déjà initialisés
                    </p>
                    <p className="text-green-700 mt-1">
                      {comptes.length} comptes sont actuellement disponibles dans
                      le système. Vous pouvez les consulter dans la section de
                      gestion des comptes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info OHADA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold text-blue-900">
                  À propos du plan OHADA
                </p>
                <p className="text-sm text-blue-700">
                  Le plan comptable OHADA (Organisation pour l'Harmonisation en
                  Afrique du Droit des Affaires) est utilisé dans 17 pays
                  d'Afrique de l'Ouest et Centrale. Cette initialisation créera
                  les comptes les plus couramment utilisés pour une entreprise de
                  restauration rapide, incluant les achats de matières premières,
                  les ventes, les charges d'exploitation et la trésorerie.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grille des comptes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Comptes disponibles ({COMPTES_OHADA_DEFAULT.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {COMPTES_OHADA_DEFAULT.map((compte, index) => (
              <motion.div
                key={compte.code_ohada}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  delay: index * 0.015,
                  duration: 0.3,
                }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {getTypeIcon(compte.type)}
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor(
                          compte.type
                        )}`}
                      >
                        {compte.type === "entree/sortie"
                          ? "Mixte"
                          : compte.type === "entree"
                          ? "Entrée"
                          : "Sortie"}
                      </span>
                    </div>
                    <CardTitle className="text-base leading-tight">
                      {compte.denomination}
                    </CardTitle>
                    <p className="text-sm font-mono text-muted-foreground">
                      Code: {compte.code_ohada}
                    </p>
                  </CardHeader>
                  {compte.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {compte.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DesktopInitialiserComptes;
