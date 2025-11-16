import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnStock from "./mobile/MobileGererUnStock";
import DesktopGererUnStock from "./desktop/DesktopGererUnStock";
const GererUnStock = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnStock /> : <DesktopGererUnStock />;
};

export default GererUnStock;
/*
- version mobile
  * analyse le admin/stockToolkit.jsx + admin/emplacementToolkit.jsx
  * recupere l'id de l'emplacement avec useParams
  * charge l'emplacement : details, stock_actuel, historique de ventes (a mettre en place plus tard)
  * 3 tabs Details | Stock actuel | Historique des ventes
  * dans la tab Details, chaque champ de details est represente par un inputgroup editable pour modifier le champ correspondant
  * dans la tab historique, un array qui donne l'historique de vente 
  * tu utiliseras 1 store zustand (useEditEmplaceemnt pour modifier les details lies a l'emplacement, ) 

- version desktop
  les memes fonctionnalites sur mobile mais l'affichage de details se fera dans une grid spacieuse, l'affichage de l'historique se fera dans un tableau spacieux avec un composant de filtre 

- specificites
  * lucide react pour une iconographie riche
  * framer-motion pour les animations d'entree et de sortie
  * lit et comprend tres bien le fonctionnement de ui/input-group et utilise pour tous les champs editables
*/
