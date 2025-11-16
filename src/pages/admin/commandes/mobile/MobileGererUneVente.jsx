/**
 * MobileGererUneVente.jsx
 * Gestion d'une commande individuelle sur mobile
 *
 * Layout: 4 cards verticales
 * 1. Détails de création (code, date, heure, emplacement, vendeur, type)
 * 2. Détails de la commande (tableau [dénomination | quantité | total])
 * 3. Détails de paiement
 * 4. Détails de service/livraison (clôture)
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  Plus,
  Trash2,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCommandes, UpdateCommande } from "@/toolkits/admin/commandeToolkit";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { useMenus } from "@/toolkits/admin/menuToolkit";
import { useBoissons } from "@/toolkits/admin/boissonToolkit";
import useEditCommande from "@/stores/admin/useEditCommande";

const MobileGererUneVente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { commandes, loading } = useCommandes({ filter: "today" });
  const { users } = useUsers();
  const [commande, setCommande] = useState(null);

  const loadCommande = useEditCommande((state) => state.loadCommande);

  useEffect(() => {
    if (!loading && commandes.length > 0) {
      const found = commandes.find((c) => c.id === id);
      if (found) {
        setCommande(found);
        loadCommande(found);
      }
    }
  }, [id, commandes, loading, loadCommande]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-sm text-muted-foreground">Commande non trouvée</p>
        <Button onClick={() => navigate("/admin/commandes/ventes")} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const vendeur = users.find((u) => u.id === commande.createdBy);
  const vendeurName = vendeur
    ? `${vendeur.nom} ${vendeur.prenoms[0]}`
    : "Inconnu";

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-3 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/commandes/ventes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-lg font-bold">Détails commande</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Card 1: Détails de création */}
          <DetailsCreationCard commande={commande} vendeurName={vendeurName} />

          {/* Card 2: Détails de la commande */}
          <DetailsCommandeCard commande={commande} />

          {/* Card 3: Détails de paiement */}
          <DetailsPaiementCard commande={commande} />

          {/* Card 4: Détails de service/livraison */}
          <DetailsStatutCard commande={commande} />
        </div>
      </ScrollArea>
    </div>
  );
};

/**
 * Card 1: Détails de création
 * Code, Date, Heure, Emplacement, Vendeur, Type
 */
