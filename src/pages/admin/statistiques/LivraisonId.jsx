import useBreakpoint from "@/hooks/useBreakpoint";
import MobileLivraisonId from "./mobile/MobileLivraisonId";
import DesktopLivraisonId from "./desktop/DesktopLivraisonId";

const LivraisonId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileLivraisonId /> : <DesktopLivraisonId />;
};

export default LivraisonId;
