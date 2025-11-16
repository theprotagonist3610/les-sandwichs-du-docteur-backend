/**
 * Point d'entrée du module Dashboard
 * Exporte les composants principaux
 */

export { default as Dashboard } from "./Dashboard";
export { default as DashboardLayout } from "./components/layout/DashboardLayout";
export { default as TopBar } from "./components/layout/TopBar";
export { default as QuickActions } from "./components/layout/QuickActions";
export { default as KPICard } from "./components/kpis/KPICard";
export { default as KPIGrid } from "./components/kpis/KPIGrid";
export { default as useDashboardGlobal } from "./hooks/useDashboardGlobal";
