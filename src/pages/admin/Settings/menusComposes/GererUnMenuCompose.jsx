import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnMenuCompose from "./mobile/MobileGererUnMenuCompose";
import DesktopGererUnMenuCompose from "./desktop/DesktopGererUnMenuCompose";

const GererUnMenuCompose = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnMenuCompose /> : <DesktopGererUnMenuCompose />;
};

export default GererUnMenuCompose;
