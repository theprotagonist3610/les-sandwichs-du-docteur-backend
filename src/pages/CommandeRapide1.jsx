import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Sandwich,
  Fish,
  Drumstick,
  Milk,
  CupSoda,
  Soup,
  IceCream,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import HeaderNav from "@/components/HeaderNav";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  generateCodeCommande,
  saveCommande,
  validateCommande,
} from "@/components/commandeToolkit";
import { ScrollArea } from "@/components/ui/scroll-area"; // shadcn/ui
import { orderBy as OB } from "lodash";
const iconMap = {
  Sandwich: Sandwich,
  Poisson: Fish,
  Viande: Drumstick,
  Yaourt: Milk,
  Soda: CupSoda,
  Box: Soup,
  Dessert: IceCream,
};

function getTodayRange() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  return { start, end };
}

export default function CommandeRapide() {
  // Produits & commandes du jour
  const [menus, setMenus] = useState([]);
  const [commande, setCommande] = useState({});
  const [commandesJour, setCommandesJour] = useState([]);
  const [tab, setTab] = useState("menu");
  const [produitModal, setProduitModal] = useState(null);
  const [finalDialog, setFinalDialog] = useState(false);

  // Paiement & Infos client
  const [nom, setNom] = useState("");
  const [numero, setNumero] = useState("");
  const [sexe, setSexe] = useState("H");
  const [type, setType] = useState("Sur place"); // Toggle group ici !
  const [typeCommande, setTypeCommande] = useState("P"); // "C", "P", "G"
  const [adresse, setAdresse] = useState("");
  const [indicationAdresse, setIndicationAdresse] = useState("");
  const [heureLivraison, setHeureLivraison] = useState("");
  const [numeroLivraison, setNumeroLivraison] = useState("");

  const [moyen, setMoyen] = useState("Especes");
  const [montantMoMo, setMontantMoMo] = useState(0);
  const [montantEspeces, setMontantEspeces] = useState(0);
  const [montantRecu, setMontantRecu] = useState(0);
  const [reliquatRendu, setReliquatRendu] = useState(0);
  const [resteADevoir, setResteADevoir] = useState(0);

  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingInfos, setPendingInfos] = useState(null);
  const [venteDifferee, setVenteDifferee] = useState(false);

  // Refresh & chargement
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCmd, setLoadingCmd] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setLoadingCmd(true);
    setRefresh((r) => !r);
  }, []);

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "menus"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenus(data.filter((m) => m.disponible));
      } catch (error) {
        toast.error("Erreur lors du chargement des menus.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, [refresh]);

  useEffect(() => {
    setLoadingCmd(true);
    const { start, end } = getTodayRange();
    const commandesQuery = query(
      collection(db, "commandes"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      commandesQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCommandesJour(data);
        setLoadingCmd(false);
      },
      (error) => {
        toast.error("Erreur lors du chargement des commandes du jour.");
        setLoadingCmd(false);
      }
    );
    return () => unsubscribe();
  }, [refresh]);

  useEffect(() => {
    if (!finalDialog) {
      setNom("");
      setNumero("");
      setSexe("H");
      setType("Sur place");
      setTypeCommande("P");
      setAdresse("");
      setIndicationAdresse("");
      setHeureLivraison("");
      setMoyen("Especes");
      setNumeroLivraison("");
      setMontantMoMo(0);
      setMontantEspeces(0);
      setMontantRecu(0);
      setReliquatRendu(0);
      setResteADevoir(0);
      setPendingInfos(null);
      setAlertOpen(false);
      setVenteDifferee(false);
    }
  }, [finalDialog]);

  useEffect(() => {
    if (moyen === "MoMo") {
      setReliquatRendu(0);
      setResteADevoir(0);
      setMontantRecu(0);
    }
    if (moyen === "MoMo+Especes") {
      setMontantMoMo(0);
      setMontantEspeces(0);
      setReliquatRendu(0);
      setResteADevoir(0);
      setMontantRecu(0);
    }
  }, [moyen]);

  const menusFiltres = {
    menu: OB(
      menus.filter((m) => m.type === "menu"),
      ["denomination", "prix"]
    ),
    boisson: OB(
      menus.filter((m) => m.type === "boisson"),
      ["denomination", "prix"]
    ),
  };

  const badges = produitsCommande.map((p, idx) => (
    <Badge
      key={idx}
      className="mr-1 mb-1 text-xs flex items-center gap-1 bg-orange-100 text-orange-900">
      ({p.quantite}) {p.nom} : {p.prix_unitaire} FCFA
    </Badge>
  ));

  const resetCommande = () => setCommande({});

  // --- Enregistrement commande (toolkit) ---
  const handleValider = async () => {
    setSaving(true);
    try {
      const annee = new Date().getFullYear().toString();
      const code_commande = await generateCodeCommande({
        annee,
        sexe,
        type_commande: typeCommande,
      });

      // Champs livraison dynamiques :
      const isLivraison = type === "A livrer";
      // Champ livreur = "" comme demandé
      const commandeData = {
        code_commande,
        prenom_client: nom,
        telephone: numero,
        sexe,
        type_appel: "direct", // à adapter si WhatsApp
        adresse: isLivraison ? adresse : "",
        indication_adresse: isLivraison ? indicationAdresse : "",
        date_livraison: new Date(),
        heure_livraison: isLivraison ? heureLivraison : "",
        numero_livraison: isLivraison ? numeroLivraison : "",
        livreur: "", // à gérer plus tard
        cout_total: total,
        produits: produitsCommande,
        paiement: getPaiementData(),
      };

      // Validation stricte (toolkit)
      const valid = validateCommande(commandeData);
      if (valid !== true) {
        toast.error(valid.join("\n"));
        setSaving(false);
        return;
      }

      await saveCommande(commandeData);

      toast.success("Commande enregistrée !");
      setFinalDialog(false);
      resetCommande();
      handleRefresh();
    } catch (err) {
      toast.error("Erreur : " + err.message);
    }
    setSaving(false);
  };

  const handleProduitClick = (produit) => setProduitModal(produit);
  const handleConfirmerQuantite = (quantite) => {
    setCommande((cmd) => ({ ...cmd, [produitModal.id]: quantite }));
    setProduitModal(null);
  };

  // Bloc Finalisation
  const handleFinaliserCommande = () => {
    if (venteDifferee || moyen === "Plus tard") {
      if (nom.trim() === "" || numero.trim() === "") {
        toast.error("Nom et numéro obligatoires pour un paiement différé !");
        return;
      }
      handleValider();
      return;
    }
    handleValider();
  };

  return (
    <div className="max-w-lg mx-auto p-2">
      <HeaderNav onRefresh={handleRefresh} />
      {/* Zone DetailsCommande */}
      <div className="flex flex-col bg-white rounded-xl border shadow-sm p-2 mb-2 relative min-h-[250px]">
        <div className="flex items-center flex-wrap min-h-[32px] pb-16">
          {badges.length ? (
            badges
          ) : (
            <span className="text-xs text-gray-400">
              Aucun produit sélectionné.
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-4 flex flex-col items-end">
          <div className="text-sm font-bold text-green-700">
            Total : {total} FCFA
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetCommande}
              className="text-xs px-2">
              Annuler
            </Button>
            <Button
              size="sm"
              className="text-xs px-2"
              disabled={total === 0}
              onClick={() => setFinalDialog(true)}>
              Valider
            </Button>
          </div>
        </div>
      </div>

      {/* Onglets Menu/Boisson/Commandes */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-2">
          <TabsTrigger
            value="menu"
            className="text-xs flex items-center gap-1 justify-center">
            <Sandwich className="w-4 h-4" />
            Menus
          </TabsTrigger>
          <TabsTrigger
            value="boisson"
            className="text-xs flex items-center gap-1 justify-center">
            <CupSoda className="w-4 h-4" />
            Boissons
          </TabsTrigger>
          <TabsTrigger
            value="commandes"
            className="text-xs flex items-center gap-1 justify-center">
            <Loader2 className="w-4 h-4" />
            Commandes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="menu">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {menusFiltres.menu.map((prod) => {
                const Icon = iconMap[prod.icone] || Sandwich;
                return (
                  <div
                    key={prod.id}
                    className="bg-gray-100 rounded-lg p-2 flex flex-col items-center cursor-pointer hover:shadow-md transition relative"
                    onClick={() => handleProduitClick(prod)}>
                    <span className="mb-1">
                      <Icon className="w-6 h-6 text-orange-500" />
                    </span>
                    <div className="font-semibold text-sm text-center mb-1">
                      {prod.denomination}
                    </div>
                    <div className="font-bold text-xs mb-1">
                      {prod.prix} FCFA
                    </div>
                    {commande[prod.id] > 0 && (
                      <Badge className="absolute top-1 right-1 text-[10px] bg-green-500 text-white">
                        x{commande[prod.id]}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="boisson">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {menusFiltres.boisson.map((prod) => {
                const Icon = iconMap[prod.icone] || CupSoda;
                return (
                  <div
                    key={prod.id}
                    className="bg-gray-100 rounded-lg p-2 flex flex-col items-center cursor-pointer hover:shadow-md transition relative"
                    onClick={() => handleProduitClick(prod)}>
                    <span className="mb-1">
                      <Icon className="w-6 h-6 text-blue-500" />
                    </span>
                    <div className="font-semibold text-sm text-center mb-1">
                      {prod.denomination}
                    </div>
                    <div className="font-bold text-xs mb-1">
                      {prod.prix} FCFA
                    </div>
                    {commande[prod.id] > 0 && (
                      <Badge className="absolute top-1 right-1 text-[10px] bg-green-500 text-white">
                        x{commande[prod.id]}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="commandes">
          {loadingCmd ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
            </div>
          ) : commandesJour.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              Aucune commande aujourd'hui.
            </div>
          ) : (
            <div className="space-y-2">
              {commandesJour.map((cmd) => (
                <div
                  key={cmd.code_commande || cmd.id}
                  className="bg-orange-50 rounded-lg px-3 py-2 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-orange-900 text-sm">
                      Client : {cmd.prenom_client || <i>Inconnu</i>}
                    </div>
                    <div className="text-xs text-gray-600">
                      Payé : {cmd.cout_total} FCFA ({cmd.paiement?.type})
                      {cmd.paiement?.reste_a_devoir > 0 && (
                        <span className="text-red-600 ml-1">
                          • Reste à devoir : {cmd.paiement.reste_a_devoir} FCFA
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cmd.produits
                      ? cmd.produits.map((p, i) => (
                          <Badge
                            key={i}
                            className="bg-orange-100 text-orange-900 text-xs">
                            {p.quantite}x {p.nom}
                          </Badge>
                        ))
                      : null}
                  </div>
                  <div className="text-xs text-gray-400 text-right w-full md:w-auto">
                    {cmd.createdAt?.toDate
                      ? cmd.createdAt.toDate().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modale calculatrice */}
      {produitModal && (
        <CalculatriceDialog
          open={!!produitModal}
          onClose={() => setProduitModal(null)}
          produit={produitModal}
          onConfirm={(qte) => handleConfirmerQuantite(qte)}
        />
      )}

      {/* Dialogue de finalisation (dans ScrollArea) */}
    </div>
  );
}
