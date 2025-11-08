/**
 * Emplacements.jsx
 * Wrapper responsive pour la liste des emplacements
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopEmplacements from "./desktop/DesktopEmplacements";
import MobileEmplacements from "./mobile/MobileEmplacements";

const Emplacements = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileEmplacements /> : <DesktopEmplacements />;
};

export default Emplacements;
