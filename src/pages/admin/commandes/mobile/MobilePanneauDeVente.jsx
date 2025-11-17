/**
 * MobilePanneauDeVente.jsx
 * Interface mobile pour la prise de commande avec layout vertical
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, X, Check, MapPin, Coffee, UtensilsCrossed } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import usePanneauDeVenteStore from "@/stores/admin/panneauDeVenteStore";
import { useEmplacements } from "@/toolkits/admin/emplacementToolkit";
import { useMenus } from "@/toolkits/admin/menuToolkit";
import { useBoissons } from "@/toolkits/admin/boissonToolkit";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MobilePanneauDeVente = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Point de vente */}
      <PointDeVenteSelector />

      {/* Détails de la commande */}
      <DetailsCommande />

      {/* Boutons de soumission */}
      <SubmitCommande />

      {/* Tabs Menus / Boissons */}
      <CommandeTabs />
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
    <div className="p-2 border-b bg-card">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-9 text-sm">
            <Store className="w-4 h-4" />
            <span className="flex-1 text-left truncate">
              {pointDeVente ? pointDeVente.denomination : "Point de vente"}
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
    <div className="p-2 border-b bg-card" style={{ height: "200px" }}>
      <Card className="h-full">
        <CardContent className="p-2 h-full flex flex-col">
          {/* Zone des détails - flex-1 pour prendre tout l'espace disponible */}
          <div className="flex-1 overflow-hidden mb-2">
            {details.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-xs">Panier vide</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <ul className="space-y-0.5 text-xs pr-2">
                  <AnimatePresence mode="popLayout">
                    {details.map((item) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 leading-tight">
                        <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                        <span className="flex-1 min-w-0 truncate">
                          {item.quantite}x {item.denomination}
                        </span>
                        <span className="font-semibold shrink-0">
                          {(item.quantite * item.prix).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDetail(item.id)}
                          className="h-4 w-4 p-0 shrink-0">
                          <X className="w-3 h-3 text-destructive" />
                        </Button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </ScrollArea>
            )}
          </div>

          {/* Zone du total - hauteur fixe en bas */}
          {details.length > 0 && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs font-semibold">Total</span>
              <span className="text-sm font-bold text-primary">
                {total.toLocaleString()} FCFA
              </span>
            </div>
          )}
        </CardContent>
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
    <div className="p-2 border-t bg-card">
      <div className="grid grid-cols-3 gap-1.5">
        <Button
          variant="outline"
          onClick={handleAnnuler}
          disabled={details.length === 0}
          className="gap-1 h-9 text-xs">
          <X className="w-3 h-3" />
          Annuler
        </Button>
        <Button
          onClick={handleSurPlace}
          disabled={details.length === 0}
          className="gap-1 h-9 text-xs">
          <Check className="w-3 h-3" />
          Sur Place
        </Button>
        <Button
          onClick={handleALivrer}
          disabled={details.length === 0}
          variant="secondary"
          className="gap-1 h-9 text-xs">
          <Check className="w-3 h-3" />
          Livrer
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
    <div className="flex-1 overflow-hidden bg-card min-h-0">
      <Tabs defaultValue="menus" className="h-full flex flex-col">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-t h-8">
          <TabsTrigger value="menus" className="gap-1 text-xs">
            <UtensilsCrossed className="w-3 h-3" />
            Menus
          </TabsTrigger>
          <TabsTrigger value="boissons" className="gap-1 text-xs">
            <Coffee className="w-3 h-3" />
            Boissons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menus" className="flex-1 mt-0 h-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <MenusGrid />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="boissons" className="flex-1 mt-0 h-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <BoissonsGrid />
            </div>
          </ScrollArea>
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
      <p className="text-center text-muted-foreground py-8">
        Chargement des menus...
      </p>
    );
  }

  if (error) {
    return <p className="text-center text-destructive py-8">Erreur: {error}</p>;
  }

  if (!menusActifs || menusActifs.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">Aucun menu actif</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {menusActifs.map((menu) => (
        <MenuCard key={menu.id} menu={menu} />
      ))}
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
      <p className="text-center text-muted-foreground py-8">
        Chargement des boissons...
      </p>
    );
  }

  if (error) {
    return <p className="text-center text-destructive py-8">Erreur: {error}</p>;
  }

  if (!boissonsActives || boissonsActives.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Aucune boisson active
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {boissonsActives.map((boisson) => (
        <BoissonCard key={boisson.id} boisson={boisson} />
      ))}
    </div>
  );
};

/**
 * Card pour un menu
 */
