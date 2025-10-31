import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUneAdresse from "./mobile/MobileGererUneAdresse";
import DesktopGererUneAdresse from "./desktop/DesktopGererUneAdresse";
const GererUneAdresse = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUneAdresse /> : <DesktopGererUneAdresse />;
};

export default GererUneAdresse;
