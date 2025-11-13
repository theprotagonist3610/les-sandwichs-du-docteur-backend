import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopComptabiliteDashboard from "./desktop/DesktopComptabiliteDashboard";
import MobileComptabiliteDashboard from "./mobile/MobileComptabiliteDashboard";

const ComptabiliteDashboard = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileComptabiliteDashboard /> : <DesktopComptabiliteDashboard />;
};

export default ComptabiliteDashboard;
