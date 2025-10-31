import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUnProfil from "./mobile/MobileGererUnProfil";
import DesktopGererUnProfil from "./desktop/DesktopGererUnProfil";

const GererUnProfil = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUnProfil /> : <DesktopGererUnProfil />;
};

export default GererUnProfil;
