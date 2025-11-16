import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesMenus from "./mobile/MobileGererLesMenus";
import DesktopGererLesMenus from "./desktop/DesktopGererLesMenus";
const GererLesMenus = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLesMenus /> : <DesktopGererLesMenus />;
};

export default GererLesMenus;
