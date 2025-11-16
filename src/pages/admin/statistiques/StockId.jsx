import useBreakpoint from "@/hooks/useBreakpoint";
import MobileStockId from "./mobile/MobileStockId";
import DesktopStockId from "./desktop/DesktopStockId";

const StockId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileStockId /> : <DesktopStockId />;
};

export default StockId;
