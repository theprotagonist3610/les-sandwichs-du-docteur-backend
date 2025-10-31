import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesProductions from "./mobile/MobileGererLesProductions";
import DesktopGererLesProductions from "./desktop/DesktopGererLesProductions";
const GererLesProductions = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileGererLesProductions />
  ) : (
    <DesktopGererLesProductions />
  );
};

export default GererLesProductions;
