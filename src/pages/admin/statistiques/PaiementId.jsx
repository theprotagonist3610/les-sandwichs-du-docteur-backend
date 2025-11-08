import useBreakpoint from "@/hooks/useBreakpoint";
import MobilePaiementId from "./mobile/MobilePaiementId";
import DesktopPaiementId from "./desktop/DesktopPaiementId";

const PaiementId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobilePaiementId /> : <DesktopPaiementId />;
};

export default PaiementId;
