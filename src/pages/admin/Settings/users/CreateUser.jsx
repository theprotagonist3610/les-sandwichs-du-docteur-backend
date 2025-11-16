import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateUser from "./mobile/MobileCreateUser";
import DesktopCreateUser from "./desktop/DesktopCreateUser";
const CreateUser = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateUser /> : <DesktopCreateUser />;
};

export default CreateUser;
