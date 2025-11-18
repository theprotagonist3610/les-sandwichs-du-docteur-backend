/**
 * DesktopGererLesVentes.jsx
 * Gestion et filtrage des ventes/commandes sur desktop
 * - Layout 3 colonnes : filtre fixe + 2 colonnes de commandes
 * - Réutilise le style des cards du Dashboard
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFilteredCommandes } from "@/toolkits/admin/commandeToolkit";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { useMenus } from "@/toolkits/admin/menuToolkit";
import { useBoissons } from "@/toolkits/admin/boissonToolkit";
import { useNavigate } from "react-router-dom";

const DesktopGererLesVentes = () => {
  const { users } = useUsers();
  const { emplacements } = useEmplacements();
  const { menus } = useMenus();
  const { boissons } = useBoissons();

  // États des filtres (multi-select pour certains)
  const [filters, setFilters] = useState({
    createdBy: [], // Multi-select
    periode: "today", // today, week, month, custom
    dateDebut: "", // Pour période custom
    dateFin: "", // Pour période custom
    articles: [], // Multi-select
    emplacements: [], // Multi-select
    types: [], // Multi-select
    prixMin: "",
    prixMax: "",
    moyensPaiement: [], // Multi-select
    statuts: [], // Multi-select
  });

  // Charger les commandes avec le nouveau hook qui gère les archives
  const { commandes, loading } = useFilteredCommandes({
    periode: filters.periode,
    dateDebut: filters.dateDebut,
    dateFin: filters.dateFin,
  });

  // Combine menus et boissons pour le filtre article
  const articles = useMemo(() => {
    const menuArticles = menus.map((m) => ({ id: m.id, denomination: m.denomination }));
    const boissonArticles = boissons.map((b) => ({ id: b.id, denomination: b.denomination }));
    return [...menuArticles, ...boissonArticles];
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

    // Filtre par vendeur (multi-select)
    if (filters.createdBy.length > 0) {
      result = result.filter((cmd) => filters.createdBy.includes(cmd.createdBy));
    }

    // Filtre par articles (multi-select)
    if (filters.articles.length > 0) {
      result = result.filter((cmd) =>
        cmd.details.some((detail) => filters.articles.includes(detail.id))
      );
    }

    // Filtre par emplacements (multi-select)
    if (filters.emplacements.length > 0) {
      result = result.filter((cmd) => filters.emplacements.includes(cmd.point_de_vente.id));
    }

    // Filtre par types (multi-select)
    if (filters.types.length > 0) {
      result = result.filter((cmd) => filters.types.includes(cmd.type));
    }

    // Filtre par prix (paiement.total)
    if (filters.prixMin) {
      result = result.filter((cmd) => cmd.paiement.total >= parseFloat(filters.prixMin));
    }
    if (filters.prixMax) {
      result = result.filter((cmd) => cmd.paiement.total <= parseFloat(filters.prixMax));
    }

    // Filtre par moyens de paiement (multi-select)
    if (filters.moyensPaiement.length > 0) {
      result = result.filter((cmd) => {
        return filters.moyensPaiement.some((moyen) => {
          if (moyen === "especes") {
            return cmd.paiement.montant_espece_recu > 0 && cmd.paiement.montant_momo_recu === 0;
          } else if (moyen === "momo") {
            return cmd.paiement.montant_momo_recu > 0 && cmd.paiement.montant_espece_recu === 0;
          } else if (moyen === "mixte") {
            return cmd.paiement.montant_espece_recu > 0 && cmd.paiement.montant_momo_recu > 0;
          }
          return false;
        });
      });
    }

    // Filtre par statuts (multi-select)
    if (filters.statuts.length > 0) {
      result = result.filter((cmd) => filters.statuts.includes(cmd.statut));
    }

    // Tri par date (plus récent en premier)
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [commandes, filters]);

  // Nombre de filtres actifs
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

  // Reset des filtres
  const handleResetFilters = () => {
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

  // Helper pour toggle un item dans un array
  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gérer les ventes</h1>
        <p className="text-muted-foreground mt-1">
          {commandesFiltrees.length} commande{commandesFiltrees.length > 1 ? "s" : ""} trouvée
          {commandesFiltrees.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid 3 colonnes : 1 filtre + 2 commandes */}
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        {/* Colonne 1 : Panneau de filtres */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtres</CardTitle>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser ({activeFiltersCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <FilterForm
              filters={filters}
              setFilters={setFilters}
              toggleArrayItem={toggleArrayItem}
              users={users}
              emplacements={emplacements}
              articles={articles}
            />
          </CardContent>
        </Card>

        {/* Colonnes 2-3 : Grille de commandes */}
        <div className="col-span-2">
          <ScrollArea className="h-full">
            {commandesFiltrees.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Aucune commande trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pr-4">
                <AnimatePresence mode="popLayout">
                  {commandesFiltrees.map((commande) => (
                    <CommandeCard key={commande.id} commande={commande} users={users} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

// Composant FilterForm avec multi-select
const FilterForm = ({ filters, setFilters, toggleArrayItem, users, emplacements, articles }) => {
  return (
    <div className="space-y-4">
      {/* Période */}
      <div className="space-y-2">
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
              className="w-full"
            >
              Aujourd'hui
            </Button>
            <Button
              variant={filters.periode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, periode: "week" })}
              className="w-full"
            >
              7 jours
            </Button>
            <Button
              variant={filters.periode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, periode: "month" })}
              className="w-full"
            >
              30 jours
            </Button>
            <Button
              variant={filters.periode === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, periode: "custom" })}
              className="w-full"
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
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dateFin" className="text-xs">Fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                  className="h-8"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Vendeurs - Multi-select */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Vendeurs ({filters.createdBy.length})
        </Label>
        <ScrollArea className="h-32 border rounded-md p-2">
          <div className="space-y-2">
            {users.map((user) => (
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
                  className="text-xs cursor-pointer flex-1"
                >
                  {user.nom} {user.prenoms[0]}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Articles - Multi-select */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Articles ({filters.articles.length})
        </Label>
        <ScrollArea className="h-40 border rounded-md p-2">
          <div className="space-y-2">
            {articles.map((article) => (
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
                  className="text-xs cursor-pointer flex-1"
                >
                  {article.denomination}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Emplacements - Multi-select */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Emplacements ({filters.emplacements.length})
        </Label>
        <ScrollArea className="h-32 border rounded-md p-2">
          <div className="space-y-2">
            {emplacements.map((emp) => (
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
                  className="text-xs cursor-pointer flex-1"
                >
                  {emp.denomination}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Types - Multi-select */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Types ({filters.types.length})
        </Label>
        <div className="space-y-2 border rounded-md p-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="type-sur-place"
              checked={filters.types.includes("sur place")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  types: toggleArrayItem(filters.types, "sur place"),
                })
              }
            />
            <Label htmlFor="type-sur-place" className="text-xs cursor-pointer flex-1">
              Sur place
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="type-a-livrer"
              checked={filters.types.includes("a livrer")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  types: toggleArrayItem(filters.types, "a livrer"),
                })
              }
            />
            <Label htmlFor="type-a-livrer" className="text-xs cursor-pointer flex-1">
              À livrer
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Intervalle de prix */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Intervalle de prix
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.prixMin}
            onChange={(e) => setFilters({ ...filters, prixMin: e.target.value })}
            className="flex-1"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.prixMax}
            onChange={(e) => setFilters({ ...filters, prixMax: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <Separator />

      {/* Moyens de paiement - Multi-select */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Moyens de paiement ({filters.moyensPaiement.length})
        </Label>
        <div className="space-y-2 border rounded-md p-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="paiement-especes"
              checked={filters.moyensPaiement.includes("especes")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  moyensPaiement: toggleArrayItem(filters.moyensPaiement, "especes"),
                })
              }
            />
            <Label htmlFor="paiement-especes" className="text-xs cursor-pointer flex-1">
              Espèces
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="paiement-momo"
              checked={filters.moyensPaiement.includes("momo")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  moyensPaiement: toggleArrayItem(filters.moyensPaiement, "momo"),
                })
              }
            />
            <Label htmlFor="paiement-momo" className="text-xs cursor-pointer flex-1">
              Mobile Money
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="paiement-mixte"
              checked={filters.moyensPaiement.includes("mixte")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  moyensPaiement: toggleArrayItem(filters.moyensPaiement, "mixte"),
                })
              }
            />
            <Label htmlFor="paiement-mixte" className="text-xs cursor-pointer flex-1">
              Mixte
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Statuts - Multi-select */}
      <div className="space-y-2">
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
              id="statut-non-livree"
              checked={filters.statuts.includes("non livree")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  statuts: toggleArrayItem(filters.statuts, "non livree"),
                })
              }
            />
            <Label htmlFor="statut-non-livree" className="text-xs cursor-pointer flex-1">
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
              id="statut-non-servi"
              checked={filters.statuts.includes("non servi")}
              onCheckedChange={() =>
                setFilters({
                  ...filters,
                  statuts: toggleArrayItem(filters.statuts, "non servi"),
                })
              }
            />
            <Label htmlFor="statut-non-servi" className="text-xs cursor-pointer flex-1">
              Non servi
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant CommandeCard (même style que Dashboard)
const CommandeCard = ({ commande, users }) => {
  const navigate = useNavigate();

  // Déterminer si la commande est clôturée
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

  // Total des articles
  const totalArticles = commande.details.reduce((sum, detail) => sum + detail.quantite, 0);

  // Navigation
  const handleClick = () => {
    navigate(`/admin/commandes/ventes/${commande.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${bgColor}`} onClick={handleClick}>
        <CardContent className="p-4 space-y-3">
          {/* Ligne 1 : En-tête (Vendeur + Emplacement + Client) */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{commande.id}</span>
                <TypeBadge type={commande.type} />
              </div>
              {commande.client?.nom && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{commande.client.nom}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{commande.point_de_vente.denomination}</span>
            </div>
          </div>

          <Separator />

          {/* Ligne 2 : Détails de la commande */}
          <div className="space-y-1">
            {commande.details.slice(0, 2).map((detail) => (
              <div key={detail.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate">
                  {detail.quantite}x {detail.denomination}
                </span>
                <span className="font-semibold shrink-0 ml-2">
                  {(detail.quantite * detail.prix).toLocaleString()} F
                </span>
              </div>
            ))}
            {commande.details.length > 2 && (
              <p className="text-xs text-muted-foreground italic">
                +{commande.details.length - 2} article(s)
              </p>
            )}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="w-4 h-4" />
                <span>{totalArticles} article{totalArticles > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-primary">
                <DollarSign className="w-4 h-4" />
                <span>{commande.paiement.total.toLocaleString()} F</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CreditCard className="w-3 h-3" />
              <span>
                {commande.paiement.montant_espece_recu > 0 && commande.paiement.montant_momo_recu > 0
                  ? "Mixte"
                  : commande.paiement.montant_momo_recu > 0
                  ? "Mobile Money"
                  : "Espèces"}
              </span>
            </div>
          </div>

          <Separator />

          {/* Ligne 3 : Statut + Détails livraison */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <StatutBadge statut={commande.statut} />
              {commande.paiement.dette > 0 && (
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Dette: {commande.paiement.dette.toLocaleString()} F
                </span>
              )}
            </div>

            {/* Incidents/Commentaires */}
            {(commande.incident || commande.commentaire) && (
              <div className="space-y-1">
                {commande.incident && (
                  <div className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{commande.incident}</span>
                  </div>
                )}
                {commande.commentaire && (
                  <div className="flex items-start gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{commande.commentaire}</span>
                  </div>
                )}
              </div>
            )}

            {/* Vendeur */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
              <User className="w-3 h-3" />
              <span>Vendeur: {vendeurName}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Badge pour le type
const TypeBadge = ({ type }) => {
  return (
    <div className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
      {type === "sur place" ? "Sur place" : "À livrer"}
    </div>
  );
};

// Badge pour le statut
const StatutBadge = ({ statut }) => {
  const config = {
    livree: { icon: PackageCheck, color: "bg-green-500", label: "Livrée" },
    "non livree": { icon: Truck, color: "bg-orange-500", label: "En cours" },
    servi: { icon: CheckCircle, color: "bg-blue-500", label: "Servi" },
    "non servi": { icon: Clock, color: "bg-yellow-500", label: "En attente" },
  };

  const { icon: Icon, color, label } = config[statut] || {
    icon: Clock,
    color: "bg-gray-500",
    label: statut,
  };

  return (
    <div className={`${color} text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
};

export default DesktopGererLesVentes;
