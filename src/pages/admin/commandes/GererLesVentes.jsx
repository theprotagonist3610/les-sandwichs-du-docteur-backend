import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesVentes from "./mobile/MobileGererLesVentes";
import DesktopGererLesVentes from "./desktop/DesktopGererLesVentes";

const GererLesVentes = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLesVentes /> : <DesktopGererLesVentes />;
};

export default GererLesVentes;
/*
 - mobile
  1. un composant filtre sticky qui permet de filtrer les commandes (createdBy | periode | articles | emplacement | type de commande | intervalle de prix | moyen de paiement | statut)
  2. les commandes filtrees sont representees sous formes de cards comme dans le dashboard. chaque card est cliquable et navigue vers "admin/commandes/ventes/:id" 
  3. les commandes sont tjrs filtrees du plus recent au plus ancien
 
 - desktop
  le composant est une grid de 3 colonnes, la premiere card contient le composant de filtre
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
*/
