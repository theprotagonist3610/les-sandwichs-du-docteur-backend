import useBreakpoint from "@/hooks/useBreakpoint";
import MobileVenteId from "./mobile/MobileVenteId";
import DesktopVenteId from "./desktop/DesktopVenteId";

const VenteId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileVenteId /> : <DesktopVenteId />;
};

export default VenteId;
