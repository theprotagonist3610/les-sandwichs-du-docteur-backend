import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesUsers from "./mobile/MobileGererLesUsers";
import DesktopGererLesUsers from "./desktop/DesktopGererLesUsers";
const CreateUser = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererLesUsers /> : <DesktopGererLesUsers />;
};

export default CreateUser;
