import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateProduction from "./mobile/MobileCreateProduction";
import DesktopCreateProduction from "./desktop/DesktopCreateProduction";

const CreateProduction = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateProduction /> : <DesktopCreateProduction />;
};

export default CreateProduction;
/*
 - mobile
  1. une disposition verticale 
  2. un store zustand useCreateProduction ou chaque champ du production schema lit une seule variable du store pour eviter les rerenders inutiles
  3. il faut une card Ingredient principal (denomination, quantite), recuperer les ingredients du stock pour les mettre dans un select
  4. il faut une card Recette ou on selectionne les ingredient secondaire (quantite)
  5. il faut une card Produit Fini ou resultat de production, les elements du stock qui ne sont pas ingredients sont recuperes et mis dans un select
  6. le status de production est automatiquement initialisee a programmee

 - desktop
  on fait la meme disposition en 3 colonnes [Ingredient principal | Recette | Resultat]
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
   3. les nouvelles production et statistiques doivent etre detectees via rtdb a temps et l'interface doit etre mise a jour automatiquement pour un suivi optimal
   4. lit bien productionToolkit pour implementer les fonctionnalites
*/
