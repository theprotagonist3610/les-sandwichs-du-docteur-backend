import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUneBoisson from "./mobile/MobileGererUneBoisson";
import DesktopGererUneBoisson from "./desktop/DesktopGererUneBoisson";
const GererUneBoisson = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUneBoisson /> : <DesktopGererUneBoisson />;
};

export default GererUneBoisson;
