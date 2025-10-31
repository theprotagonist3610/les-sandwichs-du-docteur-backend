/*
lit le menuToolkit, il exporte des fonction pour gerer les ingredients
cree les 2 composants mobile et desktop d'initialisation des ingredient
le champ quantite doit etre un number positif avec valeur 0 par defaut
chaque ingredient est cree en important depuuis ./liste.js
combine le nom et l'emoji de chaque ingredient pour creer la denomination
utilise des cards avec une iconographie riche et une typography lisible utilise framer-motion pour les animations d'entree et de sorties
 */
import useBreakpoint from "@/hooks/useBreakpoint";
import MobileInitialiserIngredients from "./mobile/MobileInitialiserIngredients";
import DesktopInitialiserIngredients from "./desktop/DesktopInitialiserIngredients";

const InitialiserIngredients = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileInitialiserIngredients />
  ) : (
    <DesktopInitialiserIngredients />
  );
};

export default InitialiserIngredients;
