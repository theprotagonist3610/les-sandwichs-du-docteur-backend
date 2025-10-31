import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUneProduction from "./mobile/MobileGererUneProduction";
import DesktopGererUneProduction from "./desktop/DesktopGererUneProduction";
const GererUneProduction = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUneProduction /> : <DesktopGererUneProduction />;
};

export default GererUneProduction;
