import useBreakpoint from "@/hooks/useBreakpoint";
import MobileOperationDeStock from "./mobile/MobileOperationDeStock";
import DesktopOperationDeStock from "./desktop/DesktopOperationDeStock";

const OperationDeStock = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileOperationDeStock /> : <DesktopOperationDeStock />;
};

export default OperationDeStock;
