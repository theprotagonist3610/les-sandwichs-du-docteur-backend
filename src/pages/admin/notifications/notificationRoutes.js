/**
 * Configuration des sous-routes de Notifications
 * Ces routes seront intégrées dans adminRoutes
 *
 * Route principale: /admin/notifications
 * Affiche toutes les notifications en grid responsive avec navigation contextuelle
 */

// Import du composant principal
import Notifications from "@/pages/admin/notifications/Notifications";

export const notificationSubRoutes = [
  {
    path: "",
    nom: "Notifications",
    description: "Toutes les notifications en temps réel",
    url: "/bell.svg",
    component: Notifications,
  },
];

export default notificationSubRoutes;
