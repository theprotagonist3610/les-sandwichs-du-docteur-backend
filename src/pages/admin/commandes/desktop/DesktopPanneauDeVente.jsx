/**
 * DesktopPanneauDeVente.jsx
 * Interface desktop pour la prise de commande avec layout 2 colonnes
 * Colonne gauche: Point de vente + Détails commande (vertical)
 * Colonne droite: Tabs Menus/Boissons
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ShoppingCart,
  Trash2,
  X,
  Check,
  MapPin,
  Coffee,
  UtensilsCrossed,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import usePanneauDeVenteStore from "@/stores/admin/panneauDeVenteStore";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { useMenus } from "@/toolkits/admin/menuToolkit";
import { useBoissons } from "@/toolkits/admin/boissonToolkit";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DesktopPanneauDeVente = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Colonne gauche: Point de vente + Détails */}
      <div className="w-1/2 flex flex-col border-r">
        <PointDeVenteSelector />
        <SubmitCommande />
        <DetailsCommande />
      </div>

      {/* Colonne droite: Tabs */}
      <div className="w-1/2 flex flex-col">
        <CommandeTabs />
      </div>
    </div>
  );
};

/**
 * Composant 1: PointDeVenteSelector
 * Affiche le point de vente actuel et permet de le changer via un dialog
 */
const PointDeVenteSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pointDeVente = usePanneauDeVenteStore((state) => state.pointDeVente);
  const setPointDeVente = usePanneauDeVenteStore(
    (state) => state.setPointDeVente
  );

  // Récupérer les emplacements actifs (points de vente)
  const { emplacements, loading, error } = useEmplacements({ status: true });

  const pointsDeVente = emplacements;
  //   ?.filter(
  //     (e) => e.type?.famille === "point_de_vente" || e.type?.famille === "stand"
  //   );

  const handleSelect = (pdv) => {
    setPointDeVente({ id: pdv.id, denomination: pdv.denomination });
    setIsOpen(false);
    toast.success(`Point de vente: ${pdv.denomination}`);
  };

  return (
    <div className="p-3 border-b bg-card">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 h-10">
            <Store className="w-4 h-4" />
            <span className="flex-1 text-left truncate">
              {pointDeVente
                ? pointDeVente.denomination
                : "Sélectionner un point de vente"}
            </span>
            <MapPin className="w-3 h-3 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choisir le point de vente</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading && (
              <p className="text-center text-muted-foreground">Chargement...</p>
            )}
            {error && (
              <p className="text-center text-destructive">Erreur: {error}</p>
            )}
            {pointsDeVente && pointsDeVente.length === 0 && (
              <p className="text-center text-muted-foreground">
                Aucun point de vente actif
              </p>
            )}
            {pointsDeVente?.map((pdv) => (
              <motion.div
                key={pdv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSelect(pdv)}>
                  <Store className="w-4 h-4 mr-2" />
                  {pdv.denomination}
                </Button>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Composant 2: DetailsCommande
 * Rectangle scrollable listant les détails de la commande
 */
const DetailsCommande = () => {
  const details = usePanneauDeVenteStore((state) => state.details);
  const total = usePanneauDeVenteStore((state) => state.paiement.total);
  const removeDetail = usePanneauDeVenteStore((state) => state.removeDetail);

  return (
    <div
      className="overflow-hidden flex flex-col p-3"
      style={{ height: "500px" }}>
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence mode="popLayout">
            {details.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Panier vide</p>
              </motion.div>
            ) : (
              details.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.denomination}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantite} x {item.prix.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {(item.quantite * item.prix).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDetail(item.id)}
                    className="shrink-0 h-7 w-7">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </CardContent>

        {details.length > 0 && (
          <div className="p-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                {total.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

/**
 * Composant 3: SubmitCommande
 * Boutons [Annuler | Sur Place | A Livrer]
 */
const SubmitCommande = () => {
  const navigate = useNavigate();
  const pointDeVente = usePanneauDeVenteStore((state) => state.pointDeVente);
  const details = usePanneauDeVenteStore((state) => state.details);
  const resetCommande = usePanneauDeVenteStore((state) => state.resetCommande);

  const handleAnnuler = () => {
    resetCommande();
    toast.info("Commande annulée");
  };

  const handleSurPlace = () => {
    if (details.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    if (!pointDeVente) {
      toast.error("Veuillez sélectionner un point de vente");
      return;
    }

    // Naviguer vers la page SurPlace pour compléter les détails
    navigate("/admin/commandes/panneau_de_ventes/sur_place");
  };

  const handleALivrer = () => {
    if (details.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    if (!pointDeVente) {
      toast.error("Veuillez sélectionner un point de vente");
      return;
    }

    // Naviguer vers la page ALivrer pour compléter les détails
    navigate("/admin/commandes/panneau_de_ventes/a_livrer");
  };
  return (
    <div className="p-3 border-t bg-card">
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          onClick={handleAnnuler}
          disabled={details.length === 0}
          className="gap-2 h-10">
          <X className="w-4 h-4" />
          Annuler
        </Button>
        <Button
          onClick={handleSurPlace}
          disabled={details.length === 0}
          className="gap-2 h-10">
          <Check className="w-4 h-4" />
          Sur Place
        </Button>
        <Button
          onClick={handleALivrer}
          disabled={details.length === 0}
          variant="secondary"
          className="gap-2 h-10">
          <Check className="w-4 h-4" />À Livrer
        </Button>
      </div>
    </div>
  );
};

/**
 * Composant 4: CommandeTabs
 * Tabs [Menu | Boissons] avec mini cards
 */
const CommandeTabs = () => {
  return (
    <div className="flex-1 overflow-hidden bg-card">
      <Tabs defaultValue="menus" className="h-full flex flex-col">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b h-14">
          <TabsTrigger value="menus" className="gap-2 text-base">
            <UtensilsCrossed className="w-5 h-5" />
            Menus
          </TabsTrigger>
          <TabsTrigger value="boissons" className="gap-2 text-base">
            <Coffee className="w-5 h-5" />
            Boissons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menus" className="flex-1 overflow-y-auto p-6 mt-0">
          <MenusGrid />
        </TabsContent>

        <TabsContent
          value="boissons"
          className="flex-1 overflow-y-auto p-6 mt-0">
          <BoissonsGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Grille des menus
 */
const MenusGrid = () => {
  const { menus, loading, error } = useMenus();

  // Filtrer uniquement les menus actifs
  const menusActifs = menus?.filter((m) => m.status === true);

  if (loading) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Chargement des menus...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive py-12">Erreur: {error}</p>
    );
  }

  if (!menusActifs || menusActifs.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Aucun menu actif
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      <AnimatePresence mode="popLayout">
        {menusActifs.map((menu) => (
          <MenuCard key={menu.id} menu={menu} />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Grille des boissons
 */
const BoissonsGrid = () => {
  const { boissons, loading, error } = useBoissons();

  // Filtrer uniquement les boissons actives
  const boissonsActives = boissons?.filter((b) => b.status === true);

  if (loading) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Chargement des boissons...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive py-12">Erreur: {error}</p>
    );
  }

  if (!boissonsActives || boissonsActives.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Aucune boisson active
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      <AnimatePresence mode="popLayout">
        {boissonsActives.map((boisson) => (
          <BoissonCard key={boisson.id} boisson={boisson} />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Card pour un menu
 */
const MenuCard = ({ menu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quantite, setQuantite] = useState("1");
  const inputRef = useRef(null);
  const addDetail = usePanneauDeVenteStore((state) => state.addDetail);
  const details = usePanneauDeVenteStore((state) => state.details);

  // Calculer la quantité dans le panier pour ce menu
  const itemInCart = details.find((item) => item.id === menu.id);
  const cartQuantity = itemInCart?.quantite || 0;

  // Focus automatique quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  const handleAdd = () => {
    const qty = parseInt(quantite) || 1;
    if (qty <= 0) {
      toast.error("Quantité invalide");
      return;
    }

    addDetail({
      id: menu.id,
      denomination: menu.denomination,
      quantite: qty,
      prix: menu.prix,
    });

    toast.success(`${menu.denomination} x${qty} ajouté`);
    setIsOpen(false);
    setQuantite("1");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className="relative group">
        <Card className="cursor-pointer overflow-hidden border-l-4 border-l-orange-500 hover:shadow-xl hover:border-l-orange-600 transition-all duration-300 bg-gradient-to-br from-orange-50/50 via-background to-background dark:from-orange-950/20 dark:via-background dark:to-background">
          <CardContent className="space-y-3">
            {/* Icône menu */}
            <div className="flex items-start justify-between">
              <div className="p-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 group-hover:scale-110 transition-transform duration-300">
                <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              {cartQuantity > 0 && (
                <div className="bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg animate-in zoom-in-50">
                  {cartQuantity}
                </div>
              )}
            </div>

            {/* Dénomination avec typographie élégante */}
            <h4 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] tracking-tight">
              {menu.denomination}
            </h4>

            {/* Prix avec style premium */}
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 tracking-tight">
                {menu.prix.toLocaleString()}
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                FCFA
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              {menu.denomination}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quantité</label>
              <Input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                min="1"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdd();
                  }
                }}
                className="text-2xl text-center font-bold"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleAdd}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Card pour une boisson
 */
const BoissonCard = ({ boisson }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quantite, setQuantite] = useState("1");
  const inputRef = useRef(null);
  const addDetail = usePanneauDeVenteStore((state) => state.addDetail);
  const details = usePanneauDeVenteStore((state) => state.details);

  // Calculer la quantité dans le panier pour cette boisson
  const itemInCart = details.find((item) => item.id === boisson.id);
  const cartQuantity = itemInCart?.quantite || 0;

  // Focus automatique quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  const handleAdd = () => {
    const qty = parseInt(quantite) || 1;
    if (qty <= 0) {
      toast.error("Quantité invalide");
      return;
    }

    addDetail({
      id: boisson.id,
      denomination: boisson.denomination,
      quantite: qty,
      prix: boisson.prix,
    });

    toast.success(`${boisson.denomination} x${qty} ajouté`);
    setIsOpen(false);
    setQuantite("1");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className="relative group">
        <Card className="cursor-pointer overflow-hidden border-l-4 border-l-blue-500 hover:shadow-xl hover:border-l-blue-600 transition-all duration-300 bg-gradient-to-br from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background">
          <CardContent className="space-y-3">
            {/* Icône boisson */}
            <div className="flex items-start justify-between">
              <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-300">
                <Coffee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              {cartQuantity > 0 && (
                <div className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg animate-in zoom-in-50">
                  {cartQuantity}
                </div>
              )}
            </div>

            {/* Dénomination avec typographie élégante */}
            <h4 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] tracking-tight">
              {boisson.denomination}
            </h4>

            {/* Prix avec style premium */}
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                {boisson.prix.toLocaleString()}
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                FCFA
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-blue-600" />
              {boisson.denomination}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quantité</label>
              <Input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                min="1"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdd();
                  }
                }}
                className="text-2xl text-center font-bold"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleAdd}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DesktopPanneauDeVente;
