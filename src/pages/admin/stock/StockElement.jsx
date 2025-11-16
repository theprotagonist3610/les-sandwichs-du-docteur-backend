/**
 * StockElement.jsx
 * Wrapper responsive pour le détail d'un élément de stock
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopStockElement from "./desktop/DesktopStockElement";
import MobileStockElement from "./mobile/MobileStockElement";

const StockElement = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileStockElement /> : <DesktopStockElement />;
};

export default StockElement;
