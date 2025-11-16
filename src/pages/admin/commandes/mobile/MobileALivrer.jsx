/**
 * MobileALivrer.jsx
 * Page mobile pour compléter et valider une commande "à livrer"
 * Charge les données depuis panneauDeVenteStore
 * Champs spécifiques: client, date_heure_livraison, personne_a_livrer, paiement (avec livraison), incident, commentaire
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  CreditCard,
  Banknote,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  ArrowLeft,
  Check,
  Loader2,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import usePanneauDeVenteStore from "@/stores/admin/panneauDeVenteStore";
import { CreateCommande } from "@/toolkits/admin/commandeToolkit";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AddressSelector from "@/components/global/AddressSelector";

// Composant pavé numérique
const NumericKeypad = ({ value, onChange, onSubmit, onCancel, label }) => {
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
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-4xl font-bold text-primary">{value} FCFA</p>
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
          Valider
        </Button>
      </div>
    </div>
  );
};

// Composant principal
const MobileALivrer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numericDialog, setNumericDialog] = useState({
    open: false,
    field: "",
    value: "0",
    label: "",
  });

  // États locaux pour les champs spécifiques à la livraison
  const [dateLivraison, setDateLivraison] = useState("");
  const [heureLivraison, setHeureLivraison] = useState("");
  const [personneALivrer, setPersonneALivrer] = useState({
    nom: "",
    contact: "",
  });
  const [fraisLivraison, setFraisLivraison] = useState(0);
  const [selectedAddressComplete, setSelectedAddressComplete] = useState(null);

  // Charger les données depuis le store
  const pointDeVente = usePanneauDeVenteStore((state) => state.pointDeVente);
  const details = usePanneauDeVenteStore((state) => state.details);
  const total = usePanneauDeVenteStore((state) => state.paiement.total);
  const client = usePanneauDeVenteStore((state) => state.client);
  const paiement = usePanneauDeVenteStore((state) => state.paiement);
  const incident = usePanneauDeVenteStore((state) => state.incident);
  const commentaire = usePanneauDeVenteStore((state) => state.commentaire);

  // Actions du store
  const setClientNom = usePanneauDeVenteStore((state) => state.setClientNom);
  const setClientNumero = usePanneauDeVenteStore(
    (state) => state.setClientNumero
  );
  const setPaiementField = usePanneauDeVenteStore(
    (state) => state.setPaiementField
  );
  const setIncident = usePanneauDeVenteStore((state) => state.setIncident);
  const setCommentaire = usePanneauDeVenteStore(
    (state) => state.setCommentaire
  );
  const resetCommande = usePanneauDeVenteStore((state) => state.resetCommande);

  // Adresse de livraison
  const adresseLivraison = usePanneauDeVenteStore((state) => state.adresseLivraison);
  const setAdresseLivraison = usePanneauDeVenteStore((state) => state.setAdresseLivraison);

  // Calculs automatiques
  const totalAvecLivraison = total + fraisLivraison;
  const montantTotalRecu =
    (parseFloat(paiement.montant_espece_recu) || 0) +
    (parseFloat(paiement.montant_momo_recu) || 0);

  const montantApresReduction =
    totalAvecLivraison - (parseFloat(paiement.reduction) || 0);
  const monnaieRendue = Math.max(0, montantTotalRecu - montantApresReduction);
  const dette = Math.max(0, montantApresReduction - montantTotalRecu);

  // Ouvrir le pavé numérique
  const openNumericKeypad = (field, label, currentValue = 0) => {
    setNumericDialog({
      open: true,
      field,
      value: currentValue.toString(),
      label,
    });
  };

  // Valider la saisie du pavé numérique
  const handleNumericSubmit = () => {
    const value = parseFloat(numericDialog.value) || 0;

    if (numericDialog.field === "livraison") {
      setFraisLivraison(value);
    } else {
      setPaiementField(numericDialog.field, value);
    }

    setNumericDialog({ open: false, field: "", value: "0", label: "" });
  };

  // Annuler la saisie du pavé numérique
  const handleNumericCancel = () => {
    setNumericDialog({ open: false, field: "", value: "0", label: "" });
  };

  // Formater la date pour le schéma (DDMMYYYY)
  const formatDateForSchema = (dateStr) => {
    if (!dateStr) return "";
    // dateStr est au format YYYY-MM-DD
    const [year, month, day] = dateStr.split("-");
    return `${day}${month}${year}`;
  };

  // Validation et soumission
  const handleSubmit = async () => {
    // Validation basique
    if (!pointDeVente) {
      toast.error("Point de vente non défini");
      return;
    }

    if (details.length === 0) {
      toast.error("Aucun article dans la commande");
      return;
    }

    if (!client.nom || client.nom.trim() === "") {
      toast.error("Le nom du client est requis");
      return;
    }

    if (!selectedAddressComplete || !selectedAddressComplete.id) {
      toast.error("L'adresse de livraison est requise");
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = auth.currentUser?.uid || "system";

      // Préparer date_heure_livraison si renseignée
      let dateHeureLivraison = undefined;
      if (dateLivraison && heureLivraison) {
        dateHeureLivraison = {
          date: formatDateForSchema(dateLivraison),
          heure: heureLivraison,
        };
      }

      // Préparer personne_a_livrer si renseignée
      let personneALivrerData = undefined;
      if (personneALivrer.nom && personneALivrer.nom.trim() !== "") {
        personneALivrerData = {
          nom: personneALivrer.nom,
          contact: personneALivrer.contact || "",
        };
      }

      // Préparer les données de la commande (sans champs undefined)
      const commandeData = {
        point_de_vente: pointDeVente,
        client,
        details,
        type: "a livrer",
        statut: "non livree",
        ...(dateHeureLivraison && { date_heure_livraison: dateHeureLivraison }),
        ...(personneALivrerData && { personne_a_livrer: personneALivrerData }),
        adresse_livraison: {
          id: selectedAddressComplete.id,
          description: adresseLivraison?.description || "",
        },
        paiement: {
          ...paiement,
          livraison: fraisLivraison,
          total: totalAvecLivraison,
          montant_total_recu: montantTotalRecu,
          monnaie_rendue: monnaieRendue,
          dette,
        },
        ...(incident && { incident }),
        ...(commentaire && { commentaire }),
      };

      await CreateCommande(commandeData, userId);

      toast.success("Commande à livrer enregistrée avec succès");

      // Réinitialiser le store
      resetCommande();

      // Retourner au panneau de vente
      navigate("/admin/commandes/panneau_de_ventes");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la commande:", error);
      toast.error("Erreur lors de l'enregistrement de la commande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/commandes/panneau_de_ventes");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-sm">Commande À Livrer</h1>
            <p className="text-xs text-muted-foreground">
              {pointDeVente?.denomination || "Point de vente non défini"}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3 pb-20">
          {/* Récapitulatif de la commande */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-3">
                <h2 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Détails de la commande
                </h2>
                <ul className="space-y-1 text-xs mb-2">
                  {details.map((item) => (
                    <li key={item.id} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                      <span className="flex-1 truncate">
                        {item.quantite}x {item.denomination}
                      </span>
                      <span className="font-semibold">
                        {(item.quantite * item.prix).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs font-semibold">Sous-total</span>
                  <span className="text-sm font-bold text-primary">
                    {total.toLocaleString()} FCFA
                  </span>
                </div>
                {fraisLivraison > 0 && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-muted-foreground">
                      Livraison
                    </span>
                    <span className="text-xs font-semibold">
                      {fraisLivraison.toLocaleString()} FCFA
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="text-sm font-bold text-primary">
                    {totalAvecLivraison.toLocaleString()} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Informations client (REQUIS) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-3">
                <h2 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Client <span className="text-red-500">*</span>
                </h2>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Nom du client"
                        value={client.nom}
                        onChange={(e) => setClientNom(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Téléphone
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="Numéro (optionnel)"
                        value={client.numero}
                        onChange={(e) => setClientNumero(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Adresse de livraison (REQUIS) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}>
            <Card>
              <CardContent className="p-3">
                <AddressSelector
                  selectedAddress={selectedAddressComplete}
                  onSelectAddress={(addr) => {
                    setSelectedAddressComplete(addr);
                    if (addr) {
                      setAdresseLivraison({ id: addr.id, description: "" });
                    } else {
                      setAdresseLivraison(null);
                    }
                  }}
                  description={adresseLivraison?.description || ""}
                  onDescriptionChange={(desc) => {
                    setAdresseLivraison({
                      id: selectedAddressComplete?.id,
                      description: desc,
                    });
                  }}
                  required
                  className="[&_label]:text-xs [&_input]:h-8 [&_input]:text-xs [&_button]:h-8 [&_p]:text-xs"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Date et heure de livraison */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-3">
                <h2 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date et heure de livraison
                </h2>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Date
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateLivraison}
                        onChange={(e) => setDateLivraison(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Heure
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={heureLivraison}
                        onChange={(e) => setHeureLivraison(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personne à livrer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-3">
                <h2 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Personne à livrer (optionnel)
                </h2>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Nom</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Nom du destinataire"
                        value={personneALivrer.nom}
                        onChange={(e) =>
                          setPersonneALivrer({
                            ...personneALivrer,
                            nom: e.target.value,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Contact
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="Numéro du destinataire"
                        value={personneALivrer.contact}
                        onChange={(e) =>
                          setPersonneALivrer({
                            ...personneALivrer,
                            contact: e.target.value,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Paiement */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}>
            <Card>
              <CardContent className="p-3">
                <h2 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Paiement
                </h2>
                <div className="space-y-2">
                  {/* Frais de livraison */}
                  <div
                    onClick={() =>
                      openNumericKeypad(
                        "livraison",
                        "Frais de livraison",
                        fraisLivraison
                      )
                    }
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Frais de livraison
                      </p>
                      <p className="text-sm font-semibold">
                        {fraisLivraison.toLocaleString()} FCFA
                      </p>
                    </div>
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </div>

                  {/* Espèces */}
                  <div
                    onClick={() =>
                      openNumericKeypad(
                        "montant_espece_recu",
                        "Montant en espèces",
                        paiement.montant_espece_recu
                      )
                    }
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Espèces</p>
                      <p className="text-sm font-semibold">
                        {(paiement.montant_espece_recu || 0).toLocaleString()}{" "}
                        FCFA
                      </p>
                    </div>
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </div>

                  {/* Mobile Money */}
                  <div
                    onClick={() =>
                      openNumericKeypad(
                        "montant_momo_recu",
                        "Mobile Money",
                        paiement.montant_momo_recu
                      )
                    }
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Mobile Money
                      </p>
                      <p className="text-sm font-semibold">
                        {(paiement.montant_momo_recu || 0).toLocaleString()}{" "}
                        FCFA
                      </p>
                    </div>
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </div>

                  {/* Réduction */}
                  <div
                    onClick={() =>
                      openNumericKeypad(
                        "reduction",
                        "Réduction",
                        paiement.reduction
                      )
                    }
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <TrendingDown className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Réduction</p>
                      <p className="text-sm font-semibold">
                        {(paiement.reduction || 0).toLocaleString()} FCFA
                      </p>
                    </div>
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </div>

                  {/* Calculs automatiques */}
                  <div className="space-y-1 pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Montant reçu
                      </span>
                      <span className="font-semibold">
                        {montantTotalRecu.toLocaleString()} FCFA
                      </span>
                    </div>
                    {paiement.reduction > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Après réduction
                        </span>
                        <span className="font-semibold">
                          {montantApresReduction.toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {monnaieRendue > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Monnaie à rendre</span>
                        <span className="font-semibold">
                          {monnaieRendue.toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {dette > 0 && (
                      <div className="flex justify-between text-xs text-red-600">
                        <span>Dette</span>
                        <span className="font-semibold">
                          {dette.toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Incident */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}>
            <Card>
              <CardContent className="p-3">
                <h2 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Incident (optionnel)
                </h2>
                <Input
                  placeholder="Signaler un incident..."
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  className="h-8 text-xs"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Commentaire */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}>
            <Card>
              <CardContent className="p-3">
                <h2 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Commentaire (optionnel)
                </h2>
                <Input
                  placeholder="Ajouter un commentaire..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="h-8 text-xs"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Boutons d'action */}
      <div className="p-3 border-t bg-card shrink-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 h-10">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || details.length === 0}
            className="flex-1 h-10">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Valider
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dialog pavé numérique */}
      <Dialog
        open={numericDialog.open}
        onOpenChange={(open) => !open && handleNumericCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Saisir le montant</DialogTitle>
          </DialogHeader>
          <NumericKeypad
            value={numericDialog.value}
            onChange={(value) =>
              setNumericDialog((prev) => ({ ...prev, value }))
            }
            onSubmit={handleNumericSubmit}
            onCancel={handleNumericCancel}
            label={numericDialog.label}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileALivrer;
