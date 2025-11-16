/**
 * Point d'entrée du module Dashboard
 * Exporte les composants principaux
 */

export { default as Dashboard } from "./Dashboard";

// Layout
export { default as DashboardLayout } from "./components/layout/DashboardLayout";
export { default as TopBar } from "./components/layout/TopBar";
export { default as QuickActions } from "./components/layout/QuickActions";

// KPIs
export { default as KPICard } from "./components/kpis/KPICard";
export { default as KPIGrid } from "./components/kpis/KPIGrid";

// Widgets
export { default as WidgetContainer } from "./components/widgets/WidgetContainer";
export { default as ComptabiliteWidget } from "./components/widgets/ComptabiliteWidget";
export { default as VentesWidget } from "./components/widgets/VentesWidget";
export { default as LivraisonsWidget } from "./components/widgets/LivraisonsWidget";
export { default as ProductionWidget } from "./components/widgets/ProductionWidget";
export { default as StockWidget } from "./components/widgets/StockWidget";
export { default as AlertesWidget } from "./components/widgets/AlertesWidget";

// Timeline & Notifications
export { default as ActivityTimeline } from "./components/timeline/ActivityTimeline";
export { default as NotificationCenter } from "./components/notifications/NotificationCenter";

// Hooks
export { default as useDashboardGlobal } from "./hooks/useDashboardGlobal";
export { default as useActivities } from "./hooks/useActivities";
export { default as useNotifications } from "./hooks/useNotifications";
