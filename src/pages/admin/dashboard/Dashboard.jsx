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
import ActivityTimeline from "./components/timeline/ActivityTimeline";
import useDashboardGlobal from "./hooks/useDashboardGlobal";
import useNotificationCleanup from "@/hooks/useNotificationCleanup";

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
    livraisonsEnCours,
    refresh,
  } = useDashboardGlobal();

  // Hook de nettoyage automatique des notifications (48H)
  useNotificationCleanup({
    enabled: true,
    runOnMount: true,
    onCleanupComplete: (stats) => {
      console.log("✅ Nettoyage notifications terminé:", stats);
    },
  });

  // Gestion du clic sur un KPI ou widget
  const handleNavigate = (module) => {
    console.log(`Navigation vers module: ${module}`);
    navigate(`/admin/${module}`);
  };

  // Gestion des actions rapides
  const handleQuickAction = (actionId) => {
    // TODO: Rediriger ou ouvrir modal selon l'action
    console.log(`Action rapide: ${actionId}`);
  };

  // État d'erreur
  if (error) {
    return (
      <DashboardLayout
        onRefresh={refresh}
        isLoading={isLoading}
      >
        <div className="flex items-center justify-center py-24">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-8 max-w-md">
            <h3 className="text-destructive font-bold text-lg mb-2">
              Erreur de chargement
            </h3>
            <p className="text-destructive/80 text-sm mb-4">{error}</p>
            <button
              onClick={refresh}
              className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
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
      onRefresh={refresh}
      isLoading={isLoading}
    >
      <div className="space-y-8">
        {/* ================================================================ */}
        {/* SECTION 1: KPIs GLOBAUX */}
        {/* ================================================================ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
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
          <h2 className="text-xl font-semibold text-foreground mb-6">
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
        {/* SECTION 4: TIMELINE ACTIVITÉS (Temps réel) */}
        {/* ================================================================ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Flux d'Activités
          </h2>
          <ActivityTimeline maxItems={10} />
        </section>

        {/* ================================================================ */}
        {/* FOOTER */}
        {/* ================================================================ */}
        <div className="text-center text-sm text-muted-foreground py-4 border-t border-border">
          Centre de Contrôle - Les Sandwichs du Docteur © 2025
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
