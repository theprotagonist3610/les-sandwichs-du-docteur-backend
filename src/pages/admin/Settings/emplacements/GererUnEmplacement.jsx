import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnEmplacement from "./mobile/MobileGererUnEmplacement";
import DesktopGererUnEmplacement from "./desktop/DesktopGererUnEmplacement";
const GererUnEmplacement = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnEmplacement /> : <DesktopGererUnEmplacement />;
};

export default GererUnEmplacement;
/*
- version mobile
  * analyse le admin/stockToolkit.jsx
  * recupere l'id du stock avec useParams
  * charge l'element de stock : details, stock_actuel, historique sur une semaine par defaut
  * 2 tabs Details | Historique
  * dans la tab Details, chaque champ de details est represente par un inputgroup editable pour modifier le champ correspondant
  * un composant sous forme de Card en  haut pour ajouter des transactions/transfert de stock (analyse le fonctionnement des transactions de stock pour comprendre les champs obligatoires)
  * dans la tab historique, un array qui donne l'historique des transaction et transfert de stock : code-couleur rouge pour une transaction de sortie, vert pour une entree et bleu pour un transfert
  * tu utiliseras 3 stores zustand (useTransactioStock pour gerer les transactions de stock, useEditStockElement pour modifier les details d'un element precis, useEditTransaction stock pour modifier les transactions dans l'historique )
  * la modification des transaction se fera via un dialog

- version desktop
  les memes fonctionnalites sur mobile mais l'affichage de details se fera dans une grid spacieuse, l'affichage de l'historique se fera dans un tableau spacieux avec un composant de filtre qui sera egalement sur mobile (entree, sortie, transfert, periode )
  les transactions seront cliquables pour trigger un dialog afin de les modifier

- specificites
  * lucide react pour une iconographie riche
  * framer-motion pour les animations d'entree et de sortie
  * lit et comprend tres bien le fonctionnement de ui/input-group et utilise pour tous les champs editables
*/
