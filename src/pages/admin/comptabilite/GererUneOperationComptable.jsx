import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUneOperationComptable from "./mobile/MobileGererUneOperationComptable";
import DesktopGererUneOperationComptable from "./desktop/DesktopGererUneOperationComptable";

const GererUneOperationComptable = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileGererUneOperationComptable />
  ) : (
    <DesktopGererUneOperationComptable />
  );
};

export default GererUneOperationComptable;
