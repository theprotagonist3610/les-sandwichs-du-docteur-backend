import useBreakpoint from "@/hooks/useBreakpoint";
import MobileVendeurs from "./mobile/MobileVendeurs";
import DesktopVendeurs from "./desktop/DesktopVendeurs";

const Vendeurs = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileVendeurs /> : <DesktopVendeurs />;
};

export default Vendeurs;
