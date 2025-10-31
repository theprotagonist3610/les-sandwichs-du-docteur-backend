import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateEmplacement from "./mobile/MobileCreateEmplacement";
import DesktopCreateEmplacement from "./desktop/DesktopCreateEmplacement";
const CreateEmplacement = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateEmplacement /> : <DesktopCreateEmplacement />;
};

export default CreateEmplacement;
/*
- version mobile
 * un store zustand pour le formulaire de creation, chaque champ doit consommer une et une seule variable pour eviter les rerendues inutiles
 * une disposition verticale et bien spacieuse
 * le composant ui/input-group sera utilise pour representer chaque champ du formulaire
 * utiliser smallloader pour le feedback d'enregistrement
- version desktop
 * meme exigences que sur mobile mais avec un formulaire plus spacieux 
- specificite
 * lucide react pour une iconographie riche
 * framer motion pour animation d'entree et de sortie
 * naviguer vers "admin/settings/emplacements/gerer/" si succes
*/
