/**
 * DesktopALivrer.jsx
 * Page desktop pour compléter et valider une commande "à livrer"
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
  Calendar,
  Clock,
  MapPin,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import usePanneauDeVenteStore from "@/stores/admin/panneauDeVenteStore";
import { CreateCommande } from "@/toolkits/admin/commandeToolkit";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";

const DesktopALivrer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États locaux pour les champs spécifiques à la livraison
  const [dateLivraison, setDateLivraison] = useState("");
  const [heureLivraison, setHeureLivraison] = useState("");
  const [personneALivrer, setPersonneALivrer] = useState({
    nom: "",
    contact: "",
  });
  const [fraisLivraison, setFraisLivraison] = useState(0);

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

  // Calculs automatiques
  const totalAvecLivraison = total + fraisLivraison;
  const montantTotalRecu =
    (parseFloat(paiement.montant_espece_recu) || 0) +
    (parseFloat(paiement.montant_momo_recu) || 0);

  const montantApresReduction =
    totalAvecLivraison - (parseFloat(paiement.reduction) || 0);
  const monnaieRendue = Math.max(0, montantTotalRecu - montantApresReduction);
  const dette = Math.max(0, montantApresReduction - montantTotalRecu);

  // Formater la date pour le schéma (DDMMYYYY)
  const formatDateForSchema = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}${month}${year}`;
  };

  // Validation et soumission
  const handleSubmit = async () => {
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

    setIsSubmitting(true);

    try {
      const userId = auth.currentUser?.uid || "system";

      let dateHeureLivraison = undefined;
      if (dateLivraison && heureLivraison) {
        dateHeureLivraison = {
          date: formatDateForSchema(dateLivraison),
          heure: heureLivraison,
        };
      }

      let personneALivrerData = undefined;
      if (personneALivrer.nom && personneALivrer.nom.trim() !== "") {
        personneALivrerData = {
          nom: personneALivrer.nom,
          contact: personneALivrer.contact || "",
        };
      }

      const commandeData = {
        point_de_vente: pointDeVente,
        client,
        details,
        type: "a livrer",
        statut: "non livree",
        ...(dateHeureLivraison && { date_heure_livraison: dateHeureLivraison }),
        ...(personneALivrerData && { personne_a_livrer: personneALivrerData }),
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
      resetCommande();
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Commande À Livrer</h1>
              <p className="text-sm text-muted-foreground">
                {pointDeVente?.denomination || "Point de vente non défini"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || details.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Valider la commande
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal - 2 colonnes */}
      <div className="flex-1 flex">
        {/* Colonne gauche - Récapitulatif */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Récapitulatif de la commande
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <Card>
                <CardContent className="p-4">
                  <ul className="space-y-2 mb-4">
                    {details.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="flex-1 truncate">
                          {item.quantite}x {item.denomination}
                        </span>
                        <span className="font-semibold">
                          {(item.quantite * item.prix).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-semibold">Sous-total</span>
                    <span className="text-lg font-bold text-primary">
                      {total.toLocaleString()} FCFA
                    </span>
                  </div>
                  {fraisLivraison > 0 && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-muted-foreground">
                        Frais de livraison
                      </span>
                      <span className="font-semibold">
                        {fraisLivraison.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t mt-3">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {totalAvecLivraison.toLocaleString()} FCFA
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* Colonne droite - Formulaire */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4 max-w-3xl">
              {/* Informations client */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Informations client{" "}
                      <span className="text-red-500">*</span>
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Nom du client <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Nom"
                            value={client.nom}
                            onChange={(e) => setClientNom(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Numéro de téléphone
                        </label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="Téléphone (optionnel)"
                            value={client.numero}
                            onChange={(e) => setClientNumero(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Date et heure de livraison */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date et heure de livraison
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Date
                        </label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="date"
                            value={dateLivraison}
                            onChange={(e) => setDateLivraison(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Heure
                        </label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={heureLivraison}
                            onChange={(e) => setHeureLivraison(e.target.value)}
                            className="flex-1"
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
                transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Personne à livrer (optionnel)
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Nom du destinataire
                        </label>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Nom"
                            value={personneALivrer.nom}
                            onChange={(e) =>
                              setPersonneALivrer({
                                ...personneALivrer,
                                nom: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Contact
                        </label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="Téléphone"
                            value={personneALivrer.contact}
                            onChange={(e) =>
                              setPersonneALivrer({
                                ...personneALivrer,
                                contact: e.target.value,
                              })
                            }
                            className="flex-1"
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
                transition={{ delay: 0.4 }}>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Détails du paiement
                    </h2>
                    <div className="space-y-4">
                      {/* Ligne 1: Frais de livraison */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Frais de livraison
                          </label>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="0"
                              value={fraisLivraison || ""}
                              onChange={(e) =>
                                setFraisLivraison(
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ligne 2: Espèces et Mobile Money */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Montant en espèces
                          </label>
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="0"
                              value={paiement.montant_espece_recu || ""}
                              onChange={(e) =>
                                setPaiementField(
                                  "montant_espece_recu",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Mobile Money
                          </label>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="0"
                              value={paiement.montant_momo_recu || ""}
                              onChange={(e) =>
                                setPaiementField(
                                  "montant_momo_recu",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ligne 3: Réduction */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Réduction
                          </label>
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="0"
                              value={paiement.reduction || ""}
                              onChange={(e) =>
                                setPaiementField(
                                  "reduction",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Calculs automatiques */}
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Montant total reçu
                          </span>
                          <span className="font-semibold">
                            {montantTotalRecu.toLocaleString()} FCFA
                          </span>
                        </div>
                        {paiement.reduction > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Total après réduction
                            </span>
                            <span className="font-semibold">
                              {montantApresReduction.toLocaleString()} FCFA
                            </span>
                          </div>
                        )}
                        {monnaieRendue > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-sm font-medium">
                              Monnaie à rendre
                            </span>
                            <span className="font-bold">
                              {monnaieRendue.toLocaleString()} FCFA
                            </span>
                          </div>
                        )}
                        {dette > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span className="text-sm font-medium">
                              Dette restante
                            </span>
                            <span className="font-bold">
                              {dette.toLocaleString()} FCFA
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Incident et Commentaire */}
              <div className="grid grid-cols-2 gap-4">
                {/* Incident */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}>
                  <Card>
                    <CardContent className="p-4">
                      <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Incident
                      </h2>
                      <Input
                        placeholder="Signaler un incident (optionnel)"
                        value={incident}
                        onChange={(e) => setIncident(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Commentaire */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}>
                  <Card>
                    <CardContent className="p-4">
                      <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Commentaire
                      </h2>
                      <Input
                        placeholder="Ajouter un commentaire (optionnel)"
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
};

export default DesktopALivrer;
