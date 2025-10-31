import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesEmplacements from "./mobile/MobileGererLesEmplacements";
import DesktopGererLesEmplacements from "./desktop/DesktopGererLesEmplacements";
const GererLesEmplacements = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileGererLesEmplacements />
  ) : (
    <DesktopGererLesEmplacements />
  );
};

export default GererLesEmplacements;
/*
- version mobile
 * une disposition verticale et bien spacieuse, chaque emplacement est represente par une card riche

- version desktop
 * meme exigences que sur mobile mais avec une disposition grid plus spacieuse
- specificite
 * lucide react pour une iconographie riche
 * framer motion pour animation d'entree et de sortie
 * naviguer vers "admin/settings/emplacements/gerer/:id"
*/
