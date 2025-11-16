import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateProduction from "./mobile/MobileCreateProduction";
import DesktopCreateProduction from "./desktop/DesktopCreateProduction";
const CreateProduction = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateProduction /> : <DesktopCreateProduction />;
};

export default CreateProduction;
/*
1. un store zustand useCreateProduction ou chaque champ consomme une variable unique pour eviter les rerendues inutiles
2. utiliser obligatoirement le composant ui/input-group pour l'habillage des champs de formulaire
3. un feedback visuel pendant le submitting 
4. les champs du formulaire sont adaptes au schema de recette dans productionToolkit, 
5. un formulaire spacieux et aere sur desktop
6. lucide react pour une iconographie riche 
7. framer-motion pour les animations d'entree et de sortie
8. les champs des ingredients doit recuperer le stock et filtrer les ingredients et en faire un select
9. le champ de resultat doit filtrer le stock et recuperer les menus/boissons et en faire un select
 (lire stockToolkit pour mieux comprendre)
*/
