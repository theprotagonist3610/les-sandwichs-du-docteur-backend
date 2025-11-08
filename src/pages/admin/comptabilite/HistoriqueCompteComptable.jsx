import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopHistoriqueCompteComptable from "./desktop/DesktopHistoriqueCompteComptable";
import MobileHistoriqueCompteComptable from "./mobile/MobileHistoriqueCompteComptable";

const HistoriqueCompteComptable = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileHistoriqueCompteComptable /> : <DesktopHistoriqueCompteComptable />;
};

export default HistoriqueCompteComptable;
