import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Database,
  Loader2,
  AlertCircle,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COMPTES_OHADA_DEFAULT,
  initializeComptesOHADA,
  useComptes,
} from "@/toolkits/admin/comptabiliteToolkit";
import { toast } from "sonner";

const MobileInitialiserComptes = () => {
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

  if (loadingComptes) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">
            Chargement des comptes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Initialiser les Comptes OHADA
        </h1>
        <p className="text-sm text-muted-foreground">
          {COMPTES_OHADA_DEFAULT.length} comptes comptables disponibles selon le
          plan OHADA
        </p>
      </motion.div>

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
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      Comptes déjà initialisés
                    </p>
                    <p className="text-sm text-green-700">
                      {comptes.length} comptes sont actuellement disponibles dans
                      le système
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton d'initialisation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          onClick={handleInitialize}
          disabled={initializing || isAlreadyInitialized}
          className="w-full h-12"
          size="lg"
        >
          {initializing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Initialisation en cours...
            </>
          ) : isAlreadyInitialized ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Comptes déjà initialisés
            </>
          ) : (
            <>
              <Database className="mr-2 h-5 w-5" />
              Initialiser tous les comptes
            </>
          )}
        </Button>
      </motion.div>

      {/* Liste des comptes */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Comptes disponibles ({COMPTES_OHADA_DEFAULT.length})
        </h2>

        <AnimatePresence>
          {COMPTES_OHADA_DEFAULT.map((compte, index) => (
            <motion.div
              key={compte.code_ohada}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      {getTypeIcon(compte.type)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">
                          {compte.denomination}
                        </CardTitle>
                        <p className="text-sm font-mono text-muted-foreground mt-1">
                          Code: {compte.code_ohada}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${getTypeBadgeColor(
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

      {/* Message d'information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 space-y-1">
                <p className="font-medium">À propos du plan OHADA</p>
                <p className="text-blue-700">
                  Le plan comptable OHADA (Organisation pour l'Harmonisation en
                  Afrique du Droit des Affaires) est utilisé dans 17 pays
                  d'Afrique de l'Ouest et Centrale. Cette initialisation créera
                  les comptes les plus couramment utilisés pour une entreprise de
                  restauration rapide.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MobileInitialiserComptes;
