/**
 * DesktopDashboard.jsx
 * Dashboard desktop pour les commandes avec 2 tabs (version spacieuse):
 * - Stats du jour (Ventes, Emplacements, Encaissements)
 * - Commandes du jour
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  PackageCheck,
  Truck,
  User,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PlusCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  useCommandes,
  useCommandeStatistiques,
  useCommandeStatistiquesWeek,
} from "@/toolkits/admin/commandeToolkit";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { useNavigate } from "react-router-dom";
import {
  WeekCommandesChart,
  TopArticlesChart,
  VenteursChart,
  EncaissementsChart,
} from "../components/DashboardCharts";

const DesktopDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-6 border-b bg-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Commandes</h1>
          <p className="text-sm text-muted-foreground">Suivi en temps réel</p>
        </div>
        <Button
          size="lg"
          variant="default"
          className="gap-2"
          onClick={() => navigate("/admin/commandes/panneau_de_ventes")}>
          <PlusCircle className="w-5 h-5" />
          Vendre
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="stats"
        className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b h-14">
          <TabsTrigger value="stats" className="gap-2 text-base">
            <ShoppingBag className="w-5 h-5" />
            Stats du jour
          </TabsTrigger>
          <TabsTrigger value="commandes" className="gap-2 text-base">
            <Clock className="w-5 h-5" />
            Commandes du jour
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="flex-1 mt-0 overflow-hidden">
          <StatsTab />
        </TabsContent>

        <TabsContent value="commandes" className="flex-1 mt-0 overflow-hidden">
          <CommandesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Tab Stats du jour avec grille 2x2 + card Tendances full-width
 */
const StatsTab = () => {
  const { statistiques, loading, isArchiving } = useCommandeStatistiques();
  const { statistiques: statistiquesWeek } = useCommandeStatistiquesWeek();
  const { commandes } = useCommandes({ filter: "today" });

  // Calculer les ventes par emplacement
  const ventesParEmplacement = commandes.reduce((acc, cmd) => {
    const emplacementId = cmd.point_de_vente.id;
    if (!acc[emplacementId]) {
      acc[emplacementId] = {
        id: emplacementId,
        denomination: cmd.point_de_vente.denomination,
        quantite: 0,
      };
    }
    acc[emplacementId].quantite += cmd.details.reduce(
      (sum, detail) => sum + detail.quantite,
      0
    );
    return acc;
  }, {});

  const emplacementsOuverts = Object.values(ventesParEmplacement).sort(
    (a, b) => b.quantite - a.quantite
  );

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
        {/* Notification archivage */}
        {isArchiving && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              📦 Archivage automatique en cours...
            </p>
          </motion.div>
        )}

        {/* Grille 2x2 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Card 1: Ventes */}
          <VentesCard statistiques={statistiques} />

          {/* Card 2: Emplacements */}
          <EmplacementsCard emplacements={emplacementsOuverts} />

          {/* Card 3: Encaissements */}
          <EncaissementsCard
            statistiques={statistiques}
            statistiquesWeek={statistiquesWeek}
          />

          {/* Card 4: Placeholder for balance */}
          <div className="min-h-[300px]" />
        </div>

        {/* Card Tendances full-width */}
        <TendancesCard
          statistiques={statistiques}
          statistiquesWeek={statistiquesWeek}
        />
      </div>
    </ScrollArea>
  );
};

/**
 * Card 1: Ventes (Articles | Quantité | Tendance)
 */
