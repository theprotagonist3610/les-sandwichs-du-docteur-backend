import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererLesOperationsComptables from "./mobile/MobileGererLesOperationsComptables";
import DesktopGererLesOperationsComptables from "./desktop/DesktopGererLesOperationsComptables";

const GererLesOperationsComptables = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileGererLesOperationsComptables />
  ) : (
    <DesktopGererLesOperationsComptables />
  );
};

export default GererLesOperationsComptables;
