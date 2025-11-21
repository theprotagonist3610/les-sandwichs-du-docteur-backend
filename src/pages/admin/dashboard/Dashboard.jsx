/**
 * Dashboard - Page principale du Centre de Contrôle
 * Vue d'ensemble globale de toutes les fonctionnalités de la sandwicherie
 */

import { useState } from "react";
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
import BudgetWidget from "./components/widgets/BudgetWidget";
import ActivityTimeline from "./components/timeline/ActivityTimeline";
import useDashboardGlobal from "./hooks/useDashboardGlobal";
import useNotificationCleanup from "@/hooks/useNotificationCleanup";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/**
 * Composant Dashboard principal
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("indicateurs");
  const {
    isLoading,
    error,
    kpis,
    alertes,
    livraisonsEnCours,
    commandesJour,
    productionsJour,
    alertesStock,
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
      <DashboardLayout onRefresh={refresh} isLoading={isLoading}>
        <div className="flex items-center justify-center py-24">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-8 max-w-md">
            <h3 className="text-destructive font-bold text-lg mb-2">
              Erreur de chargement
            </h3>
            <p className="text-destructive/80 text-sm mb-4">{error}</p>
            <button
              onClick={refresh}
              className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium">
              Réessayer
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onRefresh={refresh} isLoading={isLoading}>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="indicateurs">Indicateurs</TabsTrigger>
          <TabsTrigger value="ventes">Ventes</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="livraisons">Livraisons</TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: INDICATEURS */}
        {/* ================================================================ */}
        <TabsContent value="indicateurs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche: Indicateurs + Actions rapides + Budget */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Indicateurs Clés de Performance
                </h2>
                <KPIGrid kpis={kpis} onKPIClick={handleNavigate} />
              </section>

              <section>
                <QuickActions onAction={handleQuickAction} />
              </section>

              <section>
                <BudgetWidget
                  onViewMore={() => handleNavigate("statistiques/comptabilite/budget")}
                />
              </section>
            </div>

            {/* Colonne droite: Flux d'activités + Alertes */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Flux d'Activités
                </h2>
                <ActivityTimeline maxItems={10} />
              </section>

              <section>
                <AlertesWidget
                  alertes={alertes}
                  onViewMore={() => handleNavigate("alertes")}
                />
              </section>
            </div>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2: VENTES */}
        {/* ================================================================ */}
        <TabsContent value="ventes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche: Ventes */}
            <VentesWidget
              kpiData={kpis.commandes}
              commandesJour={commandesJour}
              onViewMore={() => handleNavigate("commandes")}
            />

            {/* Colonne droite: Comptabilité */}
            <ComptabiliteWidget
              kpiData={kpis.tresorerie}
              onViewMore={() => handleNavigate("comptabilite")}
            />
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3: PRODUCTION */}
        {/* ================================================================ */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche: Production */}
            <ProductionWidget
              kpiData={kpis.production}
              productionsJour={productionsJour}
              onViewMore={() => handleNavigate("production")}
            />

            {/* Colonne droite: Stock */}
            <StockWidget
              kpiData={kpis.stock}
              alertesStock={alertesStock}
              onViewMore={() => handleNavigate("stock")}
            />
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 4: LIVRAISONS */}
        {/* ================================================================ */}
        <TabsContent value="livraisons" className="space-y-6">
          <LivraisonsWidget
            kpiData={kpis.livraisons}
            livraisonsEnCours={livraisonsEnCours}
            onViewMore={() => handleNavigate("livraisons")}
          />
        </TabsContent>

        {/* ================================================================ */}
        {/* FOOTER */}
        {/* ================================================================ */}
        <div className="text-center text-sm text-muted-foreground py-4 border-t border-border">
          Centre de Contrôle - Les Sandwichs du Docteur © 2025
        </div>
      </Tabs>
    </DashboardLayout>
  );
};

export default Dashboard;
