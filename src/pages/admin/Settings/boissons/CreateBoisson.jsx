import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateBoisson from "./mobile/MobileCreateBoisson";
import DesktopCreateBoisson from "./desktop/DesktopCreateBoisson";
const CreateBoisson = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateBoisson /> : <DesktopCreateBoisson />;
};

export default CreateBoisson;
