import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesMenusComposes from "./mobile/MobileGererLesMenusComposes";
import DesktopGererLesMenusComposes from "./desktop/DesktopGererLesMenusComposes";

const GererLesMenusComposes = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileGererLesMenusComposes />
  ) : (
    <DesktopGererLesMenusComposes />
  );
};

export default GererLesMenusComposes;
