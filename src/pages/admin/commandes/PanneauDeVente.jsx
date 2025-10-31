import useBreakpoint from "@/hooks/useBreakpoint";
import MobilePanneauDeVente from "./mobile/MobilePanneauDeVente";
import DesktopPanneauDeVente from "./desktop/DesktopPanneauDeVente";

const PanneauDeVente = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobilePanneauDeVente /> : <DesktopPanneauDeVente />;
};

export default PanneauDeVente;
