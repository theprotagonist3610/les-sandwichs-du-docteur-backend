import React, { useState } from "react";
import HeaderNav from "@/components/HeaderNav";
import DetailsCommand from "@/components/commandes/DetailsCommand";
import CommandTabs from "@/components/commandes/CommandTabs";
import CalculatriceDialog from "@/components/commandes/CalculatriceDialog";
import { useCommande } from "@/context/CommandContext";
import SurPlaceDialog from "@/components/commandes/SurPlaceDialog";
import ALivrerDialog from "@/components/commandes/ALivrerDialog";
import PointDeVente from "@/components/commandes/PointDeVente";
import { useCurrentUser } from "../components/useCurrentUser";
import { Mask } from "@/components/Mask";
import { toast } from "sonner";
const CommandPage = () => {
  const {
    actualCommand,
    ajouterProduit,
    openSurPlaceDialog,
    setOpenSurPlaceDialog,
    openALivrerDialog,
    setOpenALivrerDialog,
    pointDeVente,
    createCommand,
    paiement,
    resetCommande,
  } = useCommande();
  const currentUser = useCurrentUser();
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  // Lorsqu'on clique sur une carte menu/boisson
  const handleProduitClick = (produit) => {
    setSelectedProduit(produit);
    setDialogOpen(true);
  };

  const handleValiderSurPlace = async (data) => {
    setLoadingMessage("Enregistrement de la commande");
    setLoading(true);
    const save = await createCommand(
      {
        ...data,
        paiement,
        actualCommand: (() => {
          let list = [];
          actualCommand.map((el) =>
            list.push({
              id: el.id,
              prix: el.prix,
              type: el.type,
              quantite: el.quantite,
            })
          );
          return list;
        })(),
        point_de_vente: pointDeVente.id,
        vendeur: JSON.stringify({
          id: currentUser.app_id,
          nom: `${currentUser.prenom} ${currentUser.nom
            .charAt(0)
            .toUpperCase()}.`,
        }),
      },
      "sur place"
    );
    if (save) {
      resetCommande();
      setLoading(false);
      setLoadingMessage("");
      toast.success(`Votre commande a ete enregistre sous le code ${save}`);
    } else {
      resetCommande();
      setLoading(false);
      setLoadingMessage("");
      toast.error(
        `Il y a eu une erreur lors de l'enregistrement de votre commande`
      );
    }
    // Ajoute ici ta logique d'enregistrement si besoin
  };

  const handleValiderALivrer = async (data) => {
    setLoadingMessage("Enregistrement de la commande a livrer");
    setLoading(true);
    const save = await createCommand(
      {
        ...data,
        paiement,
        actualCommand: (() => {
          let list = [];
          actualCommand.map((el) =>
            list.push({
              id: el.id,
              prix: el.prix,
              type: el.type,
              quantite: el.quantite,
            })
          );
          return list;
        })(),
        point_de_vente: pointDeVente.id,
        vendeur: JSON.stringify({
          id: currentUser.app_id,
          nom: `${currentUser.prenom} ${currentUser.nom
            .charAt(0)
            .toUpperCase()}.`,
        }),
      },
      "a livrer"
    );
    if (save) {
      resetCommande();
      setLoading(false);
      setLoadingMessage("");
      toast.success(`Votre commande a ete enregistre sous le code ${save}`);
    } else {
      resetCommande();
      setLoading(false);
      setLoadingMessage("");
      toast.error(
        `Il y a eu une erreur lors de l'enregistrement de votre commande`
      );
    }
    // Ajoute ici ta logique d'enregistrement si besoin
  };

  // Lorsqu'on valide la quantité
  const handleConfirmQuantite = (quantite) => {
    setDialogOpen(false);
    if (!quantite || quantite <= 0) return;
    ajouterProduit(selectedProduit, quantite);
  };

  return (
    <>
      <Mask message={"loadingMessage"} show={loading} />
      <div className="">
        <HeaderNav />
        <PointDeVente />
        <DetailsCommand /> {/* Utilise useCommande en interne */}
        <CommandTabs onProduitClick={handleProduitClick} />
        <CalculatriceDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleConfirmQuantite}
          produit={selectedProduit}
        />
        <SurPlaceDialog
          open={openSurPlaceDialog}
          onClose={() => setOpenSurPlaceDialog(false)}
          onValider={handleValiderSurPlace}
        />
        <ALivrerDialog
          open={openALivrerDialog}
          onClose={() => setOpenALivrerDialog(false)}
          onValider={handleValiderALivrer}
        />
      </div>
    </>
  );
};

export default CommandPage;
