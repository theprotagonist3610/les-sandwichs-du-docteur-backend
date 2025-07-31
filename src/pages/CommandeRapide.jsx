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

function CalculatriceDialog({ open, onClose, onConfirm, produit }) {
  const [value, setValue] = useState("");
  const handleKey = (k) => {
    if (k === "C") setValue("");
    else if (k === "OK" && Number(value) > 0) onConfirm(Number(value));
    else if (/^[0-9]$/.test(k)) setValue((v) => (v === "0" ? k : v + k));
    else if (k === "Del") setValue((v) => v.slice(0, -1));
  };
  useEffect(() => {
    if (open) setValue("");
  }, [open]);
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "Del"],
  ];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Quantité – {produit?.denomination}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center my-2">
          <div className="text-3xl font-mono border-b-2 px-4 pb-2 min-w-[60px] text-center">
            {value || "0"}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {keys.flat().map((k) =>
            k === "Del" ? (
              <Button
                key={k}
                size="sm"
                variant="outline"
                onClick={() => handleKey(k)}>
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                key={k}
                size="sm"
                variant={["C", "OK"].includes(k) ? "destructive" : "outline"}
                onClick={() => handleKey(k)}
                disabled={k === "OK"}>
                {k}
              </Button>
            )
          )}
        </div>
        <DialogFooter className="mt-2">
          <Button
            disabled={Number(value) <= 0}
            onClick={() => {
              if (Number(value) > 0) onConfirm(Number(value));
            }}
            className="w-full">
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

  const produitsCommande = Object.entries(commande)
    .filter(([_, qte]) => qte > 0)
    .map(([id, qte]) => {
      const produit = menus.find((m) => m.id === id);
      return produit
        ? {
            nom: produit.denomination,
            quantite: qte,
            prix_unitaire: Number(produit.prix),
          }
        : null;
    })
    .filter(Boolean);

  const total = produitsCommande.reduce(
    (acc, p) => acc + p.quantite * p.prix_unitaire,
    0
  );

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

  // Génère le bon objet paiement selon le choix
  const getPaiementData = () => {
    if (venteDifferee || moyen === "Plus tard") {
      return {
        solde: false,
        type: "plus_tard",
        montant_momo: 0,
        montant_especes: 0,
        reste_a_devoir: total,
      };
    }
    if (moyen === "MoMo+Especes") {
      return {
        solde: true,
        type: "momo+especes",
        montant_momo: Number(montantMoMo),
        montant_especes: Number(montantEspeces),
        reste_a_devoir: 0,
      };
    }
    if (moyen === "MoMo") {
      return {
        solde: true,
        type: "momo",
        montant_momo: Number(montantRecu),
        montant_especes: 0,
        reste_a_devoir: 0,
      };
    }
    if (moyen === "Especes") {
      return {
        solde: resteADevoir == 0,
        type: "especes",
        montant_momo: 0,
        montant_especes: Number(montantRecu),
        reste_a_devoir: Number(resteADevoir),
      };
    }
    return {};
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
      <Dialog open={finalDialog} onOpenChange={setFinalDialog}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <ScrollArea className="h-[70vh] pr-3">
            <DialogHeader>
              <DialogTitle>Finaliser la commande</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Nom du client (optionnel sauf si dette)"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              <Input
                placeholder="Numéro du client (optionnel sauf si dette)"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                type="tel"
              />
              {/* Sexe client */}
              <div>
                <div className="mb-1 text-xs">Sexe</div>
                <div className="flex gap-2">
                  {["H", "F"].map((s) => (
                    <Button
                      key={s}
                      variant={sexe === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSexe(s)}>
                      {s === "H" ? "Homme" : "Femme"}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Type de commande */}
              <div>
                <div className="mb-1 text-xs">Type de commande</div>
                <div className="flex gap-2">
                  {[
                    { v: "P", l: "Pour le client" },
                    { v: "C", l: "Le client offre" },
                    { v: "G", l: "Cadeau entreprise" },
                  ].map((opt) => (
                    <Button
                      key={opt.v}
                      variant={typeCommande === opt.v ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTypeCommande(opt.v)}>
                      {opt.l}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Toggle “Sur place” / “A livrer” */}
              <div>
                <div className="mb-1 text-xs">Lieu</div>
                <div className="flex gap-2">
                  {["Sur place", "A livrer"].map((lieu) => (
                    <Button
                      key={lieu}
                      variant={type === lieu ? "default" : "outline"}
                      size="sm"
                      onClick={() => setType(lieu)}>
                      {lieu}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Champs livraison si "A livrer" */}
              {type === "A livrer" && (
                <>
                  <Input
                    placeholder="Adresse"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                  />
                  <Input
                    placeholder="Indication d'adresse"
                    value={indicationAdresse}
                    onChange={(e) => setIndicationAdresse(e.target.value)}
                  />
                  <Input
                    placeholder="Heure livraison (ex : 15:30)"
                    value={heureLivraison}
                    onChange={(e) => setHeureLivraison(e.target.value)}
                  />
                  <Input
                    placeholder="Numéro pour la livraison"
                    value={numeroLivraison}
                    onChange={(e) => setNumeroLivraison(e.target.value)}
                    type="tel"
                  />
                </>
              )}
              {/* Paiement */}
              <div>
                <div className="mb-1 text-xs">Moyen de paiement *</div>
                <div className="flex gap-2 flex-wrap">
                  {["Especes", "MoMo", "MoMo+Especes", "Plus tard"].map((m) => (
                    <Button
                      key={m}
                      variant={moyen === m ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setMoyen(m);
                        setVenteDifferee(m === "Plus tard");
                      }}>
                      {m === "MoMo+Especes" ? "MoMo + Espèces" : m}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Champs conditionnels paiement */}
              {moyen === "Especes" && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-medium">Montant reçu *</label>
                  <Input
                    placeholder="Montant reçu"
                    type="number"
                    min={0}
                    value={montantRecu}
                    onChange={(e) => setMontantRecu(e.target.value)}
                    required
                  />
                  <label className="text-xs font-medium">
                    Reliquat rendu *
                  </label>
                  <Input
                    placeholder="Reliquat rendu"
                    type="number"
                    min={0}
                    value={reliquatRendu}
                    onChange={(e) => setReliquatRendu(e.target.value)}
                    required
                  />
                  <label className="text-xs font-medium">
                    Reste à devoir *
                  </label>
                  <Input
                    placeholder="Reste à devoir"
                    type="number"
                    min={0}
                    value={resteADevoir}
                    onChange={(e) => setResteADevoir(e.target.value)}
                    required
                  />
                </div>
              )}
              {moyen === "MoMo" && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-medium">Montant reçu *</label>
                  <Input
                    placeholder="Montant reçu"
                    type="number"
                    min={0}
                    value={montantRecu}
                    onChange={(e) => setMontantRecu(e.target.value)}
                    required
                  />
                  <div className="text-xs text-gray-500">
                    Pour MoMo, le montant reçu doit être égal au total.
                  </div>
                </div>
              )}
              {moyen === "MoMo+Especes" && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-medium">
                    Montant payé par MoMo *
                  </label>
                  <Input
                    placeholder="Montant MoMo"
                    type="number"
                    min={0}
                    value={montantMoMo}
                    onChange={(e) => setMontantMoMo(e.target.value)}
                    required
                  />
                  <label className="text-xs font-medium">
                    Montant payé en espèces *
                  </label>
                  <Input
                    placeholder="Montant espèces"
                    type="number"
                    min={0}
                    value={montantEspeces}
                    onChange={(e) => setMontantEspeces(e.target.value)}
                    required
                  />
                  <div className="text-xs text-gray-500">
                    La somme doit être exactement {total} FCFA.
                  </div>
                </div>
              )}
              {moyen === "Plus tard" && (
                <div className="text-xs text-orange-800 mt-2">
                  Vente à crédit : nom et numéro du client requis.
                </div>
              )}
              <div className="text-xs mt-1 text-gray-600">
                <b>Total attendu : {total} FCFA</b>
              </div>
            </div>
          </ScrollArea>
          {/* AlertDialog pour reste à devoir > 0 sans nom ou numéro */}
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Nom et numéro requis pour une dette
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Pour faciliter le remboursement du reliquat, on a besoin du
                  nom et du numéro du client.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline" onClick={() => setAlertOpen(false)}>
                    Remplir nom
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    onClick={() => {
                      setAlertOpen(false);
                      if (pendingInfos) {
                        handleValider(pendingInfos);
                        setPendingInfos(null);
                        setFinalDialog(false);
                        resetCommande();
                      }
                    }}>
                    Valider quand même
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DialogFooter>
            <Button
              onClick={handleFinaliserCommande}
              className="w-full"
              disabled={saving}>
              {saving ? "Enregistrement..." : "Valider la commande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
