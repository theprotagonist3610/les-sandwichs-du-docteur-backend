import useBreakpoint from "@/hooks/useBreakpoint";
import MobileProfile from "./mobile/MobileProfile";
import DesktopProfile from "./desktop/DesktopProfile";

const Profile = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileProfile /> : <DesktopProfile />;
};

export default Profile;
