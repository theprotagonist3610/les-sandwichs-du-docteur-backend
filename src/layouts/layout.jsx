import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopMainLayout from "./desktop/mainLayout";
import DesktopErrorLayout from "./desktop/errorLayout";
import MobileMainLayout from "./mobile/mainLayout";
import MobileErrorLayout from "./mobile/errorLayout";

const Layout = ({ error = false }) => {
  const { mobile } = useBreakpoint();

  // Sélectionner le layout approprié
  if (error) {
    return mobile ? <MobileErrorLayout /> : <DesktopErrorLayout />;
  }

  return mobile ? <MobileMainLayout /> : <DesktopMainLayout />;
};

export default Layout;
