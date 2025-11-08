import useBreakpoint from "@/hooks/useBreakpoint";
import MobileEmplacements from "./mobile/MobileEmplacements";
import DesktopEmplacements from "./desktop/DesktopEmplacements";

const Emplacements = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileEmplacements /> : <DesktopEmplacements />;
};

export default Emplacements;
