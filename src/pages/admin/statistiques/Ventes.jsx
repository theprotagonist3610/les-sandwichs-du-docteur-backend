import useBreakpoint from "@/hooks/useBreakpoint";
import MobileVentes from "./mobile/MobileVentes";
import DesktopVentes from "./desktop/DesktopVentes";

const Ventes = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileVentes /> : <DesktopVentes />;
};

export default Ventes;
