import useBreakpoint from "@/hooks/useBreakpoint";
import MobileInitialiserBoissons from "./mobile/MobileInitialiserBoissons";
import DesktopInitialiserBoissons from "./desktop/DesktopInitialiserBoissons";

const InitialiserBoissons = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileInitialiserBoissons /> : <DesktopInitialiserBoissons />;
};

export default InitialiserBoissons;
