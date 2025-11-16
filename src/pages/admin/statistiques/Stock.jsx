import useBreakpoint from "@/hooks/useBreakpoint";
import MobileStock from "./mobile/MobileStock";
import DesktopStock from "./desktop/DesktopStock";

const Stock = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileStock /> : <DesktopStock />;
};

export default Stock;
