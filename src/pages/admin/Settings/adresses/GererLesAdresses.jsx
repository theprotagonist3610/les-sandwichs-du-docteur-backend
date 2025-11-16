import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesAdresses from "./mobile/MobileGererLesAdresses";
import DesktopGererLesAdresses from "./desktop/DesktopGererLesAdresses";
const GererLesAdresses = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLesAdresses /> : <DesktopGererLesAdresses />;
};

export default GererLesAdresses;
/*
- mobile
 * une disposition en 2 onglets "Gerer | Adresses"
 * dans l'onglets gerer, on a 4 cards dans une dispostion verticales
  - Card departements liste tous les departements avec un bouton activer/desactiver
  - Card communes liste tous les communes avec un bouton activer/desactiver
  - Card arrondissements liste tous les arrondissements avec un bouton activer/desactiver
  - Card quartiers liste tous les quartiers avec un bouton activer/desactiver
 * dans l'onglets adresses
  - un composant filtre en haut qui permet un filtrage a plusieurs niveaux departement -> commune -> arrondissements -> quartier
  - chaque adresse est representee par un element de liste riche en icone et en typography claire et lisible
  - chaque adresse est cliquable et navigue vers ""

- desktop
 * une disposition en 2 onglets comme sur mobile 
 * onglets gerer comme sur mobile, les cards sont dans une grid 2x2 scrollables
 * une disposition spacieuse dans une grid pour l'onglets adresses avec comptes (actifs/total)
 * une sidebar (utiliser le composant sheet de shadcn-ui) qui comporte le composant du filtre qui sera toogle via un bouton filtrer bien mis en evidence
 * chaque adresse est representee par une card

- specificite
 * framer-motion pour des animation d'entree sorties fluides et riches
 * lucide - react pour une iconographie riche
*/
