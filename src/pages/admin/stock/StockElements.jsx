/**
 * StockElements.jsx
 * Wrapper responsive pour la liste des éléments de stock
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopStockElements from "./desktop/DesktopStockElements";
import MobileStockElements from "./mobile/MobileStockElements";

const StockElements = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileStockElements /> : <DesktopStockElements />;
};

export default StockElements;
