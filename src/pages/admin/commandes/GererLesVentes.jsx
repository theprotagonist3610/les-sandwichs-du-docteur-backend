import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesVentes from "./mobile/MobileGererLesVentes";
import DesktopGererLesVentes from "./desktop/DesktopGererLesVentes";

const GererLesVentes = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLesVentes /> : <DesktopGererLesVentes />;
};

export default GererLesVentes;
