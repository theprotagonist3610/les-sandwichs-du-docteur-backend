import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateIngredient from "./mobile/MobileCreateIngredient";
import DesktopCreateIngredient from "./desktop/DesktopCreateIngredient";
const CreateIngredient = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateIngredient /> : <DesktopCreateIngredient />;
};

export default CreateIngredient;
