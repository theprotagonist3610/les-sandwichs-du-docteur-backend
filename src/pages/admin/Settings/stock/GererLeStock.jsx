import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLeStock from "./mobile/MobileGererLeStock";
import DesktopGererLeStock from "./desktop/DesktopGererLeStock";
const GererLeStock = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLeStock /> : <DesktopGererLeStock />;
};

export default GererLeStock;
/*
- version mobile
  * un composant de filtre pour filtrer le stock selon le nom, le type, le seuil_d'alerte, la volatilite
  * un composant d'affichage qui liste les elements par ordre alphabetique
  * chaque element est mis dans une liste avec un typography et une iconographie bien lisible, on doit voir le type, le nom, la quantite actuelle
  * les elements desactives egalement sont visibles
  * les elements sont cliquables et naviguent vers "admin/settings/stock/gerer/:id"
- version desktop
  les memes fonctionnalites sur mobile mais l'affichage se fera dans une grid spacieuse
  les elements seront representes par des cards cliquables et navigue vers "admin/settings/stock/gerer/:id"
- specificites
  * lucide react pour une iconographie riche
  * framer-motion pour les animations d'entree et de sortie
*/
