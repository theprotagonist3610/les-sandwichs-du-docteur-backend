import useBreakpoint from "@/hooks/useBreakpoint";
import MobileComptes from "./mobile/MobileComptes";
import DesktopComptes from "./desktop/DesktopComptes";

const Comptes = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileComptes /> : <DesktopComptes />;
};

export default Comptes;
