import useBreakpoint from "@/hooks/useBreakpoint";
import MobileInitialiserComptes from "./mobile/MobileInitialiserComptes";
import DesktopInitialiserComptes from "./desktop/DesktopInitialiserComptes";
const InitialiserComptes = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileInitialiserComptes /> : <DesktopInitialiserComptes />;
};

export default InitialiserComptes;
/*
1. liste les comptes disponibles a initialiser sous forme de cards descriptive
2. un bouton en haut initialiser tous les comptes
3. utiliser la fonctioin de creation batch pour initialiser tout en une operation
4. disposition verticale sur mobile et en grid sur desktop 
5. framer motion pour les animation d'entree et sortie
6. lucide react pour une iconographie riche 
7. un feedback visuel pendant l'initialisation
*/
