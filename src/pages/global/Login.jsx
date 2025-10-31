import { useBreakpoint } from "@/hooks/useBreakpoint";
import MobileLogin from "./login/MobileLogin";
import DesktopLogin from "./login/DesktopLogin";

const Login = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileLogin /> : <DesktopLogin />;
};

export default Login;