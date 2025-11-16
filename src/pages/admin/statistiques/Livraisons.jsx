import useBreakpoint from "@/hooks/useBreakpoint";
import MobileLivraisons from "./mobile/MobileLivraisons";
import DesktopLivraisons from "./desktop/DesktopLivraisons";

const Livraisons = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileLivraisons /> : <DesktopLivraisons />;
};

export default Livraisons;