const VentesCard = ({ statistiques }) => {
  const articles = statistiques?.total_ventes_par_articles || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Ventes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {articles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune vente aujourd'hui
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-6">Article</div>
                <div className="col-span-3 text-center">Quantité</div>
                <div className="col-span-3 text-center">Tendance</div>
              </div>

              {/* Rows */}
              <AnimatePresence mode="popLayout">
                {articles.map((article) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="col-span-6 font-medium">
                      {article.denomination}
                    </div>
                    <div className="col-span-3 text-center font-bold text-primary">
                      {article.total}
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <TendanceIcon tendance={statistiques?.tendance} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 2: Emplacements (Emplacements | Quantité | Position)
 */
const EmplacementsCard = ({ emplacements }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Emplacements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {emplacements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun emplacement actif
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-6">Emplacement</div>
                <div className="col-span-3 text-center">Quantité</div>
                <div className="col-span-3 text-center">Position</div>
              </div>

              {/* Rows */}
              <AnimatePresence mode="popLayout">
                {emplacements.map((emplacement, index) => (
                  <motion.div
                    key={emplacement.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="col-span-6 font-medium">
                      {emplacement.denomination}
                    </div>
                    <div className="col-span-3 text-center font-bold text-primary">
                      {emplacement.quantite}
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 3: Encaissements (Espèces | Momo) avec comparaison
 */
const EncaissementsCard = ({ statistiques, statistiquesWeek = [] }) => {
  // Encaissements aujourd'hui
  const encaissementsAujourdhui = statistiques?.encaissements || {
    especes: 0,
    momo: 0,
    total: 0,
  };

  // Encaissements d'hier
  const encaissementsHier =
    statistiquesWeek.length >= 2
      ? statistiquesWeek[statistiquesWeek.length - 2]?.encaissements || {
          especes: 0,
          momo: 0,
          total: 0,
        }
      : { especes: 0, momo: 0, total: 0 };

  // Calcul des pourcentages
  const calculatePercentage = (today, yesterday) => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return ((today - yesterday) / yesterday) * 100;
  };

  const percentageTotal = calculatePercentage(
    encaissementsAujourdhui.total,
    encaissementsHier.total
  );
  const percentageEspeces = calculatePercentage(
    encaissementsAujourdhui.especes,
    encaissementsHier.especes
  );
  const percentageMomo = calculatePercentage(
    encaissementsAujourdhui.momo,
    encaissementsHier.momo
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Encaissements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Total */}
          <div className="p-4 rounded-lg bg-primary/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Total</span>
              <span className="text-xl font-bold text-primary">
                {encaissementsAujourdhui.total.toLocaleString()} F
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">vs hier:</span>
              <PercentageBadge percentage={percentageTotal} />
            </div>
          </div>

          {/* Espèces */}
          <div className="p-3 rounded-lg bg-muted space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Espèces</span>
              <span className="text-sm font-semibold">
                {encaissementsAujourdhui.especes.toLocaleString()} F
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">vs hier:</span>
              <PercentageBadge percentage={percentageEspeces} />
            </div>
          </div>

          {/* Mobile Money */}
          <div className="p-3 rounded-lg bg-muted space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Mobile Money</span>
              <span className="text-sm font-semibold">
                {encaissementsAujourdhui.momo.toLocaleString()} F
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">vs hier:</span>
              <PercentageBadge percentage={percentageMomo} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card Tendances avec carrousel de charts
 */
const TendancesCard = ({ statistiques, statistiquesWeek = [] }) => {
  const [currentChart, setCurrentChart] = useState(0);
  const { users } = useUsers();

  const charts = [
    {
      title: "Commandes de la semaine",
      icon: BarChart3,
      component: <WeekCommandesChart data={statistiquesWeek} />,
    },
    {
      title: "Top articles vendus",
      icon: ShoppingBag,
      component: (
        <TopArticlesChart
          data={statistiques?.total_ventes_par_articles || []}
        />
      ),
    },
    {
      title: "Ventes par vendeur",
      icon: User,
      component: (
        <VenteursChart
          data={statistiques?.total_ventes_par_vendeur || []}
          users={users}
        />
      ),
    },
    {
      title: "Encaissements (Espèces vs Momo)",
      icon: Wallet,
      component: <EncaissementsChart data={statistiquesWeek} />,
    },
  ];

  const handlePrevious = () => {
    setCurrentChart((prev) => (prev === 0 ? charts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentChart((prev) => (prev === charts.length - 1 ? 0 : prev + 1));
  };

  const CurrentIcon = charts[currentChart].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CurrentIcon className="w-5 h-5" />
              Tendances
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevious}
                className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-center">
                {currentChart + 1}/{charts.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Titre du chart actuel */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground text-center">
              {charts[currentChart].title}
            </h3>
          </div>

          {/* Chart avec animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChart}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}>
              {charts[currentChart].component}
            </motion.div>
          </AnimatePresence>

          {/* Indicateurs de pagination (dots) */}
          <div className="flex justify-center gap-2 mt-4">
            {charts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentChart(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentChart
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Aller au chart ${index + 1}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Tab Commandes du jour (grille 3 colonnes)
 */
const CommandesTab = () => {
  const { commandes, loading } = useCommandes({ filter: "today" });
  const { users } = useUsers();

  // Trier du plus récent au plus ancien
  const commandesSorted = [...commandes].sort(
    (a, b) => b.createdAt - a.createdAt
  );

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
        {commandesSorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Aucune commande aujourd'hui
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {commandesSorted.map((commande) => (
                <CommandeCard
                  key={commande.id}
                  commande={commande}
                  users={users}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

/**
 * Card pour une commande (3 lignes: En-tête | Détails | Statut+Livraison)
 */
const CommandeCard = ({ commande, users = [] }) => {
  const navigate = useNavigate();

  // Détermine si la commande est clôturée
  const isCloturee =
    commande.statut === "livree" || commande.statut === "servi";

  // Couleur de fond selon statut
  const bgColor = isCloturee
    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
    : "bg-card border-border";

  // Récupérer les infos du vendeur
  const vendeur = users.find((u) => u.id === commande.createdBy);
  const vendeurName = vendeur
    ? `${vendeur.nom} ${vendeur.prenoms[0]}`
    : "Inconnu";

  const handleClick = () => {
    navigate(`/admin/commandes/ventes/${commande.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}>
      <Card
        className={`cursor-pointer hover:shadow-lg transition-all ${bgColor}`}
        onClick={handleClick}>
        <CardContent className="p-4 space-y-3">
          {/* Ligne 1: En-tête (Vendeur + Emplacement + Client) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground">
                {commande.id}
              </p>
              <TypeBadge type={commande.type} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium">{commande.client.nom}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{commande.point_de_vente.denomination}</span>
            </div>
          </div>

          {/* Ligne 2: Détails de la commande */}
          <div className="border-t pt-2 space-y-1">
            {commande.details.slice(0, 3).map((detail) => (
              <div key={detail.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate">
                  {detail.quantite}x {detail.denomination}
                </span>
                <span className="font-semibold shrink-0 ml-2">
                  {(detail.quantite * detail.prix).toLocaleString()}
                </span>
              </div>
            ))}
            {commande.details.length > 3 && (
              <p className="text-xs text-muted-foreground italic">
                +{commande.details.length - 3} article(s)
              </p>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t">
              <span>Total</span>
              <span className="text-primary">
                {commande.paiement.total.toLocaleString()} F
              </span>
            </div>
          </div>

          {/* Ligne 3: Statut + Détails livraison */}
          <div className="border-t pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <StatutBadge statut={commande.statut} />
              {commande.paiement.dette > 0 && (
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Dette: {commande.paiement.dette.toLocaleString()} F
                </span>
              )}
            </div>

            {/* Incident ou Commentaire */}
            {(commande.incident || commande.commentaire) && (
              <div className="space-y-1">
                {commande.incident && (
                  <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{commande.incident}</span>
                  </div>
                )}
                {commande.commentaire && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{commande.commentaire}</span>
                  </div>
                )}
              </div>
            )}

            {/* Vendeur */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
              <User className="w-3 h-3" />
              <span className="italic">Vendeur: {vendeurName}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Badge pour le statut
 */
const StatutBadge = ({ statut }) => {
  const config = {
    livree: { icon: CheckCircle, color: "bg-green-500", label: "Livrée" },
    "non livree": { icon: Truck, color: "bg-orange-500", label: "En cours" },
    servi: { icon: PackageCheck, color: "bg-blue-500", label: "Servi" },
    "non servi": { icon: Clock, color: "bg-yellow-500", label: "En attente" },
  };

  const {
    icon: Icon,
    color,
    label,
  } = config[statut] || {
    icon: XCircle,
    color: "bg-gray-500",
    label: statut,
  };

  return (
    <div
      className={`${color} text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
};

/**
 * Badge pour le type
 */
const TypeBadge = ({ type }) => {
  return (
    <div className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
      {type === "sur place" ? "Sur place" : "À livrer"}
    </div>
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
