import useBreakpoint from "@/hooks/useBreakpoint";
import MobilePaiement from "./mobile/MobilePaiement";
import DesktopPaiement from "./desktop/DesktopPaiement";

const Paiement = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobilePaiement /> : <DesktopPaiement />;
};

export default Paiement;
