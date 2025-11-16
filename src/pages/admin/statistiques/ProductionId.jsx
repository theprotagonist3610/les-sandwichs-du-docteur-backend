import useBreakpoint from "@/hooks/useBreakpoint";
import MobileProductionId from "./mobile/MobileProductionId";
import DesktopProductionId from "./desktop/DesktopProductionId";

const ProductionId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileProductionId /> : <DesktopProductionId />;
};

export default ProductionId;
