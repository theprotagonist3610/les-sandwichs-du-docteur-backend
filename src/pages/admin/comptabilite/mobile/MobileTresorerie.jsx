import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  AlertCircle,
  ChevronRight,
  TrendingUpDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useTresorerieData from "@/hooks/useTresorerieData";
import {
  formatMontant,
  getCompteConfig,
} from "@/utils/comptabilite/tresorerieFormatters";

/**
 * Version mobile optimisée du composant Trésorerie
 * Interface tactile avec swipe cards et bottom sheet pour les actions
 * + Écoute RTDB pour mises à jour temps réel
 */
const MobileTresorerie = () => {
  const navigate = useNavigate();
  const [activeSheet, setActiveSheet] = useState(false);

  // Utiliser le hook personnalisé qui gère toute la logique de données
  // + écoute RTDB pour mises à jour temps réel
  const {
    comptesTresorerie,
    soldeTotal,
    variationPourcentage,
    isLoading,
    error,
    ouvrirCreationCompte,
  } = useTresorerieData();

  // Mémoriser les fonctions de navigation
  const naviguerVersCompte = useCallback(
    (compteId) => {
      navigate(`/admin/comptabilite/tresorerie/${compteId}`);
    },
    [navigate]
  );

  const naviguerVersEntree = useCallback(() => {
    navigate("/admin/comptabilite/create?type=entree");
    setActiveSheet(false);
  }, [navigate]);

  const naviguerVersSortie = useCallback(() => {
    navigate("/admin/comptabilite/create?type=sortie");
    setActiveSheet(false);
  }, [navigate]);

  const naviguerVersTransfert = useCallback(() => {
    navigate("/admin/comptabilite/transfert");
    setActiveSheet(false);
  }, [navigate]);

  // Loading state mobile
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state mobile
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6" aria-hidden="true" />
              Trésorerie
            </h1>
          </div>
          <Button
            size="sm"
            onClick={ouvrirCreationCompte}
            aria-label="Créer un nouveau compte"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Résumé compact */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Solde total</p>
                <p className="text-2xl font-bold">
                  {formatMontant(soldeTotal)}
                  <span className="text-sm ml-1">FCFA</span>
                </p>
              </div>
              <div className="text-right">
                {variationPourcentage >= 0 ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    <span className="font-bold">
                      +{variationPourcentage.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                    <span className="font-bold">
                      {variationPourcentage.toFixed(1)}%
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">vs hier</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides - Bottom Sheet */}
      <div className="px-4 py-4">
        <Sheet open={activeSheet} onOpenChange={setActiveSheet}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              size="lg"
            >
              <span className="flex items-center gap-2">
                <TrendingUpDown className="h-5 w-5" aria-hidden="true" />
                Actions rapides
              </span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>Actions de trésorerie</SheetTitle>
              <SheetDescription>
                Gérez vos opérations rapidement
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-3 mt-6">
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4 flex items-center justify-between hover:border-green-500 hover:bg-green-50"
                onClick={naviguerVersEntree}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-50">
                    <ArrowDownCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Ajouter une entrée</p>
                    <p className="text-xs text-muted-foreground">Encaissement</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4 flex items-center justify-between hover:border-red-500 hover:bg-red-50"
                onClick={naviguerVersSortie}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-50">
                    <ArrowUpCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Ajouter une sortie</p>
                    <p className="text-xs text-muted-foreground">Paiement</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4 flex items-center justify-between hover:border-blue-500 hover:bg-blue-50"
                onClick={naviguerVersTransfert}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-50">
                    <ArrowLeftRight className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Transférer</p>
                    <p className="text-xs text-muted-foreground">Entre comptes</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Liste des comptes avec scroll */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="px-4 pb-20 space-y-3">
          <AnimatePresence>
            {comptesTresorerie.map((compte, index) => {
              const config = getCompteConfig(compte.code_ohada);
              const Icon = config.icon;

              return (
                <motion.div
                  key={compte.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer active:shadow-lg border-2 ${config.borderColor}`}
                    onClick={() => naviguerVersCompte(compte.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Compte ${compte.denomination}, solde ${formatMontant(compte.solde || 0)} francs CFA`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.bgColor}`} aria-hidden="true">
                            <Icon className={`h-5 w-5 ${config.textColor}`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">
                              {compte.denomination}
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs mt-1"
                            >
                              {compte.code_ohada}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Separator className="mb-3" />
                      <div className="space-y-2">
                        {compte.numero && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              Numéro
                            </span>
                            <span className="text-xs font-mono">
                              {compte.numero}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Solde actuel
                          </span>
                          <span className={`text-lg font-bold ${config.textColor}`}>
                            {formatMontant(compte.solde || 0)} FCFA
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Carte d'ajout */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: comptesTresorerie.length * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer border-2 border-dashed hover:border-primary/50 bg-muted/30"
                onClick={ouvrirCreationCompte}
                role="button"
                tabIndex={0}
                aria-label="Ajouter un nouveau compte de trésorerie"
              >
                <CardContent className="py-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10" aria-hidden="true">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Ajouter un compte</p>
                      <p className="text-xs text-muted-foreground">
                        Créer un nouveau compte de trésorerie
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Message si aucun compte */}
          {comptesTresorerie.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p className="font-medium mb-1">Aucun compte</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez votre premier compte pour commencer
                </p>
                <Button onClick={ouvrirCreationCompte} size="sm">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Créer un compte
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobileTresorerie;
