import useBreakpoint from "@/hooks/useBreakpoint";
import MobileTresorerie from "./mobile/MobileTresorerie";
import DesktopTresorerie from "./desktop/DesktopTresorerie";

const Tresorerie = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileTresorerie /> : <DesktopTresorerie />;
};

export default Tresorerie;
