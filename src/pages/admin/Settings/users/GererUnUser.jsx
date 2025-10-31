import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnUser from "./mobile/MobileGererUnUser";
import DesktopGererUnUser from "./desktop/DesktopGererUnUser";
const GererUnUser = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnUser /> : <DesktopGererUnUser />;
};

export default GererUnUser;
