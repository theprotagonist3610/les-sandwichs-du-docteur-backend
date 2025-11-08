/**
 * Emplacement.jsx
 * Wrapper responsive pour le détail d'un emplacement
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopEmplacement from "./desktop/DesktopEmplacement";
import MobileEmplacement from "./mobile/MobileEmplacement";

const Emplacement = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileEmplacement /> : <DesktopEmplacement />;
};

export default Emplacement;
