/**
 * OperationDeStock.jsx
 * Wrapper responsive pour les opérations de stock
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopOperationDeStock from "./desktop/DesktopOperationDeStock";
import MobileOperationDeStock from "./mobile/MobileOperationDeStock";

const OperationDeStock = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileOperationDeStock /> : <DesktopOperationDeStock />;
};

export default OperationDeStock;
