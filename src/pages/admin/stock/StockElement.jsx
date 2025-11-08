import useBreakpoint from "@/hooks/useBreakpoint";
import MobileStockElement from "./mobile/MobileStockElement";
import DesktopStockElement from "./desktop/DesktopStockElement";

const StockElement = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileStockElement /> : <DesktopStockElement />;
};

export default StockElement;
