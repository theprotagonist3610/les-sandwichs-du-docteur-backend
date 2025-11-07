import useBreakpoint from "@/hooks/useBreakpoint";
import MobileHistoriqueCompteTresorerie from "./mobile/MobileHistoriqueCompteTresorerie";
import DesktopHistoriqueCompteTresorerie from "./desktop/DesktopHistoriqueCompteTresorerie";

const HistoriqueCompteTresorerie = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileHistoriqueCompteTresorerie />
  ) : (
    <DesktopHistoriqueCompteTresorerie />
  );
};

export default HistoriqueCompteTresorerie;
