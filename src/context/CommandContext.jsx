import { createContext, useContext, useState } from "react";
import {
  useMenus,
  useBoissons,
  useTodayCommand,
  useAdressesLivraison,
  useLivreurs,
  useMoyensPaiement,
  createCommand,
} from "@/components/CommandeToolkit";

const CommandeContext = createContext();

export const CommandeProvider = ({ children }) => {
  const [actualCommand, setActualCommand] = useState([]);
  const [openSurPlaceDialog, setOpenSurPlaceDialog] = useState(false);
  const [openALivrerDialog, setOpenALivrerDialog] = useState(false);
  const [pointDeVente, setPointDeVente] = useState(null);
  const [paiement, setPaiement] = useState({
    infos: {
      total: 0,
      montant_recu: 0,
      montant_recu_especes: 0,
      montant_recu_momo: 0,
      reliquat_rendu: 0,
      reste_a_devoir: 0,
      prix_livraison: 0,
      dette: 0,
    },
    statut: "non paye", // ou "paye partiellement", "paye"
  });

  // Chargement des données produits et commandes
  const menus = useMenus();
  const boissons = useBoissons();
  const todayCommand = useTodayCommand();
  const livreurs = useLivreurs();
  const adresses = useAdressesLivraison();
  const moyensPaiement = useMoyensPaiement();

  const updatePaiement = ({ infos, statut }) => {
    setPaiement({
      infos,
      statut,
    });
  };

  // Ajouter un produit à la commande
  const ajouterProduit = (produit, quantite) => {
    setActualCommand((prev) => {
      const existing = prev.find((item) => item.id === produit.id);
      if (existing) {
        return prev.map((item) =>
          item.id === produit.id
            ? { ...item, quantite: item.quantite + quantite }
            : item
        );
      } else {
        return [
          ...prev,
          {
            ...produit,
            id: produit.id, // requis pour la suppression/modification
            type: produit.type, // "menu" ou "boisson"
            quantite,
          },
        ];
      }
    });
  };

  // Supprimer un produit
  const supprimerProduit = (id) => {
    setActualCommand((prev) => prev.filter((item) => item.id !== id));
  };

  // Modifier la quantité d’un produit
  const modifierQuantiteProduit = (id, newQuantite) => {
    setActualCommand((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantite: newQuantite } : item
      )
    );
  };

  // Réinitialiser la commande
  const resetCommande = () => {
    setActualCommand([]);
    setPaiement({
      infos: {
        total: 0,
        montant_recu: 0,
        montant_recu_especes: 0,
        montant_recu_momo: 0,
        reliquat_rendu: 0,
        reste_a_devoir: 0,
        prix_livraison: 0,
        dette: 0,
      },
      statut: "non paye",
    });
  };

  return (
    <CommandeContext.Provider
      value={{
        paiement,
        updatePaiement,
        pointDeVente,
        setPointDeVente,
        createCommand,
        openALivrerDialog,
        openSurPlaceDialog,
        setOpenALivrerDialog,
        setOpenSurPlaceDialog,
        livreurs,
        adresses,
        moyensPaiement,
        actualCommand,
        menus,
        boissons,
        todayCommand,
        ajouterProduit,
        supprimerProduit,
        modifierQuantiteProduit,
        resetCommande,
      }}>
      {children}
    </CommandeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useCommande = () => useContext(CommandeContext);
