import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateTodo from "./mobile/MobileCreateTodo";
import DesktopCreateTodo from "./desktop/DesktopCreateTodo";

const CreateTodo = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateTodo /> : <DesktopCreateTodo />;
};

export default CreateTodo;
/*
- store zustand useCreateTodo, chaque champ consomme un et seul variable pour eviter les rerendues inutiles 
- lit et comprend le fonctionnement de components/ui/input-group pour la mise en forme et l'edition de chaque champ
- formulaire spacieux sur desktop et strictement vertical sur mobile 
- sonner pour toast de confirmation apres confirmation
- 
 */
