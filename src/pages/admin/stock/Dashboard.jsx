/**
 * Dashboard.jsx
 * Wrapper responsive pour le dashboard stock
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopDashboard from "./desktop/DesktopDashboard";
import MobileDashboard from "./mobile/MobileDashboard";

const Dashboard = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileDashboard /> : <DesktopDashboard />;
};

export default Dashboard;
