import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateMenuCompose from "./mobile/MobileCreateMenuCompose";
import DesktopCreateMenuCompose from "./desktop/DesktopCreateMenuCompose";

const CreateMenuCompose = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateMenuCompose /> : <DesktopCreateMenuCompose />;
};

export default CreateMenuCompose;
