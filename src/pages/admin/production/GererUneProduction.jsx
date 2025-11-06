import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUneProduction from "./mobile/MobileGererUneProduction";
import DesktopGererUneProduction from "./desktop/DesktopGererUneProduction";

const GererUneProduction = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUneProduction /> : <DesktopGererUneProduction />;
};

export default GererUneProduction;
/*
 - mobile
  1. 2 tabs [Stats du jour | Commandes du jour]
  2. concernant la tabs Stats du jour, 3 cards alignees verticalement 
   2.1. card 1 (Ventes) affiche un tableau de 3 colonnes (Articles | quantite | tendance). ce tableau liste les articles vendus today en temps reel avec les tendances comparees a la veille
   2.2. card 2 (Emplacements) affiche les emplacements actifs et ouverts avec les quotas vendus et les classe en fonction du quotas (Emplacements | quantite | position)
   2.3. card 3 (Encaissements) affiche les encaissements de today classe par (Especes | Momo)
  3. concernant la tabs commandes du jour, les commandes du jour sont listees du plus recent au plus ancien  (commande (code) | details | statut)
 
 - desktop
  on fait la meme disposition que sur mobile, mais une version plus spacieuse
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
   3. les nouvelles commandes et statistiques doivent etre detectees via rtdb a temps et l'interface doit etre mise a jour automatiquement pour un suivi optimal
   4. lit bien commandeToolkit pour implementer les fonctionnalites
*/
