/**
 * Dashboard - Page principale du Centre de Contrôle
 * Vue d'ensemble globale de toutes les fonctionnalités de la sandwicherie
 */

import { useNavigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import KPIGrid from "./components/kpis/KPIGrid";
import QuickActions from "./components/layout/QuickActions";
import ComptabiliteWidget from "./components/widgets/ComptabiliteWidget";
import VentesWidget from "./components/widgets/VentesWidget";
import LivraisonsWidget from "./components/widgets/LivraisonsWidget";
import ProductionWidget from "./components/widgets/ProductionWidget";
import StockWidget from "./components/widgets/StockWidget";
import AlertesWidget from "./components/widgets/AlertesWidget";
import useDashboardGlobal from "./hooks/useDashboardGlobal";

/**
 * Composant Dashboard principal
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    kpis,
    alertes,
    nbAlertes,
    livraisonsEnCours,
    refresh,
  } = useDashboardGlobal();

  // Gestion du clic sur un KPI ou widget
  const handleNavigate = (module) => {
    // TODO: Rediriger vers le module approprié
    console.log(`Navigation vers module: ${module}`);
    // navigate(`/admin/${module}`);
  };

  // Gestion des actions rapides
  const handleQuickAction = (actionId) => {
    // TODO: Rediriger ou ouvrir modal selon l'action
    console.log(`Action rapide: ${actionId}`);
  };

  // État de chargement global
  if (isLoading) {
    return (
      <DashboardLayout
        titre="🏢 Les Sandwichs du Docteur - Centre de Contrôle"
        nbAlertes={0}
      >
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-lg text-gray-600 font-medium">
              Chargement du dashboard...
            </p>
            <p className="text-sm text-gray-500">
              Récupération des données en cours
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <DashboardLayout
        titre="🏢 Les Sandwichs du Docteur - Centre de Contrôle"
        nbAlertes={0}
        onRefresh={refresh}
      >
        <div className="flex items-center justify-center py-24">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
            <h3 className="text-red-800 font-bold text-lg mb-2">
              Erreur de chargement
            </h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={refresh}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      titre="🏢 Les Sandwichs du Docteur - Centre de Contrôle"
      nbAlertes={nbAlertes}
      onRefresh={refresh}
    >
      <div className="space-y-8">
        {/* ================================================================ */}
        {/* SECTION 1: KPIs GLOBAUX */}
        {/* ================================================================ */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Indicateurs Clés de Performance
          </h2>
          <KPIGrid kpis={kpis} onKPIClick={handleNavigate} />
        </section>

        {/* ================================================================ */}
        {/* SECTION 2: ACTIONS RAPIDES */}
        {/* ================================================================ */}
        <section>
          <QuickActions onAction={handleQuickAction} />
        </section>

        {/* ================================================================ */}
        {/* SECTION 3: WIDGETS MODULES (Grid 2 colonnes) */}
        {/* ================================================================ */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Aperçu des Modules
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget Comptabilité */}
            <ComptabiliteWidget
              kpiData={kpis.tresorerie}
              onViewMore={() => handleNavigate("comptabilite")}
            />

            {/* Widget Ventes */}
            <VentesWidget
              kpiData={kpis.commandes}
              onViewMore={() => handleNavigate("commandes")}
            />

            {/* Widget Livraisons */}
            <LivraisonsWidget
              kpiData={kpis.livraisons}
              livraisonsEnCours={livraisonsEnCours}
              onViewMore={() => handleNavigate("livraisons")}
            />

            {/* Widget Production */}
            <ProductionWidget
              kpiData={kpis.production}
              onViewMore={() => handleNavigate("production")}
            />

            {/* Widget Stock */}
            <StockWidget
              kpiData={kpis.stock}
              onViewMore={() => handleNavigate("stock")}
            />

            {/* Widget Alertes */}
            <AlertesWidget
              alertes={alertes}
              onViewMore={() => handleNavigate("alertes")}
            />
          </div>
        </section>

        {/* ================================================================ */}
        {/* FOOTER */}
        {/* ================================================================ */}
        <div className="text-center text-sm text-gray-500 py-4 border-t border-gray-200">
          Centre de Contrôle - Les Sandwichs du Docteur © 2025
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
