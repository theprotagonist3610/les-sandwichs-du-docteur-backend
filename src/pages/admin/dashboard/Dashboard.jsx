/**
 * Dashboard - Page principale du Centre de Contrôle
 * Vue d'ensemble globale de toutes les fonctionnalités de la sandwicherie
 */

import { useNavigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import KPIGrid from "./components/kpis/KPIGrid";
import QuickActions from "./components/layout/QuickActions";
import useDashboardGlobal from "./hooks/useDashboardGlobal";

/**
 * Composant Dashboard principal
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoading, error, kpis, alertes, nbAlertes, refresh } = useDashboardGlobal();

  // Gestion du clic sur un KPI
  const handleKPIClick = (module) => {
    // TODO: Rediriger vers le module approprié
    console.log(`Navigation vers module: ${module}`);
    // navigate(`/admin/${module}`);
  };

  // Gestion des actions rapides
  const handleQuickAction = (actionId) => {
    // TODO: Rediriger ou ouvrir modal selon l'action
    console.log(`Action rapide: ${actionId}`);
  };

  return (
    <DashboardLayout
      titre="🏢 Les Sandwichs du Docteur - Centre de Contrôle"
      nbAlertes={nbAlertes}
      onRefresh={refresh}
    >
      <div className="space-y-8">
        {/* Section KPIs Globaux */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Indicateurs Clés de Performance
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Chargement des données...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 font-medium">Erreur de chargement</p>
              <p className="text-red-600 text-sm mt-2">{error}</p>
              <button
                onClick={refresh}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <KPIGrid kpis={kpis} onKPIClick={handleKPIClick} />
          )}
        </section>

        {/* Section Actions Rapides */}
        <section>
          <QuickActions onAction={handleQuickAction} />
        </section>

        {/* Section Alertes */}
        {alertes.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Alertes ({alertes.length})
            </h2>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
              {alertes.map((alerte) => (
                <div
                  key={alerte.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Badge type */}
                    <div
                      className={`
                      px-2 py-1 rounded text-xs font-medium flex-shrink-0
                      ${
                        alerte.type === "error"
                          ? "bg-red-100 text-red-700"
                          : alerte.type === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                      }
                    `}
                    >
                      {alerte.type === "error"
                        ? "URGENT"
                        : alerte.type === "warning"
                          ? "ATTENTION"
                          : "INFO"}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{alerte.module}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(alerte.timestamp).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{alerte.titre}</p>
                      <p className="text-sm text-gray-600 mt-1">{alerte.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer/Credits */}
        <div className="text-center text-sm text-gray-500 py-4">
          Centre de Contrôle - Les Sandwichs du Docteur © 2025
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
