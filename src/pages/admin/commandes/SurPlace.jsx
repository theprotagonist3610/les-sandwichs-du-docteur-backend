import useBreakpoint from "@/hooks/useBreakpoint";
import MobileSurPlace from "./mobile/MobileSurPlace";
import DesktopSurPlace from "./desktop/DesktopSurPlace";

const SurPlace = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileSurPlace /> : <DesktopSurPlace />;
};

export default SurPlace;
/*
 - role
 surplace est une page qui permet d'enregistrer les donnees complementaires 
 pour valider une commande a servir sur place
 c'est a dire qu'il se sert du meme store zustand que panneaudevente pour charger tous les champs d'une commande 
 en fonction du schema d'une commande ou le type est sur place 
 les details de la commande sont deja charges
  les champs suivant seulement sont editables (paiement,client,incident et commentaire)
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
   3. seuls les menus et boissons actifs sont affichees
*/
