import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesIngredients from "./mobile/MobileGererLesIngredients";
import DesktopGererLesIngredients from "./desktop/DesktopGererLesIngredients";
const GererLesIngredients = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileGererLesIngredients />
  ) : (
    <DesktopGererLesIngredients />
  );
};

export default GererLesIngredients;
