/**
 * Profiles.jsx
 * Wrapper responsive pour la liste de tous les profils utilisateurs
 */

import { useBreakpoint } from "@/hooks/useBreakpoint";
import DesktopProfiles from "./desktop/DesktopProfiles";
import MobileProfiles from "./mobile/MobileProfiles";

const Profiles = () => {
  const { isMobile } = useBreakpoint();

  return isMobile ? <MobileProfiles /> : <DesktopProfiles />;
};

export default Profiles;
