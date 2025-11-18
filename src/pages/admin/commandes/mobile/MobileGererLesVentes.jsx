/**
 * MobileGererLesVentes.jsx
 * Gestion et filtrage des ventes/commandes sur mobile
 * - Filtre sticky avec multiples critères
 * - Cards de commandes (réutilise le style du Dashboard)
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  User,
  MapPin,
  ShoppingBag,
  DollarSign,
  CreditCard,
  CheckCircle,
  Truck,
  PackageCheck,
  Clock,
  AlertCircle,
  MessageSquare,
  XCircle,
  Calendar,
  Banknote,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useFilteredCommandes } from "@/toolkits/admin/commandeToolkit";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { useMenus } from "@/toolkits/admin/menuToolkit";
import { useBoissons } from "@/toolkits/admin/boissonToolkit";
import { useNavigate } from "react-router-dom";

const MobileGererLesVentes = () => {
  const { users } = useUsers();
  const { emplacements } = useEmplacements();
  const { menus } = useMenus();
  const { boissons } = useBoissons();

  // États des filtres (multi-select avec arrays)
  const [filters, setFilters] = useState({
    createdBy: [], // Multi-select vendeurs
    periode: "today", // today, week, month, custom
    dateDebut: "", // Pour période custom
    dateFin: "", // Pour période custom
    articles: [], // Multi-select articles
    emplacements: [], // Multi-select emplacements
    types: [], // Multi-select types (sur place, a livrer)
    prixMin: "",
    prixMax: "",
    moyensPaiement: [], // Multi-select moyens de paiement
    statuts: [], // Multi-select statuts
  });

  // Charger les commandes avec le nouveau hook qui gère les archives
  const { commandes, loading } = useFilteredCommandes({
    periode: filters.periode,
    dateDebut: filters.dateDebut,
    dateFin: filters.dateFin,
  });

  // Helper function pour toggle array items
  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  // Tous les articles (menus + boissons)
  const allArticles = useMemo(() => {
    return [
      ...(menus || []).map((m) => ({ id: m.id, denomination: m.denomination })),
      ...(boissons || []).map((b) => ({ id: b.id, denomination: b.denomination })),
    ];
  }, [menus, boissons]);

  // Filtrage des commandes
  const commandesFiltrees = useMemo(() => {
    let result = [...commandes];

    // Filtre par période
    if (filters.periode) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (filters.periode === "today") {
        result = result.filter((cmd) => {
          const cmdDate = new Date(cmd.createdAt);
          return cmdDate >= today;
        });
      } else if (filters.periode === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((cmd) => {
          const cmdDate = new Date(cmd.createdAt);
          return cmdDate >= weekAgo;
        });
      } else if (filters.periode === "month") {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        result = result.filter((cmd) => {
          const cmdDate = new Date(cmd.createdAt);
          return cmdDate >= monthAgo;
        });
      } else if (filters.periode === "custom") {
        if (filters.dateDebut) {
          const startDate = new Date(filters.dateDebut);
          startDate.setHours(0, 0, 0, 0);
          result = result.filter((cmd) => {
            const cmdDate = new Date(cmd.createdAt);
            return cmdDate >= startDate;
          });
        }
        if (filters.dateFin) {
          const endDate = new Date(filters.dateFin);
          endDate.setHours(23, 59, 59, 999);
          result = result.filter((cmd) => {
            const cmdDate = new Date(cmd.createdAt);
            return cmdDate <= endDate;
          });
        }
      }
    }

    // Filtre createdBy (multi-select)
    if (filters.createdBy.length > 0) {
      result = result.filter((cmd) => filters.createdBy.includes(cmd.createdBy));
    }

    // Filtre articles (multi-select)
    if (filters.articles.length > 0) {
      result = result.filter((cmd) =>
        cmd.details.some((detail) => filters.articles.includes(detail.id))
      );
    }

    // Filtre emplacements (multi-select)
    if (filters.emplacements.length > 0) {
      result = result.filter((cmd) => filters.emplacements.includes(cmd.point_de_vente.id));
    }

    // Filtre types (multi-select)
    if (filters.types.length > 0) {
      result = result.filter((cmd) => filters.types.includes(cmd.type));
    }

    // Filtre prix
    if (filters.prixMin) {
      result = result.filter((cmd) => cmd.paiement.total >= parseFloat(filters.prixMin));
    }
    if (filters.prixMax) {
      result = result.filter((cmd) => cmd.paiement.total <= parseFloat(filters.prixMax));
    }

    // Filtre moyens de paiement (multi-select)
    if (filters.moyensPaiement.length > 0) {
      result = result.filter((cmd) => {
        const hasEspeces = cmd.paiement.montant_espece_recu > 0;
        const hasMomo = cmd.paiement.montant_momo_recu > 0;

        return filters.moyensPaiement.some(moyen => {
          if (moyen === "especes") return hasEspeces && !hasMomo;
          if (moyen === "momo") return hasMomo && !hasEspeces;
          if (moyen === "mixte") return hasEspeces && hasMomo;
          return false;
        });
      });
    }

    // Filtre statuts (multi-select)
    if (filters.statuts.length > 0) {
      result = result.filter((cmd) => filters.statuts.includes(cmd.statut));
    }

    // Trier du plus récent au plus ancien
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [commandes, filters]);

  const resetFilters = () => {
    setFilters({
      createdBy: [],
      periode: "today",
      dateDebut: "",
      dateFin: "",
      articles: [],
      emplacements: [],
      types: [],
      prixMin: "",
      prixMax: "",
      moyensPaiement: [],
      statuts: [],
    });
  };

  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    // Ne pas compter la période "today" par défaut
    if (key === "periode") {
      return count + (value !== "today" ? 1 : 0);
    }
    // Ne pas compter dateDebut/dateFin séparément (déjà compté avec periode)
    if (key === "dateDebut" || key === "dateFin") {
      return count;
    }
    if (key === "prixMin" || key === "prixMax") {
      return count + (value !== "" ? 1 : 0);
    }
    return count + (Array.isArray(value) && value.length > 0 ? 1 : 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header avec filtre */}
      <div className="p-3 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold">Gérer les ventes</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh]">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(90vh-80px)] mt-4">
                <FilterForm
                  filters={filters}
                  setFilters={setFilters}
                  toggleArrayItem={toggleArrayItem}
                  users={users}
                  emplacements={emplacements}
                  articles={allArticles}
                  onReset={resetFilters}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
        <p className="text-xs text-muted-foreground">
          {commandesFiltrees.length} commande(s) trouvée(s)
        </p>
      </div>

      {/* Liste des commandes */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {commandesFiltrees.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Aucune commande trouvée
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {commandesFiltrees.map((commande) => (
                <CommandeCard key={commande.id} commande={commande} users={users} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

/**
 * Formulaire de filtres avec multi-select (Switch)
 */
const FilterForm = ({ filters, setFilters, toggleArrayItem, users, emplacements, articles, onReset }) => {
  return (
    <div className="space-y-6 pb-4 px-4">
      {/* Période */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Période
        </Label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={filters.periode === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, periode: "today" })}
              className="w-full text-xs"
            >
              Aujourd'hui
            </Button>
            <Button
              variant={filters.periode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, periode: "week" })}
              className="w-full text-xs"
            >
              7 jours
            </Button>
            <Button
              variant={filters.periode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, periode: "month" })}
              className="w-full text-xs"
            >
              30 jours
            </Button>
            <Button
              variant={filters.periode === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, periode: "custom" })}
              className="w-full text-xs"
            >
              Personnalisé
            </Button>
          </div>
          {filters.periode === "custom" && (
            <div className="space-y-2 pt-2">
              <div className="space-y-1">
                <Label htmlFor="dateDebut" className="text-xs">Début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dateFin" className="text-xs">Fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Vendeurs - Multi-select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Vendeurs ({filters.createdBy.length})
        </Label>
        <ScrollArea className="h-32 border rounded-md p-2">
          <div className="space-y-2">
            {users?.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <Switch
                  id={`user-${user.id}`}
                  checked={filters.createdBy.includes(user.id)}
                  onCheckedChange={() =>
                    setFilters({
                      ...filters,
                      createdBy: toggleArrayItem(filters.createdBy, user.id),
                    })
                  }
                />
                <Label
                  htmlFor={`user-${user.id}`}
                  className="text-xs cursor-pointer flex-1">
                  {user.nom} {user.prenoms[0]}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Articles - Multi-select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Articles ({filters.articles.length})
        </Label>
        <ScrollArea className="h-40 border rounded-md p-2">
          <div className="space-y-2">
            {articles?.map((article) => (
              <div key={article.id} className="flex items-center space-x-2">
                <Switch
                  id={`article-${article.id}`}
                  checked={filters.articles.includes(article.id)}
                  onCheckedChange={() =>
                    setFilters({
                      ...filters,
                      articles: toggleArrayItem(filters.articles, article.id),
                    })
                  }
                />
                <Label
                  htmlFor={`article-${article.id}`}
                  className="text-xs cursor-pointer flex-1">
                  {article.denomination}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Emplacements - Multi-select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Emplacements ({filters.emplacements.length})
        </Label>
        <ScrollArea className="h-32 border rounded-md p-2">
          <div className="space-y-2">
            {emplacements?.map((emp) => (
              <div key={emp.id} className="flex items-center space-x-2">
                <Switch
                  id={`emp-${emp.id}`}
                  checked={filters.emplacements.includes(emp.id)}
                  onCheckedChange={() =>
                    setFilters({
                      ...filters,
                      emplacements: toggleArrayItem(filters.emplacements, emp.id),
                    })
                  }
                />
                <Label
                  htmlFor={`emp-${emp.id}`}
                  className="text-xs cursor-pointer flex-1">
                  {emp.denomination}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Types - Multi-select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Types ({filters.types.length})
        </Label>
        <div className="space-y-2 border rounded-md p-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="type-surplace"
              checked={filters.types.includes("sur place")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  types: toggleArrayItem(filters.types, "sur place"),
                })
              }
            />
            <Label htmlFor="type-surplace" className="text-xs cursor-pointer flex-1">
              Sur place
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="type-alivrer"
              checked={filters.types.includes("a livrer")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  types: toggleArrayItem(filters.types, "a livrer"),
                })
              }
            />
            <Label htmlFor="type-alivrer" className="text-xs cursor-pointer flex-1">
              À livrer
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Moyens de paiement - Multi-select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Moyens de paiement ({filters.moyensPaiement.length})
        </Label>
        <div className="space-y-2 border rounded-md p-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="moyen-especes"
              checked={filters.moyensPaiement.includes("especes")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  moyensPaiement: toggleArrayItem(filters.moyensPaiement, "especes"),
                })
              }
            />
            <Label htmlFor="moyen-especes" className="text-xs cursor-pointer flex-1">
              Espèces
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="moyen-momo"
              checked={filters.moyensPaiement.includes("momo")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  moyensPaiement: toggleArrayItem(filters.moyensPaiement, "momo"),
                })
              }
            />
            <Label htmlFor="moyen-momo" className="text-xs cursor-pointer flex-1">
              Mobile Money
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="moyen-mixte"
              checked={filters.moyensPaiement.includes("mixte")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  moyensPaiement: toggleArrayItem(filters.moyensPaiement, "mixte"),
                })
              }
            />
            <Label htmlFor="moyen-mixte" className="text-xs cursor-pointer flex-1">
              Mixte
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Statuts - Multi-select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Statuts ({filters.statuts.length})
        </Label>
        <div className="space-y-2 border rounded-md p-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="statut-livree"
              checked={filters.statuts.includes("livree")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  statuts: toggleArrayItem(filters.statuts, "livree"),
                })
              }
            />
            <Label htmlFor="statut-livree" className="text-xs cursor-pointer flex-1">
              Livrée
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="statut-nonlivree"
              checked={filters.statuts.includes("non livree")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  statuts: toggleArrayItem(filters.statuts, "non livree"),
                })
              }
            />
            <Label htmlFor="statut-nonlivree" className="text-xs cursor-pointer flex-1">
              Non livrée
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="statut-servi"
              checked={filters.statuts.includes("servi")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  statuts: toggleArrayItem(filters.statuts, "servi"),
                })
              }
            />
            <Label htmlFor="statut-servi" className="text-xs cursor-pointer flex-1">
              Servi
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="statut-nonservi"
              checked={filters.statuts.includes("non servi")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  statuts: toggleArrayItem(filters.statuts, "non servi"),
                })
              }
            />
            <Label htmlFor="statut-nonservi" className="text-xs cursor-pointer flex-1">
              Non servi
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Intervalle de prix */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Intervalle de prix
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.prixMin}
            onChange={(e) => setFilters({ ...filters, prixMin: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.prixMax}
            onChange={(e) => setFilters({ ...filters, prixMax: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      {/* Bouton Reset */}
      <Button variant="outline" className="w-full" onClick={onReset}>
        <X className="w-4 h-4 mr-2" />
        Réinitialiser les filtres
      </Button>
    </div>
  );
};

/**
 * Card pour une commande (réutilise le style du Dashboard)
 */
const CommandeCard = ({ commande, users = [] }) => {
  const navigate = useNavigate();

  // Détermine si la commande est clôturée
  const isCloturee = commande.statut === "livree" || commande.statut === "servi";

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
        className={`cursor-pointer hover:shadow-md transition-all ${bgColor}`}
        onClick={handleClick}>
        <CardContent className="p-3 space-y-2">
          {/* Ligne 1: En-tête (Vendeur + Emplacement + Client) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-muted-foreground">{commande.id}</p>
              <TypeBadge type={commande.type} />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium truncate">{commande.client.nom}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate">{commande.point_de_vente.denomination}</span>
            </div>
          </div>

          {/* Ligne 2: Détails de la commande */}
          <div className="border-t pt-2 space-y-0.5">
            {commande.details.slice(0, 2).map((detail) => (
              <div key={detail.id} className="flex justify-between text-[10px]">
                <span className="text-muted-foreground truncate">
                  {detail.quantite}x {detail.denomination}
                </span>
                <span className="font-semibold shrink-0 ml-2">
                  {(detail.quantite * detail.prix).toLocaleString()}
                </span>
              </div>
            ))}
            {commande.details.length > 2 && (
              <p className="text-[10px] text-muted-foreground italic">
                +{commande.details.length - 2} article(s)
              </p>
            )}
            <div className="flex justify-between text-xs font-bold pt-1 border-t">
              <span>Total</span>
              <span className="text-primary">
                {commande.paiement.total.toLocaleString()} F
              </span>
            </div>
          </div>

          {/* Ligne 3: Paiement badges */}
          <div className="border-t pt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {commande.paiement.montant_espece_recu > 0 && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Banknote className="w-2.5 h-2.5" />
                  Espèces
                </div>
              )}
              {commande.paiement.montant_momo_recu > 0 && (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CreditCard className="w-2.5 h-2.5" />
                  MoMo
                </div>
              )}
              {commande.paiement.dette > 0 && (
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                  Dette: {commande.paiement.dette.toLocaleString()} F
                </span>
              )}
            </div>

            {/* Détails livraison (si commande à livrer) */}
            {commande.type === "a livrer" && (
              <div className="space-y-1 pt-1 border-t">
                {commande.paiement.livraison > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Truck className="w-2.5 h-2.5" />
                    <span>Livraison: {commande.paiement.livraison.toLocaleString()} F</span>
                  </div>
                )}
                {commande.adresse_livraison && (
                  <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <Home className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">
                      {commande.adresse_livraison.commune && commande.adresse_livraison.commune.toLowerCase() !== "inconnu"
                        ? `${commande.adresse_livraison.commune} | ${commande.adresse_livraison.quartier}`
                        : commande.adresse_livraison.quartier}
                    </span>
                  </div>
                )}
                {commande.date_heure_livraison && (commande.date_heure_livraison.date || commande.date_heure_livraison.heure) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {commande.date_heure_livraison.date && new Date(commande.date_heure_livraison.date).toLocaleDateString("fr-FR")}
                      {commande.date_heure_livraison.date && commande.date_heure_livraison.heure && " à "}
                      {commande.date_heure_livraison.heure}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Statut */}
            <div className="flex items-center justify-between pt-1 border-t">
              <StatutBadge statut={commande.statut} />
            </div>

            {/* Incident ou Commentaire */}
            {(commande.incident || commande.commentaire) && (
              <div className="space-y-1">
                {commande.incident && (
                  <div className="flex items-start gap-1.5 text-[10px] text-red-600 dark:text-red-400">
                    <AlertCircle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{commande.incident}</span>
                  </div>
                )}
                {commande.commentaire && (
                  <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <MessageSquare className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{commande.commentaire}</span>
                  </div>
                )}
              </div>
            )}

            {/* Vendeur */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t">
              <User className="w-2.5 h-2.5" />
              <span className="italic">Vendeur: {vendeurName}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatutBadge = ({ statut }) => {
  const config = {
    livree: { icon: CheckCircle, color: "bg-green-500", label: "Livrée" },
    "non livree": { icon: Truck, color: "bg-orange-500", label: "En cours" },
    servi: { icon: PackageCheck, color: "bg-blue-500", label: "Servi" },
    "non servi": { icon: Clock, color: "bg-yellow-500", label: "En attente" },
  };

  const { icon: Icon, color, label } = config[statut] || {
    icon: XCircle,
    color: "bg-gray-500",
    label: statut,
  };

  return (
    <div className={`${color} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </div>
  );
};

const TypeBadge = ({ type }) => {
  return (
    <div className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
      {type === "sur place" ? "Sur place" : "À livrer"}
    </div>
  );
};

export default MobileGererLesVentes;
