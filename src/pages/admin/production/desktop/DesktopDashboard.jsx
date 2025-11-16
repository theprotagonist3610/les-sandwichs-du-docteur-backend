/**
 * DesktopDashboard.jsx
 * Dashboard desktop pour la production avec 2 tabs:
 * - Stats & Production (vue d'ensemble spacieuse + timeline)
 * - Historique (productions passées en grille)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle,
  AlertCircle,
  Factory,
  MapPin,
  Zap,
  BarChart3,
  History,
  PlusCircle,
  User,
  Play,
  Edit,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useProductionsEnAttente,
  useProductionStatistiquesJour,
  useProductionsDay,
  formatDayKey,
  startProduction,
} from "@/toolkits/admin/productionToolkit";
import { useNavigate } from "react-router-dom";

const DesktopDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-6 border-b bg-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Production</h1>
          <p className="text-sm text-muted-foreground">Suivi en temps réel</p>
        </div>
        <Button
          size="lg"
          variant="default"
          className="gap-2"
          onClick={() => navigate("/admin/production/create")}>
          <PlusCircle className="w-5 h-5" />
          Produire
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b h-14">
          <TabsTrigger value="stats" className="gap-2 text-base">
            <BarChart3 className="w-5 h-5" />
            Stats & Production
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-2 text-base">
            <History className="w-5 h-5" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="flex-1 mt-0 overflow-hidden">
          <StatsTab />
        </TabsContent>

        <TabsContent value="historique" className="flex-1 mt-0 overflow-hidden">
          <HistoriqueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Tab Stats & Production
 */
const StatsTab = () => {
  const { statistiques, loading } = useProductionStatistiquesJour();
  const { items: productionsEnAttente } = useProductionsEnAttente();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-base text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Section 1: Cards de stats en grille 2x2 */}
        <div className="grid grid-cols-2 gap-6">
          <ProductionsActivesCard statistiques={statistiques} />
          <DemandeEmplacementCard statistiques={statistiques} />
          <TopRecettesCard statistiques={statistiques} />
          <EfficaciteCard statistiques={statistiques} />
        </div>

        {/* Section 2: Timeline des productions full-width */}
        <TimelineProductionsCard productions={productionsEnAttente} />
      </div>
    </ScrollArea>
  );
};

/**
 * Card 1: Productions Actives
 */
