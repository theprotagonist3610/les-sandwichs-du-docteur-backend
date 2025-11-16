import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Building2,
  Loader2,
  ChevronDown,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  initialiserComptesDefault,
  initialiserTresorerieDefault,
  getAllComptes,
  getAllComptesTresorerie,
  COMPTES_OHADA_DEFAULT,
  COMPTES_TRESORERIE_DEFAULT,
} from "@/toolkits/admin/comptabiliteToolkit";

const MobileInitialiserComptes = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [comptesInitialises, setComptesInitialises] = useState(false);
  const [tresorerieInitialisee, setTresorerieInitialisee] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [expandedCategorie, setExpandedCategorie] = useState(null);

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

  // Regroupement des comptes par catégorie
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
      nom: "Capital",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      key: "immobilisations",
      nom: "Immobilisations",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      key: "stocks",
      nom: "Stocks",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      key: "tiers",
      nom: "Tiers",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      key: "charges",
      nom: "Charges",
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      key: "produits",
      nom: "Produits",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const handleInitialiserTout = async () => {
    try {
      setIsInitializing(true);
      setInitProgress(0);

      toast.info("Initialisation en cours...");

      // Étape 1: Comptes OHADA
      setInitProgress(10);
      await initialiserComptesDefault();
      setInitProgress(50);
      setComptesInitialises(true);
      toast.success(`${COMPTES_OHADA_DEFAULT.length} comptes OHADA créés`);

      // Étape 2: Comptes de trésorerie
      setInitProgress(75);
      await initialiserTresorerieDefault();
      setInitProgress(100);
      setTresorerieInitialisee(true);
      toast.success(`${COMPTES_TRESORERIE_DEFAULT.length} comptes de trésorerie créés`);

      toast.success("Initialisation terminée! 🎉");
    } catch (error) {
      console.error("Erreur initialisation:", error);
      toast.error("Erreur lors de l'initialisation");
    } finally {
      setIsInitializing(false);
      setTimeout(() => setInitProgress(0), 1000);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toutInitialise = comptesInitialises && tresorerieInitialisee;

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Initialisation</h1>
          {toutInitialise && (
            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              OK
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Configurez le plan comptable OHADA
        </p>
      </div>

      <Separator />

      {/* Bouton d'initialisation */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold">
              {toutInitialise ? "Déjà initialisé" : "Initialiser tout"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {toutInitialise
                ? "Système opérationnel"
                : `${COMPTES_OHADA_DEFAULT.length} comptes OHADA + ${COMPTES_TRESORERIE_DEFAULT.length} comptes trésorerie`}
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleInitialiserTout}
            disabled={isInitializing || toutInitialise}
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
                Initialiser
              </>
            )}
          </Button>

          {/* Progress */}
          <AnimatePresence>
            {isInitializing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                <Progress value={initProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground text-center">
                  {initProgress}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={comptesInitialises ? "border-green-200" : ""}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-muted-foreground" />
              {comptesInitialises && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>
            <div>
              <p className="text-xl font-bold">{COMPTES_OHADA_DEFAULT.length}</p>
              <p className="text-xs text-muted-foreground">Comptes OHADA</p>
            </div>
          </CardContent>
        </Card>

        <Card className={tresorerieInitialisee ? "border-green-200" : ""}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              {tresorerieInitialisee && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>
            <div>
              <p className="text-xl font-bold">{COMPTES_TRESORERIE_DEFAULT.length}</p>
              <p className="text-xs text-muted-foreground">Trésorerie</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catégories - Version collapsible pour mobile */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Catégories de comptes</h2>

        <div className="space-y-2">
          {categoriesInfo.map((categorie, index) => {
            const Icon = categorie.icon;
            const comptes = comptesByCategorie[categorie.key];
            const isExpanded = expandedCategorie === categorie.key;

            return (
              <motion.div
                key={categorie.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() =>
                    setExpandedCategorie(isExpanded ? null : categorie.key)
                  }
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${categorie.bgColor}`}>
                              <Icon className={`h-4 w-4 ${categorie.color}`} />
                            </div>
                            <div className="text-left">
                              <CardTitle className="text-sm">{categorie.nom}</CardTitle>
                              <CardDescription className="text-xs">
                                {comptes.length} compte{comptes.length > 1 ? "s" : ""}
                              </CardDescription>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3">
                        <Separator className="mb-3" />
                        <div className="space-y-2">
                          {comptes.map((compte) => (
                            <div
                              key={compte.code_ohada}
                              className="flex items-start gap-2 text-sm"
                            >
                              <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Badge variant="secondary" className="font-mono text-xs px-1 py-0">
                                    {compte.code_ohada}
                                  </Badge>
                                  <span className="text-xs font-medium truncate">
                                    {compte.denomination}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {compte.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Comptes de trésorerie */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">Trésorerie</CardTitle>
              <CardDescription className="text-xs">
                Liquidités et paiements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {COMPTES_TRESORERIE_DEFAULT.map((compte, index) => (
            <motion.div
              key={compte.code_ohada}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg border bg-card"
            >
              <div className="space-y-1.5">
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
        </CardContent>
      </Card>

      {/* Info */}
      {!toutInitialise && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-blue-900">
                  Prérequis nécessaire
                </h4>
                <p className="text-xs text-blue-800">
                  Initialisez d'abord les comptes pour pouvoir créer des opérations comptables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileInitialiserComptes;
