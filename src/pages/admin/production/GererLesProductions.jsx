import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesProductions from "./mobile/MobileGererLesProductions";
import DesktopGererLesProductions from "./desktop/DesktopGererLesProductions";

const GererLesProductions = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileGererLesProductions />
  ) : (
    <DesktopGererLesProductions />
  );
};

export default GererLesProductions;
/*
 - mobile
  1. une disposition verticale 
  2. 3 tabs [Recettes | Productions en attente | Productions terminees]
   2.1. concernant la tab des recettes, chaque recette est representee par une card semantiquement riche (en tete, details de la recette et pour finir produit fini), il faut un bouton "Programmer" sur chaque card qui ouvre un dialog pour renseigner la quantite de l'ingredient principal
   2.2. concernant la tab des productions en attente, les production programmees sont affichees
   2.3. concernant la tab des productions terminees, on liste les productions terminees

 - desktop
  on fait la meme disposition que sur mobile en 3 tabs, les tabs sont organisees en grid de 3 colonnes 
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
   3. lit bien productionToolkit pour implementer les fonctionnalites
*/
