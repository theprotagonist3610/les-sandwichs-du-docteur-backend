import useBreakpoint from "@/hooks/useBreakpoint";
import MobileALivrer from "./mobile/MobileALivrer";
import DesktopALivrer from "./desktop/DesktopALivrer";

const ALivrer = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileALivrer /> : <DesktopALivrer />;
};

export default ALivrer;
/*
 - role
 alivrer est une page qui permet d'enregistrer les donnees complementaires 
 pour valider une commande a livrer
 c'est a dire qu'il se sert du meme store zustand que panneaudevente pour charger tous les champs d'une commande 
 en fonction du schema d'une commande ou le type est a livrer
 les details de la commande sont deja charges
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
   3. seuls les menus et boissons actifs sont affichees
*/
