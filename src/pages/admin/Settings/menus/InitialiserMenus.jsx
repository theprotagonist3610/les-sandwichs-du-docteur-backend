import useBreakpoint from "@/hooks/useBreakpoint";
import MobileInitialiserMenus from "./mobile/MobileInitialiserMenus";
import DesktopInitialiserMenus from "./desktop/DesktopInitialiserMenus";
const InitialiserMenus = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileInitialiserMenus /> : <DesktopInitialiserMenus />;
};

export default InitialiserMenus;
