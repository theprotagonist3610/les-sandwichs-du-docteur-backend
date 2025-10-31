import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateMenu from "./mobile/MobileCreateMenu";
import DesktopCreateMenu from "./desktop/DesktopCreateMenu";
const CreateMenu = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateMenu /> : <DesktopCreateMenu />;
};

export default CreateMenu;
