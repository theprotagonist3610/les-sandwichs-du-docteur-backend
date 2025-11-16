import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnIngredient from "./mobile/MobileGererUnIngredient";
import DesktopGererUnIngredient from "./desktop/DesktopGererUnIngredient";
const GererUnIngredient = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnIngredient /> : <DesktopGererUnIngredient />;
};

export default GererUnIngredient;
