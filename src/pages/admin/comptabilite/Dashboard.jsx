import useBreakpoint from "@/hooks/useBreakpoint";
import MobileDashboard from "./mobile/MobileDashboard";
import DesktopDashboard from "./desktop/DesktopDashboard";

const Dashboard = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileDashboard /> : <DesktopDashboard />;
};

export default Dashboard;
