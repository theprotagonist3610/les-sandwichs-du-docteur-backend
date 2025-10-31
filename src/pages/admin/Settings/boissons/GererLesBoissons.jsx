import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesBoissons from "./mobile/MobileGererLesBoissons";
import DesktopGererLesBoissons from "./desktop/DesktopGererLesBoissons";
const GererLesBoissons = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLesBoissons /> : <DesktopGererLesBoissons />;
};

export default GererLesBoissons;
