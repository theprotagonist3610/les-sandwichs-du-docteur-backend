import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUneVente from "./mobile/MobileGererUneVente";
import DesktopGererUneVente from "./desktop/DesktopGererUneVente";

const GererUneVente = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUneVente /> : <DesktopGererUneVente />;
};

export default GererUneVente;