const ProductionsActivesCard = ({ statistiques }) => {
  const stats = statistiques || {};
  const enCours = stats.productions_en_cours || 0;
  const programmees = stats.productions_programmees || 0;
  const total = stats.total_items_produits || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Productions Actives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-base">
            <span className="text-muted-foreground">En cours</span>
            <Badge variant="destructive" className="text-base font-bold px-3 py-1">
              {enCours}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-base">
            <span className="text-muted-foreground">Programmées</span>
            <Badge variant="secondary" className="text-base font-bold px-3 py-1">
              {programmees}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-base pt-2 border-t">
            <span className="font-medium">Total items</span>
            <span className="text-2xl font-bold text-primary">~{total}</span>
          </div>
          {enCours > 0 && (
            <div className="flex items-start gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg mt-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{enCours} production(s) en cours</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 2: Demande par Emplacement
 */
const DemandeEmplacementCard = ({ statistiques }) => {
  const emplacements = statistiques?.productions_par_emplacement || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Demande par Emplacement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emplacements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun emplacement
            </p>
          ) : (
            <div className="space-y-3">
              {emplacements.slice(0, 5).map((emp, index) => (
                <div
                  key={emp.emplacementId}
                  className="flex items-center justify-between text-base py-2 border-b last:border-0">
                  <span className="text-sm truncate">{emp.denomination}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary text-lg">{emp.quantite}</span>
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white shadow-lg"
                          : index === 1
                          ? "bg-gray-400 text-white shadow-md"
                          : index === 2
                          ? "bg-orange-600 text-white shadow-md"
                          : "bg-muted text-muted-foreground"
                      }`}>
                      {index + 1}
                    </span>
                  </div>
                </div>
              ))}
              {emplacements.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{emplacements.length - 5} autre(s)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 3: Top Recettes du Jour
 */
const TopRecettesCard = ({ statistiques }) => {
  const recettes = statistiques?.top_recettes || [];
  const tendance = statistiques?.tendance || "stable";
  const tendancePct = statistiques?.tendance_pourcentage || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top Recettes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recettes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune production
            </p>
          ) : (
            <div className="space-y-3">
              {recettes.slice(0, 5).map((recette) => (
                <div
                  key={recette.denomination}
                  className="flex items-center justify-between text-base py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{recette.type === "menu" ? "🍔" : "🥤"}</span>
                    <span className="text-sm truncate">{recette.denomination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary text-lg">{recette.quantite_totale}</span>
                    <TendanceIcon tendance={tendance} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm pt-3 border-t">
                <span className="text-muted-foreground">vs hier:</span>
                <PercentageBadge percentage={tendancePct} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 4: Efficacité
 */
const EfficaciteCard = ({ statistiques }) => {
  const efficacite = statistiques?.efficacite || {
    temps_moyen_minutes: 0,
    taux_reussite: 100,
    productions_par_heure: 0,
  };
  const tendancePct = statistiques?.tendance_pourcentage || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Efficacité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-base">
            <span className="text-muted-foreground">Temps moyen</span>
            <span className="text-lg font-bold">{efficacite.temps_moyen_minutes} min</span>
          </div>
          <div className="flex justify-between items-center text-base">
            <span className="text-muted-foreground">Taux réussite</span>
            <span className="text-lg font-bold">{efficacite.taux_reussite}%</span>
          </div>
          <div className="flex justify-between items-center text-base">
            <span className="text-muted-foreground">Productions/h</span>
            <span className="text-lg font-bold">{efficacite.productions_par_heure}</span>
          </div>
          <div className="flex items-center gap-2 text-sm pt-3 border-t">
            <span className="text-muted-foreground">Tendance:</span>
            <PercentageBadge percentage={tendancePct} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card Timeline des Productions (Full-width)
 */
const TimelineProductionsCard = ({ productions = [] }) => {
  const navigate = useNavigate();
  const [startingId, setStartingId] = useState(null);

  const enCours = productions.filter((p) => p.status === "en_cours");
  const programmees = productions.filter((p) => p.status === "Programmee");

  const handleStart = async (production) => {
    try {
      setStartingId(production.id);
      await startProduction(production.id, formatDayKey());
      setStartingId(null);
    } catch (error) {
      console.error("Erreur démarrage production:", error);
      setStartingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline de Production ({productions.length} items)
            </div>
            <Button
              size="default"
              variant="outline"
              onClick={() => navigate("/admin/production/create")}>
              <PlusCircle className="w-4 h-4" />
              Programmer
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Productions en cours */}
          {enCours.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                🔴 EN COURS ({enCours.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {enCours.map((prod) => (
                  <ProductionEnCoursItem key={prod.id} production={prod} />
                ))}
              </div>
            </div>
          )}

          {/* Productions programmées */}
          {programmees.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                🟡 PROGRAMMÉES ({programmees.length})
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {programmees.map((prod) => (
                  <ProductionProgrammeeItem
                    key={prod.id}
                    production={prod}
                    onStart={handleStart}
                    isStarting={startingId === prod.id}
                  />
                ))}
              </div>
            </div>
          )}

          {productions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucune production en attente
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Item production en cours
 */
const ProductionEnCoursItem = ({ production }) => {
  const navigate = useNavigate();
  const tempsEcoule = Math.round((Date.now() - production.createdAt) / 60000); // minutes
  const progression = Math.min(tempsEcoule * 4, 95); // Estimation 4% par minute

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/admin/production/${production.id}`)}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold">
              {production.type === "menu" ? "🍔" : "🥤"} {production.denomination}
            </p>
            <p className="text-sm text-muted-foreground">
              × {production.principal_cible.quantite} {production.principal_cible.unite.symbol}
            </p>
          </div>
          <Badge variant="destructive" className="text-sm">
            {tempsEcoule} min
          </Badge>
        </div>
        {production.actorId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            {production.actorId}
          </div>
        )}
        <div className="space-y-1">
          <Progress value={progression} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">~{progression}% estimé</p>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Item production programmée
 */
const ProductionProgrammeeItem = ({ production, onStart, isStarting }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-base font-semibold">
              {production.type === "menu" ? "🍔" : "🥤"} {production.denomination}
            </p>
            <p className="text-sm text-muted-foreground">
              × {production.principal_cible.quantite} {production.principal_cible.unite.symbol}
            </p>
          </div>
        </div>
        {production.emplacementId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            Pour: {production.emplacementId}
          </div>
        )}
        {production.note && (
          <p className="text-sm text-muted-foreground italic line-clamp-2">{production.note}</p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={() => onStart(production)}
            disabled={isStarting}>
            <Play className="w-4 h-4" />
            {isStarting ? "Démarrage..." : "Démarrer"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/production/${production.id}`)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Tab Historique
 */
const HistoriqueTab = () => {
  const { items: productions, loading } = useProductionsDay();

  const productionsSorted = [...(productions || [])]
    .filter((p) => p.status === "termine")
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-base text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        {productionsSorted.length === 0 ? (
          <p className="text-base text-muted-foreground text-center py-16">
            Aucune production terminée aujourd'hui
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {productionsSorted.map((prod) => (
                <HistoriqueItem key={prod.id} production={prod} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

/**
 * Item historique
 */
const HistoriqueItem = ({ production }) => {
  const navigate = useNavigate();
  const duree = Math.round((production.updatedAt - production.createdAt) / 60000);
  const heure = new Date(production.updatedAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/admin/production/${production.id}`)}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-base font-semibold">
              {production.type === "menu" ? "🍔" : "🥤"} {production.denomination}
            </p>
            <p className="text-sm text-muted-foreground">
              × {production.resultat?.quantite || production.principal_cible.quantite}{" "}
              {production.resultat?.unite?.symbol || production.principal_cible.unite.symbol}
            </p>
          </div>
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{heure}</span>
          <span>•</span>
          <span>Durée: {duree} min</span>
        </div>
        {production.actorId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            {production.actorId}
          </div>
        )}
        {production.emplacementId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {production.emplacementId}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Icône de tendance
 */
const TendanceIcon = ({ tendance }) => {
  if (tendance === "hausse") {
    return <TrendingUp className="w-5 h-5 text-green-500" />;
  }
  if (tendance === "baisse") {
    return <TrendingDown className="w-5 h-5 text-red-500" />;
  }
  return <Minus className="w-5 h-5 text-muted-foreground" />;
};

/**
 * Badge de pourcentage avec couleur et icône
 */
const PercentageBadge = ({ percentage }) => {
  const isPositive = percentage >= 0;
  const color = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={`${color} font-semibold flex items-center gap-1 text-sm`}>
      <Icon className="w-3.5 h-3.5" />
      {isPositive ? "+" : ""}
      {Math.abs(percentage).toFixed(1)}%
    </span>
  );
};

export default DesktopDashboard;
