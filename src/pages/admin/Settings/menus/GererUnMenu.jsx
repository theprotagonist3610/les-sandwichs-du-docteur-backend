import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnMenu from "./mobile/MobileGererUnMenu";
import DesktopGererUnMenu from "./desktop/DesktopGererUnMenu";
const GererUnMenu = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnMenu /> : <DesktopGererUnMenu />;
};

export default GererUnMenu;
