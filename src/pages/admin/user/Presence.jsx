/**
 * Presence.jsx
 * Wrapper responsive pour le monitoring de présence en temps réel
 */

import { useBreakpoint } from "@/hooks/useBreakpoint";
import DesktopPresence from "./desktop/DesktopPresence";
import MobilePresence from "./mobile/MobilePresence";

const Presence = () => {
  const { isMobile } = useBreakpoint();

  return isMobile ? <MobilePresence /> : <DesktopPresence />;
};

export default Presence;
