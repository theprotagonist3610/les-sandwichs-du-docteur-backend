import useBreakpoint from "@/hooks/useBreakpoint";
import MobileVendeurId from "./mobile/MobileVendeurId";
import DesktopVendeurId from "./desktop/DesktopVendeurId";

const VendeurId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileVendeurId /> : <DesktopVendeurId />;
};

export default VendeurId;
