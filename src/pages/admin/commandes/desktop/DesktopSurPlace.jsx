/**
 * DesktopSurPlace.jsx
 * Page desktop pour compléter et valider une commande "sur place"
 * Charge les données depuis panneauDeVenteStore
 * Seuls les champs paiement, client, incident et commentaire sont éditables
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

const DesktopSurPlace = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const montantTotalRecu =
    (parseFloat(paiement.montant_espece_recu) || 0) +
    (parseFloat(paiement.montant_momo_recu) || 0);

  const montantApresReduction = total - (parseFloat(paiement.reduction) || 0);
  const monnaieRendue = Math.max(0, montantTotalRecu - montantApresReduction);
  const dette = Math.max(0, montantApresReduction - montantTotalRecu);

  // Mettre à jour les calculs dans le store
  const updateCalculations = () => {
    setPaiementField("montant_total_recu", montantTotalRecu);
    setPaiementField("monnaie_rendue", monnaieRendue);
    setPaiementField("dette", dette);
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

    // Mettre à jour les calculs
    updateCalculations();

    setIsSubmitting(true);

    try {
      const userId = auth.currentUser?.uid || "system";

      // Préparer les données de la commande avec valeurs par défaut pour champs optionnels
      const commandeData = {
        point_de_vente: pointDeVente,
        client: {
          nom: client.nom || "inconnu",
          numero: client.numero || "000000000",
        },
        details,
        type: "sur place",
        statut: "non servi",
        paiement: {
          ...paiement,
          montant_total_recu: montantTotalRecu,
          monnaie_rendue: monnaieRendue,
          dette,
        },
        incident: incident || "inconnu",
        commentaire: commentaire || "inconnu",
      };

      await CreateCommande(commandeData, userId);

      toast.success("Commande enregistrée avec succès");

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
              <h1 className="font-bold text-lg">Commande Sur Place</h1>
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
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {total.toLocaleString()} FCFA
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* Colonne droite - Formulaire */}
        <div className="flex-1 flex flex-col">
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
                      Informations client
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Nom du client
                        </label>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Nom (optionnel)"
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

              {/* Paiement */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Détails du paiement
                    </h2>
                    <div className="space-y-4">
                      {/* Ligne 1: Espèces et Mobile Money */}
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

                      {/* Ligne 2: Réduction */}
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
                  transition={{ delay: 0.3 }}>
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
                  transition={{ delay: 0.4 }}>
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

export default DesktopSurPlace;
