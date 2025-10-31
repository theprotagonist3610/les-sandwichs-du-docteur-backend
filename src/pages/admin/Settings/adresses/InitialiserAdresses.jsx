import useBreakpoint from "@/hooks/useBreakpoint";
import MobileInitialiserAdresses from "./mobile/MobileInitialiserAdresses";
import DesktopInitialiserAdresses from "./desktop/DesktopInitialiserAdresses";

const InitialiserAdresses = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileInitialiserAdresses />
  ) : (
    <DesktopInitialiserAdresses />
  );
};

export default InitialiserAdresses;
/*
 - version mobile
  * bouton "Initialiser tout"
  * card pour chacun des 12 departements comme dans le toolkit
  * chaque card [titre :nom du departement, Communes : nbre de communes, arrondissements : nbre d'arrondissement, quartier : nbre de quartiers] et boutons initialiser
  * disposition verticale  
 - version desktop
 meme chose que la version mobile dans une grid plus large

 specificite 
  * framer-motion pour les animations d'entree et de sortie
  * lucide react pour une iconographie riche 
 */