/**
 * Pavé numérique pour saisie de quantité
 */
const NumericKeypad = ({ value, onChange, onSubmit, onCancel }) => {
  const handleNumberClick = (num) => {
    if (value === "0" || value === "") {
      onChange(num.toString());
    } else {
      onChange(value + num.toString());
    }
  };

  const handleBackspace = () => {
    if (value.length > 1) {
      onChange(value.slice(0, -1));
    } else {
      onChange("0");
    }
  };

  const handleClear = () => {
    onChange("0");
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-4xl font-bold text-primary">{value}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-12 text-lg font-semibold"
            onClick={() => handleNumberClick(num)}>
            {num}
          </Button>
        ))}
        <Button
          variant="outline"
          className="h-12 text-lg"
          onClick={handleClear}>
          C
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg font-semibold"
          onClick={() => handleNumberClick(0)}>
          0
        </Button>
        <Button
          variant="outline"
          className="h-12 text-lg"
          onClick={handleBackspace}>
          ←
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button className="flex-1" onClick={onSubmit}>
          Ajouter
        </Button>
      </div>
    </div>
  );
};

const MenuCard = ({ menu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quantite, setQuantite] = useState("0");
  const addDetail = usePanneauDeVenteStore((state) => state.addDetail);
  const details = usePanneauDeVenteStore((state) => state.details);

  // Calculer la quantité dans le panier pour ce menu
  const itemInCart = details.find((item) => item.id === menu.id);
  const cartQuantity = itemInCart?.quantite || 0;

  const handleAdd = () => {
    const qty = parseInt(quantite) || 0;
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
    setQuantite("0");
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="relative group">
        <div className="h-20 rounded-lg border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 via-background to-background dark:from-orange-950/20 dark:via-background dark:to-background cursor-pointer hover:shadow-lg transition-all duration-300 p-1 flex flex-col justify-between overflow-hidden">
          {/* Icône et badge en haut */}
          <div className="flex items-start justify-between mb-1">
            <div className="p-1 rounded bg-orange-100 dark:bg-orange-900/30">
              <UtensilsCrossed className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            </div>
            {cartQuantity > 0 && (
              <div className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md">
                {cartQuantity}
              </div>
            )}
          </div>

          {/* Dénomination */}
          <h4 className="font-semibold text-[11px] leading-tight  tracking-tight mb-1">
            {menu.denomination}
          </h4>

          {/* Prix */}
          <div className="flex items-baseline gap-0.5">
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400 tracking-tight">
              {menu.prix.toLocaleString()}
            </p>
            <span className="text-[9px] text-muted-foreground font-medium">
              F
            </span>
          </div>
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-600" />
              {menu.denomination}
            </DialogTitle>
          </DialogHeader>
          <NumericKeypad
            value={quantite}
            onChange={setQuantite}
            onSubmit={handleAdd}
            onCancel={() => {
              setIsOpen(false);
              setQuantite("0");
            }}
          />
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
  const [quantite, setQuantite] = useState("0");
  const addDetail = usePanneauDeVenteStore((state) => state.addDetail);
  const details = usePanneauDeVenteStore((state) => state.details);

  // Calculer la quantité dans le panier pour cette boisson
  const itemInCart = details.find((item) => item.id === boisson.id);
  const cartQuantity = itemInCart?.quantite || 0;

  const handleAdd = () => {
    const qty = parseInt(quantite) || 0;
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
    setQuantite("0");
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="relative group">
        <div className="h-20 rounded-lg border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background cursor-pointer hover:shadow-lg transition-all duration-300 p-1 flex flex-col justify-between overflow-hidden">
          {/* Icône et badge en haut */}
          <div className="flex items-start justify-between mb-1">
            <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30">
              <Coffee className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            {cartQuantity > 0 && (
              <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md">
                {cartQuantity}
              </div>
            )}
          </div>

          {/* Dénomination */}
          <h4 className="font-semibold text-[11px] leading-tight line-clamp-2 tracking-tight mb-1">
            {boisson.denomination}
          </h4>

          {/* Prix */}
          <div className="flex items-baseline gap-0.5">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-tight">
              {boisson.prix.toLocaleString()}
            </p>
            <span className="text-[9px] text-muted-foreground font-medium">
              F
            </span>
          </div>
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {boisson.denomination}
            </DialogTitle>
          </DialogHeader>
          <NumericKeypad
            value={quantite}
            onChange={setQuantite}
            onSubmit={handleAdd}
            onCancel={() => {
              setIsOpen(false);
              setQuantite("0");
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobilePanneauDeVente;
