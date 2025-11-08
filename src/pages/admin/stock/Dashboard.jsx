/**
 * Dashboard.jsx
 * Wrapper responsive pour le dashboard stock
 */

import useBreakpoint from "@/hooks/useBreakpoint";
import DesktopDashboard from "./desktop/DesktopDashboard";
import MobileDashboard from "./mobile/MobileDashboard";

const Dashboard = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileDashboard /> : <DesktopDashboard />;
};

export default Dashboard;
