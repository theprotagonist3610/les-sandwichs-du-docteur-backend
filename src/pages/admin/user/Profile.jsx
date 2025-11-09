/**
 * Profile.jsx
 * Wrapper responsive pour le détail d'un profil utilisateur
 */

import { useBreakpoint } from "@/hooks/useBreakpoint";
import DesktopProfile from "./desktop/DesktopProfile";
import MobileProfile from "./mobile/MobileProfile";

const Profile = () => {
  const { isMobile } = useBreakpoint();

  return isMobile ? <MobileProfile /> : <DesktopProfile />;
};

export default Profile;
