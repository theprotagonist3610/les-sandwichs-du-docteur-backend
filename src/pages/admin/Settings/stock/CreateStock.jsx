import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateStock from "./mobile/MobileCreateStock";
import DesktopCreateStock from "./desktop/DesktopCreateStock";
const CreateStock = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateStock /> : <DesktopCreateStock />;
};

export default CreateStock;
