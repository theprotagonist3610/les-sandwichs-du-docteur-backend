import useBreakpoint from "@/hooks/useBreakpoint";
import MobileHistoriqueCompte from "./mobile/MobileHistoriqueCompte";
import DesktopHistoriqueCompte from "./desktop/DesktopHistoriqueCompte";

const HistoriqueCompte = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileHistoriqueCompte /> : <DesktopHistoriqueCompte />;
};

export default HistoriqueCompte;
