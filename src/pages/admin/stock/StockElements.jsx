import useBreakpoint from "@/hooks/useBreakpoint";
import MobileStockElements from "./mobile/MobileStockElements";
import DesktopStockElements from "./desktop/DesktopStockElements";

const StockElements = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileStockElements /> : <DesktopStockElements />;
};

export default StockElements;
