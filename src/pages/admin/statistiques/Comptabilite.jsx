import useBreakpoint from "@/hooks/useBreakpoint";
import MobileComptabilite from "./mobile/MobileComptabilite";
import DesktopComptabilite from "./desktop/DesktopComptabilite";

const Comptabilite = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileComptabilite /> : <DesktopComptabilite />;
};

export default Comptabilite;
