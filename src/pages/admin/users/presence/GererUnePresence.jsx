import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnePresence from "./mobile/MobileGererUnePresence";
import DesktopGererUnePresence from "./desktop/DesktopGererUnePresence";

const GererUnePresence = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnePresence /> : <DesktopGererUnePresence />;
};

export default GererUnePresence;
