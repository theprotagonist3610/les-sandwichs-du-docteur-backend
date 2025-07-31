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
  } = useCommande();
  const currentUser = useCurrentUser();
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Lorsqu'on clique sur une carte menu/boisson
  const handleProduitClick = (produit) => {
    setSelectedProduit(produit);
    setDialogOpen(true);
  };

  const handleValiderSurPlace = (data) => {
    createCommand(
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
        paiement: "",
        point_de_vente: pointDeVente.id,
        vendeur: currentUser.app_id,
        statut_paiement: "",
      },
      "sur place"
    );
    // Ajoute ici ta logique d'enregistrement si besoin
  };

  const handleValiderALivrer = (data) => {
    console.log(data);
    console.log(actualCommand);
    //createCommand(data, "a livrer");
    // Ajoute ici ta logique d'enregistrement si besoin
  };

  // Lorsqu'on valide la quantité
  const handleConfirmQuantite = (quantite) => {
    setDialogOpen(false);
    if (!quantite || quantite <= 0) return;
    ajouterProduit(selectedProduit, quantite);
  };

  return (
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
  );
};

export default CommandPage;
