/**
 * DashboardLayout - Layout principal du dashboard
 * Wrapper pour le dashboard avec TopBar et conteneur de contenu
 */

import TopBar from "./TopBar";

/**
 * Composant DashboardLayout
 */
const DashboardLayout = ({ children, titre, nbAlertes, onRefresh }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TopBar */}
      <TopBar titre={titre} nbAlertes={nbAlertes} onRefresh={onRefresh} />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
};

export default DashboardLayout;
