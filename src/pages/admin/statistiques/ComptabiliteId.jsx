import useBreakpoint from "@/hooks/useBreakpoint";
import MobileComptabiliteId from "./mobile/MobileComptabiliteId";
import DesktopComptabiliteId from "./desktop/DesktopComptabiliteId";

const ComptabiliteId = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileComptabiliteId /> : <DesktopComptabiliteId />;
};

export default ComptabiliteId;
