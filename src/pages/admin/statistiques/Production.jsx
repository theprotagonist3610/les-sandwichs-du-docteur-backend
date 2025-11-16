import useBreakpoint from "@/hooks/useBreakpoint";
import MobileProduction from "./mobile/MobileProduction";
import DesktopProduction from "./desktop/DesktopProduction";

const Production = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileProduction /> : <DesktopProduction />;
};

export default Production;
