import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesComptes from "./mobile/MobileGererLesComptes";
import DesktopGererLesComptes from "./desktop/DesktopGererLesComptes";
const GererLesComptes = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLesComptes /> : <DesktopGererLesComptes />;
};

export default GererLesComptes;
/*
1. un composant filtre pour filtrer les comptes (code, denomination, type)
1.1. chaque compte est represente par une card riche et spacieuse, cliquer navigue vers "admin/settings/comptabilite/gerer/id" 
2. lucide react pour une iconographie riche 
3. framer-motion pour les animations d'entree et de sortie
*/
