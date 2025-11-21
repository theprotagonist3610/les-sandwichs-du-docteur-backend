import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopHistoriqueCompteComptable from "./desktop/DesktopHistoriqueCompteComptable";
import MobileHistoriqueCompteComptable from "./mobile/MobileHistoriqueCompteComptable";

const HistoriqueCompteComptable = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileHistoriqueCompteComptable /> : <DesktopHistoriqueCompteComptable />;
};

export default HistoriqueCompteComptable;
