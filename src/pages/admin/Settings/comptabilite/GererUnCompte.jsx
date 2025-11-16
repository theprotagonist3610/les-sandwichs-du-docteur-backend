import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnCompte from "./mobile/MobileGererUnCompte";
import DesktopGererUnCompte from "./desktop/DesktopGererUnCompte";
const GererUnCompte = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnCompte /> : <DesktopGererUnCompte />;
};

export default GererUnCompte;
/*
1. un store zustand useEditCompte ou chaque champ consomme une variable unique pour eviter les rerendues inutiles
2. utiliser obligatoirement le composant ui/input-group pour l'habillage des champs de formulaire
3. un feedback visuel pendant le submitting 
4. les champs du formulaire sont adaptes au schema de comptes dans comptabiliteToolkit
5. un formulaire spacieux et aere sur desktop
6. lucide react pour une iconographie riche 
7. framer-motion pour les animations d'entree et de sortie
*/
