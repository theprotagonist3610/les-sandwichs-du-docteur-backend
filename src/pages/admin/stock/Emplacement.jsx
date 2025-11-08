import useBreakpoint from "@/hooks/useBreakpoint";
import MobileEmplacement from "./mobile/MobileEmplacement";
import DesktopEmplacement from "./desktop/DesktopEmplacement";

const Emplacement = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileEmplacement /> : <DesktopEmplacement />;
};

export default Emplacement;
