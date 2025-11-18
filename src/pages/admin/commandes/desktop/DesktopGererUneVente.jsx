/**
 * DesktopGererUneVente.jsx
 * Gestion d'une commande individuelle sur desktop
 *
 * Layout: 3 colonnes
 * - Colonne gauche: Détails création + Statut/Clôture
 * - Colonne centre: Détails commande (table éditable avec dialog pour ajout)
 * - Colonne droite: Détails paiement
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCommandes, UpdateCommande } from "@/toolkits/admin/commandeToolkit";
import { useUsers } from "@/toolkits/admin/userToolkit";
import { useMenus } from "@/toolkits/admin/menuToolkit";
import { useBoissons } from "@/toolkits/admin/boissonToolkit";
import useEditCommande from "@/stores/admin/useEditCommande";

const DesktopGererUneVente = () => {
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
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/commandes/ventes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-xl font-bold">Détails commande - {commande.id}</h1>
          <div className="w-24" />
        </div>
      </div>

      {/* 3 colonnes */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-[350px_1fr_350px] gap-4 h-full p-4">
          {/* Colonne gauche: Création + Statut */}
          <div className="space-y-4 overflow-y-auto">
            <DetailsCreationCard commande={commande} vendeurName={vendeurName} />
            <DetailsStatutCard commande={commande} />
          </div>

          {/* Colonne centre: Détails commande (éditable) */}
          <div className="overflow-y-auto">
            <DetailsCommandeCard commande={commande} />
          </div>

          {/* Colonne droite: Paiement */}
          <div className="overflow-y-auto">
            <DetailsPaiementCard commande={commande} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Colonne gauche - Card 1: Détails de création
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Détails de création
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Code" value={commande.id} mono />
          <InfoRow label="Date" icon={<Calendar className="w-4 h-4" />} value={dateStr} />
          <InfoRow label="Heure" icon={<Clock className="w-4 h-4" />} value={heureStr} />
          <InfoRow
            label="Emplacement"
            icon={<MapPin className="w-4 h-4" />}
            value={commande.point_de_vente.denomination}
          />
          <InfoRow
            label="Vendeur"
            icon={<User className="w-4 h-4" />}
            value={vendeurName}
          />
          <div className="border-t pt-2" />
          <InfoRow
            label="Client"
            value={commande.client?.nom || "Non spécifié"}
          />
          {commande.client?.numero && (
            <InfoRow
              label="Contact"
              value={commande.client.numero}
            />
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Type</span>
            <TypeBadge type={commande.type} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Colonne gauche - Card 2: Statut et clôture
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {commande.type === "a livrer" ? (
              <Truck className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Statut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut actuel</span>
            <StatutBadge statut={commande.statut} />
          </div>

          {/* Boutons d'action */}
          {!isCloturee && !isAnnulee && (
            <div className="space-y-2">
              <Button
                onClick={() => handleOpenDialog("cloture")}
                disabled={isSaving}
                className="w-full"
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
                variant="destructive">
                <Ban className="w-4 h-4 mr-2" />
                Annuler la commande
              </Button>
            </div>
          )}

          {isCloturee && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-700 dark:text-green-400 text-center">
                Commande clôturée
              </p>
            </div>
          )}

          {isAnnulee && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-400 text-center">
                Commande annulée
              </p>
            </div>
          )}

          {/* Afficher incident et commentaire si présents */}
          {(commande.incident && commande.incident !== "RAS") && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Incident</Label>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {commande.incident}
              </p>
            </div>
          )}

          {(commande.commentaire && commande.commentaire !== "RAS") && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Commentaire</Label>
              <p className="text-sm">{commande.commentaire}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour incident et commentaire */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "annuler"
                ? "Annuler la commande"
                : commande.type === "a livrer"
                  ? "Confirmer commande livrée"
                  : "Confirmer commande servie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incident">Incident</Label>
              <Textarea
                id="incident"
                value={incident}
                onChange={(e) => setIncident(e.target.value)}
                placeholder="RAS (Rien à signaler)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="RAS (Rien à signaler)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isSaving}
              variant={actionType === "annuler" ? "destructive" : "default"}>
              {isSaving ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

/**
 * Colonne centre: Détails commande (éditable)
 */
const DetailsCommandeCard = ({ commande }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const details = useEditCommande((state) => state.details);
  const updateDetail = useEditCommande((state) => state.updateDetail);
  const removeDetail = useEditCommande((state) => state.removeDetail);
  const addDetail = useEditCommande((state) => state.addDetail);
  const updatePaiementField = useEditCommande((state) => state.updatePaiementField);

  const { menus } = useMenus();
  const { boissons } = useBoissons();

  // Vérifier si la commande est clôturée
  const isCloturee = commande.statut === "livree" || commande.statut === "servi" || commande.statut === "annulee";

  const allArticles = [
    ...(menus || []).map((m) => ({ id: m.id, denomination: m.denomination, prix: m.prix })),
    ...(boissons || []).map((b) => ({ id: b.id, denomination: b.denomination, prix: b.prix })),
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
      setIsDialogOpen(false);
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

  // Mettre à jour le total dans le paiement quand les details changent
  useEffect(() => {
    updatePaiementField("total", total);
  }, [total, updatePaiementField]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Détails de la commande
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={isCloturee}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un article</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => handleAddArticle(article.id)}
                      className="p-3 border rounded-md hover:bg-accent cursor-pointer flex items-center justify-between">
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
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 pb-2 border-b text-sm font-semibold text-muted-foreground">
              <span>Article</span>
              <span className="text-center">Quantité</span>
              <span className="text-right">Total</span>
              <span className="w-10"></span>
            </div>

            {/* Lignes */}
            {details.map((detail, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center text-sm">
                <span className="truncate">{detail.denomination}</span>
                <Input
                  type="number"
                  value={detail.quantite}
                  onChange={(e) => handleUpdateQuantite(index, e.target.value)}
                  className="h-8 text-center"
                  min="1"
                  disabled={isCloturee}
                />
                <span className="text-right font-semibold">
                  {(detail.quantite * detail.prix).toLocaleString()} F
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                  disabled={isCloturee}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}

            {/* Total */}
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 pt-2 border-t text-sm font-bold">
              <span>TOTAL</span>
              <span></span>
              <span className="text-right text-primary">
                {total.toLocaleString()} F
              </span>
              <span className="w-10"></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Colonne droite: Détails paiement (éditable)
 */
const DetailsPaiementCard = ({ commande }) => {
  const paiement = useEditCommande((state) => state.paiement);
  const updatePaiementField = useEditCommande((state) => state.updatePaiementField);

  // Vérifier si la commande est clôturée
  const isCloturee = commande.statut === "livree" || commande.statut === "servi" || commande.statut === "annulee";

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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Détails de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Total (auto-calculé) */}
            <InfoRow label="Total" value={`${paiement.total.toLocaleString()} F`} bold />

            {/* Réduction (éditable) */}
            <EditableField
              label="Réduction"
              value={paiement.reduction}
              onChange={(v) => handleInputChange("reduction", v)}
              disabled={isCloturee}
            />

            {/* Livraison (éditable) */}
            {commande.type === "a livrer" && (
              <>
                <EditableField
                  label="Livraison"
                  value={paiement.livraison}
                  onChange={(v) => handleInputChange("livraison", v)}
                  disabled={isCloturee}
                />
                <InfoRow
                  label="Total avec livraison"
                  value={`${totalAvecLivraison.toLocaleString()} F`}
                  bold
                />
              </>
            )}

            <div className="border-t pt-2" />

            {/* Espèces reçu (éditable) */}
            <EditableField
              label="Espèces reçu"
              value={paiement.montant_espece_recu}
              onChange={(v) => handleInputChange("montant_espece_recu", v)}
              disabled={isCloturee}
            />

            {/* Mobile Money reçu (éditable) */}
            <EditableField
              label="Mobile Money reçu"
              value={paiement.montant_momo_recu}
              onChange={(v) => handleInputChange("montant_momo_recu", v)}
              disabled={isCloturee}
            />

            <div className="border-t pt-2" />

            {/* Total reçu (auto-calculé) */}
            <InfoRow
              label="Total reçu"
              value={`${paiement.montant_total_recu.toLocaleString()} F`}
              bold
              valueClassName="text-primary"
            />

            {/* Dette (auto-calculée) */}
            {paiement.dette > 0 && (
              <InfoRow
                label="Dette"
                value={`${paiement.dette.toLocaleString()} F`}
                bold
                valueClassName="text-orange-600"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Component helper: InfoRow
 */
const InfoRow = ({ label, value, icon, mono, bold, valueClassName }) => {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm text-muted-foreground flex items-center gap-2 ${bold ? "font-bold" : ""}`}>
        {icon}
        {label}
      </span>
      <span
        className={`text-sm ${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-medium"} ${
          valueClassName || ""
        }`}>
        {value}
      </span>
    </div>
  );
};

/**
 * Component helper: EditableField (input numérique)
 */
const EditableField = ({ label, value, onChange, disabled = false }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-32 text-right"
        min="0"
        disabled={disabled}
      />
    </div>
  );
};

/**
 * Badge pour le type de commande
 */
const TypeBadge = ({ type }) => {
  return (
    <div className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full">
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
      className={`${color} text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
};

export default DesktopGererUneVente;
