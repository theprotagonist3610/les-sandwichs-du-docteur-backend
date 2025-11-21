import useBreakpoint from "@/hooks/useBreakpoint";
import MobileUpdateTodo from "./mobile/MobileUpdateTodo";
import DesktopUpdateTodo from "./desktop/DesktopUpdateTodo";

const UpdateTodo = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileUpdateTodo /> : <DesktopUpdateTodo />;
};

export default UpdateTodo;
/*
- store zustand useEditTodo, chaque champ consomme un et seul variable pour eviter les rerendues inutiles 
- un entete [Marquer comme termine] avec un bouton 
- lit et comprend le fonctionnement de components/ui/input-group pour la mise en forme et l'edition de chaque champ
- formulaire spacieux sur desktop et strictement vertical sur mobile 
- sonner pour toast de confirmation apres confirmation
 */
