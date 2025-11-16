/**
 * DashboardLayout - Layout principal du dashboard
 * Wrapper pour le dashboard avec TopBar et conteneur de contenu
 */

import TopBar from "./TopBar";

/**
 * Composant DashboardLayout
 */
const DashboardLayout = ({ children, onRefresh, isLoading = false }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* TopBar */}
      <TopBar onRefresh={onRefresh} isLoading={isLoading} />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
};

export default DashboardLayout;
