import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase"; // adapte selon ton setup
import { usePointDeVente } from "@/components/commandeToolkit";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import Line from "@/components/Line";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  File,
  MapPin,
  Locate,
  Phone,
  ReceiptText,
  ScrollText,
  Bike,
} from "lucide-react";
import { format } from "date-fns";
import HeaderNav from "@/components/HeaderNav";
import { useCommandDetail } from "@/context/CommandDetailContext";
import { toast } from "sonner";
// CHILDRENS POUR LE COMPOSANT LINE
import AdresseLivraison from "@/components/commandeDetails/AdresseLivraison";
import DateHeureLivraison from "@/components/commandeDetails/DateHeureLivraison";
import IndicationAdresseLivraison from "@/components/commandeDetails/IndicationAdresseLivraison";
import CoordonneesLivraison from "@/components/commandeDetails/CoordonneesLivraison";
import DetailsCreation from "@/components/commandeDetails/DetailsCreation";
import DetailsCommande from "@/components/commandeDetails/DetailsCommande";
import Livreur from "@/components/commandeDetails/Livreur";
//
const CommandeDetails = () => {
  const { adresses, menus, boissons, updateCommand, pointDeVente, livreurs } =
    useCommandDetail();
  const { commandeId } = useParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modified, setModified] = useState({
    adresse: false,
    date_heure_livraison: false,
    indication_adresse: false,
    details_commande: false,
  });

  // Récupération de la commande
  useEffect(() => {
    const fetchCommande = async () => {
      try {
        const docRef = doc(db, "commandes", commandeId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCommande(snap.data());
        }
        console.log(snap.data());
      } catch (err) {
        toast({
          title: "Erreur",
          description: "Impossible de charger la commande",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCommande();
  }, [commandeId]);

  if (loading) return <div className="p-4">Chargement...</div>;
  if (!commande) return <div className="p-4">Commande introuvable</div>;

  const updateField = (field, value) => {
    setCommande((prev) => ({ ...prev, [field]: value }));
  };
  const updateCommande = async () => {
    try {
      await updateDoc(doc(db, "commandes", commandeId), commande);
      toast.message("Succès", { description: "Commande enregistrée" });
    } catch (err) {
      toast.message("Erreur", { description: "Échec de la sauvegarde" });
    }
  };
  const supprimerCommande = async () => {
    try {
      navigate(-1);
      await deleteDoc(doc(db, "commandes", commandeId));
      toast.message("Supression", {
        description: "Commande supprimée avec succès",
      });
    } catch (err) {
      toast.message("Erreur", {
        description: "Échec de la suppression",
      });
    }
  };
  const partagerCommande = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.message("Lien copié", {
      description: "Le lien de la commande a été copié.",
    });
  };

  return (
    <>
      <HeaderNav />
      <div className="space-y-4 p-4 max-w-xl mx-auto">
        {commande && (
          <>
            {/* Titre de la commande */}
            <div className="flex justify-items p-4 bg-gray-200 rounded-md">
              <File className="w-8 h-8 mr-1" />
              <span className="text-lg font-semibold">{`${commandeId}`}</span>
            </div>
            {/* Carte Details de la Creation (kiosque, type commande=modifiable) : Lecture seule */}
            <Card>
              <CardHeader>
                <CardTitle>Détails création</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <Line
                  title={
                    <div className="flex items-center mb-4 border-b-1">
                      <ReceiptText className="w-4 h-4 mr-2" />
                      <div>{"Creation de la commande"}</div>
                    </div>
                  }
                  children={
                    <DetailsCreation
                      createdAt={commande?.createdAt}
                      updatedAt={commande?.updatedAt}
                      vendeur={commande?.vendeur}
                      point_de_vente={commande?.point_de_vente}
                      code_commande={commande?.code_commande}
                      pointDeVente={pointDeVente?.data}
                      update={updateCommand}
                      change={(val) =>
                        setModified({ ...modified, DetailsCreation: val })
                      }
                    />
                  }
                />
              </CardContent>
            </Card>
            {/* Carte Details de la livraison */}
            {commande?.typeCommande === "a livrer" && (
              <Card>
                <CardHeader>
                  <CardTitle>Details de livraison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Line
                    title={
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <div>{"Adresse de livraison"}</div>
                      </div>
                    }
                    children={
                      <AdresseLivraison
                        adresses={adresses}
                        adresse={commande?.adresse}
                        update={updateCommand}
                        change={(val) =>
                          setModified({ ...modified, adresse: val })
                        }
                      />
                    }
                    modified={modified?.adresse}
                  />

                  <Line
                    title={
                      <div className="flex items-center">
                        <Locate className="w-4 h-4 mr-2" />
                        <div>{"Indication Lieu livraison"}</div>
                      </div>
                    }
                    children={
                      <IndicationAdresseLivraison
                        indication={commande?.indication_adresse}
                        update={updateCommand}
                        change={(val) =>
                          setModified({ ...modified, indication_adresse: val })
                        }
                      />
                    }
                    modified={modified?.indication_adresse}
                  />
                  <Line
                    title={
                      <div className="flex items-center">
                        <Bike className="w-4 h-4 mr-2" />
                        <div>{"Livreur"}</div>
                      </div>
                    }
                    children={<Livreur livreur={commande?.livreur} />}
                  />
                  <Line
                    title={
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <div>{"Date/heure de livraison"}</div>
                      </div>
                    }
                    children={
                      <DateHeureLivraison
                        date={commande?.date_livraison}
                        heure={commande?.heure_livraison}
                        update={updateCommand}
                        change={(val) =>
                          setModified({
                            ...modified,
                            date_heure_livraison: val,
                          })
                        }
                      />
                    }
                    modified={modified?.date_heure_livraison}
                  />
                  <Line
                    title={
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        <div>{"Coordonnées de livraison"}</div>
                      </div>
                    }
                    children={
                      <CoordonneesLivraison
                        numeroClient={commande?.telephone_client}
                        prenomLivraison={commande?.prenom_a_livrer}
                        numeroLivraison={commande?.numero_a_livrer}
                        typeNumeroClient={commande?.type_appel}
                        typeNumeroLivraison={commande?.type_appel_livraison}
                        update={updateCommand}
                        change={(val) =>
                          setModified({
                            ...modified,
                            date_heure_livraison: val,
                          })
                        }
                      />
                    }
                    modified={modified?.date_heure_livraison}
                  />
                </CardContent>
              </Card>
            )}
            {/* Carte Détails commande */}
            <Card>
              <CardHeader>
                <CardTitle>Détails commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Line
                  title={
                    <div className="flex items-center mb-4">
                      <ScrollText className="w-4 h-4 mr-2" />
                      <div>{"Contenu"}</div>
                    </div>
                  }
                  children={
                    <DetailsCommande
                      details={JSON.parse(commande?.details_commande)}
                      liste={[...menus, ...boissons]}
                      update={updateCommand}
                      change={(val) =>
                        setModified({ ...modified, details_commande: val })
                      }
                    />
                  }
                  modified={modified?.details_commande}
                />
              </CardContent>
            </Card>
            {/* Carte Paiement */}
            <Card>
              <CardHeader>
                <CardTitle>Détails paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2"></CardContent>
            </Card>
          </>
        )}
        {/* Boutons d'action  */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            className="flex-1 min-w-[9rem]"
            variant="secondary"
            onClick={partagerCommande}>
            Partager
          </Button>
          <Button
            className="flex-1 min-w-[9rem]"
            variant="outline"
            onClick={() => window.print()}>
            Facture
          </Button>
          <Button
            className="flex-1 min-w-[9rem] bg-green-300"
            onClick={updateCommande}>
            Enregistrer
          </Button>
          <Button
            className="flex-1 min-w-[9rem] bg-red-500"
            variant="destructive"
            onClick={supprimerCommande}>
            Supprimer
          </Button>
        </div>
      </div>
    </>
  );
};

export default CommandeDetails;
