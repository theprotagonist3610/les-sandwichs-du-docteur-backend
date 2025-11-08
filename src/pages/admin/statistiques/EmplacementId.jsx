import useBreakpoint from "@/hooks/useBreakpoint";
import MobileEmplacementId from "./mobile/MobileEmplacementId";
import DesktopEmplacementId from "./desktop/DesktopEmplacementId";

const EmplacementId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileEmplacementId /> : <DesktopEmplacementId />;
};

export default EmplacementId;
