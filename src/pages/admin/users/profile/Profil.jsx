import useBreakpoint from "@/hooks/useBreakpoint";
import MobileProfil from "./mobile/MobileProfil";
import DesktopProfil from "./desktop/DesktopProfil";

const Profil = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileProfil /> : <DesktopProfil />;
};

export default Profil;
