import useBreakpoint from "@/hooks/useBreakpoint";
import MobileInitialiserStock from "./mobile/MobileInitialiserStock";
import DesktopInitialiserStock from "./desktop/DesktopInitialiserStock";
const InitialiserStock = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileInitialiserStock /> : <DesktopInitialiserStock />;
};

export default InitialiserStock;
