import useBreakpoint from "@/hooks/useBreakpoint";
import MobilePanneauDeVente from "./mobile/MobilePanneauDeVente";
import DesktopPanneauDeVente from "./desktop/DesktopPanneauDeVente";

const PanneauDeVente = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobilePanneauDeVente /> : <DesktopPanneauDeVente />;
};

export default PanneauDeVente;
/*
 - version mobile
  1. une disposition verticale 
  2. un premier composant tout en haut "PointDeVente" qui sert a afficher le point de vente actuel, en cliquant un dialog s'ouvre et liste les points de vente active afin d'en selectionner un (recuperer le hook des emplacement dans emplacementToolkit)
  3. un deuxieme composant DetailsCommande qui est un rectangle blanc/sombre (fonction du theme) scrollable dans lequel les details de la commande actuelle sont liste (quantite x denomination : total) comme une liste a puce un peu stylise. Tout en dessous et a droite un h2 qui affiche le total de la commande
  4. un troisieme composant SubmitCommande qui est un ensemble de 3 boutons [Annuler | Sur Place | A Livrer] permettant de submit la commande actuelle
  5. un quatrieme composant CommandeTabs qui est un composant divise en 2 tabs [Menu | Boissons]. Dans chaque tabs des mini cards en flex vertical [denomination, prix]. En cliquant sur une card, un dialog pave numerique est ouvert et le focus est pris automatiquement, le pave auto est bloque et la quantite peut etre saisie
  6. un store zustand qui correspond rigoureusement aux schemas d'une commande (lire commandeToolkit), chacun des champs et ou composant precedent consomme une variable pour limiter les rerenders inutiles
 
  - version desktop
   meme exigences que sur mobile mais une disposition en 2 fenetres cote a cote  [Point de vente + CommandeDetails (dans un flex vertical)| CommandTabs]
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
   3. seuls les menus et boissons actifs sont affichees
*/
