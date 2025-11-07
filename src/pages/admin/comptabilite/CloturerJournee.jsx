import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCloturerJournee from "./mobile/MobileCloturerJournee";
import DesktopCloturerJournee from "./desktop/DesktopCloturerJournee";

const CloturerJournee = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCloturerJournee /> : <DesktopCloturerJournee />;
};

export default CloturerJournee;
