import useBreakpoint from "@/hooks/useBreakpoint";
import MobileProfiles from "./mobile/MobileProfiles";
import DesktopProfiles from "./desktop/DesktopProfiles";

const Profiles = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileProfiles /> : <DesktopProfiles />;
};

export default Profiles;
