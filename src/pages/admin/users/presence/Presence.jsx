import useBreakpoint from "@/hooks/useBreakpoint";
import MobilePresence from "./mobile/MobilePresence";
import DesktopPresence from "./desktop/DesktopPresence";

const Presence = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobilePresence /> : <DesktopPresence />;
};

export default Presence;