const DetailsCreationCard = ({ commande, vendeurName }) => {
  const createdDate = new Date(commande.createdAt);
  const dateStr = createdDate.toLocaleDateString("fr-FR");
  const heureStr = createdDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Détails de création
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {/* Code */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Code</span>
            <span className="text-xs font-mono font-bold">{commande.id}</span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Date
            </span>
            <span className="text-xs font-medium">{dateStr}</span>
          </div>

          {/* Heure */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Heure
            </span>
            <span className="text-xs font-medium">{heureStr}</span>
          </div>

          {/* Emplacement */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Emplacement
            </span>
            <span className="text-xs font-medium">
              {commande.point_de_vente.denomination}
            </span>
          </div>

          {/* Vendeur */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              Vendeur
            </span>
            <span className="text-xs font-medium">{vendeurName}</span>
          </div>

          <div className="border-t pt-2" />

          {/* Client */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Client</span>
            <span className="text-xs font-medium">
              {commande.client?.nom || "Non spécifié"}
            </span>
          </div>

          {/* Contact client (si présent) */}
          {commande.client?.numero && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contact</span>
              <span className="text-xs font-medium">{commande.client.numero}</span>
            </div>
          )}

          {/* Type (badge) */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">Type</span>
            <TypeBadge type={commande.type} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 2: Détails de la commande (éditable)
 */
const DetailsCommandeCard = ({ commande }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const details = useEditCommande((state) => state.details);
  const updateDetail = useEditCommande((state) => state.updateDetail);
  const removeDetail = useEditCommande((state) => state.removeDetail);
  const addDetail = useEditCommande((state) => state.addDetail);
  const updatePaiementField = useEditCommande((state) => state.updatePaiementField);

  const { menus } = useMenus();
  const { boissons } = useBoissons();

  // Filtrer uniquement les articles actifs
  const allArticles = [
    ...(menus || []).filter((m) => m.status).map((m) => ({ id: m.id, denomination: m.denomination, prix: m.prix })),
    ...(boissons || []).filter((b) => b.status).map((b) => ({ id: b.id, denomination: b.denomination, prix: b.prix })),
  ];

  const handleAddArticle = (articleId) => {
    const article = allArticles.find((a) => a.id === articleId);
    if (article) {
      addDetail({
        id: article.id,
        denomination: article.denomination,
        quantite: 1,
        prix: article.prix,
      });
      setIsSheetOpen(false);
    }
  };

  const handleUpdateQuantite = (index, newQuantite) => {
    const detail = details[index];
    updateDetail(index, { ...detail, quantite: parseInt(newQuantite) || 1 });
  };

  const handleRemove = (index) => {
    removeDetail(index);
  };

  // Calculer le total et mettre à jour automatiquement le paiement
  const total = details.reduce((sum, d) => sum + d.quantite * d.prix, 0);

  useEffect(() => {
    updatePaiementField("total", total);
  }, [total, updatePaiementField]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Détails de la commande
            </CardTitle>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Ajouter un article</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(80vh-80px)] mt-4">
                  <div className="space-y-2 px-4">
                    {allArticles.map((article) => (
                      <div
                        key={article.id}
                        onClick={() => handleAddArticle(article.id)}
                        className="p-3 border rounded-md active:bg-accent cursor-pointer flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{article.denomination}</p>
                          <p className="text-xs text-muted-foreground">
                            {article.prix.toLocaleString()} F
                          </p>
                        </div>
                        <Plus className="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Tableau header */}
            <div className="grid grid-cols-[2fr_80px_1fr_32px] gap-2 pb-2 border-b text-xs font-semibold text-muted-foreground">
              <span>Article</span>
              <span className="text-center">Qté</span>
              <span className="text-right">Total</span>
              <span></span>
            </div>

            {/* Lignes de détails (éditables) */}
            {details.map((detail, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_80px_1fr_32px] gap-2 items-center text-xs">
                <span className="truncate">{detail.denomination}</span>
                <Input
                  type="number"
                  value={detail.quantite}
                  onChange={(e) => handleUpdateQuantite(index, e.target.value)}
                  className="h-7 text-center text-xs"
                  min="1"
                />
                <span className="text-right font-semibold">
                  {(detail.quantite * detail.prix).toLocaleString()} F
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemove(index)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}

            {/* Total global */}
            <div className="grid grid-cols-[2fr_80px_1fr_32px] gap-2 pt-2 border-t text-xs font-bold">
              <span>TOTAL</span>
              <span></span>
              <span className="text-right text-primary">
                {total.toLocaleString()} F
              </span>
              <span></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 3: Détails de paiement (éditable)
 */
const DetailsPaiementCard = ({ commande }) => {
  const paiement = useEditCommande((state) => state.paiement);
  const updatePaiementField = useEditCommande((state) => state.updatePaiementField);

  // Calculer automatiquement le total reçu et la dette
  useEffect(() => {
    const totalRecu = paiement.montant_espece_recu + paiement.montant_momo_recu;
    const totalAvecLivraison = paiement.total + paiement.livraison - paiement.reduction;
    const dette = Math.max(0, totalAvecLivraison - totalRecu);

    updatePaiementField("montant_total_recu", totalRecu);
    updatePaiementField("dette", dette);
  }, [
    paiement.montant_espece_recu,
    paiement.montant_momo_recu,
    paiement.total,
    paiement.livraison,
    paiement.reduction,
    updatePaiementField,
  ]);

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    updatePaiementField(field, numValue);
  };

  const totalAvecLivraison = paiement.total + paiement.livraison - paiement.reduction;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Détails de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {/* Total (auto-calculé) */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Total</span>
              <span className="font-bold">{paiement.total.toLocaleString()} F</span>
            </div>

            {/* Réduction (éditable) */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Réduction</span>
              <Input
                type="number"
                value={paiement.reduction}
                onChange={(e) => handleInputChange("reduction", e.target.value)}
                className="h-7 w-24 text-right text-xs"
                min="0"
              />
            </div>

            {/* Livraison (éditable si commande à livrer) */}
            {commande.type === "a livrer" && (
              <>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Livraison</span>
                  <Input
                    type="number"
                    value={paiement.livraison}
                    onChange={(e) => handleInputChange("livraison", e.target.value)}
                    className="h-7 w-24 text-right text-xs"
                    min="0"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Total avec livraison</span>
                  <span className="font-bold">{totalAvecLivraison.toLocaleString()} F</span>
                </div>
              </>
            )}

            <div className="border-t pt-2" />

            {/* Espèces reçu (éditable) */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Espèces reçu</span>
              <Input
                type="number"
                value={paiement.montant_espece_recu}
                onChange={(e) => handleInputChange("montant_espece_recu", e.target.value)}
                className="h-7 w-24 text-right text-xs"
                min="0"
              />
            </div>

            {/* Momo reçu (éditable) */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Mobile Money reçu</span>
              <Input
                type="number"
                value={paiement.montant_momo_recu}
                onChange={(e) => handleInputChange("montant_momo_recu", e.target.value)}
                className="h-7 w-24 text-right text-xs"
                min="0"
              />
            </div>

            <div className="border-t pt-2" />

            {/* Total reçu (auto-calculé) */}
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Total reçu</span>
              <span className="text-primary">
                {paiement.montant_total_recu.toLocaleString()} F
              </span>
            </div>

            {/* Dette (auto-calculée) */}
            {paiement.dette > 0 && (
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-orange-600">Dette</span>
                <span className="text-orange-600">
                  {paiement.dette.toLocaleString()} F
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Card 4: Détails de service/livraison (clôture avec dialog)
 */
const DetailsStatutCard = ({ commande }) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(""); // "cloture" | "annuler"
  const [incident, setIncident] = useState("RAS");
  const [commentaire, setCommentaire] = useState("RAS");

  const handleOpenDialog = (type) => {
    setActionType(type);
    setIncident("RAS");
    setCommentaire("RAS");
    setIsDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    setIsSaving(true);
    try {
      let newStatut;
      if (actionType === "annuler") {
        newStatut = "annulee";
      } else {
        newStatut = commande.type === "a livrer" ? "livree" : "servi";
      }

      await UpdateCommande(
        commande.id,
        {
          statut: newStatut,
          incident: incident,
          commentaire: commentaire,
        },
        commande.createdBy
      );

      // Attendre un peu que l'opération soit traitée par la queue
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Naviguer vers la liste des ventes au lieu de recharger
      navigate("/admin/commandes/ventes", { replace: true });
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      setIsSaving(false);
      setIsDialogOpen(false);
    }
  };

  const isCloturee = commande.statut === "livree" || commande.statut === "servi";
  const isAnnulee = commande.statut === "annulee";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {commande.type === "a livrer" ? (
              <Truck className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Statut de la commande
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Statut actuel */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Statut actuel</span>
            <StatutBadge statut={commande.statut} />
          </div>

          {/* Boutons d'action */}
          {!isCloturee && !isAnnulee && (
            <div className="space-y-2">
              <Button
                onClick={() => handleOpenDialog("cloture")}
                disabled={isSaving}
                className="w-full"
                size="sm"
                variant="default">
                <CheckCircle className="w-4 h-4 mr-2" />
                {commande.type === "a livrer"
                  ? "Confirmer commande livrée"
                  : "Confirmer commande servie"}
              </Button>

              <Button
                onClick={() => handleOpenDialog("annuler")}
                disabled={isSaving}
                className="w-full"
                size="sm"
                variant="destructive">
                <Ban className="w-4 h-4 mr-2" />
                Annuler la commande
              </Button>
            </div>
          )}

          {isCloturee && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
              <p className="text-xs text-green-700 dark:text-green-400 text-center">
                Commande clôturée
              </p>
            </div>
          )}

          {isAnnulee && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
              <p className="text-xs text-red-700 dark:text-red-400 text-center">
                Commande annulée
              </p>
            </div>
          )}

          {/* Afficher incident et commentaire si présents */}
          {(commande.incident && commande.incident !== "RAS") && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Incident</Label>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {commande.incident}
              </p>
            </div>
          )}

          {(commande.commentaire && commande.commentaire !== "RAS") && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Commentaire</Label>
              <p className="text-xs">{commande.commentaire}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour incident et commentaire */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {actionType === "annuler"
                ? "Annuler la commande"
                : commande.type === "a livrer"
                  ? "Confirmer commande livrée"
                  : "Confirmer commande servie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="incident" className="text-sm">Incident</Label>
              <Textarea
                id="incident"
                value={incident}
                onChange={(e) => setIncident(e.target.value)}
                placeholder="RAS (Rien à signaler)"
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commentaire" className="text-sm">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="RAS (Rien à signaler)"
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm">
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isSaving}
              variant={actionType === "annuler" ? "destructive" : "default"}
              size="sm">
              {isSaving ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

/**
 * Badge pour le type de commande
 */
const TypeBadge = ({ type }) => {
  return (
    <div className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
      {type === "sur place" ? "Sur place" : "À livrer"}
    </div>
  );
};

/**
 * Badge pour le statut
 */
const StatutBadge = ({ statut }) => {
  const config = {
    livree: { icon: CheckCircle, color: "bg-green-500", label: "Livrée" },
    "non livree": { icon: Truck, color: "bg-orange-500", label: "En cours" },
    servi: { icon: CheckCircle, color: "bg-blue-500", label: "Servi" },
    "non servi": { icon: Clock, color: "bg-yellow-500", label: "En attente" },
    annulee: { icon: Ban, color: "bg-red-500", label: "Annulée" },
  };

  const { icon: Icon, color, label } = config[statut] || {
    icon: XCircle,
    color: "bg-gray-500",
    label: statut,
  };

  return (
    <div
      className={`${color} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </div>
  );
};

export default MobileGererUneVente;
