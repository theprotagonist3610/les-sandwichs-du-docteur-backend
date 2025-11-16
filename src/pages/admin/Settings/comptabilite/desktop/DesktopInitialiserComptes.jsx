import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Building2,
  Loader2,
  ChevronRight,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  initialiserComptesDefault,
  initialiserTresorerieDefault,
  getAllComptes,
  getAllComptesTresorerie,
  COMPTES_OHADA_DEFAULT,
  COMPTES_TRESORERIE_DEFAULT,
} from "@/toolkits/admin/comptabiliteToolkit";

const DesktopInitialiserComptes = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [comptesInitialises, setComptesInitialises] = useState(false);
  const [tresorerieInitialisee, setTresorerieInitialisee] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Vérifier au chargement si les comptes sont déjà initialisés
  useState(() => {
    const checkStatus = async () => {
      try {
        const [comptesData, tresoData] = await Promise.all([
          getAllComptes().catch(() => null),
          getAllComptesTresorerie().catch(() => null),
        ]);

        setComptesInitialises(comptesData?.comptes?.length > 0);
        setTresorerieInitialisee(tresoData?.comptes?.length > 0);
      } catch (error) {
        console.error("Erreur vérification statut:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, []);

  // Regroupement des comptes par catégorie pour l'affichage
  const comptesByCategorie = {
    capital: COMPTES_OHADA_DEFAULT.filter((c) => c.code_ohada.startsWith("10")),
    immobilisations: COMPTES_OHADA_DEFAULT.filter((c) => c.code_ohada.startsWith("2")),
    stocks: COMPTES_OHADA_DEFAULT.filter((c) => c.code_ohada.startsWith("3")),
    tiers: COMPTES_OHADA_DEFAULT.filter((c) => c.code_ohada.startsWith("4")),
    charges: COMPTES_OHADA_DEFAULT.filter((c) => c.code_ohada.startsWith("6")),
    produits: COMPTES_OHADA_DEFAULT.filter((c) => c.code_ohada.startsWith("7")),
  };

  const categoriesInfo = [
    {
      key: "capital",
      nom: "Capital & Apports",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Capital social et compte de l'exploitant",
    },
    {
      key: "immobilisations",
      nom: "Immobilisations",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Matériel, mobilier et équipements",
    },
    {
      key: "stocks",
      nom: "Stocks",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Matières premières et produits finis",
    },
    {
      key: "tiers",
      nom: "Comptes de Tiers",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "Fournisseurs, clients et autres tiers",
    },
    {
      key: "charges",
      nom: "Charges",
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Dépenses d'exploitation",
    },
    {
      key: "produits",
      nom: "Produits",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Ventes et autres produits",
    },
  ];

  const handleInitialiserTout = async () => {
    try {
      setIsInitializing(true);
      setInitProgress(0);

      toast.info("Démarrage de l'initialisation...");

      // Étape 1: Initialiser les comptes OHADA (50%)
      setInitProgress(10);
      await initialiserComptesDefault();
      setInitProgress(50);
      setComptesInitialises(true);
      toast.success(`${COMPTES_OHADA_DEFAULT.length} comptes OHADA initialisés`);

      // Étape 2: Initialiser les comptes de trésorerie (100%)
      setInitProgress(75);
      await initialiserTresorerieDefault();
      setInitProgress(100);
      setTresorerieInitialisee(true);
      toast.success(`${COMPTES_TRESORERIE_DEFAULT.length} comptes de trésorerie initialisés`);

      toast.success("Initialisation terminée avec succès! 🎉", {
        description: "Tous les comptes comptables sont prêts à être utilisés.",
      });
    } catch (error) {
      console.error("Erreur initialisation:", error);
      toast.error("Erreur lors de l'initialisation", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setIsInitializing(false);
      setTimeout(() => setInitProgress(0), 1000);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toutInitialise = comptesInitialises && tresorerieInitialisee;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Initialisation des Comptes Comptables
            </h1>
            <p className="text-muted-foreground mt-1">
              Configuration initiale du plan comptable OHADA pour votre sandwicherie
            </p>
          </div>
          {toutInitialise && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Initialisé
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Bouton d'initialisation global */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {toutInitialise
                  ? "Comptes déjà initialisés"
                  : "Initialiser tous les comptes en un clic"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {toutInitialise
                  ? "Votre système comptable est opérationnel avec tous les comptes nécessaires."
                  : `Créez automatiquement ${COMPTES_OHADA_DEFAULT.length} comptes OHADA et ${COMPTES_TRESORERIE_DEFAULT.length} comptes de trésorerie.`}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleInitialiserTout}
              disabled={isInitializing || toutInitialise}
              className="min-w-[200px]"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initialisation...
                </>
              ) : toutInitialise ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Initialisé
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Initialiser tout
                </>
              )}
            </Button>
          </div>

          {/* Progress bar */}
          <AnimatePresence>
            {isInitializing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <Progress value={initProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Progression: {initProgress}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Résumé de l'initialisation */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={comptesInitialises ? "border-green-200 bg-green-50/50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Comptes OHADA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{COMPTES_OHADA_DEFAULT.length}</p>
                <p className="text-xs text-muted-foreground">comptes disponibles</p>
              </div>
              {comptesInitialises ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={tresorerieInitialisee ? "border-green-200 bg-green-50/50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Comptes de Trésorerie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{COMPTES_TRESORERIE_DEFAULT.length}</p>
                <p className="text-xs text-muted-foreground">comptes disponibles</p>
              </div>
              {tresorerieInitialisee ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catégories de comptes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Détail des comptes par catégorie</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {categoriesInfo.map((categorie, index) => {
              const Icon = categorie.icon;
              const comptes = comptesByCategorie[categorie.key];

              return (
                <motion.div
                  key={categorie.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${categorie.bgColor}`}>
                            <Icon className={`h-5 w-5 ${categorie.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{categorie.nom}</CardTitle>
                            <CardDescription className="text-xs">
                              {categorie.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary">{comptes.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {comptes.slice(0, 3).map((compte) => (
                          <div
                            key={compte.code_ohada}
                            className="flex items-start gap-2 text-sm"
                          >
                            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold">
                                  {compte.code_ohada}
                                </span>
                                <span className="text-xs truncate">{compte.denomination}</span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {compte.description}
                              </p>
                            </div>
                          </div>
                        ))}
                        {comptes.length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            + {comptes.length - 3} autre(s) compte(s)
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Comptes de trésorerie */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Comptes de Trésorerie</CardTitle>
              <CardDescription>Gestion des liquidités et moyens de paiement</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMPTES_TRESORERIE_DEFAULT.map((compte, index) => (
              <motion.div
                key={compte.code_ohada}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">
                      {compte.code_ohada}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm">{compte.denomination}</h4>
                  <p className="text-xs text-muted-foreground">{compte.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info importante */}
      {!toutInitialise && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-blue-900">
                  Prérequis pour créer des opérations comptables
                </h4>
                <p className="text-sm text-blue-800">
                  L'initialisation des comptes est nécessaire avant de pouvoir enregistrer des
                  opérations comptables. Une fois initialisés, vous pourrez créer des entrées et
                  sorties d'argent, suivre votre trésorerie et générer des statistiques.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesktopInitialiserComptes;
